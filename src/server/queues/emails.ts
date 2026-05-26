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
      };
    }
  | {
      kind: "applicant-confirmation";
      payload: {
        to: string;
        applicantName: string;
        jobTitle: string;
      };
    }
  | {
      kind: "custom";
      payload: {
        to: string;
        subject: string;
        bodyHtml: string;
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

  globalForBoss.emailBossStart ??= globalForBoss.emailBoss.start().then(async (boss: PgBoss) => {
    await boss.createQueue(EMAIL_SEND_QUEUE, {
      retryLimit: 3,
      retryDelay: 60,
      expireInSeconds: 300,
    });
    return boss;
  });

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
}

export async function enqueueAdminNotificationEmails(
  input: AdminNotificationFanOutInput,
): Promise<void> {
  await Promise.all(
    input.adminEmails.map((to) =>
      enqueueEmailJob({
        kind: "admin-new-application",
        payload: {
          to,
          jobTitle: input.jobTitle,
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          jobUrl: input.jobUrl,
        },
      }),
    ),
  );
}
