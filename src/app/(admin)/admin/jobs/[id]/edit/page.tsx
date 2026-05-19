import { notFound } from "next/navigation";
import { getJob } from "@/server/services/jobs/read";
import { getJobStatus } from "@/lib/jobs";
import { EditJobForm } from "./_components/EditJobForm";

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  const status = getJobStatus(job);

  return (
    <EditJobForm
      jobId={id}
      initialData={{
        title: job.title ?? "",
        description: job.description ?? "",
        descriptionUrl: job.descriptionUrl ?? "",
        location: job.location ?? "",
        type: job.type ?? "",
        salary: job.salary ?? "",
        slug: job.slug ?? "",
        department: job.department ?? "",
        whatYouWillDo: job.whatYouWillDo ?? "",
        requirements: Array.isArray(job.requirements)
          ? (job.requirements as string[]).join("\n")
          : "",
        toolsAndSkills: Array.isArray(job.toolsAndSkills)
          ? (job.toolsAndSkills as string[]).join("\n")
          : "",
      }}
      currentStatus={status}
    />
  );
}
