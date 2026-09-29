import React from 'react';
import { Check, Sparkles } from 'lucide-react';

interface DragTextRendererProps {
  params: Record<string, any>;
}

interface ParsedItem {
  questionNumber: number;
  segments: Array<{ text: string; isAnswer: boolean }>;
  answers: string[];
}

export const DragTextRenderer: React.FC<DragTextRendererProps> = ({ params }) => {
  const taskDescription = params.taskDescription || 'Drag the words into the correct boxes';
  const textField = params.textField || '';

  // Extract lines
  const rawLines = textField
    .split(/\n+/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  const allWordBank: string[] = [];
  const parsedItems: ParsedItem[] = [];

  rawLines.forEach((line: string, idx: number) => {
    // Regex splits by asterisks *word*
    const parts = line.split(/(\*[^*]+\*)/g);
    const segments: Array<{ text: string; isAnswer: boolean }> = [];
    const answers: string[] = [];

    parts.forEach((p) => {
      if (p.startsWith('*') && p.endsWith('*')) {
        const raw = p.slice(1, -1);
        const [sol] = raw.split(':');
        const ans = sol.trim();
        if (ans) {
          segments.push({ text: ans, isAnswer: true });
          answers.push(ans);
          allWordBank.push(ans);
        }
      } else {
        const clean = p.replace(/<[^>]+>/g, '');
        if (clean) {
          // Remove leading [1] or (1) if present
          const stripped = clean.replace(/^\s*\[\d+\]\s*/, '').replace(/^\s*\(\d+\)\s*/, '');
          segments.push({ text: stripped, isAnswer: false });
        }
      }
    });

    parsedItems.push({
      questionNumber: idx + 1,
      segments,
      answers,
    });
  });

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-zinc-900 transition-colors select-text">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3 flex-shrink-0 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-2">
            <span>{taskDescription}</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            Auto-Solved Study Mode • Verified correct terms placed in-line
          </p>
        </div>

        {/* Word Bank Summary Chips */}
        {allWordBank.length > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 flex-wrap max-w-md justify-end">
            <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold mr-1">
              Word Bank:
            </span>
            {Array.from(new Set(allWordBank)).slice(0, 5).map((word, wIdx) => (
              <span
                key={wIdx}
                className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium"
              >
                {word}
              </span>
            ))}
            {Array.from(new Set(allWordBank)).length > 5 && (
              <span className="text-[10px] font-mono text-zinc-400">
                +{Array.from(new Set(allWordBank)).length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
        {parsedItems.map((item) => (
          <div
            key={item.questionNumber}
            className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/60 flex flex-col justify-between shadow-2xs gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
                Item [{item.questionNumber}]
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                <Check className="w-3 h-3" />
                <span>Verified Match</span>
              </span>
            </div>

            {/* Sentence with in-line answered box */}
            <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200">
              {item.segments.map((seg, sIdx) => {
                if (seg.isAnswer) {
                  return (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-xs shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span>{seg.text}</span>
                    </span>
                  );
                }
                return <span key={sIdx}>{seg.text}</span>;
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Micro-footer */}
      <div className="pt-2 text-right text-[11px] font-mono text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>All {parsedItems.length} drag-and-drop targets solved and verified</span>
        </span>
        <span>H5P.DragText</span>
      </div>
    </div>
  );
};
