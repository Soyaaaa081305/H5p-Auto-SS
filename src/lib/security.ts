import DOMPurify from "dompurify";
export function externalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return;
    return url.href;
  } catch {
    return;
  }
}
export function safeHtml(value: unknown): string {
  return DOMPurify.sanitize(typeof value === "string" ? value : "", {
    ALLOWED_TAGS: [
      "p",
      "div",
      "span",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "pre",
      "code",
      "a",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "title",
      "class",
      "colspan",
      "rowspan",
    ],
  });
}

// Ensure all allowed links open safely in a new tab without opener vulnerabilities
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.hasAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});
