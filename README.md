# H5P to PDF Studio

> *yes, lahat ng mmcl student problem to*

A fast, 100% client-side web tool designed to extract **Blackboard / LMS H5P modules** and compile them into clean, high-resolution 1080p PDFs, presentation decks, and printable study guides.

---

## 💡 What It Does

In university LMS platforms like Blackboard Ultra, professors often upload lecture slides and modules using **H5P Course Presentations**. These presentations embed high-resolution 1080p slide graphics and interactive quizzes (like fill-in-the-blanks or multiple choice), but Blackboard does not offer a native "Save as PDF" option, and generic extractors produce blank pages because they can't handle slide canvas images or H5P asterisk syntax.

**H5P to PDF Studio** solves this completely:
1. **1080p Full-Bleed Slide Extraction**: Automatically unpacks `.h5p` packages directly in your browser, extracting every 1920×1080 slide background and overlay cleanly.
2. **Direct 1-Click PDF Download**: Compiles slides into a cropped 16:9 PDF using jsPDF—no browser headers, no `localhost` URLs, and zero margin distortion.
3. **Study Guide vs. Worksheet Modes**:
   - **Study Guide**: Automatically parses question answers (e.g., `*hard disk drive*`, `*degaussing*`) and displays them highlighted in green solution badges.
   - **Worksheet**: Blanks out the answers (`____________`) so you can print fresh test sheets to practice.
4. **Universal Compatibility**: Works on any device, browser, or static web host. Zero server uploads—all processing runs in-memory on your machine.

---

## 🚀 Live Demo & Deployment

This project is configured to automatically build and deploy via GitHub Pages:
- **Live URL**: `https://soyaaaa081305.github.io/H5p-Auto-SS/`

---

## 🛠️ Local Development

1. **Clone repository**:
   ```bash
   git clone https://github.com/Soyaaaa081305/H5p-Auto-SS.git
   cd H5p-Auto-SS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run local server**:
   ```bash
   npm start
   ```
   Opens `http://localhost:5173` in your default browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📥 How to Download `.h5p` from Blackboard

1. In Blackboard Ultra, open your course module containing the H5P presentation.
2. Scroll to the bottom frame of the H5P player.
3. Click the **Reuse** or **Download** button.
4. Click **Download as an .h5p file**.
5. Drag and drop the downloaded file into this website, select your mode, and click **Download PDF**!
