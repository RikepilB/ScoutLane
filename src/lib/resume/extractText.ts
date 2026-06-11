import mammoth from "mammoth";

type PdfParseCtor = new (input: { data: Uint8Array }) => {
  getText: () => Promise<{ text?: string }>;
  destroy?: () => Promise<void> | void;
};

type PdfParseModule = {
  default?: ((data: Buffer) => Promise<{ text?: string }>) | { PDFParse?: PdfParseCtor };
  PDFParse?: PdfParseCtor;
};

// pdfjs (inside pdf-parse) references browser canvas globals that Node does
// not provide. On Vercel's runtime this surfaced as "ReferenceError: DOMMatrix
// is not defined" and failed every PDF parse, so the globals are polyfilled
// from @napi-rs/canvas before pdf-parse loads.
let domGlobalsPromise: Promise<void> | null = null;

function ensurePdfDomGlobals(): Promise<void> {
  domGlobalsPromise ??= (async () => {
    const g = globalThis as Record<string, unknown>;
    if (typeof g.DOMMatrix !== "undefined") return;
    try {
      const canvas = await import("@napi-rs/canvas");
      g.DOMMatrix ??= canvas.DOMMatrix;
      g.ImageData ??= canvas.ImageData;
      g.Path2D ??= canvas.Path2D;
    } catch (err) {
      // Parsing of text-only PDFs may still succeed without the polyfill.
      console.warn("[extractText] canvas polyfill unavailable:", err);
    }
  })();
  return domGlobalsPromise;
}

// pdf-parse is listed in next.config.ts `serverExternalPackages`, so both
// webpack and Turbopack leave this dynamic import external and Node resolves
// the real package at runtime. (A createRequire(import.meta.url) + require()
// combo broke under the Next bundler — see commit history.)
let pdfParsePromise: Promise<PdfParseModule> | null = null;

function loadPdfParse(): Promise<PdfParseModule> {
  pdfParsePromise ??= ensurePdfDomGlobals().then(
    () => import("pdf-parse") as Promise<PdfParseModule>,
  );
  return pdfParsePromise;
}

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
    const mod = await loadPdfParse();

    if (typeof mod.default === "function") {
      const parsed = await mod.default(buffer);
      return (parsed.text ?? "").trim();
    }

    const PDFParse =
      mod.PDFParse ?? (typeof mod.default === "object" ? mod.default?.PDFParse : undefined);
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
