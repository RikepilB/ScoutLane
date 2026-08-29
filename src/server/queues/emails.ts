import { PgBoss } from "pg-boss";

export const EMAIL_SEND_QUEUE = "email.send";

export type EmailJob =
  | {
      kind: "admin-new-application";
      payload: {
        to: string;
        jobTitle: string;
        applicantName: string;
        applicantEmail: string;
        jobUrl: string;
        organizationId?: string;
      };
    }
  | {
      kind: "applicant-confirmation";
      payload: {
        to: string;
        applicantName: string;
        jobTitle: string;
        organizationId?: string;
      };
    }
  | {
      kind: "custom";
      payload: {
        to: string;
        subject: string;
        bodyHtml: string;
        organizationId?: string;
      };
    }
  | {
      kind: "job-alert-confirmation";
      payload: {
        to: string;
        token: string;
      };
    }
  | {
      kind: "new-job-notification";
      payload: {
        to: string;
        jobTitle: string;
        jobUrl: string;
        token: string;
      };
    };

const globalForBoss = globalThis as unknown as {
  emailBoss?: PgBoss;
  emailBossStart?: Promise<PgBoss>;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the email queue.");
  }
  return databaseUrl;
}

export async function getEmailQueue(): Promise<PgBoss> {
  if (!globalForBoss.emailBoss) {
    globalForBoss.emailBoss = new PgBoss({
      connectionString: getDatabaseUrl(),
      application_name: "scoutlane-email-queue",
    });
    globalForBoss.emailBoss.on("error", (error: Error) => {
      console.error("[email-queue] pg-boss error:", error);
    });
  }

  if (!globalForBoss.emailBossStart) {
    const startPromise = globalForBoss.emailBoss.start().then(async (boss: PgBoss) => {
      await boss.createQueue(EMAIL_SEND_QUEUE, {
        retryLimit: 3,
        retryDelay: 60,
        expireInSeconds: 300,
      });
      return boss;
    });
    startPromise.catch(() => {
      if (globalForBoss.emailBossStart === startPromise) {
        delete globalForBoss.emailBossStart;
        delete globalForBoss.emailBoss;
      }
    });
    globalForBoss.emailBossStart = startPromise;
  }

  return globalForBoss.emailBossStart;
}

export async function enqueueEmailJob(job: EmailJob): Promise<string | null> {
  const boss = await getEmailQueue();
  return boss.send(EMAIL_SEND_QUEUE, job, {
    retryLimit: 3,
    retryDelay: 60,
    expireInSeconds: 300,
  });
}

export interface AdminNotificationFanOutInput {
  adminEmails: string[];
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  jobUrl: string;
  organizationId?: string;
}

export interface AdminFanOutResult {
  enqueued: string[];
  failed: Array<{ to: string; error: string }>;
}

export async function enqueueAdminNotificationEmails(
  input: AdminNotificationFanOutInput,
): Promise<AdminFanOutResult> {
  const settled = await Promise.allSettled(
    input.adminEmails.map((to) =>
      enqueueEmailJob({
        kind: "admin-new-application",
        payload: {
          to,
          jobTitle: input.jobTitle,
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          jobUrl: input.jobUrl,
          organizationId: input.organizationId,
        },
      }).then((jobId) => {
        if (!jobId) throw new Error("Queue accepted no job id");
        return to;
      }),
    ),
  );

  const enqueued: string[] = [];
  const failed: Array<{ to: string; error: string }> = [];
  settled.forEach((outcome, idx) => {
    const to = input.adminEmails[idx];
    if (outcome.status === "fulfilled") {
      enqueued.push(to);
    } else {
      const reason = outcome.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      console.error(`[email-queue] failed to enqueue admin-new-application for ${to}:`, reason);
      failed.push({ to, error: message });
    }
  });

  return { enqueued, failed };
}
