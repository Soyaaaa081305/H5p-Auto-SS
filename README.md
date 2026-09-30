# H5P to PDF Converter

A browser-based tool for reviewing exported H5P course packages. Import local `.h5p` or `.zip` files to view supported content, inspect answer data stored in the package, and export study notes.

**Live app:** [https://soyaaaa081305.github.io/H5p-Auto-SS/](https://soyaaaa081305.github.io/H5p-Auto-SS/)

## Use the app

1. Open the live app or run it locally.
2. Select or drop one or more `.h5p` or `.zip` course packages.
3. Review supported content and stored answers. Use the Answers panel to search, copy, or export answer data.
4. Export slides and study materials as PDF or PNG where available.

The importer validates archive paths and enforces limits of 256 MB per archive, 10,000 entries, 10 MB per JSON file, and 512 MB expanded content.

## Supported content

The viewer renders supported H5P content such as Course Presentation, Interactive Book, Column, Interactive Video, Question Set, Accordion, Image Slider, and common image, text, audio, and video items. Unsupported libraries are identified in the interface.

Answer extraction is limited to supported versions of these activity libraries: Fill in the Blanks, Drag the Words, Drag and Drop, Multiple Choice, True/False, Single Choice Set, Summary, and Mark the Words. The app reports when an answer is missing or unsupported; it does not infer answers.

## Privacy and offline use

H5P archives are parsed in the browser. The app has no project backend, account service, or analytics service, and does not upload the imported archive or extracted answers. H5P packages can reference external media; when the viewer loads that media, the browser connects directly to the media provider.

The service worker caches the application shell and same-origin frontend assets as they are requested. The app can reopen offline after those resources have been cached. Imported course content is held in page memory and is not written to the service-worker cache. External media still needs its provider connection. Lazily loaded export code must have been loaded while online before it is available offline.

## Technology

| Area                 | Technology                   |
| -------------------- | ---------------------------- |
| UI                   | React 18, TypeScript         |
| Build and styling    | Vite 8, Tailwind CSS 3       |
| Archive processing   | JSZip, Web Worker            |
| HTML sanitization    | DOMPurify                    |
| PDF and image export | jsPDF and the Canvas API     |
| Icons                | Lucide React                 |
| Verification         | Prettier, Vitest, Playwright |
| Hosting              | GitHub Pages                 |

## Local development

Requirements: Node.js 22.12 or newer and npm.

```sh
git clone https://github.com/Soyaaaa081305/H5p-Auto-SS.git
cd H5p-Auto-SS
npm ci
npm run dev
```

The development server prints its local URL when it starts.

## Verification

```sh
npm run check
npm audit --audit-level=moderate
npx playwright install chromium
npm run test:e2e
```

`npm run check` verifies formatting, runs the unit tests, type-checks the project, and creates a production build. The two-original-books acceptance test is skipped unless `H5P_SAMPLE_FILES` points to two local `.h5p` files separated by `|`; sample course files are not stored in the repository.

Pull requests run the verification workflow. A push to `main` or a manual workflow dispatch can deploy the verified build to GitHub Pages.
