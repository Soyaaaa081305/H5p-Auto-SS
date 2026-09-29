import React, { useState } from 'react';
import { ElementDispatcher } from './ElementDispatcher';
import { Layers, HelpCircle, FileText, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface FallbackRendererProps {
  content: Record<string, any>;
  mainLibrary: string;
  assetMap: Map<string, string>;
}

interface DiscoveredQuestion {
  title: string;
  action: any;
}

export const FallbackRenderer: React.FC<FallbackRendererProps> = ({
  content,
  mainLibrary,
  assetMap,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  // Recursively discover any interactive questions hidden anywhere in the content JSON
  const discoveredQuestions: DiscoveredQuestion[] = [];
  const textSnippets: string[] = [];

  function scan(obj: any, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 8) return;

    if (Array.isArray(obj)) {
      obj.forEach((item) => scan(item, depth + 1));
      return;
    }

    // Check if current object represents an H5P action / question
    if (obj.library && typeof obj.library === 'string') {
      const lib = obj.library;
      if (
        lib.startsWith('H5P.MultiChoice') ||
        lib.startsWith('H5P.TrueFalse') ||
        lib.startsWith('H5P.Blanks') ||
        lib.startsWith('H5P.DragText') ||
        lib.startsWith('H5P.Summary') ||
        lib.startsWith('H5P.MarkTheWords') ||
        lib.startsWith('H5P.SingleChoiceSet')
      ) {
        discoveredQuestions.push({
          title: obj.params?.question || obj.params?.taskDescription || obj.params?.title || lib.split(' ')[0],
          action: obj,
        });
      }
    }

    if (obj.action && obj.action.library) {
      scan(obj.action, depth + 1);
    }

    // Look for text bodies
    if (typeof obj.text === 'string' && obj.text.length > 20) {
      textSnippets.push(obj.text);
    } else if (typeof obj.description === 'string' && obj.description.length > 20) {
      textSnippets.push(obj.description);
    }

    // Recurse into children
    Object.keys(obj).forEach((key) => {
      if (key !== 'parent' && key !== 'context') {
        scan(obj[key], depth + 1);
      }
    });
  }

  scan(content);

  // Deduplicate text snippets
  const uniqueTexts = Array.from(new Set(textSnippets)).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                Universal H5P Module View
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Detected: {mainLibrary}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
            Adaptive Parser
          </span>
        </div>

        {/* If questions discovered */}
        {discoveredQuestions.length > 0 ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Extracted {discoveredQuestions.length} interactive questions with verified answer keys revealed below.
            </span>
          </div>
        ) : (
          <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            This module has been unpacked and analyzed. All accessible text, study questions, and media are rendered below.
          </p>
        )}
      </div>

      {/* Discovered Questions Section */}
      {discoveredQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Extracted Questions & Answer Keys ({discoveredQuestions.length})</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">Study Mode</span>
          </div>

          <div className="space-y-4">
            {discoveredQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-colors"
              >
                <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-850/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                    Item {idx + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Answer Revealed</span>
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <ElementDispatcher action={q.action} assetMap={assetMap} inOverlay={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Articles / Notes if found */}
      {uniqueTexts.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Extracted Notes & Text Content</span>
          </h3>
          <div className="space-y-3">
            {uniqueTexts.map((txt, tIdx) => (
              <div
                key={tIdx}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: txt }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Structured Content Inspector Toggle */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
        >
          <span>Raw H5P Parameters Inspector</span>
          {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRaw && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto max-h-96">
            <pre>{JSON.stringify(content, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
