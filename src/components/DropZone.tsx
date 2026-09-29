import React, { useRef, useState } from 'react';
import { Loader2, Plus, FileCode2, Link as LinkIcon, ArrowRight } from 'lucide-react';

interface DropZoneProps {
  onFilesLoaded: (files: File[]) => Promise<void>;
  onUrlLoaded: (url: string) => Promise<void>;
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesLoaded,
  onUrlLoaded,
  isLoading,
  loadingMessage,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [inputUrl, setInputUrl] = useState('');
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
      onFilesLoaded(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesLoaded(Array.from(e.target.files));
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onUrlLoaded(inputUrl.trim());
  };

  return (
    <div className="no-print max-w-2xl mx-auto px-4 py-16 sm:py-20">
      {/* Title & Microcopy */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          H5P to PDF Converter
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-normal">
          Direct 1080p slide presentation converter, multi-module playlist, PDF export, and study notes.
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg bg-zinc-200/70 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              tab === 'file'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Upload .h5p File(s)
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              tab === 'url'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Import via Link
          </button>
        </div>
      </div>

      {/* Tab 1: File Drop Zone */}
      {tab === 'file' && (
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
                : 'Drop one or multiple .h5p packages here, or click to browse'}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
              Accepts single or multiple modules (.h5p, .zip) for playlist & batch export
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
      )}

      {/* Tab 2: URL Link Importer */}
      {tab === 'url' && (
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xs space-y-4">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="h5p-url" className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2 font-mono">
                Enter Direct .h5p File URL:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="h5p-url"
                    type="url"
                    required
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/module.h5p"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent font-mono bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Import</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart LMS / Blackboard Detection Banner */}
            {/blackboard\.com|instructure\.com|canvas|moodle|\/lti\//i.test(inputUrl) && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-base">⚠️</span>
                  <span>School LMS / Blackboard Course Page Detected</span>
                </div>
                <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                  This URL is a private Blackboard course webpage that requires your student login session. External websites cannot fetch files directly from this link due to school privacy & CORS protection.
                </p>
                <div className="pt-1 border-t border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="font-semibold block text-amber-950 dark:text-amber-100">
                    How to view this module in 2 clicks:
                  </span>
                  <ol className="list-decimal pl-4 space-y-1 text-amber-900 dark:text-amber-200">
                    <li>Go back to your Blackboard slide deck (or the <strong>"LTI Launch"</strong> tab).</li>
                    <li>Look at the bottom-left corner of the slide for the <strong>Reuse</strong> button (⎘ Reuse).</li>
                    <li>Click <strong>Reuse</strong> ➔ <strong>"Download as an .h5p file"</strong>.</li>
                    <li>Switch to the <strong>"Upload .h5p File(s)"</strong> tab and drop the downloaded file!</li>
                  </ol>
                </div>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
              💡 <strong>Note:</strong> Link importing is for direct public <code>.h5p</code> binary files. For school modules hosted on Blackboard, use the built-in <strong>Reuse</strong> button on the slide to download the <code>.h5p</code> file to your device first.
            </p>
          </form>
        </div>
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
