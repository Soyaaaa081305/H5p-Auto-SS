import type { AnswerItem } from "../types/h5p";
import { statusLabel } from "../lib/extraction";
import { SafeMedia } from "./SafeMedia";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

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
    <div className="space-y-4">
      {answers.map((answer) => {
        const isExtracted = answer.status === "extracted";
        const hasPrompt = Boolean(answer.prompt?.trim());

        return (
          <article
            key={answer.id}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all overflow-hidden p-4 sm:p-5 break-words space-y-4"
          >
            {/* Card Header: Location, Library Type, Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold">
                  📍 {answer.location || "Activity"}
                </span>
                {answer.library && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] border border-zinc-200/60 dark:border-zinc-800">
                    {answer.library.replace(/^H5P\./, "")}
                  </span>
                )}
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isExtracted
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                }`}
              >
                {isExtracted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span>{statusLabel[answer.status]}</span>
              </span>
            </div>

            {/* Question / Task Prompt (Prominently visible for clear study context) */}
            {hasPrompt && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">
                  Question / Task
                </span>
                <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 whitespace-pre-line leading-relaxed">
                  {answer.prompt}
                </p>
              </div>
            )}

            {/* Answer Parts Box */}
            <div className="space-y-2 pt-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Verified Solution</span>
              </span>

              {answer.parts.map((part, i) => {
                const hasContent = part.values.length > 0 || (part.images && part.images.length > 0);
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-3.5 text-xs sm:text-sm border transition-colors ${
                      hasContent
                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100"
                        : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        {part.label}:
                      </span>
                      <span className="font-semibold text-emerald-950 dark:text-emerald-100 leading-normal">
                        {part.values.join(" / ") ||
                          (!part.images?.length ? "No statement or question authored in module" : "")}
                      </span>
                    </div>

                    {part.target && (
                      <span className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1.5">
                        Drop position: {part.target.x.toFixed(1)}% across, {part.target.y.toFixed(1)}% down
                      </span>
                    )}

                    {part.images?.map((path) => (
                      <div key={path} className="mt-2.5 rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-800/60 max-w-md">
                        <SafeMedia
                          path={path}
                          assetMap={assetMap}
                          alt={part.label}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Explanation / Notes if authored */}
            {answer.explanation && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-750 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 mr-1.5">Note:</span>
                  <span>{answer.explanation}</span>
                </div>
              </div>
            )}

            {/* Technical Source Details (collapsible) */}
            {compact && (
              <details className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-400 dark:text-zinc-500 group">
                <summary className="cursor-pointer font-medium hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors select-none flex items-center gap-1.5">
                  <span>Question and source</span>
                </summary>
                <div className="mt-2 pl-3 py-1 font-mono text-[11px] space-y-1 text-zinc-500 dark:text-zinc-400 border-l-2 border-zinc-200 dark:border-zinc-700">
                  {answer.prompt && <p className="font-sans text-xs text-zinc-700 dark:text-zinc-300 my-1">{answer.prompt}</p>}
                  <p>{answer.library} {answer.version}</p>
                  <p className="break-all text-[10px] text-zinc-400">{answer.sourcePath}</p>
                </div>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}
