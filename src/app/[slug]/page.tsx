import { prisma } from "@/lib/db/prisma";
import { canAcceptApplications } from "@/lib/jobs";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShortlinkRedirect({ params }: Props) {
  const { slug } = await params;

  const job = await prisma.job.findUnique({
    where: { slug },
    select: { published: true, archived: true },
  });

  if (!job || !canAcceptApplications(job)) {
    notFound();
  }

  redirect(`/careers/${slug}`);
}
