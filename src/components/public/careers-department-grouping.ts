import { DEPARTMENTS, inferDepartment } from "@/lib/jobs/departments";

export interface PublicJob {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  type: string | null;
  department: string | null;
  createdAt: string;
}

export function groupByDepartment(jobs: PublicJob[]): Map<string, PublicJob[]> {
  const map = new Map<string, PublicJob[]>();
  const ordered = [...DEPARTMENTS] as string[];

  for (const dept of ordered) {
    map.set(dept, []);
  }
  map.set("Other", []);

  for (const job of jobs) {
    const dept = job.department ?? inferDepartment(job.title);
    const key = ordered.includes(dept) ? dept : "Other";
    map.get(key)?.push(job);
  }

  for (const key of [...map.keys()]) {
    if (map.get(key)?.length === 0) map.delete(key);
  }

  return map;
}
