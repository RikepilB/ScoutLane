"use server";

import { prisma } from "@/lib/db/prisma";

interface GetApplicantsParams {
  jobId: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getApplicants({ jobId, search, status, sortBy = "createdAt", sortOrder = "desc" }: GetApplicantsParams) {
  const where: any = { jobId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "all") {
    where.status = status;
  }

  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  const [applicants, total] = await Promise.all([
    prisma.applicant.findMany({ where, orderBy }),
    prisma.applicant.count({ where }),
  ]);

  return { applicants, total };
}

export async function getApplicantDetail(applicantId: string) {
  return prisma.applicant.findUnique({
    where: { id: applicantId },
    include: {
      job: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });
}
