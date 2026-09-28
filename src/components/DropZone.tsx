import React, { useRef, useState } from 'react';
import { Loader2, Plus, FileCode2, Link as LinkIcon, ArrowRight, Bookmark } from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (file: File | Blob, customName?: string) => Promise<void>;
  onUrlLoaded: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileLoaded,
  onUrlLoaded,
  isLoading,
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
      onFileLoaded(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileLoaded(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onUrlLoaded(inputUrl.trim());
  };

  // 1-Click Bookmarklet code: triggers H5P download on Blackboard and opens H5P to PDF Website
  const bookmarkletCode = `javascript:(function(){var d=document,b=d.querySelector('.h5p-reuse')||d.querySelector('button[aria-label*="Reuse"]');if(!b){var f=d.querySelectorAll('iframe');for(var i=0;i<f.length;i++){try{var ib=f[i].contentDocument?.querySelector('.h5p-reuse')||f[i].contentDocument?.querySelector('button[aria-label*="Reuse"]');if(ib){b=ib;break;}}catch(e){}}}if(b){b.click();}window.open('https://soyaaaa081305.github.io/H5p-Auto-SS/','_blank');})();`;

  return (
    <div className="no-print max-w-2xl mx-auto px-4 py-16 sm:py-20">
      {/* Title & Microcopy */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
          H5P to PDF Viewer
        </h2>
        <p className="mt-2 text-sm text-zinc-500 font-normal">
          Direct 1080p slide presentation viewer, PDF export, and study notes.
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg bg-zinc-200/70 p-1 border border-zinc-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              tab === 'file'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Upload .h5p File
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              tab === 'url'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
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
              ? 'border-zinc-900 bg-zinc-100 ring-4 ring-zinc-900/5'
              : 'border-zinc-300/80 bg-white hover:border-zinc-400 hover:bg-zinc-50/60 shadow-xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".h5p,.zip"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-700 flex items-center justify-center mb-4 transition-transform">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
              ) : (
                <Plus className="w-5 h-5 text-zinc-800" />
              )}
            </div>

            <p className="text-sm font-medium text-zinc-900">
              {isLoading
                ? 'Parsing package structure & extracting slides...'
                : 'Drop an .h5p package here, or click to browse'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Accepts standard LMS export archives (.h5p, .zip)
            </p>

            <button
              type="button"
              className="mt-6 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition-colors pointer-events-none inline-flex items-center gap-1.5"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Select File</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: URL Link Importer */}
      {tab === 'url' && (
        <div className="bg-white rounded-2xl border border-zinc-300/80 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="h5p-url" className="block text-xs font-semibold text-zinc-800 mb-2 font-mono">
                Enter .h5p File URL or Link:
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
                    placeholder="https://.../module.h5p"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent font-mono bg-zinc-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
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
          </form>
        </div>
      )}

      {/* Front-of-Page 1-Click Blackboard Bookmarklet Card */}
      <div className="mt-8 p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-4 h-4 text-zinc-800" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-900 font-sans">
              H5P to PDF Website Bookmarklet
            </div>
            <div className="text-[11px] text-zinc-500">
              Drag this button to your Bookmarks Bar. On Blackboard, it downloads the .h5p module and opens H5P to PDF Website.
            </div>
          </div>
        </div>

        <a
          href={bookmarkletCode}
          onClick={(e) => {
            e.preventDefault();
            alert("Drag this button to your browser's Bookmarks Bar! (Cmd+Shift+B on Mac or Ctrl+Shift+B on Windows). When clicked on Blackboard, it downloads the .h5p and opens H5P to PDF Website!");
          }}
          draggable={true}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition-transform active:scale-95 cursor-grab active:cursor-grabbing flex-shrink-0"
          title="Drag this to your Bookmarks Bar"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>H5P to PDF Website</span>
        </a>
      </div>

      {/* Error notification if any */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono leading-relaxed">
          {error}
        </div>
      )}

      {/* Technical Footnote */}
      <div className="mt-8 text-center text-xs text-zinc-400 font-mono">
        All media and slides are processed in-memory directly on your device.
      </div>
    </div>
  );
};
