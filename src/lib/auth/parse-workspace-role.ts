export type WorkspaceSignInRole = "admin" | "recruiter";

export function parseWorkspaceRole(
  value: string | undefined,
): WorkspaceSignInRole | null {
  if (value === "admin" || value === "recruiter") return value;
  return null;
}
