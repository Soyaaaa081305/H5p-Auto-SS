import React, { useRef, useState } from 'react';
import { Loader2, Plus, FileCode2 } from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (file: File | Blob, customName?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded, isLoading, error }) => {
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
      const file = e.dataTransfer.files[0];
      onFileLoaded(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileLoaded(file);
    }
  };

  return (
    <div className="no-print max-w-2xl mx-auto px-4 py-16 sm:py-24">
      {/* Title & Microcopy */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
          Convert H5P to Printable PDF
        </h2>
        <p className="mt-2 text-sm text-zinc-500 font-normal">
          Direct 1080p slide extraction, vector text formatting, and printable answer keys.
        </p>
      </div>

      {/* Clean Studio Drop Zone */}
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

      {/* Error notification if any */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
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
