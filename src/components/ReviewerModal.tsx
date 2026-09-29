import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { H5PPackage } from '../types/h5p';
import { X, Copy, Check, BookOpen, Sparkles } from 'lucide-react';

interface ReviewerModalProps {
  pkg: H5PPackage;
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionItem {
  id: string;
  slideNumber: number | string;
  type: 'blanks' | 'summary' | 'multichoice' | 'truefalse' | 'dragtext';
  promptTitle: string;
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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract all questions across slides, interactive videos, question sets, or fallbacks
  const questions: QuestionItem[] = [];

  const extractFromAction = (action: any, locationLabel: string | number) => {
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
            id: `blank-${locationLabel}-${questions.length}`,
            slideNumber: locationLabel,
            type: 'blanks',
            promptTitle: `Fill in the Blank`,
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
            id: `blank-${locationLabel}-${questions.length}`,
            slideNumber: locationLabel,
            type: 'blanks',
            promptTitle: `Fill in the Blank`,
            question: qText.trim(),
            correctAnswer: ans,
          });
        }
      });
    }

    // 2. Drag the Words / DragText
    if (lib.startsWith('H5P.DragText') || lib.startsWith('H5P.DragQuestion')) {
      const textField = params.textField || '';
      const lines = textField.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      lines.forEach((line: string) => {
        const parts = line.split(/(\*[^*]+\*)/g);
        let qText = '';
        let ans = '';
        parts.forEach((p) => {
          if (p.startsWith('*') && p.endsWith('*')) {
            const raw = p.slice(1, -1);
            ans = raw.split(':')[0].trim();
            qText += ' _______ ';
          } else {
            qText += cleanHtml(p);
          }
        });
        qText = qText.replace(/^\s*\[\d+\]\s*/, '').replace(/^\s*\(\d+\)\s*/, '').trim();
        if (ans) {
          questions.push({
            id: `dragtext-${locationLabel}-${questions.length}`,
            slideNumber: locationLabel,
            type: 'dragtext',
            promptTitle: `Drag the Words Match`,
            question: qText,
            correctAnswer: ans,
          });
        }
      });
    }

    // 3. Summary (Choose correct statement)
    if (lib.startsWith('H5P.Summary')) {
      const summaries: Array<{ summary: string[] }> = params.summaries || [];
      summaries.forEach((item, itemIdx) => {
        const statements = item.summary || [];
        if (statements.length > 0) {
          questions.push({
            id: `summary-${locationLabel}-${itemIdx}`,
            slideNumber: locationLabel,
            type: 'summary',
            promptTitle: `Choose Correct Statement #${itemIdx + 1}`,
            question: 'Which statement accurately describes the course concept?',
            correctAnswer: cleanHtml(statements[0]),
            distractors: statements.slice(1).map(cleanHtml),
          });
        }
      });
    }

    // 4. MultiChoice / SingleChoice
    if (lib.startsWith('H5P.MultiChoice') || lib.startsWith('H5P.SingleChoiceSet')) {
      const qText = cleanHtml(params.question || params.text || 'Multiple Choice Question');
      const answers: Array<{ text: string; correct?: boolean }> = params.answers || [];
      const correct = answers.find((a) => a.correct);
      const distractors = answers.filter((a) => !a.correct).map((a) => cleanHtml(a.text));

      questions.push({
        id: `mc-${locationLabel}-${questions.length}`,
        slideNumber: locationLabel,
        type: 'multichoice',
        promptTitle: `Multiple Choice`,
        question: qText,
        correctAnswer: correct ? cleanHtml(correct.text) : 'None marked',
        distractors,
      });
    }

    // 5. True / False
    if (lib.startsWith('H5P.TrueFalse')) {
      const qText = cleanHtml(params.question || 'True or False');
      const isTrue = String(params.correct).toLowerCase() === 'true';

      questions.push({
        id: `tf-${locationLabel}-${questions.length}`,
        slideNumber: locationLabel,
        type: 'truefalse',
        promptTitle: `True or False`,
        question: qText,
        correctAnswer: isTrue ? 'True' : 'False',
        distractors: [isTrue ? 'False' : 'True'],
      });
    }
  };

  // Case A: Course Presentation Slides
  const slides: any[] = pkg.content?.presentation?.slides || [];
  slides.forEach((slide, sIdx) => {
    (slide.elements || []).forEach((el: any) => {
      extractFromAction(el.action, sIdx + 1);
    });
  });

  // Case B: Interactive Video Checkpoints
  const ivInteractions: any[] = pkg.content?.interactiveVideo?.interactions || pkg.content?.interactions || [];
  ivInteractions.forEach((inter: any) => {
    const fromSec = inter.duration?.from ?? 0;
    const m = Math.floor(fromSec / 60);
    const s = Math.floor(fromSec % 60);
    const timeLabel = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    extractFromAction(inter.action, `Video @ ${timeLabel}`);
  });

  // Case C: QuestionSet
  const qSet: any[] = pkg.content?.questions || [];
  qSet.forEach((q: any, qIdx: number) => {
    extractFromAction(q.action || q, `Question #${qIdx + 1}`);
  });

  // Case D: Top-level / Fallback Scan if still 0 questions found
  if (questions.length === 0) {
    extractFromAction({ library: pkg.mainLibrary, params: pkg.content }, 'Module Quiz');
  }

  const handleCopyForAnki = async () => {
    const title = pkg.metadata.title || pkg.fileName;
    let text = `# ${title} - Exam Reviewer & Answer Key\n\n`;

    questions.forEach((q, idx) => {
      const locText = typeof q.slideNumber === 'number' ? `Slide ${q.slideNumber}` : q.slideNumber;
      text += `### Q${idx + 1}: ${q.question} (${locText})\n`;
      text += `**✓ Correct Answer:** ${q.correctAnswer}\n`;
      if (q.distractors && q.distractors.length > 0) {
        text += `*Incorrect Options:* ${q.distractors.join(' | ')}\n`;
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-[10000] print:max-h-none print:shadow-none print:border-none my-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="no-print px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-850/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-2">
                <span>Exam Reviewer & Answer Key</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-semibold">
                  {questions.length} Questions
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                Course questions & verified answers from {pkg.metadata.title || pkg.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyForAnki}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
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
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Questions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 font-mono text-xs">
              No interactive quiz questions found in this module.
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      Question {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                      {q.promptTitle}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    {typeof q.slideNumber === 'number' ? `Slide ${q.slideNumber}` : q.slideNumber}
                  </span>
                </div>

                {/* Question Prompt */}
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {q.question}
                </p>

                {/* Correct Statement / Answer */}
                <div className="p-3 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 font-mono text-[11px] block mb-0.5">
                      ✓ CORRECT STATEMENT / ANSWER:
                    </span>
                    <span className="leading-relaxed">{q.correctAnswer}</span>
                  </div>
                </div>

                {/* Distractors if any */}
                {q.distractors && q.distractors.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {q.distractors.map((dist, dIdx) => (
                      <div
                        key={dIdx}
                        className="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2"
                      >
                        <span className="text-zinc-400 dark:text-zinc-500 font-bold flex-shrink-0 mt-0.5">✗</span>
                        <span className="leading-relaxed">{dist}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="no-print px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/90 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ready for exam cramming, Anki flashcards, and quick revision.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
