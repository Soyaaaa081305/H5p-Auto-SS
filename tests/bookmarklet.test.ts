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

it("ignores Blackboard MS Teams extension iframes and does not click non-H5P buttons", () => {
  document.body.innerHTML = "";

  // Simulate Blackboard MS Teams extension iframe
  const teamsFrame = document.createElement("iframe");
  teamsFrame.src = "https://bb-ms-teams-ultra-ext.api.blackboard.com/ready?uuid=123&code=abc";
  document.body.appendChild(teamsFrame);

  // Simulate Blackboard shell button with "reuse" in unrelated class or non-H5P button
  let shellClicked = false;
  const shellBtn = document.createElement("button");
  shellBtn.className = "route-reuse-item";
  shellBtn.textContent = "Reuse Course Content";
  shellBtn.onclick = () => {
    shellClicked = true;
  };
  document.body.appendChild(shellBtn);

  // Execute bookmarklet code
  const js = BOOKMARKLET_CODE.replace(/^javascript:/, "");
  new Function(js)();

  expect(shellClicked).toBe(false);

  const toast = document.getElementById("h5p-toast");
  expect(toast).not.toBeNull();
  expect(toast?.textContent).toContain("Open Slide First");
});

it("shows clear instructions when H5P is in a protected cross-origin frame", () => {
  document.body.innerHTML = "";

  // Create an iframe pointing to an H5P module
  const h5pFrame = document.createElement("iframe");
  h5pFrame.className = "h5p-iframe";
  h5pFrame.src = "https://mcl.h5p.com/content/12345";
  // Simulate cross-origin security exception on contentDocument
  Object.defineProperty(h5pFrame, "contentDocument", {
    get() {
      throw new DOMException("Blocked a frame with origin from accessing a cross-origin frame.", "SecurityError");
    },
  });
  document.body.appendChild(h5pFrame);

  // Execute bookmarklet code
  const js = BOOKMARKLET_CODE.replace(/^javascript:/, "");
  new Function(js)();

  const toast = document.getElementById("h5p-toast");
  expect(toast).not.toBeNull();
  expect(toast?.textContent).toContain("Click \"⎘ Reuse\" on Slide");
});

