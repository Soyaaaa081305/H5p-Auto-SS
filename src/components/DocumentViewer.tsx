import React from 'react';
import { H5PPackage, QuizMode, ViewMode } from '../types/h5p';
import { CoursePresentationRenderer } from './renderers/CoursePresentationRenderer';
import { InteractiveBookRenderer } from './renderers/InteractiveBookRenderer';
import { ColumnRenderer } from './renderers/ColumnRenderer';
import { FallbackRenderer } from './renderers/FallbackRenderer';

interface DocumentViewerProps {
  pkg: H5PPackage;
  viewMode: ViewMode;
  quizMode: QuizMode;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ pkg, viewMode, quizMode }) => {
  const { mainLibrary, content, assetMap } = pkg;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none print:m-0">
      {/* Content Renderer */}
      {mainLibrary.startsWith('H5P.CoursePresentation') ? (
        <CoursePresentationRenderer
          content={content as any}
          assetMap={assetMap}
          viewMode={viewMode}
          quizMode={quizMode}
        />
      ) : mainLibrary.startsWith('H5P.InteractiveBook') ? (
        <InteractiveBookRenderer
          content={content as any}
          assetMap={assetMap}
          quizMode={quizMode}
        />
      ) : mainLibrary.startsWith('H5P.Column') ? (
        <ColumnRenderer
          content={content}
          assetMap={assetMap}
          quizMode={quizMode}
        />
      ) : (
        <FallbackRenderer
          content={content}
          mainLibrary={mainLibrary}
          assetMap={assetMap}
          quizMode={quizMode}
        />
      )}
    </div>
  );
};
