import React from 'react';
import { H5PElementAction } from '../../types/h5p';
import { resolveAsset } from '../../lib/h5pParser';
import { BlanksRenderer } from './BlanksRenderer';
import { SummaryRenderer } from './SummaryRenderer';
import { MultiChoiceRenderer } from './MultiChoiceRenderer';
import { DragTextRenderer } from './DragTextRenderer';
import { SingleChoiceSetRenderer } from './SingleChoiceSetRenderer';
import { ExternalLink } from 'lucide-react';

interface ElementDispatcherProps {
  action?: H5PElementAction;
  assetMap: Map<string, string>;
  inOverlay?: boolean;
}

export const ElementDispatcher: React.FC<ElementDispatcherProps> = ({
  action,
  assetMap,
  inOverlay = false,
}) => {
  if (!action) return null;

  const { library, params = {} } = action;

  // 1. Fill in the blanks
  if (library.startsWith('H5P.Blanks')) {
    return <BlanksRenderer params={params} />;
  }

  // 2. Drag the Words / DragText
  if (library.startsWith('H5P.DragText') || library.startsWith('H5P.DragQuestion')) {
    return <DragTextRenderer params={params} />;
  }

  // 3. Summary (Choose correct statement)
  if (library.startsWith('H5P.Summary')) {
    return <SummaryRenderer params={params} />;
  }

  // 4. Single Choice Set (mini-quiz battery)
  if (library.startsWith('H5P.SingleChoiceSet')) {
    return <SingleChoiceSetRenderer params={params} />;
  }

  // 5. Multiple choice / True False
  if (
    library.startsWith('H5P.MultiChoice') ||
    library.startsWith('H5P.TrueFalse')
  ) {
    return <MultiChoiceRenderer params={params} quizMode="study" />;
  }

  // 6. Text & AdvancedText
  if (library.startsWith('H5P.Text') || library.startsWith('H5P.AdvancedText')) {
    const textHtml = params.text || '';
    return (
      <div
        className={`prose prose-zinc max-w-none ${inOverlay ? 'text-sm' : 'my-2'}`}
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
        {params.title && <p className="text-xs text-zinc-500 mt-1 italic">{params.title}</p>}
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
    // Clean &amp; to & so Canva loads properly
    url = url.replace(/&amp;/g, '&');
    const title = params.title || 'Open Slides in Canva';

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>{title}</span>
      </a>
    );
  }

  // 6. Video
  if (library.startsWith('H5P.Video')) {
    const sources: Array<{ path: string; mime?: string }> = params.sources || params.files || [];
    const src = sources[0]?.path || '';
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = src.match(regExp);
    const ytUrl = match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
    const resolvedVideo = !ytUrl ? resolveAsset(src, assetMap) || src : null;

    return (
      <div className="my-3 w-full rounded-xl overflow-hidden bg-black flex justify-center">
        {ytUrl ? (
          <div className="w-full aspect-video">
            <iframe
              src={ytUrl}
              title="Embedded Video"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : resolvedVideo ? (
          <video controls className="w-full max-h-[500px] object-contain" src={resolvedVideo}>
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className="p-4 text-xs font-mono text-zinc-400">Video source unavailable</div>
        )}
      </div>
    );
  }

  // 7. Audio
  if (library.startsWith('H5P.Audio')) {
    const files: Array<{ path: string }> = params.files || [];
    const audioUrl = resolveAsset(files[0]?.path, assetMap) || files[0]?.path;
    return (
      <div className="my-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
        <audio controls className="w-full" src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  // 8. Mark the Words
  if (library.startsWith('H5P.MarkTheWords')) {
    const taskDesc = params.taskDescription || 'Mark the correct words in the text:';
    const textField = params.textField || '';
    const parts = textField.split(/(\*[^*]+\*)/g);

    return (
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 my-2">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">{taskDesc}</h4>
        <p className="text-xs text-zinc-500 font-mono">Answers highlighted in emerald:</p>
        <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {parts.map((p: string, pIdx: number) => {
            if (p.startsWith('*') && p.endsWith('*')) {
              return (
                <span
                  key={pIdx}
                  className="mx-0.5 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-xs"
                >
                  ✓ {p.slice(1, -1)}
                </span>
              );
            }
            return <span key={pIdx} dangerouslySetInnerHTML={{ __html: p }} />;
          })}
        </div>
      </div>
    );
  }

  // 9. Accordion
  if (library.startsWith('H5P.Accordion')) {
    const panels: Array<{ title: string; content?: string }> = params.panels || [];
    return (
      <div className="space-y-3 my-4">
        {panels.map((p, idx) => (
          <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 shadow-2xs">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{p.title}</h4>
            {p.content && (
              <div
                className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: p.content }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // 10. Table
  if (library.startsWith('H5P.Table')) {
    const tableHtml = params.table || '';
    return (
      <div
        className="my-3 overflow-x-auto print:overflow-visible text-zinc-900 dark:text-zinc-100"
        dangerouslySetInnerHTML={{ __html: tableHtml }}
      />
    );
  }

  // 11. Nested Question Set in element
  if (params.questions && Array.isArray(params.questions)) {
    return (
      <div className="space-y-3 my-3">
        {params.questions.map((q: any, qIdx: number) => {
          const act = q.action || (q.library ? q : null);
          return (
            <div key={qIdx} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              {act && <ElementDispatcher action={act} assetMap={assetMap} inOverlay={inOverlay} />}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: Check for generic text or description
  if (params.text || params.html || params.body || params.description) {
    const raw = params.text || params.html || params.body || params.description;
    return (
      <div
        className="text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    );
  }

  // Resilient Universal Element Fallback (never render a blank/empty element!)
  return (
    <div className="p-3 my-2 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400">
      <span className="font-bold text-zinc-800 dark:text-zinc-200">
        [{library.split(' ')[0]}]
      </span>
      {params.title && <span className="ml-2 font-sans font-semibold text-zinc-900 dark:text-zinc-100">{params.title}</span>}
    </div>
  );
};
