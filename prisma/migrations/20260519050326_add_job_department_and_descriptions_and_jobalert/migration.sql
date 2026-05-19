-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "department" TEXT,
ADD COLUMN     "requirements" JSONB,
ADD COLUMN     "toolsAndSkills" JSONB,
ADD COLUMN     "whatYouWillDo" TEXT;

-- AlterTable
ALTER TABLE "JobTemplate" ADD COLUMN     "department" TEXT,
ADD COLUMN     "requirements" JSONB,
ADD COLUMN     "toolsAndSkills" JSONB,
ADD COLUMN     "whatYouWillDo" TEXT;

-- CreateTable
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobAlert_email_key" ON "JobAlert"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JobAlert_token_key" ON "JobAlert"("token");
