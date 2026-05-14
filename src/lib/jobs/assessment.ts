export type AssessmentQuestionPayload = {
  text: string;
  maxDurationSeconds: number;
  maxAttempts: number;
};

export function normalizeAssessmentQuestions(raw: unknown): AssessmentQuestionPayload[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return { text: item.trim(), maxDurationSeconds: 120, maxAttempts: 1 };
      }
      if (item && typeof item === "object" && "text" in item) {
        const o = item as Record<string, unknown>;
        const text = String(o.text ?? "").trim();
        if (!text) return null;
        const maxDurationSeconds =
          typeof o.maxDurationSeconds === "number" && o.maxDurationSeconds > 0
            ? o.maxDurationSeconds
            : 120;
        const maxAttempts =
          typeof o.maxAttempts === "number" && o.maxAttempts > 0 ? o.maxAttempts : 1;
        return { text, maxDurationSeconds, maxAttempts };
      }
      return null;
    })
    .filter((q): q is AssessmentQuestionPayload => q !== null);
}
