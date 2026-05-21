import mammoth from "mammoth";

function extension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
}

/**
 * Extract plain text from resume bytes (PDF, Word, CSV, or plain text).
 */
export async function extractTextFromResumeBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = extension(filename);

  if (ext === "csv" || ext === "txt" || ext === "md" || ext === "markdown") {
    return buffer.toString("utf8");
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? "").trim();
  }

  if (ext === "pdf") {
    const mod = await import("pdf-parse");
    const legacyParse = (mod as { default?: unknown }).default;

    if (typeof legacyParse === "function") {
      const parsed = await (legacyParse as (data: Buffer) => Promise<{ text?: string }>)(buffer);
      return (parsed.text ?? "").trim();
    }

    const PDFParse = (mod as {
      PDFParse?: {
        new (input: { data: Uint8Array }): {
          getText: () => Promise<{ text?: string }>;
          destroy?: () => Promise<void> | void;
        };
        setWorker: (workerSrc?: string) => string;
      };
    }).PDFParse;
    if (!PDFParse) {
      throw new Error("PDF parser is unavailable.");
    }

    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const parsed = await parser.getText();
      return (parsed.text ?? "").trim();
    } finally {
      await parser.destroy?.();
    }
  }

  if (ext === "doc") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? "").trim();
      if (text.length > 0) return text;
    } catch {
      /* binary .doc often unsupported */
    }
    throw new Error("Legacy .doc format is not supported. Please upload PDF, DOCX, or CSV.");
  }

  const asUtf8 = buffer.toString("utf8");
  if (asUtf8.length > 200 && /^[\x09\x0A\x0D\x20-\x7E]+$/.test(asUtf8.slice(0, 500))) {
    return asUtf8.trim();
  }

  throw new Error(`Unsupported resume format (.${ext || "unknown"}). Please upload PDF, DOCX, or CSV.`);
}
