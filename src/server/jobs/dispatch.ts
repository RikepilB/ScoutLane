import {
  parseApplicantResumeFromBuffer,
  parseApplicantResumeFromUrl,
} from "@/lib/resume/parseApplicantResume";
import {
  enqueueAdminNotificationEmails,
  enqueueEmailJob,
  type AdminFanOutResult,
  type AdminNotificationFanOutInput,
  type EmailJob,
} from "@/server/queues/emails";
import { enqueueResumeParseJob } from "@/server/queues/resume";
import { dispatchEmailJob } from "@/server/services/emails/dispatch-email-job";
import { getJobRunnerMode, runAfterResponse } from "./runner";

/**
 * Dispatches a resume parse: enqueued to pg-boss in `worker` mode, executed
 * after the response in `inline` mode (preferring the in-memory buffer when
 * the caller still has it, avoiding a re-download).
 */
export async function dispatchResumeParse(input: {
  applicantId: string;
  resumeUrl: string;
  buffer?: Buffer;
  filename?: string;
}): Promise<void> {
  if (getJobRunnerMode() === "worker") {
    await enqueueResumeParseJob({
      applicantId: input.applicantId,
      resumeUrl: input.resumeUrl,
    });
    return;
  }

  const { applicantId, resumeUrl, buffer, filename } = input;
  runAfterResponse("resume-parse", async () => {
    if (buffer && filename) {
      await parseApplicantResumeFromBuffer(applicantId, buffer, filename);
      return;
    }
    await parseApplicantResumeFromUrl(applicantId, resumeUrl);
  });
}

/**
 * Dispatches a single email job: enqueued in `worker` mode, sent after the
 * response in `inline` mode. Inline send results are logged to EmailLog by
 * the send functions themselves.
 */
export async function dispatchEmail(job: EmailJob): Promise<void> {
  if (getJobRunnerMode() === "worker") {
    await enqueueEmailJob(job);
    return;
  }

  runAfterResponse(`email-${job.kind}`, async () => {
    const result = await dispatchEmailJob(job);
    if (result.skipped) {
      console.warn(`[jobs:email] skipped ${job.kind} for ${job.payload.to}`);
    } else if (!result.ok) {
      console.error(`[jobs:email] ${job.kind} failed for ${job.payload.to}: ${result.error}`);
    }
  });
}

/**
 * Fans out admin "new application" notifications. In `worker` mode the queue
 * reports per-recipient enqueue failures; in `inline` mode delivery happens
 * post-response, so there is nothing to report yet (send failures land in
 * EmailLog). Inline sends run sequentially inside a single after() task —
 * parallel sends trip Resend's requests-per-second limit.
 */
export async function dispatchAdminNotificationEmails(
  input: AdminNotificationFanOutInput,
): Promise<AdminFanOutResult> {
  if (getJobRunnerMode() === "worker") {
    return enqueueAdminNotificationEmails(input);
  }

  const jobs: EmailJob[] = input.adminEmails.map((to) => ({
    kind: "admin-new-application",
    payload: {
      to,
      jobTitle: input.jobTitle,
      applicantName: input.applicantName,
      applicantEmail: input.applicantEmail,
      jobUrl: input.jobUrl,
    },
  }));

  runAfterResponse("email-admin-fan-out", async () => {
    for (const [index, job] of jobs.entries()) {
      // Sequential alone is not enough: rejected sends return in ~50ms, so a
      // burst of admins (+ the applicant confirmation) still trips Resend's
      // requests-per-second cap. Pace consecutive sends.
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      const result = await dispatchEmailJob(job);
      if (result.skipped) {
        console.warn(`[jobs:email] skipped ${job.kind} for ${job.payload.to}`);
      } else if (!result.ok) {
        console.error(`[jobs:email] ${job.kind} failed for ${job.payload.to}: ${result.error}`);
      }
    }
  });

  return { enqueued: [...input.adminEmails], failed: [] };
}
