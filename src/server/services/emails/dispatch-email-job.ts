import {
  sendAdminNewApplicationEmail,
  sendApplicationConfirmationEmail,
  sendCustomEmail,
  sendJobAlertConfirmation,
  sendNewJobNotification,
  type EmailSendResult,
} from "@/lib/email/send";
import type { EmailJob } from "@/server/queues/emails";

/**
 * Routes an EmailJob to its send function. Shared by the pg-boss worker and
 * the inline job runner so both paths behave identically.
 */
export async function dispatchEmailJob(job: EmailJob): Promise<EmailSendResult> {
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
