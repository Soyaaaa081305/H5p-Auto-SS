import { useState } from "react";
import { resolveAsset } from "../lib/h5pParser";
import { externalUrl } from "../lib/security";
export function SafeMedia({
  path,
  assetMap,
  kind = "image",
  alt = "Package media",
}: {
  path?: string;
  assetMap: Map<string, string>;
  kind?: "image" | "video" | "audio";
  alt?: string;
}) {
  const [allowed, setAllowed] = useState<string>();
  const local = resolveAsset(path, assetMap);
  const remote = externalUrl(path);
  if (!local && remote && allowed !== remote)
    return (
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm">
        <p>
          External {kind} from {new URL(remote).hostname}. Loading it sends a
          request to that host.
        </p>
        <button
          className="mt-2 underline font-semibold"
          onClick={() => setAllowed(remote)}
        >
          Load external {kind}
        </button>
      </div>
    );
  const src = local || (allowed === remote ? remote : undefined);
  if (!src)
    return (
      <p className="text-xs text-zinc-500 p-3">
        Media unavailable or blocked. Answers remain available.
      </p>
    );
  if (kind === "image")
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="max-w-full max-h-[700px] object-contain rounded-lg mx-auto"
        loading="lazy"
      />
    );
  if (kind === "audio")
    return <audio controls preload="none" src={src} className="w-full" />;
  if (remote && src === remote) {
    const u = new URL(remote);
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : [
              "www.youtube.com",
              "youtube.com",
              "www.youtube-nocookie.com",
            ].includes(u.hostname)
          ? u.searchParams.get("v") || u.pathname.split("/").pop()
          : undefined;
    if (id && /^[\w-]{11}$/.test(id))
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={alt}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="fullscreen; encrypted-media"
          allowFullScreen
          className="w-full aspect-video rounded-xl"
        />
      );
  }
  return (
    <video
      controls
      preload="none"
      src={src}
      className="w-full max-h-[600px] rounded-xl"
    />
  );
}
