import React from 'react';
import { QuizMode } from '../../types/h5p';
import { CheckCircle2 } from 'lucide-react';

interface BlanksRendererProps {
  params: Record<string, any>;
  quizMode: QuizMode;
}

export const BlanksRenderer: React.FC<BlanksRendererProps> = ({ params, quizMode }) => {
  const promptText = params.text || '';
  const questions: string[] = params.questions || [];

  // Parse H5P Blanks asterisk syntax: *answer* or *answer:tip*
  const renderQuestionText = (htmlText: string) => {
    // Replace *answer* or *answer:tip*
    // First, split or replace with regex
    const parts = htmlText.split(/(\*[^*]+\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const rawContent = part.slice(1, -1);
        // Sometimes solutions have alternatives separated by /: e.g. *RAM/Random Access Memory*
        const [solutionsPart] = rawContent.split(':');
        const primarySolution = solutionsPart.split('/')[0].trim();

        if (quizMode === 'study') {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-md font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm print:bg-emerald-50 print:border-emerald-400 print:text-emerald-900"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:hidden inline-block" />
              <span>{primarySolution}</span>
            </span>
          );
        } else {
          return (
            <span
              key={idx}
              className="inline-block mx-1.5 px-3 border-b-2 border-slate-700 min-w-[120px] text-center text-transparent select-none print:border-slate-800"
            >
              _________________
            </span>
          );
        }
      }

      // Render raw HTML snippet safely
      return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 my-4 print:border-none print:shadow-none print:p-2">
      {promptText && (
        <div
          className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 print:border-slate-300"
          dangerouslySetInnerHTML={{ __html: promptText }}
        />
      )}

      <div className="space-y-4">
        {questions.map((questionHtml, qIdx) => (
          <div
            key={qIdx}
            className="text-slate-700 text-base leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border-none print:p-1"
          >
            {renderQuestionText(questionHtml)}
          </div>
        ))}
      </div>
    </div>
  );
};
