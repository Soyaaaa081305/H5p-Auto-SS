import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, FileCode2, Sparkles, CheckCircle2, X } from 'lucide-react';

interface DropZoneProps {
  onFilesLoaded: (files: File[]) => Promise<void>;
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesLoaded,
  isLoading,
  loadingMessage,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (e.target.files && e.target.files.length > 0) {
      void onFilesLoaded(Array.from(e.target.files));
    }
  };

  return (
    <div className="no-print max-w-2xl mx-auto px-4 py-16 sm:py-20">
      {/* Title & Microcopy */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          H5P to PDF Converter
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-normal">
          Direct slide presentation converter, question solutions, multi-module playlist, and printable PDF notes.
        </p>
      </div>

      {/* File Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border transition-all duration-150 p-12 text-center cursor-pointer ${
          isDragging
            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 ring-4 ring-zinc-900/5 dark:ring-zinc-100/10'
            : 'border-zinc-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".h5p,.zip"
          className="hidden"
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
              ? loadingMessage || 'Parsing package structure & extracting slides...'
              : 'Drop your .h5p or .zip package here, or click to browse'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
            Accepts single or multiple files (.h5p, .zip) for playlist & batch export
          </p>

          <button
            type="button"
            className="mt-6 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs shadow-xs transition-colors pointer-events-none inline-flex items-center gap-1.5"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Select File(s)</span>
          </button>
        </div>
      </div>

      {/* Trigger: Blackboard Download Guide Modal */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>How to download from Blackboard (2 quick clicks)</span>
        </button>
      </div>

      {/* Blackboard Download Guide Modal Popup */}
      {showHelpModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowHelpModal(false);
            }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-[10000] p-6 space-y-5 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                      How to download from Blackboard
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                      2 quick clicks to get your .h5p file
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Steps */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/60 space-y-3 text-xs">
                <ol className="list-decimal pl-5 space-y-2 text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                  <li>
                    Open your course slide module on Blackboard (e.g. <strong className="font-semibold text-zinc-900 dark:text-zinc-100">2.1 - Memory and Remanence</strong>).
                  </li>
                  <li>
                    Look at the <strong className="font-semibold text-zinc-900 dark:text-zinc-100">bottom-left corner</strong> of the slide (next to the H5P logo) and click <strong className="font-semibold text-zinc-900 dark:text-zinc-100">⎘ Reuse</strong>.
                  </li>
                  <li>
                    Click <strong className="font-semibold text-zinc-900 dark:text-zinc-100">"Download as an .h5p file"</strong>.
                  </li>
                  <li>
                    Drop the downloaded file right here to view all questions, answers, and printable PDF notes!
                  </li>
                </ol>
              </div>

              {/* Privacy Footer */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>100% private & client-side — your files never leave your browser.</span>
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
            </div>
          </div>,
          document.body
        )}

      {/* Error notification if any */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-mono leading-relaxed">
          {error}
        </div>
      )}

      {/* Technical Footnote */}
      <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono">
        All media and slides are processed in-memory directly on your device.
      </div>
    </div>
  );
};
