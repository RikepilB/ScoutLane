import { NextRequest, NextResponse } from "next/server";
import { authorizeResumeRequest } from "@/lib/resume/access";
import { canEmbedResume } from "@/lib/resume/preview";
import { buildContentDisposition, readResumeObject } from "@/lib/resume/storage-read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ objectName: string[] }> },
) {
  const { objectName } = await params;
  const storedObjectName = objectName.join("/");

  // Resume files contain candidate PII — only the owning workspace may read them.
  const access = await authorizeResumeRequest(storedObjectName);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let resume;
  try {
    resume = await readResumeObject(storedObjectName);
  } catch {
    return NextResponse.json({ error: "Invalid resume path" }, { status: 400 });
  }

  if (!resume) {
    return NextResponse.json(
      {
        error:
          "Resume file not found. It may have been uploaded in a different environment or before durable storage was enabled.",
      },
      { status: 404 },
    );
  }

  // request.nextUrl is absent when invoked with a plain Request (e.g. tests).
  const requestUrl = request.nextUrl ?? new URL(request.url);
  const forceDownload = requestUrl.searchParams.get("download") === "1";
  const disposition =
    !forceDownload && canEmbedResume({ contentType: resume.contentType })
      ? "inline"
      : "attachment";

  return new NextResponse(new Uint8Array(resume.buffer), {
    headers: {
      "Cache-Control": "private, max-age=0, no-cache",
      "Content-Disposition": buildContentDisposition(disposition, resume.filename),
      "Content-Length": String(resume.size),
      "Content-Type": resume.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
