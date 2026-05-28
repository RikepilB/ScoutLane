import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  span: ["style"],
  p: ["style"],
  div: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
  h4: ["style"],
  h5: ["style"],
  h6: ["style"],
  td: ["style", "colspan", "rowspan"],
  th: ["style", "colspan", "rowspan"],
  table: ["style"],
  tr: ["style"],
};

const ALLOWED_SCHEMES = ["http", "https", "mailto", "tel"];

export function sanitizeEmailHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: { a: ALLOWED_SCHEMES },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    allowedStyles: {
      "*": {
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z-]+$/i],
        "background-color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z-]+$/i],
        "text-align": [/^left$|^right$|^center$|^justify$/],
        "font-size": [/^\d+(?:px|em|rem|%)$/],
        "font-weight": [/^\d+$|^bold$|^normal$/],
        margin: [/^[\d\s\-pxremxce%]+$/i],
        padding: [/^[\d\s\-pxremxce%]+$/i],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target === "_blank" ? "_blank" : "_self",
        },
      }),
    },
  });
}
