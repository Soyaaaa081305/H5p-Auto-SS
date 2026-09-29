import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Download, BookOpen } from "lucide-react";
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
  if (!isOpen) return null;
  const selected = all ? packages : [pkg];
  const groups = selected.map((p) => ({
    pkg: p,
    answers: p.report.answers.filter((a) =>
      `${a.prompt} ${answerText(a)} ${a.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  }));
  const answers = groups.flatMap((g) => g.answers);
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
    } catch {
      setMessage(
        "Clipboard unavailable. Use PDF export or select the text to copy.",
      );
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="answers-title"
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl"
      >
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <h2 id="answers-title" className="font-bold flex gap-2">
            <BookOpen size={20} />
            Answers
          </h2>
          <button aria-label="Close answers" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="p-4 flex flex-wrap gap-3 border-b border-zinc-200 dark:border-zinc-700">
          <input
            aria-label="Search answers"
            placeholder="Search answers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg p-2 bg-transparent flex-1 min-w-[180px]"
          />
          <select
            aria-label="Answer modules"
            value={all ? "all" : "current"}
            onChange={(e) => setAll(e.target.value === "all")}
            className="border rounded-lg p-2 bg-white dark:bg-zinc-900"
          >
            <option value="current">Current module</option>
            <option value="all">All modules</option>
          </select>
          <button onClick={copy} className="flex items-center gap-1 text-sm">
            <Copy size={16} />
            Copy
          </button>
          <button
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
            className="flex items-center gap-1 text-sm"
          >
            <Download size={16} />
            Answer PDF
          </button>
          {exporting && (
            <button onClick={() => exportController.current?.abort()}>
              Cancel export
            </button>
          )}
        </div>
        <p role="status" className="px-4 py-2 text-xs text-zinc-500">
          {message ||
            `${answers.length} answer activities · Extracted from the package, without guessing.`}
        </p>
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {groups.map((group, i) => (
            <section key={i}>
              <h3 className="font-bold mb-3">
                {group.pkg.metadata.title || group.pkg.fileName}
              </h3>
              {group.answers.map((a) => (
                <div key={a.id} className="mb-4">
                  <p className="text-xs text-zinc-500 mb-1">{a.location}</p>
                  {a.library === "H5P.DragQuestion" && (
                    <DragTargetPreview
                      params={
                        group.pkg.report.nodes.find(
                          (n) => n.path === a.sourcePath,
                        )?.params || {}
                      }
                      assetMap={group.pkg.assetMap}
                    />
                  )}
                  <AnswerCards
                    answers={[a]}
                    assetMap={group.pkg.assetMap}
                    compact
                  />
                  {a.status !== "extracted" && (
                    <details className="text-xs mt-2">
                      <summary>Stored source parameters</summary>
                      <pre className="whitespace-pre-wrap break-all max-h-64 overflow-auto">
                        {JSON.stringify(
                          group.pkg.report.nodes.find(
                            (n) => n.path === a.sourcePath,
                          )?.params || {},
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              {!group.answers.length && (
                <p>
                  No matching answers. This package may contain no supported
                  stored answer key.
                </p>
              )}
              {!!group.pkg.report.warnings.length && (
                <p className="text-sm text-amber-700">
                  {[...new Set(group.pkg.report.warnings)].join(" ")}
                </p>
              )}
              {!!group.pkg.report.videoNotes.length && (
                <details className="mt-4 border-t pt-4">
                  <summary className="font-semibold cursor-pointer">
                    Video study notes
                  </summary>
                  {group.pkg.report.videoNotes.map((n, j) => (
                    <div key={j} className="my-4 text-sm">
                      <h4 className="font-medium">
                        {n.location} ·{" "}
                        {n.kind === "transcript"
                          ? "Packaged transcript excerpts"
                          : "Activity-based notes"}
                      </h4>
                      <p className="whitespace-pre-line mt-2">{n.text}</p>
                    </div>
                  ))}
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
