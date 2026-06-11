import "dotenv/config";

import type { Job } from "pg-boss";
import { EMAIL_SEND_QUEUE, getEmailQueue, type EmailJob } from "@/server/queues/emails";
import { dispatchEmailJob } from "@/server/services/emails/dispatch-email-job";

async function main() {
  const boss = await getEmailQueue();

  await boss.work<EmailJob>(
    EMAIL_SEND_QUEUE,
    { batchSize: 1 },
    async (jobs: Job<EmailJob>[]) => {
      const [job] = jobs;
      if (!job) return;
      const result = await dispatchEmailJob(job.data);
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
