import React from 'react';
import { Check, X } from 'lucide-react';

interface SummaryRendererProps {
  params: Record<string, any>;
}

export const SummaryRenderer: React.FC<SummaryRendererProps> = ({ params }) => {
  const intro = params.intro || 'Choose the correct statement:';
  const summaries: Array<{ summary: string[] }> = params.summaries || [];

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-3 mb-4">
        <h3 className="text-xl font-bold text-zinc-900 font-sans flex items-center gap-2">
          <span>Review & Practice: Choose the Correct Statement</span>
        </h3>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          {intro} (Right answers are marked with a green checkmark)
        </p>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-y-auto">
        {summaries.map((item, idx) => {
          const statements = item.summary || [];
          // In H5P Summary specification, index 0 is always the correct statement
          const correctStatement = statements[0] || '';
          const distractors = statements.slice(1);

          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-800 flex flex-col justify-between shadow-2xs gap-2"
            >
              <div className="text-[11px] font-mono font-bold text-zinc-500">
                Question {idx + 1}
              </div>

              {/* Correct Statement (Always Index 0 in H5P) */}
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-2 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div
                  className="flex-1 leading-snug"
                  dangerouslySetInnerHTML={{ __html: correctStatement }}
                />
              </div>

              {/* Distractor / Incorrect Statements */}
              {distractors.map((dist, dIdx) => (
                <div
                  key={dIdx}
                  className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-400 flex items-start gap-2 line-through decoration-zinc-300 text-[11px]"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-2.5 h-2.5" />
                  </div>
                  <div
                    className="flex-1 leading-snug"
                    dangerouslySetInnerHTML={{ __html: dist }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
