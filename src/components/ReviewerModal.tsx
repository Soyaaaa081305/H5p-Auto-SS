import React, { useState } from 'react';
import { H5PPackage } from '../types/h5p';
import { X, Copy, Check, Printer, BookOpen, Sparkles } from 'lucide-react';

interface ReviewerModalProps {
  pkg: H5PPackage;
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionItem {
  id: string;
  slideNumber: number;
  type: 'blanks' | 'summary' | 'multichoice' | 'truefalse';
  question: string;
  correctAnswer: string;
  distractors?: string[];
}

function cleanHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export const ReviewerModal: React.FC<ReviewerModalProps> = ({ pkg, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Extract all questions across all slides
  const questions: QuestionItem[] = [];
  const slides: any[] = pkg.content?.presentation?.slides || [];

  slides.forEach((slide, sIdx) => {
    const elements: any[] = slide.elements || [];
    elements.forEach((el) => {
      const action = el.action;
      if (!action) return;
      const lib = action.library || '';
      const params = action.params || {};

      // 1. Fill in the Blanks
      if (lib.startsWith('H5P.Blanks')) {
        const rawQuestions: string[] = params.questions || [];
        rawQuestions.forEach((qStr) => {
          const pRegex = /<p>(.*?)<\/p>/gi;
          let match;
          let found = false;
          while ((match = pRegex.exec(qStr)) !== null) {
            found = true;
            const paragraph = match[1].trim();
            if (!paragraph) continue;

            const parts = paragraph.split(/(\*[^*]+\*)/g);
            let qText = '';
            let ans = '';

            parts.forEach((p) => {
              if (p.startsWith('*') && p.endsWith('*')) {
                const raw = p.slice(1, -1);
                const [sol] = raw.split(':');
                ans = sol.split('/')[0].trim();
                qText += ' _______ ';
              } else {
                qText += cleanHtml(p);
              }
            });

            qText = qText.replace(/^\s*\(\d+\)\s*/, '').trim();

            questions.push({
              id: `blank-${sIdx}-${questions.length}`,
              slideNumber: sIdx + 1,
              type: 'blanks',
              question: qText,
              correctAnswer: ans,
            });
          }

          if (!found && qStr.trim()) {
            const parts = qStr.split(/(\*[^*]+\*)/g);
            let qText = '';
            let ans = '';
            parts.forEach((p) => {
              if (p.startsWith('*') && p.endsWith('*')) {
                const raw = p.slice(1, -1);
                const [sol] = raw.split(':');
                ans = sol.split('/')[0].trim();
                qText += ' _______ ';
              } else {
                qText += cleanHtml(p);
              }
            });
            questions.push({
              id: `blank-${sIdx}-${questions.length}`,
              slideNumber: sIdx + 1,
              type: 'blanks',
              question: qText.trim(),
              correctAnswer: ans,
            });
          }
        });
      }

      // 2. Summary (Choose correct statement)
      if (lib.startsWith('H5P.Summary')) {
        const summaries: Array<{ summary: string[] }> = params.summaries || [];
        summaries.forEach((item, itemIdx) => {
          const statements = item.summary || [];
          if (statements.length > 0) {
            questions.push({
              id: `summary-${sIdx}-${itemIdx}`,
              slideNumber: sIdx + 1,
              type: 'summary',
              question: `Statement Choice #${itemIdx + 1}: Which statement is correct?`,
              correctAnswer: cleanHtml(statements[0]),
              distractors: statements.slice(1).map(cleanHtml),
            });
          }
        });
      }

      // 3. MultiChoice / SingleChoice
      if (lib.startsWith('H5P.MultiChoice') || lib.startsWith('H5P.SingleChoiceSet')) {
        const qText = cleanHtml(params.question || params.text || 'Multiple Choice Question');
        const answers: Array<{ text: string; correct?: boolean }> = params.answers || [];
        const correct = answers.find((a) => a.correct);
        const distractors = answers.filter((a) => !a.correct).map((a) => cleanHtml(a.text));

        questions.push({
          id: `mc-${sIdx}-${questions.length}`,
          slideNumber: sIdx + 1,
          type: 'multichoice',
          question: qText,
          correctAnswer: correct ? cleanHtml(correct.text) : 'None marked',
          distractors,
        });
      }

      // 4. True / False
      if (lib.startsWith('H5P.TrueFalse')) {
        const qText = cleanHtml(params.question || 'True or False');
        const isTrue = String(params.correct).toLowerCase() === 'true';

        questions.push({
          id: `tf-${sIdx}-${questions.length}`,
          slideNumber: sIdx + 1,
          type: 'truefalse',
          question: qText,
          correctAnswer: isTrue ? 'True' : 'False',
          distractors: [isTrue ? 'False' : 'True'],
        });
      }
    });
  });

  const handleCopyForAnki = async () => {
    const title = pkg.metadata.title || pkg.fileName;
    let text = `# ${title} - Exam Reviewer & Answer Key\n\n`;

    questions.forEach((q, idx) => {
      text += `### Q${idx + 1}: ${q.question} (Slide ${q.slideNumber})\n`;
      text += `**Correct Answer:** ${q.correctAnswer}\n`;
      if (q.distractors && q.distractors.length > 0) {
        text += `*Distractors:* ${q.distractors.join(' | ')}\n`;
      }
      text += `\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden print:max-h-none print:shadow-none print:border-none">
        {/* Modal Header */}
        <div className="no-print px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-sans flex items-center gap-2">
                Exam Reviewer & Answer Key
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold">
                  {questions.length} Questions
                </span>
              </h3>
              <p className="text-xs text-zinc-500 font-normal">
                Condensed study guide extracted from {pkg.metadata.title || pkg.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyForAnki}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied for Anki/Notion!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy for Anki / Notion</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Print Reviewer Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Questions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 font-mono text-xs">
              No interactive quiz questions found in this module.
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-zinc-200/90 bg-white hover:border-zinc-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-900">
                    Question {idx + 1}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Slide {q.slideNumber}
                  </span>
                </div>

                <p className="text-sm font-medium text-zinc-800 leading-relaxed mb-3">
                  {q.question}
                </p>

                {/* Correct Answer Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Correct Answer: {q.correctAnswer}</span>
                </div>

                {/* Distractors if any */}
                {q.distractors && q.distractors.length > 0 && (
                  <div className="mt-2 text-xs text-zinc-400 font-sans">
                    <span className="font-semibold text-zinc-500">Other options:</span>{' '}
                    {q.distractors.join(' · ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="no-print px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ready for exam cramming, Anki flashcards, and quick revision.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium text-xs shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
