import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react';

interface SingleChoiceSetRendererProps {
  params: Record<string, any>;
}

export const SingleChoiceSetRenderer: React.FC<SingleChoiceSetRendererProps> = ({ params }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Normalize choices array
  const choices: Array<{ question: string; answers: string[] }> = params.choices || [];

  if (choices.length === 0) {
    // Fallback if structured as traditional single question
    const fallbackQuestion = params.question || params.text || '';
    const fallbackAnswers = (params.answers || []).map((a: any) =>
      typeof a === 'string' ? a : a.text || ''
    );
    if (!fallbackQuestion && fallbackAnswers.length === 0) {
      return (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-400">
          No questions found in SingleChoiceSet.
        </div>
      );
    }
    choices.push({
      question: fallbackQuestion,
      answers: fallbackAnswers,
    });
  }

  const currentChoice = choices[activeIndex] || choices[0];
  const total = choices.length;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors my-2">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
            Question {activeIndex + 1} of {total}
          </span>
          <span className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            (H5P.SingleChoiceSet)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Question Selector Pills */}
          {total > 1 && total <= 15 && (
            <div className="hidden md:flex items-center gap-1 mr-1">
              {choices.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setShowAll(false);
                  }}
                  className={`w-6 h-6 rounded text-xs font-mono font-medium transition-all ${
                    idx === activeIndex && !showAll
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title={`Jump to Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Prev / Next controls */}
          {total > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveIndex((prev) => Math.max(0, prev - 1));
                  setShowAll(false);
                }}
                disabled={activeIndex === 0}
                className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Previous Question"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveIndex((prev) => Math.min(total - 1, prev + 1));
                  setShowAll(false);
                }}
                disabled={activeIndex === total - 1}
                className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Next Question"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Show All Toggle */}
          {total > 1 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                showAll
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                  : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>{showAll ? 'Single View' : `View All (${total})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Questions */}
      {showAll ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {choices.map((c, qIdx) => (
            <div
              key={qIdx}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Question {qIdx + 1}
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Verified Answer Revealed
                </span>
              </div>
              <div
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: c.question }}
              />
              <div className="space-y-2">
                {c.answers.map((ansHtml, aIdx) => {
                  const isCorrect = aIdx === 0;
                  return (
                    <div
                      key={aIdx}
                      className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border text-xs transition-colors ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 font-medium'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div dangerouslySetInnerHTML={{ __html: ansHtml }} />
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded flex-shrink-0">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Question Prompt */}
          <div
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: currentChoice.question }}
          />

          {/* Answer Options */}
          <div className="space-y-2.5">
            {currentChoice.answers.map((ansHtml, aIdx) => {
              // In H5P SingleChoiceSet, the first answer (index 0) is ALWAYS the verified correct answer
              const isCorrect = aIdx === 0;

              return (
                <div
                  key={aIdx}
                  className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-sm transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 font-medium shadow-2xs'
                      : 'bg-zinc-50/70 dark:bg-zinc-850/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 flex-shrink-0">
                      {isCorrect ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </div>
                    <div
                      className="leading-snug font-sans"
                      dangerouslySetInnerHTML={{ __html: ansHtml }}
                    />
                  </div>

                  {isCorrect && (
                    <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full flex-shrink-0 shadow-2xs">
                      ✓ Correct Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Progress Bar */}
          {total > 1 && (
            <div className="pt-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
