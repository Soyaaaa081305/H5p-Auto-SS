import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Download, BookOpen, Search, Check, Video, Loader2 } from "lucide-react";
import type { H5PPackage } from "../types/h5p";
import { DragTargetPreview } from "./DragTargetPreview";
import { AnswerCards } from "./AnswerCards";
import { answerText, statusLabel } from "../lib/extraction";
import { exportAnswerKey } from "../lib/pdfExporter";

interface Props {
  pkg: H5PPackage;
  packages?: H5PPackage[];
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewerModal({
  pkg,
  packages = [pkg],
  isOpen,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const exportController = useRef<AbortController>();
  const [exporting, setExporting] = useState(false);

  useEffect(() => () => exportController.current?.abort(), [isOpen, packages]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== "Tab") return;
      const nodes = [
        ...(dialog.current?.querySelectorAll<HTMLElement>(
          "button, input, select, summary, a[href]",
        ) || []),
      ].filter((n) => !n.hasAttribute("disabled") && n.getClientRects().length);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", key, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key, true);
      previous?.focus();
    };
  }, [isOpen, onClose]);

  const selected = useMemo(() => (all ? packages : [pkg]), [all, packages, pkg]);

  const { groups, answers } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const g = selected.map((p) => ({
      pkg: p,
      answers: q
        ? p.report.answers.filter((a) =>
            `${a.prompt} ${answerText(a)} ${a.location}`
              .toLowerCase()
              .includes(q),
          )
        : p.report.answers,
    }));
    return {
      groups: g,
      answers: g.flatMap((group) => group.answers),
    };
  }, [selected, query]);

  const nodesMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of selected) {
      for (const n of p.report.nodes) {
        map.set(n.path, n.params);
      }
    }
    return map;
  }, [selected]);

  if (!isOpen) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        answers
          .map(
            (a) =>
              `${a.packageName} · ${a.location}\n${statusLabel[a.status]}\n${answerText(a)}`,
          )
          .join("\n\n"),
      );
      setMessage("Answers copied.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage(
        "Clipboard unavailable. Use PDF export or select the text to copy.",
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="answers-title"
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="answers-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-2">
                Answers
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                Extracted study guide & solutions from module data
              </p>
            </div>
          </div>
          <button
            aria-label="Close answers"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3.5 sm:p-4 flex flex-wrap items-center gap-2.5 sm:gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              aria-label="Search answers"
              placeholder="Search answers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/60 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            aria-label="Answer modules"
            value={all ? "all" : "current"}
            onChange={(e) => setAll(e.target.value === "all")}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/60 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="current">Current module</option>
            <option value="all">All modules ({packages.length})</option>
          </select>

          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 font-semibold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={async () => {
              exportController.current = new AbortController();
              setExporting(true);
              try {
                await exportAnswerKey(
                  selected,
                  answers,
                  exportController.current.signal,
                );
                setMessage("Answer PDF downloaded.");
              } catch {
                setMessage(
                  exportController.current.signal.aborted
                    ? "Export cancelled."
                    : "PDF export failed. Try fewer modules.",
                );
              } finally {
                setExporting(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Answer PDF</span>
          </button>

          {exporting && (
            <button
              type="button"
              onClick={() => exportController.current?.abort()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium hover:bg-rose-100 transition-colors"
            >
              Cancel export
            </button>
          )}
        </div>

        {/* Live Status Banner (maintains exact accessibility & test role) */}
        <div className="px-5 sm:px-6 py-2.5 bg-zinc-50/70 dark:bg-zinc-850/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
          <p role="status" className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {answers.length} answer activities
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-zinc-400 dark:text-zinc-500 font-sans hidden sm:inline">
              Extracted from the package, without guessing.
            </span>
          </p>
          {message && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              {message}
            </span>
          )}
        </div>

        {/* Answer Content Scrollable Area */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {groups.map((group, i) => (
            <section key={i}>
              <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] font-semibold">
                  Module
                </span>
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-sans truncate">
                  {group.pkg.metadata.title || group.pkg.fileName}
                </h3>
                <span className="text-xs text-zinc-400 font-mono ml-auto flex-shrink-0">
                  {group.answers.length} {group.answers.length === 1 ? "activity" : "activities"}
                </span>
              </div>

              {group.answers.map((a) => (
                <div key={a.id} className="mb-4">
                  {a.library === "H5P.DragQuestion" && (
                    <div className="mb-3">
                      <DragTargetPreview
                        params={nodesMap.get(a.sourcePath) || {}}
                        assetMap={group.pkg.assetMap}
                      />
                    </div>
                  )}

                  <AnswerCards
                    answers={[a]}
                    assetMap={group.pkg.assetMap}
                    compact
                  />

                  {a.status !== "extracted" && (
                    <details className="text-xs mt-2 text-zinc-400">
                      <summary className="cursor-pointer font-medium hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                        Stored source parameters
                      </summary>
                      <pre className="whitespace-pre-wrap break-all max-h-60 overflow-auto p-3 mt-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                        {JSON.stringify(
                          nodesMap.get(a.sourcePath) || {},
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              ))}

              {!group.answers.length && (
                <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/30">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    No matching answers. This package may contain no supported
                    stored answer key.
                  </p>
                </div>
              )}

              {!!group.pkg.report.warnings.length && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 mt-3">
                  {[...new Set(group.pkg.report.warnings)].join(" ")}
                </p>
              )}

              {!!group.pkg.report.videoNotes.length && (
                <details className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <summary className="font-semibold text-xs font-mono uppercase tracking-wider text-zinc-500 cursor-pointer flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Video study notes</span>
                  </summary>
                  <div className="space-y-3 mt-3">
                    {group.pkg.report.videoNotes.map((n, j) => (
                      <div key={j} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                        <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {n.location} ·{" "}
                          {n.kind === "transcript"
                            ? "Packaged transcript excerpts"
                            : "Activity-based notes"}
                        </h4>
                        <p className="whitespace-pre-line mt-2 text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
