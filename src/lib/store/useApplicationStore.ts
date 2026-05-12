import { create } from "zustand";
import type { ApplicationData, CustomFieldValue } from "@/schemas/application";
import { applicationSchema, submissionSchema } from "@/schemas/application";

const STORAGE_KEY_PREFIX = "scoutlane_application_";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const SAVE_DEBOUNCE_MS = 500;

function getStorageKey(jobSlug: string): string {
  return `${STORAGE_KEY_PREFIX}${jobSlug}`;
}

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function safeJsonStringify(data: unknown, fallback = "{}"): string {
  try {
    return JSON.stringify(data);
  } catch {
    return fallback;
  }
}

function loadInitialState(jobSlug: string): ApplicationData {
  if (typeof window === "undefined") {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      customFields: [],
      resumeUrl: "",
      status: "draft",
      jobSlug,
    };
  }
  const raw = localStorage.getItem(getStorageKey(jobSlug));
  if (!raw) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      customFields: [],
      resumeUrl: "",
      status: "draft",
      jobSlug,
    };
  }
  const parsed = safeJsonParse<ApplicationData>(raw, null as unknown as ApplicationData);
  if (parsed && typeof parsed === "object" && parsed.jobSlug === jobSlug) {
    const result = applicationSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  }
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    customFields: [],
    resumeUrl: "",
    status: "draft",
    jobSlug,
  };
}

async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY,
): Promise<T> {
  let lastError: Error = new Error("Unknown error");
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

interface ApplicationStore {
  formData: ApplicationData;
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
  _saveTimeout: ReturnType<typeof setTimeout> | null;

  updateField: <K extends keyof ApplicationData>(key: K, value: ApplicationData[K]) => void;
  setCustomFields: (fields: CustomFieldValue[]) => void;
  updateCustomField: (id: string, value: string) => void;
  setResumeUrl: (url: string) => void;

  saveDraft: (jobSlug: string) => Promise<{ success: boolean; error?: string }>;
  submitApplication: (jobSlug: string) => Promise<{ success: boolean; error?: string }>;
  loadApplication: (jobSlug: string, applicationId?: string) => Promise<{ success: boolean; error?: string }>;
  clearForm: (jobSlug: string) => void;
  resetError: () => void;
}

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  formData: loadInitialState(""),
  isLoading: false,
  error: null,
  lastSaved: null,
  _saveTimeout: null,

  updateField: (key, value) =>
    set((state) => ({
      formData: { ...state.formData, [key]: value },
    })),

  setCustomFields: (fields) =>
    set((state) => ({
      formData: { ...state.formData, customFields: fields },
    })),

  updateCustomField: (id, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        customFields: state.formData.customFields.map((f) =>
          f.id === id ? { ...f, value } : f,
        ),
      },
    })),

  setResumeUrl: (url) =>
    set((state) => ({
      formData: { ...state.formData, resumeUrl: url },
    })),

  saveDraft: async (jobSlug) => {
    const { formData, _saveTimeout } = get();
    if (_saveTimeout) clearTimeout(_saveTimeout);

    set({ isLoading: true, error: null });

    const dataToSave = { ...formData, jobSlug, status: "draft" as const };
    const parsed = applicationSchema.safeParse(dataToSave);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      set({ isLoading: false, error: messages });
      return { success: false, error: messages };
    }

    try {
      localStorage.setItem(getStorageKey(jobSlug), safeJsonStringify(parsed.data));

      const result = await retryApiCall(async () => {
        const res = await fetch(`/api/public/jobs/${jobSlug}/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: safeJsonStringify({ ...parsed.data, _draft: true }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Network error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      });

      set({ isLoading: false, lastSaved: new Date() });
      return { success: true };
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to save draft",
        lastSaved: new Date(),
      });
      return { success: false, error: error.message };
    }
  },

  submitApplication: async (jobSlug) => {
    const { formData } = get();
    set({ isLoading: true, error: null });

    const dataToSubmit = { ...formData, jobSlug, status: "submitted" as const };
    const parsed = submissionSchema.safeParse(dataToSubmit);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      set({ isLoading: false, error: messages });
      return { success: false, error: messages };
    }

    try {
      const result = await retryApiCall(async () => {
        const res = await fetch(`/api/public/jobs/${jobSlug}/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: safeJsonStringify(parsed.data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Network error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      });

      localStorage.removeItem(getStorageKey(jobSlug));
      set({
        formData: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          customFields: [],
          resumeUrl: "",
          status: "draft",
          jobSlug,
        },
        isLoading: false,
        lastSaved: new Date(),
      });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false, error: error.message || "Failed to submit application" });
      return { success: false, error: error.message };
    }
  },

  loadApplication: async (jobSlug, applicationId) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ jobSlug });
      if (applicationId) params.append("applicationId", applicationId);

      const result = await retryApiCall(async () => {
        const res = await fetch(`/api/public/jobs/${jobSlug}/applications?${params.toString()}`, {
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          if (res.status === 404) return { success: true, data: null };
          const err = await res.json().catch(() => ({ error: "Network error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      });

      if (result.success && result.data) {
        const parsed = applicationSchema.safeParse(result.data);
        if (parsed.success) {
          localStorage.setItem(getStorageKey(jobSlug), safeJsonStringify(parsed.data));
          set({ formData: parsed.data, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } else {
        const initial = loadInitialState(jobSlug);
        set({ formData: initial, isLoading: false });
      }
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false, error: error.message || "Failed to load application" });
      return { success: false, error: error.message };
    }
  },

  clearForm: (jobSlug) => {
    localStorage.removeItem(getStorageKey(jobSlug));
    set({
      formData: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        customFields: [],
        resumeUrl: "",
        status: "draft",
        jobSlug,
      },
      error: null,
      lastSaved: null,
    });
  },

  resetError: () => set({ error: null }),
}));
