function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    const processed = escapeHtml(trimmed)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code class=\"rounded bg-muted px-1 py-0.5 text-sm\">$1</code>");

    if (/^###\s/.test(processed)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 class="text-lg font-semibold mt-4 mb-1">${processed.slice(4)}</h3>`);
    } else if (/^##\s/.test(processed)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2 class="text-xl font-semibold mt-5 mb-2">${processed.slice(3)}</h2>`);
    } else if (/^#\s/.test(processed)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1 class="text-2xl font-bold mt-6 mb-3">${processed.slice(2)}</h1>`);
    } else if (/^-\s/.test(processed)) {
      if (!inList) { html.push('<ul class="list-disc pl-5 space-y-1 my-2">'); inList = true; }
      html.push(`<li>${processed.slice(2)}</li>`);
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p class="mb-2 leading-relaxed">${processed}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  return html.join("\n");
}
