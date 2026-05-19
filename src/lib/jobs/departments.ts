export const DEPARTMENTS = [
  "Data Science",
  "Engineering",
  "Product",
  "GTM",
  "Operations",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

const KEYWORDS: Record<Department, string[]> = {
  "Data Science": [
    "data scientist", "machine learning", "ml engineer", "data analyst",
    "data engineer", "ai", "analytics", "statistician", "nlp",
  ],
  Engineering: [
    "engineer", "developer", "devops", "backend", "frontend",
    "full stack", "fullstack", "software", "platform", "infrastructure",
    "sre", "qa", "test", "architect",
  ],
  Product: [
    "product manager", "product designer", "ux", "ui",
    "designer", "product owner", "technical program manager",
  ],
  GTM: [
    "sales", "marketing", "customer success", "account executive",
    "sdr", "bdr", "solutions engineer", "sales engineer",
    "growth", "revenue", "partnerships",
  ],
  Operations: [
    "operations", "people ops", "hr", "human resources",
    "finance", "legal", "office manager", "recruiter",
    "talent", "executive assistant", "administrative",
  ],
};

export function inferDepartment(title: string, description?: string | null): Department {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  for (const [department, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return department as Department;
    }
  }

  return "Engineering";
}
