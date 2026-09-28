import React from 'react';
import { InteractiveBookContent, QuizMode } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { ElementDispatcher } from './ElementDispatcher';
import { BookOpen } from 'lucide-react';

interface InteractiveBookRendererProps {
  content: InteractiveBookContent;
  assetMap: Map<string, string>;
  quizMode: QuizMode;
}

export const InteractiveBookRenderer: React.FC<InteractiveBookRendererProps> = ({
  content,
  assetMap,
  quizMode,
}) => {
  const chapters = content.chapters || [];
  const coverImage = content.bookCover?.coverMedium?.params?.file?.path;
  const coverUrl = resolveAsset(coverImage, assetMap);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Cover / Book Title */}
      {(coverUrl || content.bookCover?.coverDescription) && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center print:border-none print:shadow-none print:p-0">
          {coverUrl && (
            <img
              src={coverUrl}
              alt="Book Cover"
              className="max-h-80 mx-auto rounded-xl object-contain mb-6 shadow"
            />
          )}
          {content.bookCover?.coverDescription && (
            <div
              className="text-slate-700 text-base max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: content.bookCover.coverDescription }}
            />
          )}
        </div>
      )}

      {/* Chapters */}
      {chapters.map((chapter, cIdx) => {
        const sections = chapter.params?.content || [];

        return (
          <section
            key={cIdx}
            className="print-section bg-white rounded-2xl p-8 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:mb-8"
          >
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200 print:border-slate-400">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 print:hidden">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Chapter {cIdx + 1}: {chapter.title || 'Untitled Chapter'}
              </h2>
            </div>

            <div className="space-y-6">
              {sections.map((section, sIdx) => {
                const subContent = section.content || section.params || section;
                const library = section.library || subContent?.library || '';

                return (
                  <div key={sIdx} className="space-y-3">
                    <ElementDispatcher
                      action={{
                        library,
                        params: subContent.params || subContent,
                      }}
                      assetMap={assetMap}
                      quizMode={quizMode}
                      inOverlay={false}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
