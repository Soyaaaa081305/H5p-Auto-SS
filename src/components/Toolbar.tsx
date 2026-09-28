import React, { useState } from 'react';
import { QuizMode, ViewMode, H5PPackage } from '../types/h5p';
import { exportSlidesToPdf } from '../lib/pdfExporter';
import {
  Download,
  Printer,
  RotateCcw,
  Loader2,
  Check,
} from 'lucide-react';

interface ToolbarProps {
  pkg: H5PPackage;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  quizMode: QuizMode;
  onQuizModeChange: (mode: QuizMode) => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  pkg,
  viewMode,
  onViewModeChange,
  quizMode,
  onQuizModeChange,
  onReset,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      setExportProgress('Preparing slides...');
      await exportSlidesToPdf(pkg, quizMode, (curr, total) => {
        setExportProgress(`Compiling ${curr}/${total}`);
      });
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleNativePrint = () => {
    document.body.setAttribute('data-view-mode', viewMode);
    window.print();
  };

  const title = pkg.metadata.title || pkg.fileName;
  const slideCount = pkg.content?.presentation?.slides?.length;

  return (
    <div className="no-print bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Document Metadata */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-zinc-900 truncate max-w-xs sm:max-w-md font-sans" title={title}>
              {title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <span>{pkg.mainLibrary.replace('H5P.', '')}</span>
              {slideCount !== undefined && <span>• {slideCount} slides</span>}
              <span>• {(pkg.fileSize / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => onViewModeChange('slides')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'slides'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              16:9 Slides
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('document')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'document'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Reading Doc
            </button>
          </div>

          {/* Quiz Mode Toggle */}
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => onQuizModeChange('study')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                quizMode === 'study'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Reveal correct answers and solutions for study"
            >
              {quizMode === 'study' && <Check className="w-3 h-3" />}
              <span>Study Guide</span>
            </button>
            <button
              type="button"
              onClick={() => onQuizModeChange('worksheet')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                quizMode === 'worksheet'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Blank out question solutions for self-testing"
            >
              Worksheet
            </button>
          </div>

          {/* Direct High-Resolution 1080p PDF Exporter */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Download full-bleed 1080p PDF without browser print dialog"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{exportProgress || 'Exporting...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Native Print Dialog Option */}
          <button
            type="button"
            onClick={handleNativePrint}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            title="Open browser print dialog"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Reset / Upload Another */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            title="Load another package"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
