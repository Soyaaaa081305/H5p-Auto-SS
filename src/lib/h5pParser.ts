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

export async function fetchH5PFromUrl(url: string): Promise<H5PPackage> {
  const trimmed = url.trim();

  // Detect Blackboard URLs
  if (trimmed.includes('blackboard.com')) {
    throw new Error(
      'Blackboard links require your active school login session. An external link cannot bypass login. Please open the H5P in Blackboard, click "Reuse" or "Download" at the bottom of the player frame to download the .h5p file, and drop it here!'
    );
  }

  // Attempt direct fetch
  let response: Response | null = null;
  try {
    response = await fetch(trimmed);
  } catch {
    // Attempt with proxy if CORS blocks
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`;
      response = await fetch(proxyUrl);
    } catch (e) {
      throw new Error('Failed to fetch file from URL. Please verify the URL or download the .h5p file directly.');
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to download from URL (Status ${response?.status || 'Unknown'}). Verify the URL points to a public .h5p file.`);
  }

  const blob = await response.blob();
  const filename = trimmed.split('/').pop()?.split('?')[0] || 'presentation.h5p';
  return parseH5PFile(blob, filename.endsWith('.h5p') ? filename : `${filename}.h5p`);
}

