import "server-only";
import { startBoss } from "./client";

export const RESUME_PARSE_QUEUE = "resume-parse";

export interface ResumeParseJobData {
  applicantId: string;
  resumeUrl: string;
}

export async function enqueueResumeParse(
  applicantId: string,
  resumeUrl: string,
): Promise<string | null> {
  const boss = await startBoss();
  await boss
    .createQueue(RESUME_PARSE_QUEUE, {
      retryLimit: 3,
      retryBackoff: true,
      retryDelay: 30,
      expireInSeconds: 600,
    })
    .catch(() => {});
  return boss.send(
    RESUME_PARSE_QUEUE,
    { applicantId, resumeUrl } satisfies ResumeParseJobData,
  );
}
