"use server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

interface GetApplicantsParams {
  jobId: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getApplicants({ jobId, search, status, sortBy = "createdAt", sortOrder = "desc" }: GetApplicantsParams) {
  const user = await requireSession({ allowGuest: true });

  const where: any = { jobId, job: { organizationId: user.organizationId } };

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
  const user = await requireSession({ allowGuest: true });

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: {
      job: {
        select: {
          title: true,
          slug: true,
          organizationId: true,
        },
      },
    },
  });

  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    return null;
  }

  return applicant;
}
