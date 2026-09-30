import React, { useRef, useState } from 'react';
import { Loader2, Plus, FileCode2, Sparkles, CheckCircle2 } from 'lucide-react';

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

      {/* Blackboard 2-Click Quick Guide Card */}
      <div className="mt-8 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>How to download from Blackboard (2 quick clicks):</span>
        </div>
        <ol className="list-decimal pl-5 text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <li>
            Open your course slide module on Blackboard (e.g. <em>2.1 - Memory and Remanence</em>).
          </li>
          <li>
            Look at the <strong>bottom-left corner</strong> of the slide (next to the H5P logo) and click <strong>⎘ Reuse</strong>.
          </li>
          <li>
            Click <strong>"Download as an .h5p file"</strong>.
          </li>
          <li>
            Drop the downloaded file right here to view all questions, answers, and printable PDF notes!
          </li>
        </ol>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>100% private & client-side — your files never leave your browser.</span>
        </div>
      </div>

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
