import { test, expect } from "@playwright/test";
import { archive, activity } from "../fixtures";
import { readFile } from "node:fs/promises";
const upload = async (page: any, buffer: Buffer, name = "sample.h5p") =>
  page
    .locator("input[type=file]")
    .first()
    .setInputFiles({ name, mimeType: "application/zip", buffer });
test("local answers, external media, clipboard, PDF and responsive design", async ({
  page,
  context,
}, info) => {
  const outside: string[] = [],
    errors: string[] = [],
    exportRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (/(?:jspdf|pdfExporter)/i.test(request.url())) {
      exportRequests.push(request.url());
    }
  });
  await context.route("https://**/*", (route) => {
    outside.push(route.request().url());
    return route.fulfill({
      body: "<html><body>External media fixture</body></html>",
      contentType: "text/html",
    });
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "H5P to PDF Converter" }),
  ).toBeVisible();
  expect(exportRequests).toEqual([]);
  await upload(page, await archive());
  await expect(
    page.getByRole("button", { name: "Answers", exact: true }),
  ).toBeVisible();
  await expect(page.locator('iframe[src*="youtube"]')).toBeVisible();
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("status")).toContainText("8 answer activities");
  await expect(
    dialog.getByText("red / crimson", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByText("No answer key stored", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Copy", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Correct option 2: Two",
  );
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Answer PDF" }).click();
  const pdf = await download;
  expect(exportRequests.some((url) => /(?:jspdf|pdfExporter)/i.test(url))).toBe(
    true,
  );
  await pdf.saveAs(info.outputPath("answers.pdf"));
  expect(
    (await readFile(info.outputPath("answers.pdf"))).subarray(0, 4).toString(),
  ).toBe("%PDF");
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("answers-desktop.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("answers-mobile.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("answers-dark.png"),
  });
  await dialog.getByRole("button", { name: "Close answers" }).click();
  expect(errors).toEqual([]);
  await expect.poll(() => outside.length).toBeGreaterThan(0);
  expect(outside.some((u) => u.includes("youtube"))).toBe(true);
});
test("keeps successful files and supports all-module answers and removal", async ({
  page,
}) => {
  await page.goto("/");
  const buffer = await archive();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles([
      { name: "one.h5p", mimeType: "application/zip", buffer },
      {
        name: "bad.h5p",
        mimeType: "application/zip",
        buffer: Buffer.from("broken"),
      },
      { name: "two.h5p", mimeType: "application/zip", buffer },
    ]);
  await expect(page.getByRole("alert")).toContainText("1 file(s)");
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  await page.getByLabel("Answer modules").selectOption("all");
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "16 answer activities",
  );
  await page.getByLabel("Search answers").fill("Choose both");
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "2 answer activities",
  );
});
test("long answer exports paginate without changing the extracted key", async ({
  page,
}, info) => {
  const long = "An extended answer with Unicode: café 日本語. ".repeat(500);
  const buffer = await archive(
    {
      questions: [
        activity("H5P.MultiChoice 1.16", {
          question: "Long answer",
          answers: [{ text: long, correct: true }],
        }),
      ],
    },
    "H5P.QuestionSet",
  );
  await page.goto("/");
  await upload(page, buffer);
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Answer PDF" }).click();
  await (await dl).saveAs(info.outputPath("long.pdf"));
  const pdf = await readFile(info.outputPath("long.pdf"));
  expect(
    (pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length,
  ).toBeGreaterThan(2);
});
const samples = process.env.H5P_SAMPLE_FILES?.split("|") || [];
test("local acceptance: both original laboratory books", async ({
  page,
}, info) => {
  test.skip(
    samples.length !== 2,
    "Set H5P_SAMPLE_FILES to two local paths separated by |. Files are never committed.",
  );
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().startsWith("https:")) requests.push(r.url());
  });
  await page.goto("/");
  await page.locator("input[type=file]").first().setInputFiles(samples);
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  await page.getByLabel("Answer modules").selectOption("all");
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "10 answer activities",
  );
  await expect(
    page.getByRole("dialog").getByText("Target 5", { exact: false }),
  ).toBeVisible();
  expect(requests).toEqual([]);
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("laboratory-answers.png"),
  });
});
test("reset releases media URLs and batch PDF contains nested answers", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const state = { created: 0, revoked: 0 };
    (window as any).assetStats = state;
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      state.created++;
      return create(blob);
    };
    URL.revokeObjectURL = (url) => {
      state.revoked++;
      revoke(url);
    };
  });
  await page.goto("/");
  const buffer = await archive();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles([
      { name: "one.h5p", mimeType: "application/zip", buffer },
      { name: "two.h5p", mimeType: "application/zip", buffer },
    ]);
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export All (2) Study Guide", exact: true })
    .click();
  await (await dl).saveAs(info.outputPath("batch.pdf"));
  const bytes = await readFile(info.outputPath("batch.pdf"));
  expect(
    (bytes.toString("latin1").match(/\/Type \/Page\b/g) || []).length,
  ).toBeGreaterThan(2);
  await page.getByTitle("Close modules and upload another").click();
  const stats = await page.evaluate(() => (window as any).assetStats);
  expect(stats.created).toBeGreaterThan(0);
  await expect
    .poll(async () => page.evaluate(() => (window as any).assetStats.revoked))
    .toBe(stats.created);
});
test("local worker import can be cancelled before it completes", async ({
  page,
}) => {
  const bytes = await archive(
    { text: "x".repeat(9 * 1024 * 1024) },
    "H5P.AdvancedText",
  );
  await page.goto("/");
  await upload(page, bytes);
  await page.getByRole("button", { name: "Cancel import" }).click();
  await expect(page.getByRole("alert")).toContainText("cancelled");
  await expect(
    page.getByRole("button", { name: "Answers", exact: true }),
  ).toHaveCount(0);
});
test("service worker excludes imported content and caches only application assets", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
  await page.reload();
  await upload(page, await archive());
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  await page.getByRole("button", { name: "Close answers" }).click();
  const cache = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) =>
      name.startsWith("h5p-pdf-shell-"),
    );
    const urls = (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => r.url),
        ),
      )
    ).flat();
    return { names, urls, origin: new URL(location.href).origin };
  });
  expect(cache.names).toContain("h5p-pdf-shell-v3");
  expect(cache.urls.length).toBeGreaterThan(3);
  expect(
    cache.urls.every((url) => {
      const parsed = new URL(url);
      return (
        parsed.origin === cache.origin &&
        !parsed.search &&
        !parsed.pathname.toLowerCase().endsWith(".h5p") &&
        (parsed.pathname === "/" ||
          ["/index.html", "/manifest.webmanifest", "/icon.svg"].includes(
            parsed.pathname,
          ) ||
          /^\/assets\/[\w.-]+\.(js|css|woff2?|png|svg)$/.test(parsed.pathname))
      );
    }),
  ).toBe(true);
  const removedPresentation = await page.request.get("/sample-module.h5p");
  if (removedPresentation.status() === 200) {
    expect(removedPresentation.headers()["content-type"]).toContain(
      "text/html",
    );
  } else {
    expect(removedPresentation.status()).toBe(404);
  }
  expect(
    (await removedPresentation.body()).subarray(0, 4).toString("hex"),
  ).not.toBe("504b0304");

  try {
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByText(
        "Drop one or more .h5p or .zip files here, or click to browse",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Answers", exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.setOffline(false);
  }
});

test("file selection and both help dialogs work from the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const blackboardHelp = page.getByRole("button", {
    name: "How to download from Blackboard",
  });
  await blackboardHelp.click();
  const blackboardDialog = page.getByRole("dialog", {
    name: "How to download from Blackboard",
  });
  await expect(blackboardDialog).toBeVisible();
  await expect(
    blackboardDialog.getByRole("button", {
      name: "Close Blackboard download guide",
    }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    blackboardDialog.getByRole("button", { name: "Got It!" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(blackboardDialog).toHaveCount(0);
  await expect(blackboardHelp).toBeFocused();

  const fileInput = page.locator('input[type="file"]').first();
  await page.keyboard.press("Shift+Tab");
  await expect(fileInput).toBeFocused();
  const fileChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (
    await fileChooser
  ).setFiles({
    name: "keyboard.h5p",
    mimeType: "application/zip",
    buffer: await archive(),
  });
  await expect(
    page.getByRole("button", { name: "Answers", exact: true }),
  ).toBeVisible();

  const bookmark = page.getByRole("link", { name: "Add Bookmark" });
  await bookmark.click();
  const bookmarkDialog = page.getByRole("dialog", {
    name: "H5P to PDF Quick Bookmark",
  });
  await expect(bookmarkDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bookmarkDialog).toHaveCount(0);
  await expect(bookmark).toBeFocused();
});
test("presentation navigation, dark mode and PNG export retain slide geometry", async ({
  page,
}, info) => {
  const exportRequests: string[] = [];
  page.on("request", (request) => {
    if (/(?:jspdf|pdfExporter)/i.test(request.url())) {
      exportRequests.push(request.url());
    }
  });
  const content = {
    presentation: {
      slides: [
        {
          elements: [
            {
              x: 5,
              y: 5,
              width: 90,
              height: 30,
              action: activity("H5P.AdvancedText 1.1", { text: "First slide" }),
            },
          ],
        },
        {
          elements: [
            {
              x: 5,
              y: 5,
              width: 90,
              height: 80,
              action: activity("H5P.MultiChoice 1.16", {
                question: "Second slide question",
                answers: [{ text: "Yes", correct: true }],
              }),
            },
          ],
        },
      ],
    },
  };
  await page.goto("/");
  expect(exportRequests).toEqual([]);
  await upload(page, await archive(content, "H5P.CoursePresentation"));
  await expect(page.getByText("First slide", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Presentation Mode", exact: true })
    .click();
  await page.getByTitle("Next Slide (Arrow Right / Space)").click();
  await expect(
    page.getByText("Second slide question", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle Theme" }).click();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("slides-dark.png"),
  });
  const dl = page.waitForEvent("download");
  await page.getByTitle("Download 1080p slide PNG").first().click();
  await (await dl).saveAs(info.outputPath("slide.png"));
  expect(exportRequests.some((url) => /(?:jspdf|pdfExporter)/i.test(url))).toBe(
    true,
  );
  const bytes = await readFile(info.outputPath("slide.png"));
  expect(bytes.readUInt32BE(16)).toBe(1920);
  expect(bytes.readUInt32BE(20)).toBe(1080);
});
