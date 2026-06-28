export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdownLines(content: string): string {
  const lines = content.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      html.push("<br />");
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }
  closeList();
  return html.join("");
}

type LegalPolicyContentDisplayProps = {
  content: string;
  contentFormat?: string;
  className?: string;
};

export function LegalPolicyContentDisplay({
  content,
  contentFormat = "MARKDOWN",
  className,
}: LegalPolicyContentDisplayProps) {
  const format = contentFormat.toUpperCase();

  if (format === "HTML") {
    return (
      <pre
        className={className}
        aria-label="HTML preview (escaped)"
      >
        {content}
      </pre>
    );
  }

  if (format === "PLAIN") {
    return (
      <div className={className} style={{ whiteSpace: "pre-wrap" }}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMarkdownLines(content) }}
    />
  );
}
