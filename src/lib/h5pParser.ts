import type { H5PPackage } from "../types/h5p";
import type { readArchive } from "./archive";
import { LIMITS, normalizePath } from "./archiveLimits";
const ownedUrls = new Set<string>();
class AssetMap extends Map<string, string> {
  constructor(private blobs: Map<string, Blob>) {
    super();
  }
  override get(path: string): string | undefined {
    if (super.has(path)) return super.get(path);
    const blob = this.blobs.get(path);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    ownedUrls.add(url);
    super.set(path, url);
    return url;
  }
  override has(path: string) {
    return this.blobs.has(path) || super.has(path);
  }
  override clear() {
    this.blobs.clear();
    super.clear();
  }
}
export const isOwnedAsset = (url: string) => ownedUrls.has(url);
export async function parseH5PFile(
  file: File | Blob,
  customFileName?: string,
  signal?: AbortSignal,
): Promise<H5PPackage> {
  if (file.size > LIMITS.archive)
    throw new Error("Archive exceeds the 256 MB limit.");
  signal?.throwIfAborted();
  const bytes = await file.arrayBuffer();
  signal?.throwIfAborted();
  const fileName =
    customFileName || (file instanceof File ? file.name : "module.h5p");
  const worker = new Worker(
    new URL("../workers/h5p.worker.ts", import.meta.url),
    { type: "module" },
  );
  const result = await new Promise<Awaited<ReturnType<typeof readArchive>>>(
    (resolve, reject) => {
      const cleanup = () => {
        worker.terminate();
        signal?.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException("Import cancelled.", "AbortError"));
      };
      signal?.addEventListener("abort", abort, { once: true });
      worker.onerror = () => {
        cleanup();
        reject(
          new Error(
            "Package worker failed. Please try a smaller or valid package.",
          ),
        );
      };
      worker.onmessage = (event) => {
        cleanup();
        event.data.error
          ? reject(new Error(event.data.error))
          : resolve(event.data.result);
      };
      worker.postMessage({ bytes, fileName }, [bytes]);
    },
  );
  const assetMap = new AssetMap(result.blobs);
  return {
    fileName,
    fileSize: file.size,
    metadata: result.metadata,
    mainLibrary: result.metadata.mainLibrary,
    content: result.content,
    report: result.report,
    assetMap,
    dispose: () => revokeAssets(assetMap),
  };
}
export function resolveAsset(
  path: string | undefined,
  assetMap: Map<string, string>,
): string | undefined {
  if (typeof path !== "string") return;
  if (isOwnedAsset(path)) return path;
  try {
    const normalized = normalizePath(path);
    return (
      assetMap.get(
        normalized.startsWith("content/")
          ? normalized
          : `content/${normalized}`,
      ) || assetMap.get(normalized)
    );
  } catch {
    return;
  }
}
export function revokeAssets(assetMap: Map<string, string>) {
  for (const url of new Set(assetMap.values())) {
    ownedUrls.delete(url);
    URL.revokeObjectURL(url);
  }
  assetMap.clear();
}
