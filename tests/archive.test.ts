import { it, expect } from "vitest";
import JSZip from "jszip";
import {
  readArchive,
  inspectZip,
  normalizePath,
  LIMITS,
} from "../src/lib/archive";
import { archive, activity } from "./fixtures";
it("reads nested answers and referenced assets without executable libraries", async () => {
  const r = await readArchive(await archive(), "sample.h5p");
  expect(r.report.answers).toHaveLength(8);
  expect([...r.blobs.keys()]).toEqual(["content/images/pixel.png"]);
});
it("rejects truncated, invalid and traversing archives", async () => {
  expect(() => inspectZip(new Uint8Array(20))).toThrow();
  for (const path of ["../bad", "/root", "a/../b", "C:\\file", "a\u0000b"])
    expect(() => normalizePath(path)).toThrow();
  const z = new JSZip();
  z.file("../bad", "bad");
  await expect(
    readArchive(await z.generateAsync({ type: "uint8array" }), "bad"),
  ).rejects.toThrow(/path/);
});
it("rejects duplicate central directory paths", async () => {
  const z = new JSZip();
  z.file("aaa", "a");
  z.file("bbb", "b");
  const bytes = await z.generateAsync({ type: "uint8array" });
  for (let i = 0; i < bytes.length - 3; i++)
    if (bytes[i] === 98 && bytes[i + 1] === 98 && bytes[i + 2] === 98)
      bytes.set([97, 97, 97], i);
  expect(() => inspectZip(bytes)).toThrow(/Duplicate/);
});
it("enforces declared expansion and JSON limits before decompressing", async () => {
  const bytes = await archive();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < bytes.length - 46; i++)
    if (view.getUint32(i, true) === 0x02014b50) {
      view.setUint32(i + 24, LIMITS.expanded + 1, true);
      break;
    }
  expect(() => inspectZip(bytes)).toThrow(/limits/);
});
it("rejects malformed metadata and missing content", async () => {
  const z = new JSZip();
  z.file("h5p.json", "{}");
  await expect(
    readArchive(await z.generateAsync({ type: "uint8array" }), "bad"),
  ).rejects.toThrow(/metadata/);
  z.file("h5p.json", JSON.stringify({ mainLibrary: "H5P.Column" }));
  await expect(
    readArchive(await z.generateAsync({ type: "uint8array" }), "bad"),
  ).rejects.toThrow(/missing/);
});
it("reads only local caption files and schema hints", async () => {
  const z = new JSZip();
  z.file("h5p.json", JSON.stringify({ mainLibrary: "H5P.Column" }));
  z.file(
    "content/content.json",
    JSON.stringify({
      content: [
        {
          content: activity("H5P.Video 1.6", {
            tracks: [{ path: "captions.vtt" }],
          }),
        },
        { content: activity("H5P.Custom 1.0", {}) },
      ],
    }),
  );
  z.file(
    "content/captions.vtt",
    "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nLocal caption",
  );
  z.file(
    "H5P.Custom-1.0/semantics.json",
    JSON.stringify([{ label: "Special key" }]),
  );
  const r = await readArchive(
    await z.generateAsync({ type: "uint8array" }),
    "test",
  );
  expect(
    r.report.videoNotes.some(
      (n) => n.kind === "transcript" && n.text.includes("Local caption"),
    ),
  ).toBe(true);
  expect(r.report.answers[0].explanation).toContain("Special key");
});
