-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "lastStageChangeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pipelineStageId" TEXT;

-- CreateIndex
CREATE INDEX "Applicant_jobId_pipelineStageId_idx" ON "Applicant"("jobId", "pipelineStageId");

-- CreateIndex
CREATE INDEX "Applicant_jobId_createdAt_idx" ON "Applicant"("jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: assign each applicant to a stage on their job.
-- Match on UPPER(stage.name) === status when possible, else first stage by order asc.
WITH name_match AS (
    SELECT a."id" AS applicant_id, s."id" AS stage_id
    FROM "Applicant" a
    JOIN "PipelineStage" s ON s."jobId" = a."jobId" AND UPPER(s."name") = a."status"::text
), first_stage AS (
    SELECT DISTINCT ON (a."id") a."id" AS applicant_id, s."id" AS stage_id
    FROM "Applicant" a
    JOIN "PipelineStage" s ON s."jobId" = a."jobId"
    WHERE a."pipelineStageId" IS NULL
    ORDER BY a."id", s."order" ASC
)
UPDATE "Applicant" a
SET "pipelineStageId" = COALESCE(
    (SELECT stage_id FROM name_match WHERE applicant_id = a."id"),
    (SELECT stage_id FROM first_stage WHERE applicant_id = a."id")
),
"lastStageChangeAt" = a."createdAt"
WHERE a."pipelineStageId" IS NULL;
