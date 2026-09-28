import React from 'react';
import { CoursePresentationContent, H5PSlide, QuizMode, ViewMode } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { ElementDispatcher } from './ElementDispatcher';

interface CoursePresentationRendererProps {
  content: CoursePresentationContent;
  assetMap: Map<string, string>;
  viewMode: ViewMode;
  quizMode: QuizMode;
}

export const CoursePresentationRenderer: React.FC<CoursePresentationRendererProps> = ({
  content,
  assetMap,
  viewMode,
  quizMode,
}) => {
  const slides: H5PSlide[] = content.presentation?.slides || [];

  if (slides.length === 0) {
    return (
      <div className="p-16 text-center text-zinc-400 font-mono text-xs">
        No slides detected in this presentation archive.
      </div>
    );
  }

  // 1. SLIDES VIEW MODE (16:9 Slide Cards / Cropped Slide Print)
  if (viewMode === 'slides') {
    return (
      <div className="space-y-10 print:space-y-0 print:p-0 print:m-0">
        {slides.map((slide, slideIdx) => {
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
              el.action?.library.startsWith('H5P.QuestionSet') ||
              el.action?.library.startsWith('H5P.MultiChoice')
          );

          return (
            <div
              key={slideIdx}
              className="print-slide bg-white rounded-2xl shadow-xs border border-zinc-200/90 overflow-hidden transition-all print:shadow-none print:border-none print:rounded-none"
              style={{ backgroundColor: bgColor }}
            >
              {/* Screen Topbar (Hidden in Print) */}
              <div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-mono text-zinc-500 print:hidden">
                <span className="font-medium text-zinc-800">Slide {slideIdx + 1} / {slides.length}</span>
              </div>

              {/* Slide Canvas */}
              {hasMajorQuiz && !hasBackground ? (
                <div className="p-8 sm:p-14 min-h-[460px] flex flex-col justify-center print:min-h-0 print:p-8">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono font-semibold mb-3">
                    Interactive Activity — Slide {slideIdx + 1}
                  </div>
                  {elements.map((el, elIdx) => (
                    <div key={elIdx} className="w-full">
                      <ElementDispatcher
                        action={el.action}
                        assetMap={assetMap}
                        quizMode={quizMode}
                        inOverlay={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative w-full aspect-[16/9] overflow-hidden select-none bg-zinc-950">
                  {bgUrl && (
                    <img
                      src={bgUrl}
                      alt={`Slide ${slideIdx + 1}`}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}

                  {elements.map((el, elIdx) => {
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
                          quizMode={quizMode}
                          inOverlay={true}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Extra quiz section if slide has both background and major quiz */}
              {hasBackground && hasMajorQuiz && (
                <div className="p-6 border-t border-zinc-200 bg-zinc-50 print:bg-transparent">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono font-semibold mb-2">
                    Slide {slideIdx + 1} Question Key:
                  </div>
                  {elements.map((el, elIdx) => (
                    <ElementDispatcher
                      key={elIdx}
                      action={el.action}
                      assetMap={assetMap}
                      quizMode={quizMode}
                      inOverlay={false}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 2. DOCUMENT VIEW MODE
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {slides.map((slide, slideIdx) => {
        const bgImgPath = slide.slideBackgroundSelector?.imageSlideBackground?.path;
        const bgUrl = resolveAsset(bgImgPath, assetMap);
        const elements = slide.elements || [];

        return (
          <section
            key={slideIdx}
            className="print-section bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 shadow-xs print:border-none print:shadow-none print:p-0 print:mb-8"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 print:border-zinc-400">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-zinc-900 text-white inline-flex items-center justify-center text-xs font-mono">
                  {slideIdx + 1}
                </span>
                <span>Slide {slideIdx + 1}</span>
              </h3>
            </div>

            {bgUrl && (
              <div className="mb-6 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950">
                <img
                  src={bgUrl}
                  alt={`Slide ${slideIdx + 1}`}
                  className="w-full object-contain max-h-[550px]"
                />
              </div>
            )}

            {elements.length > 0 && (
              <div className="space-y-4">
                {elements.map((el, elIdx) => (
                  <ElementDispatcher
                    key={elIdx}
                    action={el.action}
                    assetMap={assetMap}
                    quizMode={quizMode}
                    inOverlay={false}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
