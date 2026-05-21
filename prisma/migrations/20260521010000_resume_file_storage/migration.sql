CREATE TABLE "ResumeFile" (
    "id" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResumeFile_objectName_key" ON "ResumeFile"("objectName");
CREATE INDEX "ResumeFile_createdAt_idx" ON "ResumeFile"("createdAt");
