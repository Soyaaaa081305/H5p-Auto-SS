import React from 'react';
import { H5PElementAction, QuizMode } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { BlanksRenderer } from './BlanksRenderer';
import { MultiChoiceRenderer } from './MultiChoiceRenderer';
import { ExternalLink } from 'lucide-react';

interface ElementDispatcherProps {
  action?: H5PElementAction;
  assetMap: Map<string, string>;
  quizMode: QuizMode;
  inOverlay?: boolean;
}

export const ElementDispatcher: React.FC<ElementDispatcherProps> = ({
  action,
  assetMap,
  quizMode,
  inOverlay = false,
}) => {
  if (!action) return null;

  const { library, params = {} } = action;

  // 1. Fill in the blanks
  if (library.startsWith('H5P.Blanks')) {
    return <BlanksRenderer params={params} quizMode={quizMode} />;
  }

  // 2. Multiple choice / Single choice / True False
  if (
    library.startsWith('H5P.MultiChoice') ||
    library.startsWith('H5P.SingleChoiceSet') ||
    library.startsWith('H5P.TrueFalse')
  ) {
    return <MultiChoiceRenderer params={params} quizMode={quizMode} />;
  }

  // 3. Text
  if (library.startsWith('H5P.Text')) {
    const textHtml = params.text || '';
    return (
      <div
        className={`prose prose-slate max-w-none ${inOverlay ? 'text-sm' : 'my-2'}`}
        dangerouslySetInnerHTML={{ __html: textHtml }}
      />
    );
  }

  // 4. Image
  if (library.startsWith('H5P.Image')) {
    const imgPath = params.file?.path;
    const resolvedUrl = resolveAsset(imgPath, assetMap);
    const altText = params.alt || params.title || 'Image';

    if (!resolvedUrl) return null;

    return (
      <div className={`my-2 flex flex-col items-center ${inOverlay ? 'w-full h-full' : ''}`}>
        <img
          src={resolvedUrl}
          alt={altText}
          className="max-w-full max-h-[700px] object-contain rounded-lg shadow-sm"
        />
        {params.title && <p className="text-xs text-slate-500 mt-1 italic">{params.title}</p>}
      </div>
    );
  }

  // 5. Link / External Button (like Canva slides link)
  if (library.startsWith('H5P.Link')) {
    let url = params.linkWidget?.url || params.url || '';
    const protocol = params.linkWidget?.protocol || '';
    if (protocol && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `${protocol}${url}`;
    }
    const title = params.title || 'Open Link';

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium shadow transition-all ${
          inOverlay ? 'scale-90 origin-top-left' : 'my-2'
        } print:border print:border-indigo-600 print:text-indigo-900 print:bg-indigo-50`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>{title}</span>
      </a>
    );
  }

  // 6. Accordion
  if (library.startsWith('H5P.Accordion')) {
    const panels: Array<{ title: string; content?: string }> = params.panels || [];
    return (
      <div className="space-y-3 my-4">
        {panels.map((p, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm print:border-slate-300">
            <h4 className="font-semibold text-slate-900 mb-2">{p.title}</h4>
            {p.content && (
              <div
                className="text-sm text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: p.content }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // 7. Table
  if (library.startsWith('H5P.Table')) {
    const tableHtml = params.table || '';
    return (
      <div
        className="my-3 overflow-x-auto print:overflow-visible"
        dangerouslySetInnerHTML={{ __html: tableHtml }}
      />
    );
  }

  // Fallback: Check for generic text or description
  if (params.text || params.html || params.body) {
    const raw = params.text || params.html || params.body;
    return (
      <div
        className="text-slate-800 text-sm leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    );
  }

  return null;
};
