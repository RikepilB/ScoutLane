-- CreateTable
CREATE TABLE "AutoAdvanceRule" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sourceStageId" TEXT NOT NULL,
    "targetStageId" TEXT NOT NULL,
    "thresholdScore" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoAdvanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutoAdvanceRule_sourceStageId_key" ON "AutoAdvanceRule"("sourceStageId");

-- CreateIndex
CREATE INDEX "AutoAdvanceRule_jobId_idx" ON "AutoAdvanceRule"("jobId");

-- AddForeignKey
ALTER TABLE "AutoAdvanceRule" ADD CONSTRAINT "AutoAdvanceRule_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAdvanceRule" ADD CONSTRAINT "AutoAdvanceRule_sourceStageId_fkey" FOREIGN KEY ("sourceStageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAdvanceRule" ADD CONSTRAINT "AutoAdvanceRule_targetStageId_fkey" FOREIGN KEY ("targetStageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
