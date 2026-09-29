import { jsPDF } from 'jspdf';
import { H5PPackage } from '../types/h5p';
import { resolveAsset } from './h5pParser';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function cleanHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

// Render clean, high-resolution text and cards for Fill in the Blanks quiz slide
function renderBlanksOnCanvas(ctx: CanvasRenderingContext2D, params: any) {
  const prompt = cleanHtml(params.text || 'Fill in the missing words:');
  const rawQuestions: string[] = params.questions || [];

  // Slide Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1920, 1080);

  // Inner Container
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillRect(60, 50, 1800, 980);
  ctx.strokeRect(60, 50, 1800, 980);

  // Header Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Review & Practice: Fill in the Blanks', 100, 120);

  // Subtitle / Prompt
  ctx.fillStyle = '#64748b';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(prompt, 100, 160);

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(100, 185);
  ctx.lineTo(1820, 185);
  ctx.stroke();

  // Extract individual question strings using regex
  const items: string[] = [];
  rawQuestions.forEach((qStr: string) => {
    const pRegex = /<p>(.*?)<\/p>/gi;
    let match;
    let found = false;
    while ((match = pRegex.exec(qStr)) !== null) {
      found = true;
      if (match[1].trim()) items.push(match[1].trim());
    }
    if (!found && qStr.trim()) items.push(qStr.trim());
  });

  // Render 2 columns of 5 questions each
  const leftX = 100;
  const rightX = 970;
  const colWidth = 850;
  const cardHeight = 138;

  items.forEach((item, idx) => {
    const isRight = idx >= 5;
    const colX = isRight ? rightX : leftX;
    const rowIdx = isRight ? idx - 5 : idx;
    const cardY = 210 + rowIdx * (cardHeight + 16);

    // Question box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(colX, cardY, colWidth, cardHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(colX, cardY, colWidth, cardHeight);

    // Number tag
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Question ${idx + 1}`, colX + 20, cardY + 28);

    // Parse text and solution
    const parts = item.split(/(\*[^*]+\*)/g);
    let fullText = '';
    let solution = '';

    parts.forEach((p) => {
      if (p.startsWith('*') && p.endsWith('*')) {
        const raw = p.slice(1, -1);
        const [sol] = raw.split(':');
        solution = sol.split('/')[0].trim();
        fullText += ` [ ${solution} ] `;
      } else {
        fullText += p.replace(/<[^>]+>/g, '');
      }
    });

    fullText = fullText.replace(/^\s*\(\d+\)\s*/, '');

    // Draw question text wrapped
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#334155';
    wrapText(ctx, fullText, colX + 20, cardY + 56, colWidth - 40, 22);

    // Draw green answer pill at bottom of card
    if (solution) {
      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      const ansWidth = ctx.measureText(`✓ Answer: ${solution}`).width + 24;
      ctx.fillRect(colX + 20, cardY + cardHeight - 34, ansWidth, 24);
      ctx.strokeRect(colX + 20, cardY + cardHeight - 34, ansWidth, 24);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`✓ Answer: ${solution}`, colX + 28, cardY + cardHeight - 18);
    }
  });
}

function renderDragTextOnCanvas(ctx: CanvasRenderingContext2D, params: any) {
  const taskDescription = cleanHtml(params.taskDescription || 'Drag the words into the correct boxes');
  const textField = params.textField || '';

  // Slide Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1920, 1080);

  // Inner Container
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillRect(60, 50, 1800, 980);
  ctx.strokeRect(60, 50, 1800, 980);

  // Header Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(taskDescription, 100, 120);

  // Subtitle / Prompt
  ctx.fillStyle = '#64748b';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Auto-Solved Study Mode • All answers verified and placed in-line', 100, 160);

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(100, 185);
  ctx.lineTo(1820, 185);
  ctx.stroke();

  // Parse lines
  const rawLines = textField.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);

  // Render 2 columns
  const leftX = 100;
  const rightX = 970;
  const colWidth = 850;
  const cardHeight = rawLines.length > 6 ? 138 : 160;

  rawLines.forEach((line: string, idx: number) => {
    if (idx >= 10) return; // Fits up to 10 questions cleanly
    const isRight = idx >= 5;
    const colX = isRight ? rightX : leftX;
    const rowIdx = isRight ? idx - 5 : idx;
    const cardY = 210 + rowIdx * (cardHeight + 16);

    // Card box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(colX, cardY, colWidth, cardHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(colX, cardY, colWidth, cardHeight);

    // Question number tag
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Item [${idx + 1}]`, colX + 20, cardY + 28);

    // Parse solution and text
    const parts = line.split(/(\*[^*]+\*)/g);
    let fullText = '';
    let solution = '';

    parts.forEach((p) => {
      if (p.startsWith('*') && p.endsWith('*')) {
        const raw = p.slice(1, -1);
        const [sol] = raw.split(':');
        solution = sol.trim();
        fullText += ` [ ✓ ${solution} ] `;
      } else {
        fullText += p.replace(/<[^>]+>/g, '').replace(/^\s*\[\d+\]\s*/, '').replace(/^\s*\(\d+\)\s*/, '');
      }
    });

    // Draw question text wrapped
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#334155';
    wrapText(ctx, fullText, colX + 20, cardY + 56, colWidth - 40, 22);

    // Draw green answer pill at bottom of card
    if (solution) {
      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      const ansWidth = ctx.measureText(`✓ Match: ${solution}`).width + 24;
      ctx.fillRect(colX + 20, cardY + cardHeight - 34, ansWidth, 24);
      ctx.strokeRect(colX + 20, cardY + cardHeight - 34, ansWidth, 24);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`✓ Match: ${solution}`, colX + 28, cardY + cardHeight - 18);
    }
  });
}

function renderSummaryOnCanvas(ctx: CanvasRenderingContext2D, params: any) {
  const intro = cleanHtml(params.intro || 'Choose the correct statement:');
  const summaries: Array<{ summary: string[] }> = params.summaries || [];

  // Slide Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1920, 1080);

  // Inner Container
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillRect(60, 50, 1800, 980);
  ctx.strokeRect(60, 50, 1800, 980);

  // Header Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Review & Practice: Choose the Correct Statement', 100, 120);

  // Subtitle / Prompt
  ctx.fillStyle = '#64748b';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${intro} (Right answers are marked with ✓)`, 100, 160);

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(100, 185);
  ctx.lineTo(1820, 185);
  ctx.stroke();

  // Render 2 columns of 5 questions each
  const leftX = 100;
  const rightX = 970;
  const colWidth = 850;
  const cardHeight = 138;

  summaries.forEach((item, idx) => {
    const isRight = idx >= 5;
    const colX = isRight ? rightX : leftX;
    const rowIdx = isRight ? idx - 5 : idx;
    const cardY = 210 + rowIdx * (cardHeight + 16);

    const statements = item.summary || [];
    const correctStatement = cleanHtml(statements[0] || '');
    const wrongStatement = cleanHtml(statements[1] || '');

    // Card background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(colX, cardY, colWidth, cardHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(colX, cardY, colWidth, cardHeight);

    // Number tag
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Question ${idx + 1}`, colX + 20, cardY + 28);

    // Correct statement box (green)
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(colX + 20, cardY + 38, colWidth - 40, 48);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.strokeRect(colX + 20, cardY + 38, colWidth - 40, 48);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wrapText(ctx, `✓ ${correctStatement}`, colX + 30, cardY + 62, colWidth - 60, 18);

    // Distractor box (muted/gray)
    if (wrongStatement) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(colX + 20, cardY + 92, colWidth - 40, 36);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(colX + 20, cardY + 92, colWidth - 40, 36);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      wrapText(ctx, `✗ ${wrongStatement}`, colX + 30, cardY + 114, colWidth - 60, 16);
    }
  });
}

function renderMultiChoiceOnCanvas(ctx: CanvasRenderingContext2D, params: any) {
  const question = cleanHtml(params.question || params.text || 'Multiple Choice Question');
  const answers: Array<{ text: string; correct?: boolean }> = params.answers || [];

  // Slide Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1920, 1080);

  // Inner Container
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillRect(80, 60, 1760, 960);
  ctx.strokeRect(80, 60, 1760, 960);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Quiz: Multiple Choice', 130, 130);

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(130, 155);
  ctx.lineTo(1790, 155);
  ctx.stroke();

  // Question Prompt
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  wrapText(ctx, question, 130, 205, 1660, 32);

  // Answers list
  let curY = 320;
  const optHeight = 75;
  const optWidth = 1660;

  answers.forEach((ans) => {
    const isCorrect = Boolean(ans.correct);
    const ansText = cleanHtml(ans.text || '');

    ctx.fillStyle = isCorrect ? '#ecfdf5' : '#f8fafc';
    ctx.fillRect(130, curY, optWidth, optHeight);
    ctx.strokeStyle = isCorrect ? '#10b981' : '#e2e8f0';
    ctx.lineWidth = isCorrect ? 2 : 1.5;
    ctx.strokeRect(130, curY, optWidth, optHeight);

    if (isCorrect) {
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('✓ [CORRECT ANSWER]', 155, curY + 45);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('○', 155, curY + 45);
    }

    ctx.fillStyle = isCorrect ? '#065f46' : '#334155';
    ctx.font = isCorrect
      ? 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wrapText(ctx, ansText, 440, curY + 45, optWidth - 470, 24);

    curY += optHeight + 20;
  });
}

function renderTrueFalseOnCanvas(ctx: CanvasRenderingContext2D, params: any) {
  const question = cleanHtml(params.question || '');
  const isTrueCorrect = String(params.correct).toLowerCase() === 'true';

  // Slide Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1920, 1080);

  // Inner Container
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillRect(80, 60, 1760, 960);
  ctx.strokeRect(80, 60, 1760, 960);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Quiz: True or False', 130, 130);

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(130, 155);
  ctx.lineTo(1790, 155);
  ctx.stroke();

  // Question Prompt
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  wrapText(ctx, question, 130, 230, 1660, 36);

  // True & False options
  const options = [
    { label: 'True', isCorrect: isTrueCorrect },
    { label: 'False', isCorrect: !isTrueCorrect },
  ];

  options.forEach((opt, idx) => {
    const cardY = 380 + idx * 110;
    const isCor = opt.isCorrect;

    ctx.fillStyle = isCor ? '#ecfdf5' : '#f8fafc';
    ctx.fillRect(130, cardY, 800, 85);
    ctx.strokeStyle = isCor ? '#10b981' : '#e2e8f0';
    ctx.lineWidth = isCor ? 2 : 1.5;
    ctx.strokeRect(130, cardY, 800, 85);

    ctx.fillStyle = isCor ? '#059669' : '#94a3b8';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isCor ? `✓ ${opt.label} [Correct Answer]` : `○ ${opt.label}`, 160, cardY + 50);
  });
}

async function renderSlideToCanvas(
  slide: any,
  slideIndex: number,
  assetMap: Map<string, string>
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  const bgColor =
    slide.slideBackgroundSelector?.fillSlideBackground ||
    slide.slideBackgroundSelector?.fillColorSelector ||
    '#ffffff';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1920, 1080);

  // Background Image
  const bgImgPath = slide.slideBackgroundSelector?.imageSlideBackground?.path;
  const bgUrl = resolveAsset(bgImgPath, assetMap);

  if (bgUrl) {
    try {
      const img = await loadImage(bgUrl);
      ctx.drawImage(img, 0, 0, 1920, 1080);
    } catch (e) {
      console.warn(`Failed to render slide image for slide ${slideIndex + 1}`, e);
    }
  }

  // Check for Quiz elements (e.g. Slide 15)
  const elements: any[] = slide.elements || [];
  for (const el of elements) {
    const action = el.action;
    if (!action) continue;
    const library: string = action.library || '';
    const params = action.params || {};

    if (library.startsWith('H5P.Blanks')) {
      renderBlanksOnCanvas(ctx, params);
    } else if (library.startsWith('H5P.DragText') || library.startsWith('H5P.DragQuestion')) {
      renderDragTextOnCanvas(ctx, params);
    } else if (library.startsWith('H5P.Summary')) {
      renderSummaryOnCanvas(ctx, params);
    } else if (library.startsWith('H5P.MultiChoice') || library.startsWith('H5P.SingleChoiceSet')) {
      renderMultiChoiceOnCanvas(ctx, params);
    } else if (library.startsWith('H5P.TrueFalse')) {
      renderTrueFalseOnCanvas(ctx, params);
    }
  }

  return canvas;
}

export async function exportSlidesToPdf(
  pkg: H5PPackage,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const slides: any[] = pkg.content?.presentation?.slides || [];
  if (slides.length === 0) {
    throw new Error('No slides found to export.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
    hotfixes: ['px_scaling'],
  });

  const total = slides.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(i + 1, total);
    }

    if (i > 0) {
      doc.addPage([1920, 1080], 'landscape');
    }

    const canvas = await renderSlideToCanvas(slides[i], i, pkg.assetMap);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    doc.addImage(imgData, 'JPEG', 0, 0, 1920, 1080, undefined, 'FAST');
  }

  const rawTitle = pkg.metadata.title || pkg.fileName.replace(/\.h5p$/i, '');
  const cleanFilename = `${rawTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim()}.pdf`;

  doc.save(cleanFilename);
}

export async function copySlideImageToClipboard(
  slide: any,
  slideIndex: number,
  assetMap: Map<string, string>
): Promise<void> {
  const canvas = await renderSlideToCanvas(slide, slideIndex, assetMap);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to generate slide image.');

  if (!navigator.clipboard?.write) {
    throw new Error('Clipboard API not supported in this browser.');
  }

  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob })
  ]);
}

export async function downloadSlideAsPng(
  slide: any,
  slideIndex: number,
  assetMap: Map<string, string>,
  prefixName?: string
): Promise<void> {
  const canvas = await renderSlideToCanvas(slide, slideIndex, assetMap);
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  const cleanPrefix = (prefixName || 'slide').replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  a.download = `${cleanPrefix}-slide-${slideIndex + 1}.png`;
  a.click();
}

export async function exportBatchToPdf(
  packages: H5PPackage[],
  onProgress?: (current: number, total: number, moduleName: string) => void
): Promise<void> {
  if (packages.length === 0) throw new Error('No packages to export');

  let totalSlides = 0;
  packages.forEach((p) => {
    totalSlides += p.content?.presentation?.slides?.length || 0;
  });

  if (totalSlides === 0) throw new Error('No slides found across modules.');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
    hotfixes: ['px_scaling'],
  });

  let globalSlideCount = 0;

  for (let pIdx = 0; pIdx < packages.length; pIdx++) {
    const pkg = packages[pIdx];
    const slides: any[] = pkg.content?.presentation?.slides || [];
    const pkgTitle = pkg.metadata.title || pkg.fileName;

    for (let sIdx = 0; sIdx < slides.length; sIdx++) {
      globalSlideCount++;
      if (onProgress) {
        onProgress(globalSlideCount, totalSlides, pkgTitle);
      }

      if (globalSlideCount > 1) {
        doc.addPage([1920, 1080], 'landscape');
      }

      const canvas = await renderSlideToCanvas(slides[sIdx], sIdx, pkg.assetMap);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, 1920, 1080, undefined, 'FAST');
    }
  }

  doc.save('Course_All_Modules_Bundle.pdf');
}
