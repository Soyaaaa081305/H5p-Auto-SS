import JSZip from "jszip";
import { extractContent, plainText } from "./extraction";
import type { H5PMetadata } from "../types/h5p";
import { LIMITS, normalizePath } from "./archiveLimits";
export { LIMITS, normalizePath } from "./archiveLimits";
// Inspect original central-directory names before JSZip sanitizes or merges them.
export function inspectZip(bytes: Uint8Array): void {
  if (bytes.byteLength > LIMITS.archive)
    throw new Error("Archive exceeds the 256 MB limit.");
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      d.getUint32(i, true) === 0x06054b50 &&
      i + 22 + d.getUint16(i + 20, true) === bytes.length
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("Invalid or truncated ZIP archive.");
  const count = d.getUint16(end + 10, true),
    size = d.getUint32(end + 12, true);
  let pos = d.getUint32(end + 16, true),
    total = 0;
  if (
    d.getUint16(end + 4, true) ||
    d.getUint16(end + 6, true) ||
    d.getUint16(end + 8, true) !== count ||
    count === 65535 ||
    count > LIMITS.entries ||
    pos + size !== end
  )
    throw new Error("Unsupported ZIP layout or too many entries.");
  const names = new Set<string>();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || d.getUint32(pos, true) !== 0x02014b50)
      throw new Error("Invalid ZIP directory.");
    const flags = d.getUint16(pos + 8, true),
      method = d.getUint16(pos + 10, true);
    const length = d.getUint16(pos + 28, true),
      extra = d.getUint16(pos + 30, true),
      comment = d.getUint16(pos + 32, true);
    if (
      flags & 1 ||
      ![0, 8].includes(method) ||
      pos + 46 + length + extra + comment > end
    )
      throw new Error("Encrypted or unsupported archive entry.");
    const name = normalizePath(
      decoder.decode(bytes.subarray(pos + 46, pos + 46 + length)),
    );
    if (names.has(name)) throw new Error("Duplicate archive path.");
    names.add(name);
    // Reject alternate Unicode path fields that would change the inspected name.
    let field = pos + 46 + length;
    while (field < pos + 46 + length + extra) {
      if (field + 4 > pos + 46 + length + extra)
        throw new Error("Invalid ZIP extra field.");
      const type = d.getUint16(field, true),
        len = d.getUint16(field + 2, true);
      if (field + 4 + len > pos + 46 + length + extra)
        throw new Error("Invalid ZIP extra field.");
      if (
        type === 0x7075 &&
        (len < 5 ||
          normalizePath(
            decoder.decode(bytes.subarray(field + 9, field + 4 + len)),
          ) !== name)
      )
        throw new Error("Conflicting archive path.");
      field += 4 + len;
    }
    const local = d.getUint32(pos + 42, true);
    if (local + 30 > end || d.getUint32(local, true) !== 0x04034b50)
      throw new Error("Invalid ZIP entry header.");
    const localLength = d.getUint16(local + 26, true);
    if (
      local + 30 + localLength > end ||
      normalizePath(
        decoder.decode(bytes.subarray(local + 30, local + 30 + localLength)),
      ) !== name
    )
      throw new Error("Conflicting archive entry name.");
    const expanded = d.getUint32(pos + 24, true);
    total += expanded;
    if (
      total > LIMITS.expanded ||
      (name.endsWith(".json") && expanded > LIMITS.json)
    )
      throw new Error("Archive exceeds safe expanded-data limits.");
    pos += 46 + length + extra + comment;
  }
  if (pos !== end) throw new Error("Invalid ZIP directory length.");
}

export async function readArchive(bytes: Uint8Array, fileName: string) {
  inspectZip(bytes);
  const zip = await JSZip.loadAsync(bytes);
  const entries = new Map(
    Object.entries(zip.files).map(([path, entry]) => [
      normalizePath(path),
      entry,
    ]),
  );
  const entryAt = (path: string) => {
    const entry = entries.get(path);
    return entry?.dir ? undefined : entry;
  };
  let expanded = 0;
  async function read(
    path: string,
    limit = LIMITS.expanded,
  ): Promise<Uint8Array> {
    const entry = entryAt(path);
    if (!entry)
      throw new Error(
        `Required package file is missing: ${path === "h5p.json" ? path : "content data"}.`,
      );
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let length = 0,
        stopped = false;
      // JSZip exposes internalStream at runtime; its published JSZipObject type omits it.
      type Stream = {
        on(event: "data", cb: (chunk: Uint8Array) => void): Stream;
        on(event: "error" | "end", cb: () => void): Stream;
        pause(): void;
        resume(): void;
      };
      const stream = (
        entry as unknown as { internalStream(type: string): Stream }
      ).internalStream("uint8array");
      stream
        .on("data", (chunk) => {
          if (stopped) return;
          length += chunk.length;
          expanded += chunk.length;
          if (length > limit || expanded > LIMITS.expanded) {
            stopped = true;
            stream.pause();
            chunks.length = 0;
            reject(new Error("Expanded data exceeds the safe limit."));
            return;
          }
          chunks.push(chunk);
        })
        .on("error", () =>
          reject(new Error("An archive entry could not be decompressed.")),
        )
        .on("end", () => {
          if (stopped) return;
          const result = new Uint8Array(length);
          let offset = 0;
          chunks.forEach((c) => {
            result.set(c, offset);
            offset += c.length;
          });
          resolve(result);
        })
        .resume();
    });
  }
  const json = async (path: string) =>
    JSON.parse(new TextDecoder().decode(await read(path, LIMITS.json)));
  const metadata = (await json("h5p.json")) as H5PMetadata;
  if (
    !metadata ||
    typeof metadata !== "object" ||
    typeof metadata.mainLibrary !== "string"
  )
    throw new Error("Invalid H5P metadata.");
  if (typeof metadata.title !== "string") metadata.title = fileName;
  const content = await json("content/content.json");
  if (!content || typeof content !== "object" || Array.isArray(content))
    throw new Error("Invalid H5P content.");
  const deps = Array.isArray(metadata.preloadedDependencies)
    ? metadata.preloadedDependencies
    : [];
  const dep = deps.find((d) => d.machineName === metadata.mainLibrary);
  const report = extractContent(
    content,
    metadata.mainLibrary,
    fileName,
    dep ? `${dep.majorVersion}.${dep.minorVersion}` : undefined,
  );
  const blobs = new Map<string, Blob>();
  const paths = new Set<string>();
  const stack: unknown[] = [content];
  while (stack.length) {
    const v = stack.pop();
    if (typeof v === "string" && !/^[a-z]+:/i.test(v)) {
      try {
        const path = normalizePath(v);
        const full = path.startsWith("content/") ? path : `content/${path}`;
        if (entryAt(full)) paths.add(full);
      } catch {
        /* Not an asset path. */
      }
    } else if (v && typeof v === "object") stack.push(...Object.values(v));
  }
  const mime: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    vtt: "text/vtt",
    srt: "text/plain",
  };
  for (const path of paths) {
    const ext = path.split(".").pop()!.toLowerCase();
    if (!mime[ext]) {
      report.warnings.push("An unsupported media format was left unloaded.");
      continue;
    }
    const data = await read(path);
    blobs.set(path, new Blob([data as BlobPart], { type: mime[ext] }));
  }
  for (const node of report.nodes.filter(
    (n) => n.library === "H5P.Video" || n.library === "H5P.InteractiveVideo",
  )) {
    const source = JSON.stringify(node.params);
    const captions: string[] = [];
    for (const [path, blob] of blobs) {
      if (
        /\.(vtt|srt)$/i.test(path) &&
        (source.includes(path) || source.includes(path.slice(8)))
      )
        captions.push(plainText(await blob.text()));
    }
    if (captions.length) {
      report.videoNotes = report.videoNotes.filter(
        (n) =>
          !(
            n.sourcePath === node.path &&
            n.text.startsWith("No packaged transcript")
          ),
      );
      report.videoNotes.push({
        sourcePath: node.path,
        location: node.location,
        kind: "transcript",
        text: captions.join("\n\n"),
      });
    }
  }
  // Read schema hints as data only; never import library scripts or styles.
  for (const answer of report.answers.filter(
    (a) => a.status === "unsupported",
  )) {
    if (
      !/^H5P\.[A-Za-z0-9]+$/.test(answer.library) ||
      !/^\d+\.\d+$/.test(answer.version || "")
    )
      continue;
    const path = `${answer.library}-${answer.version}/semantics.json`;
    if (!entryAt(path)) continue;
    try {
      const semantics = await json(path);
      const labels = Array.isArray(semantics)
        ? semantics
            .slice(0, 12)
            .map((s) => plainText(s?.label))
            .filter(Boolean)
        : [];
      if (labels.length)
        answer.explanation += ` Packaged field labels: ${labels.join(", ")}.`;
    } catch {
      report.warnings.push("A packaged schema hint could not be read.");
    }
  }
  return { metadata, content, report, blobs };
}
