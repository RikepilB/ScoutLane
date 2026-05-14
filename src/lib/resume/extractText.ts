import mammoth from "mammoth";

function extension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
}

/**
 * Extract plain text from resume bytes (PDF, DOCX, plain text).
 */
export async function extractTextFromResumeBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = extension(filename);

  if (ext === "txt" || ext === "md" || ext === "markdown") {
    return buffer.toString("utf8");
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? "").trim();
  }

  if (ext === "pdf") {
    const mod = await import("pdf-parse");
    const pdfParse = (mod as { default?: (data: Buffer) => Promise<{ text: string }> }).default ?? (mod as unknown as (data: Buffer) => Promise<{ text: string }>);
    const parsed = await pdfParse(buffer);
    return (parsed.text ?? "").trim();
  }

  if (ext === "doc") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? "").trim();
      if (text.length > 0) return text;
    } catch {
      /* binary .doc often unsupported */
    }
    throw new Error("Legacy .doc format is not supported. Please upload PDF or DOCX.");
  }

  const asUtf8 = buffer.toString("utf8");
  if (asUtf8.length > 200 && /^[\x09\x0A\x0D\x20-\x7E]+$/.test(asUtf8.slice(0, 500))) {
    return asUtf8.trim();
  }

  throw new Error(`Unsupported resume format (.${ext || "unknown"}). Please upload PDF or DOCX.`);
}
