import { startBoss, stopBoss } from "@/lib/queue/client";
import { registerResumeParserWorker } from "@/server/workers/resume-parser";

async function main() {
  console.log("[worker] starting pg-boss…");
  const boss = await startBoss();

  boss.on("error", (error: Error) => {
    console.error("[worker] pg-boss error:", error);
  });

  await registerResumeParserWorker(boss);
  console.log("[worker] resume-parse worker registered. Polling for jobs…");
}

async function shutdown(signal: string) {
  console.log(`[worker] received ${signal}, stopping…`);
  await stopBoss();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

main().catch((error) => {
  console.error("[worker] fatal:", error);
  process.exit(1);
});
