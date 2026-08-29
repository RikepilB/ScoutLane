import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { decryptSecret, encryptSecret } from "../src/lib/security/integration-secrets";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const [integrations, webhooks] = await Promise.all([
    prisma.jobIntegration.findMany({ select: { id: true, apiKey: true } }),
    prisma.webhook.findMany({ select: { id: true, secret: true } }),
  ]);

  const integrationsWithSecrets = integrations.filter(({ apiKey }) => apiKey);
  const webhooksWithSecrets = webhooks.filter(({ secret }) => secret);

  await prisma.$transaction([
    ...integrationsWithSecrets.map(({ id, apiKey }) =>
      prisma.jobIntegration.update({ where: { id }, data: { apiKey: encryptSecret(decryptSecret(apiKey)) } }),
    ),
    ...webhooksWithSecrets.map(({ id, secret }) =>
      prisma.webhook.update({ where: { id }, data: { secret: encryptSecret(decryptSecret(secret!)) } }),
    ),
  ]);

  console.log(
    `Re-encrypted ${integrationsWithSecrets.length} integration API key(s) and ${webhooksWithSecrets.length} webhook secret(s).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Integration secret encryption failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
