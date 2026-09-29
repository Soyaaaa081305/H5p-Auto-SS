import React from 'react';
import { H5PPackage } from '../types/h5p';
import { CoursePresentationRenderer } from './renderers/CoursePresentationRenderer';
import { InteractiveBookRenderer } from './renderers/InteractiveBookRenderer';
import { ColumnRenderer } from './renderers/ColumnRenderer';
import { InteractiveVideoRenderer } from './renderers/InteractiveVideoRenderer';
import { QuestionSetRenderer } from './renderers/QuestionSetRenderer';
import { FallbackRenderer } from './renderers/FallbackRenderer';

interface DocumentViewerProps {
  pkg: H5PPackage;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ pkg }) => {
  const { mainLibrary, content, assetMap } = pkg;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none print:m-0">
      {mainLibrary.startsWith('H5P.CoursePresentation') ? (
        <CoursePresentationRenderer
          content={content as any}
          assetMap={assetMap}
        />
      ) : mainLibrary.startsWith('H5P.InteractiveBook') ? (
        <InteractiveBookRenderer
          content={content as any}
          assetMap={assetMap}
        />
      ) : mainLibrary.startsWith('H5P.InteractiveVideo') ? (
        <InteractiveVideoRenderer
          content={content}
          assetMap={assetMap}
        />
      ) : mainLibrary.startsWith('H5P.QuestionSet') ? (
        <QuestionSetRenderer
          content={content}
          assetMap={assetMap}
        />
      ) : mainLibrary.startsWith('H5P.Column') ? (
        <ColumnRenderer
          content={content}
          assetMap={assetMap}
        />
      ) : (
        <FallbackRenderer
          content={content}
          mainLibrary={mainLibrary}
          assetMap={assetMap}
        />
      )}
    </div>
  );
};
