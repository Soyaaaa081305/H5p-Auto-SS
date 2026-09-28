import React from 'react';
import { QuizMode } from '../../types/h5p';
import { ElementDispatcher } from './ElementDispatcher';

interface FallbackRendererProps {
  content: Record<string, any>;
  mainLibrary: string;
  assetMap: Map<string, string>;
  quizMode: QuizMode;
}

export const FallbackRenderer: React.FC<FallbackRendererProps> = ({
  content,
  mainLibrary,
  assetMap,
  quizMode,
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
      <div className="mb-6 pb-4 border-b border-slate-200 print:hidden">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          Detected Content Type: {mainLibrary}
        </span>
      </div>

      <ElementDispatcher
        action={{
          library: mainLibrary,
          params: content,
        }}
        assetMap={assetMap}
        quizMode={quizMode}
        inOverlay={false}
      />
    </div>
  );
};
