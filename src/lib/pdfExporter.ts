import { jsPDF } from "jspdf";
import type { AnswerItem, H5PPackage } from "../types/h5p";
import { resolveAsset } from "./h5pParser";
import { answerText, extractNode, plainText, statusLabel } from "./extraction";
const W = 1920,
  H = 1080;
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function canvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
}
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = "";
      reject(new Error("Image load timed out."));
    }, 10000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Image unavailable."));
    };
    img.src = src;
  });
}
function lines(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
): string[] {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const token of paragraph.split(/(\s+)/)) {
      if (line && ctx.measureText(line + token).width > width) {
        result.push(line.trimEnd());
        line = "";
      }
      if (!line && /^\s+$/.test(token)) continue;
      for (const char of Array.from(token)) {
        if (line && ctx.measureText(line + char).width > width) {
          result.push(line);
          line = "";
        }
        line += char;
      }
    }
    result.push(line.trimEnd());
  }
  return result;
}
const filename = (s: string) =>
  s
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .slice(0, 100) || "H5P";
export async function renderSlideToCanvas(
  slide: any,
  slideIndex: number,
  assets: Map<string, string>,
  globalBackground?: any,
): Promise<HTMLCanvasElement> {
  const c = canvas(),
    ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const bg = slide.slideBackgroundSelector || globalBackground;
  if (/^#[0-9a-f]{3,8}$/i.test(bg?.fillSlideBackground || "")) {
    ctx.fillStyle = bg.fillSlideBackground;
    ctx.fillRect(0, 0, W, H);
  }
  const background = resolveAsset(bg?.imageSlideBackground?.path, assets);
  if (background) {
    try {
      ctx.drawImage(await loadImage(background), 0, 0, W, H);
    } catch {
      /* Preserve other slide elements. */
    }
  }
  for (const el of Array.isArray(slide.elements) ? slide.elements : []) {
    const action = el.action;
    if (!action || typeof action.library !== "string") continue;
    const [library, version] = action.library.split(" "),
      p = action.params || {};
    const x = (Math.max(0, Number(el.x) || 0) * W) / 100,
      y = (Math.max(0, Number(el.y) || 0) * H) / 100;
    const width = (Math.max(1, Number(el.width) || 100) * W) / 100,
      height = (Math.max(1, Number(el.height) || 100) * H) / 100;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    const src =
      library === "H5P.Image" ? resolveAsset(p.file?.path, assets) : undefined;
    if (src) {
      try {
        ctx.drawImage(await loadImage(src), x, y, width, height);
      } catch {
        /* No remote fallback. */
      }
    } else {
      const answers = extractNode({
        library,
        version,
        params: p,
        path: "$",
        location: `Slide ${slideIndex + 1}`,
      });
      const text = answers.length
        ? answers.map((a) => `${a.prompt}\n${answerText(a)}`).join("\n")
        : plainText(p.text || p.title);
      ctx.fillStyle = "#18181b";
      ctx.font = "24px sans-serif";
      lines(ctx, text, Math.max(1, width - 16)).forEach((line, i) =>
        ctx.fillText(line, x + 8, y + 28 + i * 31),
      );
    }
    ctx.restore();
  }
  return c;
}
class Pages {
  doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [W, H],
    hotfixes: ["px_scaling"],
  });
  page = canvas();
  ctx = this.page.getContext("2d")!;
  y = 0;
  count = 0;
  dirty = false;
  constructor() {
    this.reset();
  }
  reset() {
    this.ctx.fillStyle = "#f8fafc";
    this.ctx.fillRect(0, 0, W, H);
    this.y = 90;
    this.dirty = false;
  }
  imagePage(c: HTMLCanvasElement) {
    if (this.count++) this.doc.addPage([W, H], "landscape");
    this.doc.addImage(
      c.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      W,
      H,
      undefined,
      "FAST",
    );
  }
  flush() {
    if (this.dirty) {
      this.imagePage(this.page);
      this.reset();
    }
  }
  text(value: string, heading = false, answer = false) {
    this.ctx.font = `${heading ? "bold 30" : "24"}px sans-serif`;
    const rows = lines(this.ctx, value, W - 180);
    for (const line of rows) {
      if (this.y > H - 90) {
        this.flush();
        this.ctx.font = `${heading ? "bold 30" : "24"}px sans-serif`;
      }
      if (answer) {
        this.ctx.fillStyle = "#ecfdf5";
        this.ctx.fillRect(80, this.y - 26, W - 160, 34);
      }
      this.ctx.fillStyle = answer ? "#065f46" : heading ? "#0f172a" : "#334155";
      this.ctx.fillText(line, 90, this.y);
      this.y += heading ? 42 : 34;
      this.dirty = true;
    }
    this.y += 18;
  }
  async answer(a: AnswerItem, assets: Map<string, string>) {
    if (this.y > H - 300) this.flush();
    this.text(`${a.location} · ${statusLabel[a.status]}`, true);
    this.text(a.prompt);
    this.text(answerText(a), false, true);
    for (const p of a.parts)
      for (const path of p.images || []) {
        const src = resolveAsset(path, assets);
        if (!src) continue;
        try {
          const img = await loadImage(src);
          const scale = Math.min(500 / img.width, 300 / img.height);
          const w = img.width * scale,
            h = img.height * scale;
          if (this.y + h > H - 90) this.flush();
          this.ctx.drawImage(img, 90, this.y, w, h);
          this.y += h + 20;
          this.dirty = true;
        } catch {
          this.text("Answer image unavailable.");
        }
      }
  }
  save(name: string) {
    this.flush();
    if (!this.count) {
      this.text("No exportable package content.");
      this.flush();
    }
    const blob = this.doc.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename(name)}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.page.width = 0;
    this.page.height = 0;
  }
}
export async function exportAnswerKey(
  packages: H5PPackage[],
  selected?: AnswerItem[],
  signal?: AbortSignal,
) {
  const pages = new Pages();
  for (const p of packages) {
    signal?.throwIfAborted();
    pages.text(p.metadata.title || p.fileName, true);
    const answers = selected
      ? selected.filter((a) => p.report.answers.includes(a))
      : p.report.answers;
    if (!answers.length) pages.text("No matching stored answer key.");
    for (const a of answers) {
      signal?.throwIfAborted();
      await pages.answer(a, p.assetMap);
      await tick();
    }
  }
  signal?.throwIfAborted();
  pages.save("H5P Answer Key");
}
async function exportPackages(
  packages: H5PPackage[],
  onProgress?: (current: number, total: number, name: string) => void,
  signal?: AbortSignal,
) {
  const pages = new Pages();
  let current = 0;
  const total = packages.reduce((n, p) => n + p.report.nodes.length, 0);
  for (const pkg of packages) {
    pages.text(pkg.metadata.title || pkg.fileName, true);
    const presentations = pkg.report.nodes.filter(
      (n) => n.library === "H5P.CoursePresentation",
    );
    for (const node of pkg.report.nodes) {
      const inSlide = presentations.some((p) =>
        node.path.startsWith(`${p.path}.params.presentation.slides`),
      );
      signal?.throwIfAborted();
      onProgress?.(++current, total, pkg.metadata.title || pkg.fileName);
      if (node.library === "H5P.CoursePresentation") {
        const slides = node.params.presentation?.slides;
        if (Array.isArray(slides))
          for (let i = 0; i < slides.length; i++) {
            signal?.throwIfAborted();
            pages.flush();
            const c = await renderSlideToCanvas(
              slides[i],
              i,
              pkg.assetMap,
              node.params.presentation?.globalBackgroundSelector,
            );
            pages.imagePage(c);
            c.width = 0;
            await tick();
          }
      }
      if (
        ["H5P.Text", "H5P.AdvancedText", "H5P.Table"].includes(node.library) &&
        !node.path.includes(".task.elements") &&
        !inSlide
      ) {
        const text = plainText(node.params.text || node.params.table);
        if (text) {
          pages.text(node.location, true);
          pages.text(text);
        }
      }
      if (
        node.library === "H5P.Image" &&
        !node.path.includes(".task.elements") &&
        !inSlide
      ) {
        const src = resolveAsset(node.params.file?.path, pkg.assetMap);
        if (src) {
          try {
            const img = await loadImage(src);
            pages.flush();
            const c = canvas(),
              ctx = c.getContext("2d")!;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, W, H);
            const scale = Math.min(W / img.width, H / img.height);
            ctx.drawImage(
              img,
              (W - img.width * scale) / 2,
              (H - img.height * scale) / 2,
              img.width * scale,
              img.height * scale,
            );
            pages.imagePage(c);
            c.width = 0;
          } catch {
            pages.text("Package image unavailable.");
          }
        }
      }
      for (const a of pkg.report.answers.filter(
        (a) => a.sourcePath === node.path,
      ))
        await pages.answer(a, pkg.assetMap);
      await tick();
    }
    for (const note of pkg.report.videoNotes) {
      pages.text(
        `${note.location} · ${note.kind === "transcript" ? "Transcript excerpts" : "Activity-based video notes"}`,
        true,
      );
      pages.text(note.text);
    }
    for (const warning of pkg.report.warnings) pages.text(warning);
    pages.flush();
  }
  signal?.throwIfAborted();
  pages.save(
    packages.length === 1
      ? packages[0].metadata.title || packages[0].fileName
      : "Course All Modules Bundle",
  );
}
export const exportSlidesToPdf = (
  pkg: H5PPackage,
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal,
) => exportPackages([pkg], onProgress, signal);
export const exportBatchToPdf = exportPackages;
export async function copySlideImageToClipboard(
  slide: any,
  slideIndex: number,
  assetMap: Map<string, string>,
) {
  const c = await renderSlideToCanvas(slide, slideIndex, assetMap);
  const blob = await new Promise<Blob | null>((resolve) =>
    c.toBlob(resolve, "image/png"),
  );
  c.width = 0;
  if (!blob || !navigator.clipboard?.write)
    throw new Error("Image clipboard is unavailable.");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
export async function downloadSlideAsPng(
  slide: any,
  slideIndex: number,
  assetMap: Map<string, string>,
  prefixName?: string,
) {
  const c = await renderSlideToCanvas(slide, slideIndex, assetMap);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `${filename(prefixName || "slide")}-${slideIndex + 1}.png`;
  a.click();
  c.width = 0;
}
