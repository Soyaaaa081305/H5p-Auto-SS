import { safeHtml } from '../../lib/security';
import React from 'react';
import { InteractiveBookContent } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { ElementDispatcher } from './ElementDispatcher';
import { BookOpen } from 'lucide-react';

interface InteractiveBookRendererProps {
  content: InteractiveBookContent;
  assetMap: Map<string, string>;
}

export const InteractiveBookRenderer: React.FC<InteractiveBookRendererProps> = ({
  content,
  assetMap,
}) => {
  const chapters = Array.isArray(content.chapters) ? content.chapters : [];
  const coverImage = content.bookCover?.coverMedium?.params?.file?.path;
  const coverUrl = resolveAsset(coverImage, assetMap);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Cover / Book Title */}
      {(coverUrl || content.bookCover?.coverDescription) && (
        <div className="bg-white rounded-2xl p-8 border border-zinc-200 shadow-2xs text-center print:border-none print:shadow-none print:p-0">
          {coverUrl && (
            <img
              src={coverUrl}
              alt="Book Cover"
              className="max-h-80 mx-auto rounded-xl object-contain mb-6 shadow-sm"
            />
          )}
          {content.bookCover?.coverDescription && (
            <div
              className="text-zinc-700 text-base max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: safeHtml(content.bookCover.coverDescription) }}
            />
          )}
        </div>
      )}

      {/* Chapters */}
      {chapters.map((chapter, cIdx) => {
        const sections = Array.isArray(chapter.params?.content) ? chapter.params.content : [];

        return (
          <section
            key={cIdx}
            className="print-section bg-white rounded-2xl p-8 border border-zinc-200 shadow-2xs print:border-none print:shadow-none print:p-0 print:mb-8"
          >
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-200 print:border-zinc-400">
              <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 print:hidden">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 font-sans">
                Chapter {cIdx + 1}: {chapter.title || (chapter as any).metadata?.title || 'Untitled Chapter'}
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
