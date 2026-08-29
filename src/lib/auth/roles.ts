export type AdminRole = "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | "GUEST";

/** Fixed identity for the public read-only demo login. Seeded in prisma/seed.ts. */
export const GUEST_EMAIL = "guest@scoutlane.local";

/** Seeded recruiter demo account — full workspace minus admin settings. */
export const DEMO_RECRUITER_EMAIL = "recruiter@scoutlane.local";

export function getDemoAdminEmail(): string {
  return process.env.INITIAL_ADMIN_EMAIL?.toLowerCase().trim() || "admin@scoutlane.local";
}

export function getInitialAdminEmail(): string | undefined {
  return process.env.INITIAL_ADMIN_EMAIL?.toLowerCase().trim() || undefined;
}

export type DemoRole = "admin" | "recruiter" | "guest";

export const DEMO_ACCOUNTS: Record<
  DemoRole,
  { email: string; label: string; description: string; role: AdminRole }
> = {
  admin: {
    email: getDemoAdminEmail(),
    label: "Admin demo",
    description: "Full workspace — jobs, pipeline, settings, team",
    role: "ADMIN",
  },
  recruiter: {
    email: DEMO_RECRUITER_EMAIL,
    label: "Recruiter demo",
    description: "Recruiter nav — jobs, applicants, pipeline",
    role: "RECRUITER",
  },
  guest: {
    email: GUEST_EMAIL,
    label: "Guest view",
    description: "Read-only tour with sample data",
    role: "GUEST",
  },
};
