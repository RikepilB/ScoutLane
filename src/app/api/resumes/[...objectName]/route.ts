import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { LOCAL_RESUME_STORAGE_DIR } from "@/lib/storage/upload";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};

function resolveLocalResumePath(parts: string[]): string | null {
  const root = path.resolve(LOCAL_RESUME_STORAGE_DIR);
  const filePath = path.resolve(root, ...parts);
  return filePath === root || !filePath.startsWith(`${root}${path.sep}`) ? null : filePath;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ objectName: string[] }> },
) {
  const { objectName } = await params;
  const filePath = resolveLocalResumePath(objectName);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid resume path" }, { status: 400 });
  }

  try {
    const [file, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    const ext = path.extname(filePath).toLowerCase();

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "private, max-age=0, no-cache",
        "Content-Length": String(info.size),
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
}
