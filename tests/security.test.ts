// @vitest-environment jsdom
import { it, expect } from "vitest";
import { safeHtml, externalUrl } from "../src/lib/security";
it("removes executable markup and automatic outbound resources", () => {
  const html = safeHtml(
    '<p onclick="evil()">hello<img src="https://bad.test/track"><svg onload="evil()"></svg><iframe src="https://bad.test"></iframe><style>@import "https://bad.test";</style><a href="javascript:evil()">click</a></p>',
  );
  expect(html).toContain("hello");
  expect(html).not.toMatch(/https:|onclick|iframe|svg|style|javascript/);
});
it("allows only credential-free absolute HTTPS links", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "blob:x",
    "//bad.test",
    "https://user:pass@bad.test",
    "http://bad.test",
  ])
    expect(externalUrl(url)).toBeUndefined();
  expect(externalUrl("https://example.com/file.h5p")).toBe(
    "https://example.com/file.h5p",
  );
});
