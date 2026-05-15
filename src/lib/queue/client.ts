import "server-only";
import { PgBoss } from "pg-boss";

declare global {
  var __pgBoss: PgBoss | undefined;
  var __pgBossStarted: Promise<PgBoss> | undefined;
}

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — pg-boss client cannot connect.");
  }
  return url;
}

export function getBoss(): PgBoss {
  if (!globalThis.__pgBoss) {
    globalThis.__pgBoss = new PgBoss({
      connectionString: getConnectionString(),
      schema: "pgboss",
    });
  }
  return globalThis.__pgBoss;
}

export async function startBoss(): Promise<PgBoss> {
  if (!globalThis.__pgBossStarted) {
    const boss = getBoss();
    globalThis.__pgBossStarted = boss.start().then(() => boss);
  }
  return globalThis.__pgBossStarted;
}

export async function stopBoss(): Promise<void> {
  if (globalThis.__pgBoss && globalThis.__pgBossStarted) {
    await globalThis.__pgBoss.stop({ graceful: true });
    globalThis.__pgBossStarted = undefined;
    globalThis.__pgBoss = undefined;
  }
}
