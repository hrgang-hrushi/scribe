import jsPDF from 'jspdf';
import type { Page, Stroke } from './types';
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

export async function exportToPdf(noteTitle: string, pages: Page[]): Promise<void> {
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

    // Render strokes to canvas, then to PDF
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = pageWidth * scale;
    canvas.height = pageHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // Draw strokes
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
      const options = { size: stroke.width, thinning: 0.5, smoothing: 0.5, streamline: 0.5 };
      const outlinePoints = getStroke(stroke.points.map(p => [p.x, p.y, p.pressure]), options);
      const path = new Path2D(getSvgPathFromStroke(outlinePoints));
      ctx.save();
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : stroke.opacity;
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
      ctx.restore();
    });

    // Draw text boxes
    page.textBoxes.forEach(tb => {
      ctx.save();
      ctx.fillStyle = '#1a1a2e';
      ctx.font = `${tb.italic ? 'italic' : ''} ${tb.bold ? 'bold' : ''} ${tb.fontSize}px Manrope, sans-serif`;
      ctx.fillText(tb.text, tb.x, tb.y + tb.fontSize);
      ctx.restore();
    });

    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  pdf.save(`${noteTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
