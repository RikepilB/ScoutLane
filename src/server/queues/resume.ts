import { PgBoss } from "pg-boss";
import { prisma } from "@/lib/db/prisma";

export const RESUME_PARSE_QUEUE = "resume.parse";

export interface ResumeParseJob {
  applicantId: string;
  resumeUrl: string;
}

const globalForBoss = globalThis as unknown as {
  resumeBoss?: PgBoss;
  resumeBossStart?: Promise<PgBoss>;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the resume parsing queue.");
  }
  return databaseUrl;
}

export async function getResumeQueue(): Promise<PgBoss> {
  if (!globalForBoss.resumeBoss) {
    globalForBoss.resumeBoss = new PgBoss({
      connectionString: getDatabaseUrl(),
      application_name: "scoutlane-resume-queue",
    });
    globalForBoss.resumeBoss.on("error", (error: Error) => {
      console.error("[resume-queue] pg-boss error:", error);
    });
  }

  globalForBoss.resumeBossStart ??= globalForBoss.resumeBoss.start().then(async (boss: PgBoss) => {
    await boss.createQueue(RESUME_PARSE_QUEUE, {
      retryLimit: 3,
      retryDelay: 30,
      expireInSeconds: 300,
    });
    return boss;
  });

  return globalForBoss.resumeBossStart;
}

export async function enqueueResumeParseJob(input: ResumeParseJob): Promise<string | null> {
  const boss = await getResumeQueue();
  await prisma.applicant.update({
    where: { id: input.applicantId },
    data: { parsingStatus: "PENDING" },
  });

  return boss.send(
    RESUME_PARSE_QUEUE,
    input,
    {
      singletonKey: input.applicantId,
      retryLimit: 3,
      retryDelay: 30,
      expireInSeconds: 300,
    },
  );
}
