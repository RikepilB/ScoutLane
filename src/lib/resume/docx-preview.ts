import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "br",
  "a",
  "blockquote",
];

const BASE_STYLES = `
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #0f172a;
    max-width: 48rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    background: #ffffff;
  }
  h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 1.2em 0 0.4em; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #e2e8f0; padding: 0.35rem 0.5rem; text-align: left; }
  a { color: #4338ca; }
`;

/**
 * Converts DOCX bytes to a self-contained, sanitized HTML document suitable
 * for rendering inside a sandboxed iframe. Scripts, event handlers, images,
 * and non-https/mailto links are stripped.
 */
export async function convertDocxToSafeHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });

  const safeBody = sanitizeHtml(result.value ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "rel", "target"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noreferrer", target: "_blank" }),
    },
    disallowedTagsMode: "discard",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${BASE_STYLES}</style>
</head>
<body>${safeBody}</body>
</html>`;
}
