import React, { useState } from "react";
import {
  Loader2,
  Plus,
  FileCode2,
  HelpCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { HelpDialog } from "./HelpDialog";

interface DropZoneProps {
  onFilesLoaded: (files: File[]) => Promise<void>;
  isLoading: boolean;
  loadingMessage?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesLoaded,
  isLoading,
  loadingMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void onFilesLoaded(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) void onFilesLoaded(files);
  };

  return (
    <div className="no-print max-w-2xl mx-auto px-4 py-16 sm:py-20">
      {/* Title & Microcopy */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          H5P to PDF Converter
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-normal">
          View supported content, review stored answers, and export printable
          study notes.
        </p>
      </div>

      {/* File Drop Zone */}
      <label
        htmlFor="h5p-files"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative block rounded-2xl border transition-all duration-150 p-12 text-center cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-zinc-950 ${
          isDragging
            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 ring-4 ring-zinc-900/5 dark:ring-zinc-100/10"
            : "border-zinc-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 shadow-xs"
        }`}
      >
        <input
          id="h5p-files"
          type="file"
          multiple
          accept=".h5p,.zip"
          className="sr-only"
          aria-label="Choose H5P or ZIP files"
          aria-describedby="h5p-file-types"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mb-4 transition-transform">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-900 dark:text-zinc-100" />
            ) : (
              <Plus className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
            )}
          </div>

          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {isLoading
              ? loadingMessage ||
                "Parsing package structure & extracting slides..."
              : "Drop one or more .h5p or .zip files here, or click to browse"}
          </p>
          <p
            id="h5p-file-types"
            className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-mono"
          >
            Select local course packages to review stored answers and export
            study notes
          </p>

          <span
            aria-hidden="true"
            className="mt-6 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Select File(s)</span>
          </span>
        </div>
      </label>

      {/* Trigger: Blackboard Download Guide Modal */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 font-medium"
        >
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>How to download from Blackboard</span>
        </button>
      </div>

      {/* Blackboard Download Guide Modal Popup */}
      {showHelpModal && (
        <HelpDialog
          labelledBy="blackboard-help-title"
          onClose={() => setShowHelpModal(false)}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2
                  id="blackboard-help-title"
                  className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans"
                >
                  How to download from Blackboard
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  Steps to get your .h5p file
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              aria-label="Close Blackboard download guide"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Steps */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/60 space-y-3 text-xs">
            <ol className="list-decimal pl-5 space-y-2 text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
              <li>Open the slide module in your Blackboard course.</li>
              <li>
                Look at the{" "}
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  bottom-left corner
                </strong>{" "}
                of the slide (next to the H5P logo) and click{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-[11px] align-baseline shadow-2xs">
                  <RefreshCw className="w-3 h-3 text-zinc-600 dark:text-zinc-300 stroke-[2.5]" />{" "}
                  Reuse
                </span>
                .
              </li>
              <li>
                Click{" "}
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  "Download as an .h5p file"
                </strong>
                .
              </li>
              <li>
                Drop the downloaded file right here to view all questions,
                answers, and printable PDF notes!
              </li>
            </ol>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-semibold text-xs shadow-xs transition-colors"
            >
              Got It!
            </button>
          </div>
        </HelpDialog>
      )}

      {/* Technical Footnote */}
      <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono">
        Course packages are processed on your device. External media may load
        from its source.
      </div>
    </div>
  );
};
