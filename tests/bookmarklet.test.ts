// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { BOOKMARKLET_CODE } from "../src/components/Header";

it("exports valid bookmarklet URI with protocol prefix", () => {
  expect(BOOKMARKLET_CODE.startsWith("javascript:(function(){")).toBe(true);
  expect(BOOKMARKLET_CODE.endsWith("})();")).toBe(true);
});

it("recursively traverses nested iframes (level 1 -> level 2) to find and click H5P reuse button", async () => {
  document.body.innerHTML = "";
  vi.useFakeTimers();

  // Create top-level iframe (Level 1: e.g. classic-learn-iframe)
  const frame1 = document.createElement("iframe");
  document.body.appendChild(frame1);
  const doc1 = frame1.contentDocument;
  expect(doc1).not.toBeNull();

  // Create nested iframe inside doc1 (Level 2: e.g. LTI H5P player)
  const frame2 = doc1!.createElement("iframe");
  doc1!.body.appendChild(frame2);
  const doc2 = frame2.contentDocument;
  expect(doc2).not.toBeNull();

  // Add H5P reuse button inside doc2 with real H5P class & text
  let reuseClicked = false;
  let downloadClicked = false;

  const reuseBtn = doc2!.createElement("button");
  reuseBtn.className = "h5p-core-button h5p-button-reuse";
  reuseBtn.textContent = "Reuse";
  reuseBtn.onclick = () => {
    reuseClicked = true;
    // Simulate dialog spawning download button
    const dlBtn = doc2!.createElement("button");
    dlBtn.className = "h5p-download-button";
    dlBtn.textContent = "Download as an .h5p file";
    dlBtn.onclick = () => {
      downloadClicked = true;
    };
    doc2!.body.appendChild(dlBtn);
  };
  doc2!.body.appendChild(reuseBtn);

  // Execute bookmarklet code (strip "javascript:")
  const js = BOOKMARKLET_CODE.replace(/^javascript:/, "");
  new Function(js)();

  expect(reuseClicked).toBe(true);

  // Fast forward timers to allow pollDownload to run
  vi.advanceTimersByTime(250);

  expect(downloadClicked).toBe(true);

  // Verify toast notification is displayed in top document
  const toast = document.getElementById("h5p-toast");
  expect(toast).not.toBeNull();
  expect(toast?.textContent).toContain("H5P Download Triggered");

  vi.useRealTimers();
});
