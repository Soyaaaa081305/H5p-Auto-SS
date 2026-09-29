import { useState } from "react";
import { resolveAsset } from "../lib/h5pParser";
import { externalUrl } from "../lib/security";
import { ExternalLink, Video } from "lucide-react";

export function extractYouTubeId(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const cleaned = url.replace(/&amp;/g, "&").trim();
  const match = cleaned.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  return match ? match[1] : null;
}

export function SafeMedia({
  path,
  assetMap,
  kind = "image",
  alt = "Package media",
  title,
}: {
  path?: string;
  assetMap: Map<string, string>;
  kind?: "image" | "video" | "audio";
  alt?: string;
  title?: string;
}) {
  const [loadError, setLoadError] = useState(false);
  const local = resolveAsset(path, assetMap);

  // Normalize path format
  let cleanPath = path;
  if (typeof cleanPath === "string") {
    cleanPath = cleanPath.replace(/&amp;/g, "&").trim();
    if (cleanPath.startsWith("//")) {
      cleanPath = `https:${cleanPath}`;
    } else if (cleanPath.startsWith("http://")) {
      cleanPath = cleanPath.replace(/^http:\/\//i, "https://");
    } else if (/^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(cleanPath)) {
      cleanPath = `https://${cleanPath}`;
    }
  }

  // 1. YouTube Video handling (defaults directly to player + "Watch on YouTube" button)
  const ytId = extractYouTubeId(cleanPath);
  if (ytId) {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&enablejsapi=1`;
    const directWatchUrl = `https://www.youtube.com/watch?v=${ytId}`;

    return (
      <div className="w-full my-3 space-y-2">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <iframe
            src={embedUrl}
            title={title || alt || "YouTube Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
            onError={() => setLoadError(true)}
          />
        </div>

        {/* Action bar with direct YouTube link */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            <Video className="w-3.5 h-3.5 text-red-500" />
            <span>
              {title ? `${title} • ` : ""}YouTube Video
            </span>
          </div>

          <a
            href={directWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Open video directly on YouTube in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Watch on YouTube ↗</span>
          </a>
        </div>

        {loadError && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <span>Video playback restricted in embed? Click "Watch on YouTube" to open directly.</span>
            <a
              href={directWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Open on YouTube
            </a>
          </div>
        )}
      </div>
    );
  }

  const remote = externalUrl(cleanPath);
  const src = local || remote;

  if (!src) {
    return (
      <div className="p-3 my-2 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-2">
        <span>Media unavailable. Verified study notes & answers remain accessible below.</span>
        {path && /^https?:\/\//i.test(path) && (
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 underline font-medium"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  if (kind === "image") {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="max-w-full max-h-[700px] object-contain rounded-lg mx-auto"
        loading="lazy"
      />
    );
  }

  if (kind === "audio") {
    return <audio controls preload="none" src={src} className="w-full my-2" />;
  }

  // 3. HTML5 Video
  return (
    <div className="w-full my-3 space-y-2">
      <video
        controls
        preload="metadata"
        src={src}
        className="w-full max-h-[600px] rounded-xl bg-black"
      >
        Your browser does not support the video tag.
      </video>
      {remote && (
        <div className="flex justify-end">
          <a
            href={remote}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <span>Open source video file</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
