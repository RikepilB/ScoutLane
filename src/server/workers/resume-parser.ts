import "server-only";
import type { PgBoss, Job } from "pg-boss";
import { prisma } from "@/lib/db/prisma";
import { parseApplicantResumeFromUrl } from "@/lib/resume/parseApplicantResume";
import { RESUME_PARSE_QUEUE, type ResumeParseJobData } from "@/lib/queue/resume";

export async function registerResumeParserWorker(boss: PgBoss): Promise<void> {
  await boss
    .createQueue(RESUME_PARSE_QUEUE, {
      retryLimit: 3,
      retryBackoff: true,
      retryDelay: 30,
    })
    .catch(() => {});

  await boss.work<ResumeParseJobData>(
    RESUME_PARSE_QUEUE,
    { batchSize: 1, pollingIntervalSeconds: 2 },
    async (jobs: Job<ResumeParseJobData>[]) => {
      const job = jobs[0];
      if (!job) return;
      const { applicantId, resumeUrl } = job.data;
      try {
        await parseApplicantResumeFromUrl(applicantId, resumeUrl);
      } catch (error) {
        console.error(`[resume-parse] applicant=${applicantId} failed`, error);
        await prisma.applicant
          .update({
            where: { id: applicantId },
            data: { parsingStatus: "FAILED" },
          })
          .catch(() => {});
        throw error;
      }
    },
  );
}
