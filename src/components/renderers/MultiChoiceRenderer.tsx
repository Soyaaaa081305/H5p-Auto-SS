import React from 'react';
import { QuizMode } from '../../types/h5p';
import { Check, Circle } from 'lucide-react';

interface MultiChoiceRendererProps {
  params: Record<string, any>;
  quizMode: QuizMode;
}

export const MultiChoiceRenderer: React.FC<MultiChoiceRendererProps> = ({ params, quizMode }) => {
  const questionText = params.question || params.text || '';
  const answers: Array<{ text: string; correct?: boolean }> = params.answers || [];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 my-4 print:border-none print:shadow-none print:p-2">
      {questionText && (
        <div
          className="text-base font-semibold text-slate-800 mb-4"
          dangerouslySetInnerHTML={{ __html: questionText }}
        />
      )}

      <div className="space-y-2.5">
        {answers.map((answer, aIdx) => {
          const isCorrect = Boolean(answer.correct);
          const showAsCorrect = quizMode === 'study' && isCorrect;

          return (
            <div
              key={aIdx}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                showAsCorrect
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                  : 'bg-slate-50/50 border-slate-200 text-slate-700'
              } print:border-slate-300 print:bg-transparent`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {showAsCorrect ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div
                className="flex-1 text-sm leading-normal"
                dangerouslySetInnerHTML={{ __html: answer.text }}
              />
              {showAsCorrect && (
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded ml-auto flex-shrink-0 print:border print:border-emerald-500">
                  Correct Answer
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
