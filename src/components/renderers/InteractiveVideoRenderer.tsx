import { ElementDispatcher } from "./ElementDispatcher";
import { SafeMedia } from "../SafeMedia";
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
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4">
        <h2 className="font-bold mb-3">Interactive Video</h2>
        <SafeMedia
          path={iv.video?.files?.[0]?.path}
          kind="video"
          assetMap={assetMap}
        />
      </div>
      {interactions.map((i, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4"
        >
          <p className="text-xs font-mono mb-2">
            Checkpoint {index + 1} · {Math.floor((i.duration?.from || 0) / 60)}:
            {String(Math.floor((i.duration?.from || 0) % 60)).padStart(2, "0")}
          </p>
          <ElementDispatcher action={i.action} assetMap={assetMap} />
        </div>
      ))}
      {iv.summary?.task && (
        <ElementDispatcher action={iv.summary.task} assetMap={assetMap} />
      )}
      {!interactions.length && (
        <p className="text-sm text-zinc-500">
          No stored checkpoints found in this video.
        </p>
      )}
    </div>
  );
}
