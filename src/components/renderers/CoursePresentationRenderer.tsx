import React, { useState, useEffect, useRef } from 'react';
import { CoursePresentationContent, H5PSlide } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { ElementDispatcher } from './ElementDispatcher';
import { copySlideImageToClipboard, downloadSlideAsPng } from '../../lib/pdfExporter';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  LayoutList,
  Monitor,
  Copy,
  Download,
  Check,
} from 'lucide-react';

interface CoursePresentationRendererProps {
  content: CoursePresentationContent;
  assetMap: Map<string, string>;
}

export const CoursePresentationRenderer: React.FC<CoursePresentationRendererProps> = ({
  content,
  assetMap,
}) => {
  const slides: H5PSlide[] = content.presentation?.slides || [];
  const [viewMode, setViewMode] = useState<'scroll' | 'presentation'>('scroll');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedSlideIdx, setCopiedSlideIdx] = useState<number | null>(null);
  const presentationRef = useRef<HTMLDivElement>(null);

  const handleCopySlide = async (slide: H5PSlide, slideIdx: number) => {
    try {
      await copySlideImageToClipboard(slide, slideIdx, assetMap);
      setCopiedSlideIdx(slideIdx);
      setTimeout(() => setCopiedSlideIdx(null), 2000);
    } catch (e: any) {
      alert(e?.message || 'Failed to copy slide image to clipboard.');
    }
  };

  const handleDownloadSlide = async (slide: H5PSlide, slideIdx: number) => {
    try {
      await downloadSlideAsPng(slide, slideIdx, assetMap, 'slide');
    } catch (e: any) {
      alert(e?.message || 'Failed to save slide PNG.');
    }
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      presentationRef.current?.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (viewMode !== 'presentation') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlideIndex(slides.length - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="p-16 text-center text-zinc-400 font-mono text-xs">
        No slides detected in this presentation archive.
      </div>
    );
  }

  const renderSlideInner = (slide: H5PSlide, slideIdx: number) => {
    const bgImgPath = slide.slideBackgroundSelector?.imageSlideBackground?.path;
    const bgUrl = resolveAsset(bgImgPath, assetMap);
    const bgColor =
      slide.slideBackgroundSelector?.fillSlideBackground ||
      slide.slideBackgroundSelector?.fillColorSelector ||
      '#ffffff';

    const elements = slide.elements || [];
    const hasBackground = Boolean(bgUrl);

    const hasMajorQuiz = elements.some(
      (el) =>
        el.action?.library.startsWith('H5P.Blanks') ||
        el.action?.library.startsWith('H5P.Summary') ||
        el.action?.library.startsWith('H5P.QuestionSet') ||
        el.action?.library.startsWith('H5P.MultiChoice') ||
        el.action?.library.startsWith('H5P.SingleChoiceSet') ||
        el.action?.library.startsWith('H5P.TrueFalse')
    );

    return (
      <div
        className="w-full aspect-[16/9] overflow-hidden select-none relative"
        style={{ backgroundColor: bgColor }}
      >
        {hasMajorQuiz && !hasBackground ? (
          <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {elements.map((el, elIdx) => (
              <div key={elIdx} className="w-full h-full">
                <ElementDispatcher
                  action={el.action}
                  assetMap={assetMap}
                  inOverlay={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full h-full bg-zinc-950">
            {bgUrl && (
              <img
                src={bgUrl}
                alt={`Slide ${slideIdx + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {elements.map((el, elIdx) => {
              if (el.action?.library?.includes('Link')) return null;

              const left = `${el.x}%`;
              const top = `${el.y}%`;
              const width = `${el.width}%`;
              const height = `${el.height}%`;

              return (
                <div
                  key={elIdx}
                  className="absolute"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    zIndex: 10 + elIdx,
                  }}
                >
                  <ElementDispatcher
                    action={el.action}
                    assetMap={assetMap}
                    inOverlay={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top View Mode Switcher & Controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="inline-flex rounded-lg bg-zinc-200/70 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode('scroll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'scroll'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Scroll View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('presentation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'presentation'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Presentation Mode</span>
          </button>
        </div>

        {/* Presentation Controls if active */}
        {viewMode === 'presentation' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mr-2">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>

            <button
              type="button"
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              title="Previous Slide (Arrow Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              title="Next Slide (Arrow Right / Space)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Presentation Mode View */}
      {viewMode === 'presentation' && (
        <div
          ref={presentationRef}
          className={`space-y-4 ${
            isFullscreen ? 'bg-black flex flex-col justify-center items-center h-screen w-screen p-4' : ''
          }`}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/90 dark:border-zinc-800 overflow-hidden w-full max-w-5xl mx-auto">
            {!isFullscreen && (
              <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Slide {currentSlideIndex + 1} / {slides.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySlide(slides[currentSlideIndex], currentSlideIndex)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-2xs transition-colors"
                    title="Copy 1080p slide image to clipboard for Notion/Docs"
                  >
                    {copiedSlideIdx === currentSlideIndex ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Image</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSlide(slides[currentSlideIndex], currentSlideIndex)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-2xs transition-colors"
                    title="Download 1080p slide PNG"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save PNG</span>
                  </button>
                </div>
              </div>
            )}
            {renderSlideInner(slides[currentSlideIndex], currentSlideIndex)}
          </div>

          {/* Slide Thumbnail Scrubber Strip */}
          <div className="no-print flex items-center gap-2 overflow-x-auto py-2 px-1 max-w-full">
            {slides.map((s, idx) => {
              const sBgImg = s.slideBackgroundSelector?.imageSlideBackground?.path;
              const sBgUrl = resolveAsset(sBgImg, assetMap);
              const isActive = idx === currentSlideIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`flex-shrink-0 w-24 aspect-[16/9] rounded-lg border overflow-hidden relative transition-all ${
                    isActive
                      ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-zinc-100/30 shadow-xs scale-105'
                      : 'border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                  title={`Jump to Slide ${idx + 1}`}
                >
                  {sBgUrl ? (
                    <img src={sBgUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
                      Quiz
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scroll View (Default & for Print) */}
      <div className={`space-y-10 print:space-y-0 print:p-0 print:m-0 ${viewMode === 'presentation' ? 'hidden print:block' : 'block'}`}>
        {slides.map((slide, slideIdx) => (
          <div
            key={slideIdx}
            className="print-slide bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-zinc-200/90 dark:border-zinc-800 overflow-hidden transition-all print:shadow-none print:border-none print:rounded-none"
          >
            <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 print:hidden">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Slide {slideIdx + 1} / {slides.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySlide(slide, slideIdx)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-2xs transition-colors"
                  title="Copy 1080p slide image to clipboard for Notion/Docs"
                >
                  {copiedSlideIdx === slideIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSlide(slide, slideIdx)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-2xs transition-colors"
                  title="Download 1080p slide PNG"
                >
                  <Download className="w-3 h-3" />
                  <span>Save PNG</span>
                </button>
              </div>
            </div>
            {renderSlideInner(slide, slideIdx)}
          </div>
        ))}
      </div>
    </div>
  );
};
