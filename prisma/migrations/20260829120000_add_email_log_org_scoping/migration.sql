-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "EmailLog_organizationId_createdAt_idx" ON "EmailLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
