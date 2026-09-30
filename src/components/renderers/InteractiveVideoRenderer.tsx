import { ElementDispatcher } from "./ElementDispatcher";
import { SafeMedia, extractYouTubeId } from "../SafeMedia";
import { Clock } from "lucide-react";

export function InteractiveVideoRenderer({
  content,
  assetMap,
}: {
  content: Record<string, any>;
  assetMap: Map<string, string>;
}) {
  const iv = content.interactiveVideo || content;
  const raw = iv.assets?.interactions || iv.interactions;
  const interactions = (Array.isArray(raw) ? [...raw] : []).sort(
    (a, b) => (a.duration?.from || 0) - (b.duration?.from || 0),
  );

  const videoSources: any[] =
    iv.video?.files ||
    iv.video?.sources ||
    iv.files ||
    iv.sources ||
    content.video?.files ||
    content.video?.sources ||
    content.files ||
    content.sources ||
    [];

  // Prefer YouTube source if present among multiple sources, otherwise take the first
  const ytSource = videoSources.find((s: any) => {
    const p = typeof s === "string" ? s : s?.path || s?.url;
    return Boolean(extractYouTubeId(p));
  });

  const activeSource = ytSource || videoSources[0];
  const videoPath =
    typeof activeSource === "string"
      ? activeSource
      : activeSource?.path || activeSource?.url || (typeof iv.video === "string" ? iv.video : undefined);

  const videoTitle = iv.video?.title || content.title || "Interactive Video";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-colors">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 font-sans">
          {videoTitle}
        </h2>
        <SafeMedia
          path={videoPath}
          kind="video"
          assetMap={assetMap}
          title={videoTitle}
        />
      </div>

      {interactions.map((i, index) => (
        <div
          key={index}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              Checkpoint {index + 1}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>
                {Math.floor((i.duration?.from || 0) / 60)}:
                {String(Math.floor((i.duration?.from || 0) % 60)).padStart(2, "0")}
              </span>
            </span>
          </div>
          <ElementDispatcher action={i.action} assetMap={assetMap} />
        </div>
      ))}

      {iv.summary?.task && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-colors">
          <ElementDispatcher action={iv.summary.task} assetMap={assetMap} />
        </div>
      )}

      {!interactions.length && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/50 text-xs font-mono text-zinc-500 text-center">
          No quiz checkpoints embedded in this video.
        </div>
      )}
    </div>
  );
}
