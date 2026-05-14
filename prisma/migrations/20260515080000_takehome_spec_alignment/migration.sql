-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "assessmentTitle" TEXT,
ADD COLUMN     "assessmentQuestions" JSONB;

-- CreateTable
CREATE TABLE "ApplicantNote" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicantNote_applicantId_idx" ON "ApplicantNote"("applicantId");

-- AddForeignKey
ALTER TABLE "ApplicantNote" ADD CONSTRAINT "ApplicantNote_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicantNote" ADD CONSTRAINT "ApplicantNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "IntegrationLog" ADD COLUMN     "stageTransitionId" TEXT;

-- CreateIndex
CREATE INDEX "IntegrationLog_integrationId_stageTransitionId_idx" ON "IntegrationLog"("integrationId", "stageTransitionId");
