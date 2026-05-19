import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function PublicJobShortlinkPage({ params }: Props) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: { slug: true, published: true, archived: true },
  });

  if (!job || !job.published || job.archived) {
    notFound();
  }

  redirect(`/careers/${job.slug}`);
}
