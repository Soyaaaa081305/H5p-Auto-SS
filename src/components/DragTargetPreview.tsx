import { plainText } from "../lib/extraction";
import { resolveAsset } from "../lib/h5pParser";
const percent = (v: unknown, fallback = 0) =>
  `${Math.min(100, Math.max(0, Number(v) || fallback))}%`;
export function DragTargetPreview({
  params,
  assetMap,
}: {
  params: Record<string, any>;
  assetMap: Map<string, string>;
}) {
  const task = params.question?.task;
  const elements = Array.isArray(task?.elements) ? task.elements : [];
  const targets = Array.isArray(task?.dropZones) ? task.dropZones : [];
  if (!targets.length) return null;
  return (
    <figure className="my-3">
      <figcaption className="text-xs text-zinc-500 mb-2">
        Numbered target positions from the original activity
      </figcaption>
      <div className="relative w-full aspect-[2/1] bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {elements.map((e: any, i: number) => {
          const p = e?.type?.params || {};
          const src = resolveAsset(p.file?.path, assetMap);
          return (
            <div
              key={i}
              className="absolute text-zinc-800 text-xs overflow-hidden"
              style={{
                left: percent(e?.x),
                top: percent(e?.y),
                width: percent(e?.width, 10),
                height: percent(e?.height, 10),
              }}
            >
              {src ? (
                <img
                  src={src}
                  alt={p.alt || "Activity image"}
                  className="w-full h-full object-contain"
                />
              ) : (
                plainText(p.text)
              )}
            </div>
          );
        })}
        {targets.map((t: any, i: number) => (
          <span
            key={i}
            className="absolute rounded bg-emerald-700 text-white text-xs font-bold px-1 min-w-4 text-center"
            style={{ left: percent(t?.x), top: percent(t?.y) }}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </figure>
  );
}
