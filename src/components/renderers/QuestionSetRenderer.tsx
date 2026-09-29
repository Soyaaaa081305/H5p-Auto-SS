import React from 'react';
import { ElementDispatcher } from './ElementDispatcher';
import { HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';

interface QuestionSetRendererProps {
  content: Record<string, any>;
  assetMap: Map<string, string>;
}

export const QuestionSetRenderer: React.FC<QuestionSetRendererProps> = ({
  content,
  assetMap,
}) => {
  const introPage = content.introPage || {};
  const introTitle = introPage.title || 'Interactive Quiz';
  const introDesc = introPage.introduction || '';

  const rawQuestions: any[] = content.questions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans">
              {introTitle}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {rawQuestions.length} Questions Total • Study Mode (All Answers Revealed)
            </p>
          </div>
        </div>

        {introDesc && (
          <div
            className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: introDesc }}
          />
        )}

        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Every question in this quiz is pre-answered with the correct solution for study and revision.</span>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-5">
        {rawQuestions.map((qItem, idx) => {
          const action = qItem.action || (qItem.library ? qItem : null);
          const libName = (action?.library || '').split(' ')[0] || 'Quiz Question';

          return (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-colors"
            >
              {/* Question Header Bar */}
              <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-850/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                    Question {idx + 1}
                  </span>
                  <span className="text-zinc-400 font-mono text-[10px]">
                    {libName}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Answered</span>
                </span>
              </div>

              {/* Question Content */}
              <div className="p-5 sm:p-6">
                {action ? (
                  <ElementDispatcher action={action} assetMap={assetMap} inOverlay={false} />
                ) : (
                  <div className="text-zinc-400 text-xs font-mono">No action data</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
