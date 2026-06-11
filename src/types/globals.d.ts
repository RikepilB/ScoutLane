declare module "*.css" {}

// pdfjs worker build ships no type declarations; imported for its side effect
// of setting globalThis.pdfjsWorker (see src/lib/resume/extractText.ts).
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs";
