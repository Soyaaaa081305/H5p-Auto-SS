import React from 'react';
import { CoursePresentationContent, H5PSlide } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { ElementDispatcher } from './ElementDispatcher';

interface CoursePresentationRendererProps {
  content: CoursePresentationContent;
  assetMap: Map<string, string>;
}

export const CoursePresentationRenderer: React.FC<CoursePresentationRendererProps> = ({
  content,
  assetMap,
}) => {
  const slides: H5PSlide[] = content.presentation?.slides || [];

  if (slides.length === 0) {
    return (
      <div className="p-16 text-center text-zinc-400 font-mono text-xs">
        No slides detected in this presentation archive.
      </div>
    );
  }

  return (
    <div className="space-y-10 print:space-y-0 print:p-0 print:m-0 max-w-5xl mx-auto">
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
            {/* Slide Header Bar */}
            <div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-mono text-zinc-500 print:hidden">
              <span className="font-medium text-zinc-800">
                Slide {slideIdx + 1} / {slides.length}
              </span>
            </div>

            {/* Slide Canvas */}
            {hasMajorQuiz && !hasBackground ? (
              // Quiz Slide (Slide 15): Render clean 16:9 canvas with question cards
              <div className="w-full aspect-[16/9] flex flex-col overflow-hidden bg-white">
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
              // Image Slide (Slides 1-14, 16): 16:9 Presentation Canvas
              <div className="relative w-full aspect-[16/9] overflow-hidden select-none bg-zinc-950">
                {bgUrl && (
                  <img
                    src={bgUrl}
                    alt={`Slide ${slideIdx + 1}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}

                {/* Overlaid elements (exclude duplicate link buttons since Toolbar has the single official button) */}
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
      })}
    </div>
  );
};
