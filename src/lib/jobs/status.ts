import type { JobStatus } from "@/schemas/job";

export interface JobStatusRecord {
  archived: boolean;
  published: boolean;
}

export function getJobStatus(record: JobStatusRecord): JobStatus {
  if (record.archived) {
    return "closed";
  }

  return record.published ? "active" : "draft";
}

export function getJobPersistence(status: JobStatus): JobStatusRecord {
  switch (status) {
    case "active":
      return { archived: false, published: true };
    case "closed":
      return { archived: true, published: false };
    case "draft":
    default:
      return { archived: false, published: false };
  }
}

export function canAcceptApplications(record: JobStatusRecord): boolean {
  return getJobStatus(record) === "active";
}
