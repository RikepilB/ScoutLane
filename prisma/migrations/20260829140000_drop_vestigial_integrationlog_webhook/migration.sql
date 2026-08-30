-- DropForeignKey
ALTER TABLE "IntegrationLog" DROP CONSTRAINT "IntegrationLog_webhookId_fkey";

-- AlterTable
ALTER TABLE "IntegrationLog" DROP COLUMN "webhookId";
