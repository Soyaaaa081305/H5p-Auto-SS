import React from 'react';
import { ElementDispatcher } from './ElementDispatcher';

interface FallbackRendererProps {
  content: Record<string, any>;
  mainLibrary: string;
  assetMap: Map<string, string>;
}

export const FallbackRenderer: React.FC<FallbackRendererProps> = ({
  content,
  mainLibrary,
  assetMap,
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 border border-zinc-200 shadow-2xs">
      <div className="mb-6 pb-4 border-b border-zinc-200">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-mono font-bold">
          Detected Content Type: {mainLibrary}
        </span>
      </div>

      <ElementDispatcher
        action={{
          library: mainLibrary,
          params: content,
        }}
        assetMap={assetMap}
        inOverlay={false}
      />
    </div>
  );
};
