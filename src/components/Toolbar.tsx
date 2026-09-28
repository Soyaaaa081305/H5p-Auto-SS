import React, { useState } from 'react';
import { H5PPackage } from '../types/h5p';
import { exportSlidesToPdf } from '../lib/pdfExporter';
import {
  Download,
  RotateCcw,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ToolbarProps {
  pkg: H5PPackage;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ pkg, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      setExportProgress('Preparing slides...');
      await exportSlidesToPdf(pkg, (curr, total) => {
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

  const title = pkg.metadata.title || pkg.fileName;
  const slideCount = pkg.content?.presentation?.slides?.length;

  // Extract Canva / external presentation link
  let canvaUrl: string | null = null;
  const slides: any[] = pkg.content?.presentation?.slides || [];
  slides.forEach((s) => {
    (s.elements || []).forEach((el: any) => {
      if (el.action?.library?.includes('Link')) {
        let u = el.action.params?.linkWidget?.url || el.action.params?.url || '';
        const proto = el.action.params?.linkWidget?.protocol || '';
        if (proto && !u.startsWith('http://') && !u.startsWith('https://')) {
          u = `${proto}${u}`;
        }
        u = u.replace(/&amp;/g, '&');
        if (u) canvaUrl = u;
      }
    });
  });

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
              {slideCount !== undefined && <span>{slideCount} slides</span>}
              <span>• {(pkg.fileSize / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Prominent Canva Link if detected */}
          {canvaUrl && (
            <a
              href={canvaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold shadow-2xs transition-colors"
              title="Open full presentation directly in Canva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Canva</span>
            </a>
          )}

          {/* SINGLE Primary Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Download full 1080p PDF"
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

          {/* Change File Button */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            title="Open another file"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
