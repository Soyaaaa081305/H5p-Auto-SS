import React from "react";
import type { H5PElementAction } from "../../types/h5p";
import { extractNode } from "../../lib/extraction";
import { safeHtml, externalUrl } from "../../lib/security";
import { SafeMedia, extractYouTubeId } from "../SafeMedia";
import { ExternalLink } from "lucide-react";
import { DragTargetPreview } from "../DragTargetPreview";
import { AnswerCards } from "../AnswerCards";
import { CoursePresentationRenderer } from "./CoursePresentationRenderer";
import { InteractiveBookRenderer } from "./InteractiveBookRenderer";
import { ColumnRenderer } from "./ColumnRenderer";
import { InteractiveVideoRenderer } from "./InteractiveVideoRenderer";
interface Props {
  action?: H5PElementAction;
  assetMap: Map<string, string>;
  inOverlay?: boolean;
}
const Dispatch: React.FC<Props> = ({ action, assetMap }) => {
  if (!action || typeof action.library !== "string") return null;
  const [library, version] = action.library.split(/\s+/);
  const p =
    action.params && typeof action.params === "object" ? action.params : {};
  if (library === "H5P.CoursePresentation")
    return (
      <CoursePresentationRenderer content={p as any} assetMap={assetMap} />
    );
  if (library === "H5P.InteractiveBook")
    return <InteractiveBookRenderer content={p} assetMap={assetMap} />;
  if (library === "H5P.Column")
    return <ColumnRenderer content={p} assetMap={assetMap} />;
  if (library === "H5P.InteractiveVideo")
    return <InteractiveVideoRenderer content={p} assetMap={assetMap} />;
  if (library === "H5P.Image")
    return <SafeMedia path={p.file?.path} alt={p.alt} assetMap={assetMap} />;
  if (library === "H5P.Video" || library === "H5P.Audio") {
    const list =
      p.sources || p.files || p.video?.files || p.video?.sources || [];
    const arr = Array.isArray(list) ? list : [list];
    const ytSource = arr.find((s: any) => {
      const sp = typeof s === "string" ? s : s?.path || s?.url;
      return Boolean(extractYouTubeId(sp));
    });
    const chosen = ytSource || arr[0];
    const mediaPath =
      typeof chosen === "string" ? chosen : chosen?.path || chosen?.url;
    return (
      <SafeMedia
        path={mediaPath}
        kind={library === "H5P.Video" ? "video" : "audio"}
        assetMap={assetMap}
        title={p.title}
      />
    );
  }
  if (["H5P.Text", "H5P.AdvancedText", "H5P.Table"].includes(library))
    return (
      <div
        className="prose prose-zinc dark:prose-invert max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: safeHtml(p.text || p.table) }}
      />
    );
  if (library === "H5P.Link") {
    let raw = p.linkWidget?.url || p.url || "";
    if (typeof raw === "string") {
      raw = raw.replace(/&amp;/g, "&").trim();
      const proto = p.linkWidget?.protocol || "";
      if (proto && !raw.startsWith("http://") && !raw.startsWith("https://")) {
        raw = `${proto}${raw}`;
      }
      if (raw.startsWith("//")) {
        raw = `https:${raw}`;
      } else if (raw.startsWith("http://")) {
        raw = raw.replace(/^http:\/\//i, "https://");
      } else if (!/^https?:\/\//i.test(raw)) {
        raw = `https://${raw}`;
      }
    }
    const safeLink = externalUrl(raw);
    const ytId = safeLink ? extractYouTubeId(safeLink) : null;
    const isCanva = safeLink && safeLink.includes("canva.com");

    return safeLink ? (
      <a
        href={safeLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${
          ytId
            ? "bg-red-600 hover:bg-red-500 text-white"
            : isCanva
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        }`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>
          {p.title ||
            (ytId
              ? "Watch on YouTube"
              : isCanva
                ? "Open in Canva"
                : "Open Link")}
        </span>
      </a>
    ) : (
      <span className="text-xs text-zinc-400 font-mono">Link unavailable</span>
    );
  }
  if (library === "H5P.QuestionSet")
    return (
      <div className="space-y-4">
        {(Array.isArray(p.questions) ? p.questions : []).map(
          (q: any, i: number) => (
            <ElementDispatcher
              key={i}
              action={q.action || q}
              assetMap={assetMap}
            />
          ),
        )}
      </div>
    );
  if (library === "H5P.ImageSlider")
    return (
      <div className="space-y-4">
        {(Array.isArray(p.imageSlides) ? p.imageSlides : []).map(
          (s: any, i: number) => (
            <ElementDispatcher key={i} action={s} assetMap={assetMap} />
          ),
        )}
      </div>
    );
  if (library === "H5P.ImageSlide")
    return <ElementDispatcher action={p.image} assetMap={assetMap} />;
  if (library === "H5P.Accordion")
    return (
      <div className="space-y-3">
        {(Array.isArray(p.panels) ? p.panels : []).map(
          (panel: any, i: number) => (
            <details
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs group transition-colors"
            >
              <summary className="px-4 py-3 font-semibold text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors select-none">
                {panel.title}
              </summary>
              <div
                className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/80 text-sm prose prose-zinc dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: safeHtml(panel.content) }}
              />
            </details>
          ),
        )}
      </div>
    );
  const answers = extractNode({
    library,
    version,
    params: p,
    path: "$",
    location: "Activity",
  });
  return (
    <>
      {library === "H5P.DragQuestion" && (
        <DragTargetPreview params={p} assetMap={assetMap} />
      )}
      <AnswerCards answers={answers} assetMap={assetMap} />
    </>
  );
};

class RenderBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="p-4 text-sm text-amber-700">
        This activity cannot be displayed. Open Answers for recovered keys and
        source details.
      </p>
    ) : (
      this.props.children
    );
  }
}
export const ElementDispatcher: React.FC<Props> = (props) => (
  <RenderBoundary>
    <Dispatch {...props} />
  </RenderBoundary>
);
