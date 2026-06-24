import { NextRequest, NextResponse } from "next/server";
import { authorizeResumeRequest } from "@/lib/resume/access";
import { convertDocxToSafeHtml } from "@/lib/resume/docx-preview";
import { readResumeObject } from "@/lib/resume/storage-read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Renders a stored DOCX resume as sanitized HTML for the admin inline preview.
 * The middleware matcher excludes /api/resumes, so authentication is enforced
 * here: a signed-in user whose organization owns the requested resume.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ objectName: string[] }> },
) {
  const { objectName } = await params;
  const storedObjectName = objectName.join("/");

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
    return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
  }

  const baseContentType = resume.contentType.split(";")[0]?.trim().toLowerCase();
  const isDocx =
    baseContentType === DOCX_CONTENT_TYPE || /\.docx$/i.test(resume.filename);
  if (!isDocx) {
    return NextResponse.json(
      { error: "Preview is only available for .docx resumes." },
      { status: 415 },
    );
  }

  try {
    const html = await convertDocxToSafeHtml(resume.buffer);
    return new NextResponse(html, {
      headers: {
        "Cache-Control": "private, max-age=0, no-cache",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    console.error("[resume-preview] docx conversion failed:", error);
    return NextResponse.json(
      { error: "Could not generate a preview for this document." },
      { status: 500 },
    );
  }
}
