-- CreateIndex
CREATE INDEX "PipelineStage_jobId_order_idx" ON "PipelineStage"("jobId", "order");

-- CreateIndex
CREATE INDEX "StageTransition_applicantId_idx" ON "StageTransition"("applicantId");

-- CreateIndex
CREATE INDEX "StageTransition_jobId_idx" ON "StageTransition"("jobId");

-- CreateIndex
CREATE INDEX "Webhook_events_idx" ON "Webhook" USING GIN ("events");
