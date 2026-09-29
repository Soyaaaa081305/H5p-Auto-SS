import type { AnswerItem } from "../types/h5p";
import { statusLabel } from "../lib/extraction";
import { SafeMedia } from "./SafeMedia";
export function AnswerCards({
  answers,
  assetMap,
  compact = false,
}: {
  answers: AnswerItem[];
  assetMap: Map<string, string>;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {answers.map((answer) => (
        <article
          key={answer.id}
          className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 break-words"
        >
          {!compact && (
            <p className="font-semibold mb-3 whitespace-pre-line">
              {answer.prompt}
            </p>
          )}
          <span
            className={`text-xs font-medium ${answer.status === "extracted" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
          >
            {statusLabel[answer.status]}
          </span>
          {answer.parts.map((part, i) => {
            const hasContent = part.values.length > 0 || (part.images && part.images.length > 0);
            return (
              <div
                key={i}
                className={`mt-2 rounded-lg p-3 text-sm ${
                  hasContent
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span className="font-medium">{part.label}: </span>
                {part.values.join(" / ") ||
                  (!part.images?.length ? "No statement or question authored in module" : "")}
              {part.target && (
                <span className="block text-xs text-zinc-500">
                  Position: {part.target.x.toFixed(1)}% across,{" "}
                  {part.target.y.toFixed(1)}% down
                </span>
              )}
              {part.images?.map((path) => (
                <SafeMedia
                  key={path}
                  path={path}
                  assetMap={assetMap}
                  alt={part.label}
                />
              ))}
            </div>
            );
          })}
          {answer.explanation && (
            <p className="mt-2 text-sm text-zinc-500">{answer.explanation}</p>
          )}
          {compact && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer">Question and source</summary>
              <p className="my-2 whitespace-pre-line">{answer.prompt}</p>
              <p>
                {answer.library} {answer.version}
              </p>
              <p className="font-mono text-xs break-all">{answer.sourcePath}</p>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
