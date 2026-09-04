-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Applicant_tags_idx" ON "Applicant" USING GIN ("tags");
