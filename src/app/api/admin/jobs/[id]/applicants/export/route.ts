import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: jobId } = await params;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: user.organizationId },
    select: { title: true, slug: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const applicants = await prisma.applicant.findMany({
    where: { jobId },
    include: { pipelineStage: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "id",
    "name",
    "email",
    "phone",
    "pipelineStage",
    "status",
    "appliedAt",
    "resumeUrl",
    "parsingStatus",
  ];

  const lines = [
    header.join(","),
    ...applicants.map((a: (typeof applicants)[number]) =>
      [
        csvEscape(a.id),
        csvEscape(a.name),
        csvEscape(a.email),
        csvEscape(a.phone),
        csvEscape(a.pipelineStage?.name ?? ""),
        csvEscape(a.status),
        csvEscape(a.createdAt.toISOString()),
        csvEscape(a.resumeUrl),
        csvEscape(a.parsingStatus ?? ""),
      ].join(","),
    ),
  ];

  const body = lines.join("\n");
  const filename = `applicants-${job.slug}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
