import React from 'react';
import { QuizMode } from '../../types/h5p';
import { ElementDispatcher } from './ElementDispatcher';

interface ColumnRendererProps {
  content: Record<string, any>;
  assetMap: Map<string, string>;
  quizMode: QuizMode;
}

export const ColumnRenderer: React.FC<ColumnRendererProps> = ({
  content,
  assetMap,
  quizMode,
}) => {
  const contentItems: Array<{ content?: any; library?: string; params?: any }> =
    content.content || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {contentItems.map((item, idx) => {
        const itemContent = item.content || item.params || item;
        const library = item.library || itemContent?.library || '';

        return (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
            <ElementDispatcher
              action={{
                library,
                params: itemContent.params || itemContent,
              }}
              assetMap={assetMap}
              quizMode={quizMode}
              inOverlay={false}
            />
          </div>
        );
      })}
    </div>
  );
};
