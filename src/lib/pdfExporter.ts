import { jsPDF } from 'jspdf';
import { H5PPackage, QuizMode } from '../types/h5p';
import { resolveAsset } from './h5pParser';

// Helper to load an image into an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Strip HTML tags and entities
function cleanHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Render a single slide onto a 1920x1080 canvas
async function renderSlideToCanvas(
  slide: any,
  slideIndex: number,
  assetMap: Map<string, string>,
  quizMode: QuizMode
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  // Default white background
  const bgColor =
    slide.slideBackgroundSelector?.fillSlideBackground ||
    slide.slideBackgroundSelector?.fillColorSelector ||
    '#ffffff';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1920, 1080);

  // 1. Draw Background Image if present
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

  // 2. Render Elements
  const elements: any[] = slide.elements || [];

  for (const el of elements) {
    const action = el.action;
    if (!action) continue;

    const library: string = action.library || '';
    const params = action.params || {};

    // Render Blanks Quiz (Fill in the blanks)
    if (library.startsWith('H5P.Blanks')) {
      renderBlanksOnCanvas(ctx, params, quizMode);
    } else if (library.startsWith('H5P.Link')) {
      // Optional subtle badge for links on slides if no background or desired
      if (!bgUrl) {
        const linkUrl = params.linkWidget?.url || params.url || '';
        const title = params.title || 'Link';
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.roundRect(100, 920, 400, 60, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText(`🔗 ${title}: ${linkUrl}`, 120, 958);
      }
    }
  }

  return canvas;
}

// Render clean, high-resolution text and badges for Fill in the Blanks quiz slide
function renderBlanksOnCanvas(ctx: CanvasRenderingContext2D, params: any, quizMode: QuizMode) {
  const prompt = cleanHtml(params.text || 'Fill in the missing words:');
  const rawQuestions: string[] = params.questions || [];

  // Card Background
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.roundRect(80, 80, 1760, 920, 24);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('Interactive Quiz: Fill in the Blanks', 130, 160);

  // Subtitle / Prompt
  ctx.fillStyle = '#475569';
  ctx.font = '500 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(prompt, 130, 205);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(130, 230);
  ctx.lineTo(1790, 230);
  ctx.stroke();

  // Parse questions
  const parsedItems: string[] = [];
  for (const q of rawQuestions) {
    const div = document.createElement('div');
    div.innerHTML = q;
    const pElements = div.querySelectorAll('p');
    if (pElements.length > 0) {
      pElements.forEach((p) => {
        if (p.textContent?.trim()) parsedItems.push(p.innerHTML);
      });
    } else if (div.textContent?.trim()) {
      parsedItems.push(div.innerHTML);
    }
  }

  // Draw 2 columns of questions
  const leftX = 130;
  const rightX = 960;
  const colWidth = 790;
  let currentY = 280;

  parsedItems.forEach((itemHtml, idx) => {
    const isRightCol = idx >= Math.ceil(parsedItems.length / 2);
    const colX = isRightCol ? rightX : leftX;
    if (isRightCol && idx === Math.ceil(parsedItems.length / 2)) {
      currentY = 280; // Reset for second column
    }

    // Question row container
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(colX, currentY - 32, colWidth, 58, 10);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Parse parts with *answers*
    const parts = itemHtml.split(/(\*[^*]+\*)/g);
    let renderX = colX + 18;
    const textY = currentY + 4;

    for (const part of parts) {
      if (part.startsWith('*') && part.endsWith('*')) {
        const rawSolution = part.slice(1, -1);
        const [solutionsPart] = rawSolution.split(':');
        const answer = solutionsPart.split('/')[0].trim();

        if (quizMode === 'study') {
          // Draw solution badge
          ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
          const badgeText = ` ${answer} `;
          const textWidth = ctx.measureText(badgeText).width + 12;

          ctx.fillStyle = '#ecfdf5';
          ctx.beginPath();
          ctx.roundRect(renderX, textY - 22, textWidth, 30, 6);
          ctx.fill();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#065f46';
          ctx.fillText(badgeText, renderX + 4, textY);
          renderX += textWidth + 8;
        } else {
          // Draw empty blank
          const blankStr = '_______________';
          ctx.font = 'bold 18px monospace';
          const textWidth = ctx.measureText(blankStr).width;
          ctx.fillStyle = '#64748b';
          ctx.fillText(blankStr, renderX, textY);
          renderX += textWidth + 8;
        }
      } else {
        const plainText = cleanHtml(part);
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(plainText, renderX, textY);
        renderX += ctx.measureText(plainText).width;
      }
    }

    currentY += 68;
  });
}

// Main Export Function: Compiles 1920x1080 slides into exact high-quality PDF
export async function exportSlidesToPdf(
  pkg: H5PPackage,
  quizMode: QuizMode,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const slides: any[] = pkg.content?.presentation?.slides || [];
  if (slides.length === 0) {
    throw new Error('No slides found to export.');
  }

  // Exact 16:9 PDF dimensions in points/pixels
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

    const canvas = await renderSlideToCanvas(slides[i], i, pkg.assetMap, quizMode);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    doc.addImage(imgData, 'JPEG', 0, 0, 1920, 1080, undefined, 'FAST');
  }

  const rawTitle = pkg.metadata.title || pkg.fileName.replace(/\.h5p$/i, '');
  const cleanFilename = `${rawTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim()}.pdf`;

  doc.save(cleanFilename);
}
