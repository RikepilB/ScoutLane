-- Add unique constraint to prevent duplicate applications per job
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_jobId_email_key" UNIQUE ("jobId", "email");
