import React from 'react';
import { ElementDispatcher } from './ElementDispatcher';
import { resolveAsset } from '../../lib/h5pParser';
import { Video, Clock, CheckCircle2, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';

interface InteractiveVideoRendererProps {
  content: Record<string, any>;
  assetMap: Map<string, string>;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  } catch {
    return null;
  }
}

export const InteractiveVideoRenderer: React.FC<InteractiveVideoRendererProps> = ({
  content,
  assetMap,
}) => {
  const iv = content.interactiveVideo || content;
  const files: Array<{ path: string; mime?: string }> = iv.video?.files || [];
  const primaryFile = files[0];
  const videoPath = primaryFile?.path || '';

  // Check if YouTube
  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoPath);
  // Check if local uploaded video
  const resolvedVideoUrl = !youtubeEmbedUrl ? resolveAsset(videoPath, assetMap) || videoPath : null;

  // Extract all quiz interactions
  const rawInteractions: any[] = iv.interactions || [];
  // Sort chronologically by timestamp
  const interactions = [...rawInteractions].sort((a, b) => {
    const aFrom = a.duration?.from ?? 0;
    const bFrom = b.duration?.from ?? 0;
    return aFrom - bFrom;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Video Header Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-colors">
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                Interactive Video Module
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {interactions.length} embedded quiz checkpoints & study notes detected
              </p>
            </div>
          </div>

          {videoPath && (
            <a
              href={videoPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Original Video Link</span>
            </a>
          )}
        </div>

        {/* Video Player Area */}
        <div className="p-4 sm:p-6 bg-zinc-950 flex justify-center items-center">
          {youtubeEmbedUrl ? (
            <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
              <iframe
                src={youtubeEmbedUrl}
                title="H5P Interactive Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : resolvedVideoUrl ? (
            <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
              <video controls className="w-full aspect-video object-contain" src={resolvedVideoUrl}>
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 font-mono text-xs">
              <Video className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <span>External or non-streamable video stream</span>
            </div>
          )}
        </div>

        {/* Study Mode Notice Banner */}
        <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-200 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              All video quiz checkpoints have been auto-extracted and answered below for fast exam review.
            </span>
          </div>
          <span className="font-mono font-bold text-[11px] text-emerald-800 dark:text-emerald-300">
            {interactions.length} Checkpoints
          </span>
        </div>
      </div>

      {/* Quiz Checkpoints List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Interactive Quiz Checkpoints & Answer Key</span>
          </h3>
          <span className="text-xs font-mono text-zinc-400">Chronological Timeline</span>
        </div>

        {interactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono text-xs">
            No quiz checkpoints embedded inside this video.
          </div>
        ) : (
          interactions.map((interaction, idx) => {
            const fromSec = interaction.duration?.from ?? 0;
            const timeStr = formatTimestamp(fromSec);
            const label = interaction.label || `Checkpoint #${idx + 1}`;
            const action = interaction.action;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-colors"
              >
                {/* Checkpoint Header Bar */}
                <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-850/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono font-bold text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{timeStr}</span>
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                      {label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ({action?.library?.split(' ')[0] || 'Interactive Element'})
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Answer Key Revealed</span>
                  </span>
                </div>

                {/* Render the interaction element itself */}
                <div className="p-5 sm:p-6">
                  {action ? (
                    <ElementDispatcher action={action} assetMap={assetMap} inOverlay={false} />
                  ) : (
                    <div className="text-zinc-400 text-xs font-mono">No action details</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
