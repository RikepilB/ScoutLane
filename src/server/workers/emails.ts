import "dotenv/config";

import type { Job } from "pg-boss";
import {
  sendAdminNewApplicationEmail,
  sendApplicationConfirmationEmail,
  sendCustomEmail,
  sendJobAlertConfirmation,
  sendNewJobNotification,
  type EmailSendResult,
} from "@/lib/email/send";
import { EMAIL_SEND_QUEUE, getEmailQueue, type EmailJob } from "@/server/queues/emails";

async function dispatch(job: EmailJob): Promise<EmailSendResult> {
  switch (job.kind) {
    case "admin-new-application":
      return sendAdminNewApplicationEmail(job.payload);
    case "applicant-confirmation":
      return sendApplicationConfirmationEmail(job.payload);
    case "custom":
      return sendCustomEmail(job.payload);
    case "job-alert-confirmation":
      return sendJobAlertConfirmation(job.payload.to, job.payload.token);
    case "new-job-notification":
      return sendNewJobNotification(
        job.payload.to,
        job.payload.jobTitle,
        job.payload.jobUrl,
        job.payload.token,
      );
  }
}

async function main() {
  const boss = await getEmailQueue();

  await boss.work<EmailJob>(
    EMAIL_SEND_QUEUE,
    { batchSize: 1 },
    async (jobs: Job<EmailJob>[]) => {
      const [job] = jobs;
      if (!job) return;
      const result = await dispatch(job.data);
      if (result.skipped) {
        console.warn(`[email-worker] skipped ${job.data.kind} for ${job.data.payload.to}`);
        return;
      }
      if (!result.ok) {
        console.error(
          `[email-worker] ${job.data.kind} failed for ${job.data.payload.to}: ${result.error}`,
        );
        throw new Error(`Email send failed: ${result.error}`);
      }
    },
  );

  console.log(`[email-worker] listening on ${EMAIL_SEND_QUEUE}`);
}

main().catch((error) => {
  console.error("[email-worker] startup failed:", error);
  process.exit(1);
});
