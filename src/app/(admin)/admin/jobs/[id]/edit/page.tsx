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
        location: job.location ?? "",
        type: job.type ?? "",
        salary: job.salary ?? "",
        slug: job.slug ?? "",
      }}
      currentStatus={status}
    />
  );
}
