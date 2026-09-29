import React from 'react';
import { Check, Circle } from 'lucide-react';
import { SingleChoiceSetRenderer } from './SingleChoiceSetRenderer';

interface MultiChoiceRendererProps {
  params: Record<string, any>;
  quizMode?: string;
}

export const MultiChoiceRenderer: React.FC<MultiChoiceRendererProps> = ({ params }) => {
  if (params.choices && Array.isArray(params.choices) && params.choices.length > 0) {
    return <SingleChoiceSetRenderer params={params} />;
  }

  const questionText = params.question || params.text || '';
  const answers: Array<{ text: string; correct?: boolean }> = params.answers || [];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-6 shadow-2xs border border-zinc-200 dark:border-zinc-800 my-4 transition-colors print:border-none print:shadow-none print:p-2">
      {questionText && (
        <div
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4 font-sans"
          dangerouslySetInnerHTML={{ __html: questionText }}
        />
      )}

      <div className="space-y-2.5">
        {answers.map((answer, aIdx) => {
          const isCorrect = Boolean(answer.correct);
          const showAsCorrect = isCorrect;

          return (
            <div
              key={aIdx}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                showAsCorrect
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 font-medium'
                  : 'bg-zinc-50/60 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              } print:border-zinc-300 print:bg-transparent`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {showAsCorrect ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                )}
              </div>
              <div
                className="flex-1 text-sm leading-normal font-sans"
                dangerouslySetInnerHTML={{ __html: answer.text }}
              />
              {showAsCorrect && (
                <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded ml-auto flex-shrink-0 print:border print:border-emerald-500">
                  ✓ Correct Answer
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
