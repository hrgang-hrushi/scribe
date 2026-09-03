import { jsPDF } from 'jspdf';
import type { Page, PaperColor } from './types';
import { PAPER_THEMES } from './types';
import { getStroke } from 'perfect-freehand';

function getSvgPathFromStroke(stroke: number[][]): string {
  if (stroke.length === 0) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

// Helper to load HTMLImageElement asynchronously
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

// Helper to composite a single page to a high-resolution Canvas
async function renderPageToCanvas(page: Page, width: number, height: number, paperColor: PaperColor = 'white'): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const scale = 2; // 2x Retina resolution
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // 1. Paper Background
  const theme = PAPER_THEMES[paperColor] || PAPER_THEMES.white;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Images & Imported PDF Pages (rendered under ink annotations)
  if (page.images && page.images.length > 0) {
    for (const imgBlock of page.images) {
      try {
        const img = await loadImage(imgBlock.src);
        if (img.width > 0 && img.height > 0) {
          ctx.drawImage(img, imgBlock.x, imgBlock.y, imgBlock.width, imgBlock.height);
        }
      } catch (err) {
        console.error('Error drawing image in export:', err);
      }
    }
  }

  // 3. Ink Strokes, Highlighters, Tape & Shapes
  page.strokes.forEach(stroke => {
    if ((stroke as any).shape) {
      const shape = (stroke as any).shape;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.globalAlpha = stroke.opacity;
      const p = new Path2D(shape.path);
      ctx.stroke(p);
      ctx.restore();
      return;
    }

    if (stroke.tool === 'tape') {
      // Draw Active Recall Study Tape
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.width || 32;
      ctx.strokeStyle = stroke.color || '#f59e0b';
      ctx.globalAlpha = stroke.isRevealed ? 0.2 : 0.95;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (stroke.points.length > 0) {
      const options = { size: stroke.width, thinning: 0.5, smoothing: 0.5, streamline: 0.5 };
      const outlinePoints = getStroke(stroke.points.map(p => [p.x, p.y, p.pressure]), options);
      const path = new Path2D(getSvgPathFromStroke(outlinePoints));
      ctx.save();
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : stroke.opacity;
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
      ctx.restore();
    }
  });

  // 4. Text Boxes
  page.textBoxes.forEach(tb => {
    ctx.save();
    ctx.fillStyle = theme.defaultInk;
    ctx.font = `${tb.italic ? 'italic' : ''} ${tb.bold ? 'bold' : ''} ${tb.fontSize}px Manrope, sans-serif`;
    ctx.fillText(tb.text, tb.x, tb.y + tb.fontSize);
    ctx.restore();
  });

  return canvas;
}

export async function exportToPdf(noteTitle: string, pages: Page[], paperColor: PaperColor = 'white'): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    const page = pages[i];
    const canvas = await renderPageToCanvas(page, pageWidth, pageHeight, paperColor);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  pdf.save(`${noteTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export async function exportToPng(noteTitle: string, page: Page, paperColor: PaperColor = 'white', width = 850, height = 1100): Promise<void> {
  const canvas = await renderPageToCanvas(page, width, height, paperColor);
  const link = document.createElement('a');
  link.download = `${noteTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
