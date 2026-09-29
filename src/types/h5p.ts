export interface H5PMetadata {
  title: string;
  language?: string;
  mainLibrary: string;
  embedTypes?: string[];
  license?: string;
  defaultLanguage?: string;
  authors?: Array<{ name: string; role: string }>;
  preloadedDependencies?: Array<{
    machineName: string;
    majorVersion: number;
    minorVersion: number;
  }>;
}

export interface H5PImageReference {
  path: string;
  mime?: string;
  copyright?: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface H5PSlideBackground {
  imageSlideBackground?: H5PImageReference;
  fillSlideBackground?: string;
  fillColorSelector?: string;
}

export interface H5PElementAction {
  library: string;
  params: Record<string, any>;
  subContentId?: string;
  metadata?: {
    contentType?: string;
    title?: string;
    license?: string;
  };
}

export interface H5PElement {
  x: number;
  y: number;
  width: number;
  height: number;
  action?: H5PElementAction;
  alwaysDisplayComments?: boolean;
  backgroundOpacity?: number;
  displayAsButton?: boolean;
  buttonSize?: string;
  goToSlideType?: string;
  invisible?: boolean;
  solution?: string;
}

export interface H5PSlide {
  slideBackgroundSelector?: H5PSlideBackground;
  elements?: H5PElement[];
}

export interface CoursePresentationContent {
  presentation: {
    slides: H5PSlide[];
    keywordListEnabled?: boolean;
    globalBackgroundSelector?: H5PSlideBackground;
  };
}

export interface InteractiveBookChapter {
  title?: string;
  params?: {
    content?: Array<{
      content?: Record<string, any>;
      library?: string;
      params?: Record<string, any>;
    }>;
  };
  library?: string;
  subContentId?: string;
}

export interface InteractiveBookContent {
  chapters?: InteractiveBookChapter[];
  showCoverPage?: boolean;
  bookCover?: {
    coverDescription?: string;
    coverMedium?: {
      params?: {
        file?: H5PImageReference;
      };
    };
  };
}

export interface H5PPackage {
  fileName: string;
  fileSize: number;
  metadata: H5PMetadata;
  mainLibrary: string;
  content: Record<string, any>;
  assetMap: Map<string, string>; // paths resolved lazily to application-owned URLs
  report: ExtractionReport;
  dispose: () => void;
}

export type ViewMode = "slides" | "document";
export type QuizMode = "study" | "worksheet";

export type ExtractionStatus =
  "extracted" | "partial" | "unsupported" | "missing";
export interface ContentNode {
  path: string;
  library: string;
  version?: string;
  params: Record<string, any>;
  location: string;
  timestamp?: number;
}
export interface AnswerPart {
  label: string;
  values: string[];
  images?: string[];
  target?: { x: number; y: number };
}
export interface AnswerItem {
  id: string;
  packageName: string;
  sourcePath: string;
  library: string;
  version?: string;
  location: string;
  timestamp?: number;
  prompt: string;
  parts: AnswerPart[];
  status: ExtractionStatus;
  explanation?: string;
}
export interface VideoNote {
  sourcePath: string;
  location: string;
  kind: "transcript" | "activity";
  text: string;
}
export interface ExtractionReport {
  nodes: ContentNode[];
  answers: AnswerItem[];
  warnings: string[];
  videoNotes: VideoNote[];
}
