ALTER TABLE "PipelineStage"
ADD COLUMN "status" "ApplicationStatus" NOT NULL DEFAULT 'REVIEWING';

UPDATE "PipelineStage"
SET "status" = CASE UPPER("name")
  WHEN 'APPLIED' THEN 'NEW'::"ApplicationStatus"
  WHEN 'NEW' THEN 'NEW'::"ApplicationStatus"
  WHEN 'SCREENING' THEN 'REVIEWING'::"ApplicationStatus"
  WHEN 'REVIEWING' THEN 'REVIEWING'::"ApplicationStatus"
  WHEN 'ASSESSMENT' THEN 'REVIEWING'::"ApplicationStatus"
  WHEN 'SHORTLISTED' THEN 'SHORTLISTED'::"ApplicationStatus"
  WHEN 'INTERVIEW' THEN 'INTERVIEW'::"ApplicationStatus"
  WHEN 'OFFER' THEN 'OFFERED'::"ApplicationStatus"
  WHEN 'OFFERED' THEN 'OFFERED'::"ApplicationStatus"
  WHEN 'HIRED' THEN 'OFFERED'::"ApplicationStatus"
  WHEN 'REJECTED' THEN 'REJECTED'::"ApplicationStatus"
  WHEN 'WITHDRAWN' THEN 'WITHDRAWN'::"ApplicationStatus"
  ELSE 'REVIEWING'::"ApplicationStatus"
END;
