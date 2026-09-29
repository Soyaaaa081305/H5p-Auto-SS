# H5P to PDF & Study Guide Viewer 📚

> **The easiest way to view H5P files, extract quiz answer keys, and export clean study PDFs directly in your browser.**

🌐 **Live Web App**: [https://soyaaaa081305.github.io/H5p-Auto-SS/](https://soyaaaa081305.github.io/H5p-Auto-SS/)  
🔒 **100% Private & Client-Side**: No files or answers are ever uploaded to any server.

---

## 💡 What is this? (For Non-Techies)

If you are a student, your school or professor probably uses **H5P interactive modules** on Canvas, Blackboard, or Moodle. These are interactive presentations, videos, and quizzes where you have to click through slides, answer questions, or watch long lectures.

**The Problem**:
- You can't easily study or review them offline without an internet connection.
- You can't print them out as notes or PDFs.
- When studying for midterms or finals, you want to review the practice questions and see the correct answers without guessing or re-clicking 50 slides one by one.

**The Solution**:
This tool lets you drop in any `.h5p` file to view it like a slide deck, reveal the verified answer keys for all quizzes and checkpoints, and download everything as a clean, printable PDF study guide!

---

## 🚀 How to Use It (3 Simple Steps)

1. **Open the Web App**: Visit [https://soyaaaa081305.github.io/H5p-Auto-SS/](https://soyaaaa081305.github.io/H5p-Auto-SS/).
2. **Upload your H5P File**:
   - Drag and drop your `.h5p` file onto the upload zone, or click **"Browse files"**.
   - *(Optional)* You can also paste a public URL link to an `.h5p` file.
3. **Review & Study**:
   - 📖 **Slide Viewer**: Click through slides, interactive books, or checkpoints with full layout rendering.
   - 🎯 **Answers Button**: Click the green **"Answers"** button on the toolbar to pop open the complete answer key with copyable text.
   - 📄 **Export PDF**: Click **"Download PDF"** to save a complete, multi-column study guide with slides and solutions.

---

## ✨ Features

- **Universal H5P Support**: Works seamlessly with Course Presentations, Interactive Videos, Question Sets, Interactive Books, Drag-and-Drop, Fill-in-the-Blanks, and more.
- **Instant Answer Extraction**: Automatically retrieves the solutions embedded inside:
  - Multiple Choice quizzes
  - True / False statements
  - Single Choice sets
  - Fill in the blanks & accepted alternatives
  - Drag the words / Drag-and-drop targets
  - Summary activities
- **Interactive Video & YouTube Playback**: Play video checkpoints directly with direct **"Watch on YouTube ↗"** buttons if playback is restricted on school networks.
- **Export Options**:
  - Full Slide PDF export (retains author dimensions and formatting)
  - Separate Answer Key PDF export
  - One-click **"Copy All Answers"** to clipboard for pasting into Notion or Google Docs
- **Dark Mode Parity**: Easy on the eyes for late-night exam prep.
- **100% Offline & Mobile Friendly**: Add it to your phone or tablet home screen as a Web App (PWA).

---

## 🔍 How It Works Under the Hood

### Is this AI or hacking?
**No!** There is no hacking or AI guessing involved.

An `.h5p` file is secretly just a standard `.zip` archive containing a `content.json` file along with images, audio, and videos. When a teacher creates a quiz, the correct answers are already saved inside the `content.json` data file so the computer knows how to grade you when you click submit.

This website:
1. **Unzips the file locally** inside your web browser using a background Web Worker (so your browser won't lag or freeze).
2. **Scans the JSON tree** to find all question objects and their pre-defined correct answer flags.
3. **Displays them cleanly** in a user-friendly interface and formats them for high-resolution PDF printing.

### 🛡️ Privacy Guarantee
- **Zero Server Uploads**: Everything happens 100% inside your web browser's memory. Your files, school identity, and test answers are never sent to any backend, database, or analytics tracker.
- **Sandboxed Media**: External videos and links require explicit user consent before connecting to third-party servers.

---

## 🛠️ Tech Stack (For Developers)

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 19** + **TypeScript** | Type-safe, reactive UI component tree |
| **Build Tool** | **Vite 8** | Ultra-fast local development & optimized client bundle |
| **Styling** | **Tailwind CSS v4** | Responsive mobile-first design with native Dark Mode |
| **Worker Engine** | **Web Worker** + **JSZip** | Off-thread decompression and JSON traversal up to 256MB archives |
| **Security** | **DOMPurify** | Sanitizes user-generated HTML and prevents XSS vulnerabilities |
| **PDF Generation** | **jsPDF** + **html2canvas** | Multi-column, high-DPI rasterization and pagination |
| **Icons** | **Lucide React** | Clean, lightweight UI icons |
| **Testing** | **Vitest** + **Playwright** | 100% coverage on answer extraction, archive parsing, and E2E browser flows |
| **Deployment** | **GitHub Pages** + **GitHub Actions** | Automated CI verification and zero-downtime deployment |

---

## 💻 Local Development Setup

If you want to run this project on your own machine:

### Prerequisites
- Node.js 22.12 or newer (Node 24 recommended)
- npm

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/Soyaaaa081305/H5p-Auto-SS.git
cd H5p-Auto-SS

# 2. Install dependencies
npm ci

# 3. Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Quality Verification & Tests

```bash
# Run unit tests and production build check
npm run check

# Run end-to-end browser tests using Playwright
npx playwright install chromium
npm run test:e2e
```

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><strong>Why does a question say "No answer key stored"?</strong></summary>
Some H5P packages (like open-ended essay questions or server-graded assessments) do not include the answer in the file itself. In those cases, the app clearly flags that no answer key was included rather than guessing or providing misleading information.
</details>

<details>
<summary><strong>Does this app need internet access?</strong></summary>
No! Once the webpage loads, you can turn off Wi-Fi or go offline. All file unzipping, slide rendering, and PDF generation work completely offline. Only external YouTube videos require internet access to stream.
</details>

<details>
<summary><strong>What file size limits exist?</strong></summary>
The viewer comfortably supports H5P archives up to 256 MB with up to 10,000 files inside.
</details>

---

## 📄 License

Open-source project built for students. Released under the MIT License.
