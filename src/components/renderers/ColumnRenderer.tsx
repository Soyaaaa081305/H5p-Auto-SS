import React from 'react';
import { ElementDispatcher } from './ElementDispatcher';

interface ColumnRendererProps {
  content: Record<string, any>;
  assetMap: Map<string, string>;
}

export const ColumnRenderer: React.FC<ColumnRendererProps> = ({
  content,
  assetMap,
}) => {
  const contentItems: Array<{ content?: any; library?: string; params?: any }> =
    content.content || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {contentItems.map((item, idx) => {
        const itemContent = item.content || item.params || item;
        const library = item.library || itemContent?.library || '';

        return (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-2xs">
            <ElementDispatcher
              action={{
                library,
                params: itemContent.params || itemContent,
              }}
              assetMap={assetMap}
              inOverlay={false}
            />
          </div>
        );
      })}
    </div>
  );
};
