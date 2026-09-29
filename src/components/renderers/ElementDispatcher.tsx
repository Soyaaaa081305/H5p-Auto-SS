import React from "react";
import type { H5PElementAction } from "../../types/h5p";
import { extractNode } from "../../lib/extraction";
import { safeHtml, externalUrl } from "../../lib/security";
import { SafeMedia } from "../SafeMedia";
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
  if (library === "H5P.Video" || library === "H5P.Audio")
    return (
      <SafeMedia
        path={(p.sources || p.files)?.[0]?.path}
        kind={library === "H5P.Video" ? "video" : "audio"}
        assetMap={assetMap}
      />
    );
  if (["H5P.Text", "H5P.AdvancedText", "H5P.Table"].includes(library))
    return (
      <div
        className="prose prose-zinc dark:prose-invert max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: safeHtml(p.text || p.table) }}
      />
    );
  if (library === "H5P.Link") {
    const raw = p.linkWidget?.url || p.url || "";
    const url = externalUrl(
      /^https?:/.test(raw) ? raw : `${p.linkWidget?.protocol || ""}${raw}`,
    );
    return url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-sm"
      >
        {p.title || "Open external resource"}
      </a>
    ) : (
      <p>External link unavailable or blocked.</p>
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
      <div>
        {(Array.isArray(p.panels) ? p.panels : []).map(
          (panel: any, i: number) => (
            <details key={i}>
              <summary>{panel.title}</summary>
              <div
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
