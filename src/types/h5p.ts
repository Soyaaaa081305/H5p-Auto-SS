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
  assetMap: Map<string, string>; // path -> objectUrl
}

export type ViewMode = 'slides' | 'document';
export type QuizMode = 'study' | 'worksheet';
