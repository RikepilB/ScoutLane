CREATE TABLE "ApplicantAttachment" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "fieldId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "objectName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApplicantAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicantAttachment_objectName_key" ON "ApplicantAttachment"("objectName");
CREATE INDEX "ApplicantAttachment_applicantId_fieldId_idx" ON "ApplicantAttachment"("applicantId", "fieldId");
ALTER TABLE "ApplicantAttachment" ADD CONSTRAINT "ApplicantAttachment_applicantId_fkey"
  FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
