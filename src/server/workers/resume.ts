import { prisma } from "@/lib/db/prisma";
import { parseApplicantResumeFromUrl } from "@/lib/resume/parseApplicantResume";
import {
  getResumeQueue,
  RESUME_PARSE_QUEUE,
  type ResumeParseJob,
} from "@/server/queues/resume";

async function main() {
  const boss = await getResumeQueue();

  await boss.work<ResumeParseJob>(
    RESUME_PARSE_QUEUE,
    { batchSize: 2, includeMetadata: false },
    async ([job]) => {
      if (!job?.data?.applicantId || !job.data.resumeUrl) {
        throw new Error("Resume parse job is missing applicantId or resumeUrl.");
      }

      try {
        await parseApplicantResumeFromUrl(job.data.applicantId, job.data.resumeUrl);
      } catch (error) {
        console.error("[resume-worker] parse failed:", error);
        await prisma.applicant
          .update({
            where: { id: job.data.applicantId },
            data: { parsingStatus: "FAILED" },
          })
          .catch(() => {});
        throw error;
      }
    },
  );

  console.log(`[resume-worker] listening on ${RESUME_PARSE_QUEUE}`);
}

main().catch((error) => {
  console.error("[resume-worker] startup failed:", error);
  process.exit(1);
});
