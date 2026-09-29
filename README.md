# H5P to PDF Viewer

A local-first H5P reader with nested content viewing, answer extraction, study notes, and PDF exports. The current interface and presentation layout are retained; the **Answers** button opens a searchable answer key for one or all imported modules.

## Privacy

Files are processed in a browser worker. File contents, answers, and transcripts are not uploaded. No proxy, analytics, cloud AI, external transcription, or packaged library scripts are used. Local viewing and answer extraction do not require external media requests.

Public HTTPS imports contact the entered host only after a user action, omit credentials and referrers, reject redirects, and time out after 60 seconds. Authentication-protected and CORS-blocked links must be downloaded separately and imported as files. Query-string links require an explicit click. External media requires a separate click and can then send network information, including the user's IP address, to its provider. Third-party players may contact additional services after activation.

Only application assets are cached for offline use; imported files stay in memory. Removing modules or resetting releases their media URLs. Theme preference is the only application local-storage setting. Exported PDFs and clipboard contents are created only by the user's action.

## Answer coverage

A shared extractor scans the entire content tree, including nested Books, Columns, Presentations, Question Sets, Interactive Videos, unknown containers, and stored branches. It records chapter, slide, source path, and video timestamp. All stored branches and questions are included, rather than just the path taken by an interactive player.

Validated answer adapters cover these 1.x library shapes up through the listed minor version:

| Library | Version ceiling | Extracted information |
| --- | --- | --- |
| Blanks | 1.14 | Ordered blanks and accepted alternatives |
| DragText | 1.10 | Ordered word slots |
| DragQuestion | 1.15 | Target positions and correct-element text/images |
| MultiChoice | 1.16 | All marked correct choices |
| TrueFalse | 1.8 | Explicit true or false keys |
| SingleChoiceSet | 1.11 | Stored correct choice for each question |
| Summary | 1.10 | Stored correct statement per group |
| MarkTheWords | 1.11 | Marked words |

Unknown libraries/versions are shown as unsupported, with safe source details and packaged schema hints when available. Missing and partial keys are labeled separately. The application does not guess answers or execute custom H5P scoring code. Unsupported media codecs, encrypted archives, ZIP64/multipart archives, and custom runtime-generated keys are not supported. Missing library versions use the adapter only when its expected fields are present.

**Every file cannot be guaranteed to contain an answer key.** The two local laboratory acceptance cases contain 10 answer activities: 9 recoverable keys and one Summary activity with no statements/key stored. Tests verify Module 1-A's 3 blank slots, 6 drag-text slots, and multiple-choice key; Module 1-B's two single-choice questions, multiple-choice key, two summary records (one missing), and five drag targets.

The Answers view, copy function, and PDFs use the same extracted records. Full-module and batch PDFs include nested content and answer details. Slide images preserve the author coordinates; full answer pages follow separately so long answers are not confined to a slide's small overlay. PDF pages are rasterized for Unicode and image fidelity; text is not selectable. Use Copy for accessible text.

Video notes use only packaged transcript/caption text and associated activity text, with stored timing retained. They are source extracts, not AI-generated summaries of unseen video. A missing transcript is reported explicitly. H5P Summary questions remain distinct from these notes.

## Limits and resilience

- Maximum archive: 256 MB; maximum entries: 10,000.
- Maximum JSON document: 10 MB; maximum declared/actual expanded data: 512 MB per package.
- Content traversal: at most 100,000 visited values and nesting depth 128.
- Paths must be relative, unique, and traversal-free. Conflicting local/central/Unicode names are rejected.
- Only referenced supported content media are decompressed; object URLs are created lazily. Executable libraries are never loaded.
- Imports and exports can be cancelled. Batch import failures retain completed valid files. Reset discards pending work.

Large collections can still exceed the memory available on a particular device. Import fewer modules at a time if necessary. Unsupported or absent assets remain labeled rather than fetched implicitly.

## Development and verification

Use Node.js 24 (minimum 22.12):

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
```

The browser tests use the production build, so run `npm run build` before `npm run test:e2e`. Synthetic fixtures cover nesting, alternatives, missing/custom keys, hostile HTML, archive validation, privacy, URL opt-in, cancellation, and PDF pagination. To run the optional local laboratory acceptance tests, set `H5P_SAMPLE_FILES` to the Module 1-A and Module 1-B paths separated by `|`. Original H5P files and test artifacts are ignored by Git.

CI runs unit tests, the production build, a dependency audit, and browser tests on pull requests and main. Deployment to GitHub Pages requires an explicit workflow dispatch on main after verification succeeds. Nothing deploys merely because a push passes CI.
