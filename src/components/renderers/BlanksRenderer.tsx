import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface BlanksRendererProps {
  params: Record<string, any>;
}

export const BlanksRenderer: React.FC<BlanksRendererProps> = ({ params }) => {
  const promptText = params.text || '<p>Fill in the missing words:</p>';
  const rawQuestions: string[] = params.questions || [];

  // Extract individual paragraphs from raw HTML
  const items: string[] = [];
  rawQuestions.forEach((qStr) => {
    const pRegex = /<p>(.*?)<\/p>/gi;
    let match;
    let found = false;
    while ((match = pRegex.exec(qStr)) !== null) {
      found = true;
      if (match[1].trim()) {
        items.push(match[1].trim());
      }
    }
    if (!found && qStr.trim()) {
      items.push(qStr.trim());
    }
  });

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-3 mb-4">
        <h3 className="text-xl font-bold text-zinc-900 font-sans flex items-center gap-2">
          <span>Interactive Review: Fill in the Blanks</span>
        </h3>
        <div
          className="text-xs text-zinc-500 font-mono mt-1"
          dangerouslySetInnerHTML={{ __html: promptText }}
        />
      </div>

      {/* 2-Column Responsive Question Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-y-auto">
        {items.map((item, idx) => {
          // Split by *answer*
          const parts = item.split(/(\*[^*]+\*)/g);

          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-800 leading-relaxed flex items-start gap-2 shadow-2xs"
            >
              <div className="flex-1">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('*') && part.endsWith('*')) {
                    const rawAnswer = part.slice(1, -1);
                    const [solution] = rawAnswer.split(':');
                    const cleanAnswer = solution.split('/')[0].trim();

                    return (
                      <span
                        key={pIdx}
                        className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline-block" />
                        <span>{cleanAnswer}</span>
                      </span>
                    );
                  }

                  // Plain text snippet
                  const cleanText = part.replace(/<[^>]+>/g, '');
                  return <span key={pIdx}>{cleanText}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
