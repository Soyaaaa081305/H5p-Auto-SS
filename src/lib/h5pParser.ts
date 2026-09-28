import JSZip from 'jszip';
import { H5PMetadata, H5PPackage } from '../types/h5p';

export async function parseH5PFile(file: File | Blob, customFileName?: string): Promise<H5PPackage> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 1. Read h5p.json
  const h5pJsonFile = loadedZip.file('h5p.json');
  if (!h5pJsonFile) {
    throw new Error('Invalid H5P archive: "h5p.json" was not found in the root directory.');
  }
  const h5pJsonText = await h5pJsonFile.async('text');
  const metadata: H5PMetadata = JSON.parse(h5pJsonText);

  // 2. Read content/content.json
  const contentJsonFile = loadedZip.file('content/content.json');
  if (!contentJsonFile) {
    throw new Error('Invalid H5P archive: "content/content.json" was not found.');
  }
  const contentJsonText = await contentJsonFile.async('text');
  const content = JSON.parse(contentJsonText);

  // 3. Extract all content assets (images, audio, etc.) into Blob URLs
  const assetMap = new Map<string, string>();

  const assetPromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    // We are interested in files inside content/ (or anywhere in the zip if referenced)
    if (!zipEntry.dir && relativePath !== 'content/content.json' && relativePath !== 'h5p.json') {
      assetPromises.push(
        (async () => {
          try {
            const blob = await zipEntry.async('blob');
            const blobUrl = URL.createObjectURL(blob);
            // Store full relative path: e.g. "content/images/foo.png"
            assetMap.set(relativePath, blobUrl);

            // Also store without "content/" prefix: e.g. "images/foo.png"
            if (relativePath.startsWith('content/')) {
              const stripped = relativePath.slice('content/'.length);
              assetMap.set(stripped, blobUrl);
            }
          } catch (err) {
            console.warn(`Failed to extract asset ${relativePath}:`, err);
          }
        })()
      );
    }
  });

  await Promise.all(assetPromises);

  return {
    fileName: customFileName || (file instanceof File ? file.name : 'module.h5p'),
    fileSize: file.size,
    metadata,
    mainLibrary: metadata.mainLibrary || 'Unknown',
    content,
    assetMap,
  };
}

export function resolveAsset(path: string | undefined, assetMap: Map<string, string>): string | undefined {
  if (!path) return undefined;
  
  // If already an absolute URL or data URL
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  // Normalize slashes
  const cleanPath = path.replace(/\\/g, '/');

  if (assetMap.has(cleanPath)) {
    return assetMap.get(cleanPath);
  }

  if (cleanPath.startsWith('content/')) {
    const stripped = cleanPath.slice('content/'.length);
    if (assetMap.has(stripped)) {
      return assetMap.get(stripped);
    }
  } else {
    const prefixed = `content/${cleanPath}`;
    if (assetMap.has(prefixed)) {
      return assetMap.get(prefixed);
    }
  }

  // Fallback: look for filename match
  const filename = cleanPath.split('/').pop();
  if (filename) {
    for (const [key, url] of assetMap.entries()) {
      if (key.endsWith(filename)) {
        return url;
      }
    }
  }

  return undefined;
}

export function revokeAssets(assetMap: Map<string, string>) {
  for (const url of assetMap.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  assetMap.clear();
}
