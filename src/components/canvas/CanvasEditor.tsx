'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Page, Stroke, Point, TextBox, ImageBlock, Tool, ToolSettings } from '@/lib/types';

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

function getStrokeOptions(width: number, smoothing: number) {
  return {
    size: width,
    thinning: 0.5 + smoothing * 0.3,
    smoothing: 0.5 + smoothing * 0.4,
    streamline: 0.5 + smoothing * 0.3,
    easing: (t: number) => t,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
  };
}

function detectShape(points: Point[]): { type: string; path: string } | null {
  if (points.length < 10) return null;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  const first = points[0], last = points[points.length - 1];
  const dist = Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);
  const closedness = dist / (Math.sqrt(w * w + h * h) || 1);

  // Line: very narrow aspect ratio or nearly straight
  const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const variance = ys.reduce((a, y) => a + (y - avgY) ** 2, 0) / ys.length;
  if (variance < (h * h) * 0.05 && w > 30) {
    return { type: 'line', path: `M ${minX} ${minY + h / 2} L ${maxX} ${minY + h / 2}` };
  }

  // Rectangle: closed + 4 corners + right angles
  if (closedness < 0.3 && w > 20 && h > 20) {
    const ratio = w / h;
    if (ratio > 0.7 && ratio < 1.4) {
      return { type: 'rect', path: `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z` };
    }
    return { type: 'rect', path: `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z` };
  }

  // Circle: closed + roughly square + consistent radius
  if (closedness < 0.3 && w > 20 && h > 20) {
    const ratio = w / h;
    if (ratio > 0.8 && ratio < 1.2) {
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const rx = w / 2, ry = h / 2;
      return { type: 'circle', path: `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} Z` };
    }
  }

  return null;
}

interface CanvasEditorProps {
  page: Page;
  template?: string;
  tool: Tool;
  settings: ToolSettings;
  theme: 'light' | 'dark';
  onSave: (page: Page) => void;
  onUndo: () => void;
}

export default function CanvasEditor({ page, template = 'blank', tool, settings, theme, onSave, onUndo }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const committedStrokes = useRef<Stroke[]>([...page.strokes]);
  const committedTextBoxes = useRef<TextBox[]>([...page.textBoxes]);
  const committedImages = useRef<ImageBlock[]>([...page.images]);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const lastPinchDist = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shapeStartRef = useRef<Point | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(page.textBoxes);
  const [images, setImages] = useState<ImageBlock[]>(page.images);
  const [editingTextBox, setEditingTextBox] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    committedStrokes.current = [...page.strokes];
    committedTextBoxes.current = [...page.textBoxes];
    committedImages.current = [...page.images];
    setTextBoxes(page.textBoxes);
    setImages(page.images);
    redrawAll();
  }, [page.id]);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      setDimensions({ width: rect.width, height: rect.height });
      [canvasRef.current, overlayCanvasRef.current].forEach(c => {
        if (!c) return;
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        c.style.width = rect.width + 'px';
        c.style.height = rect.height + 'px';
        const ctx = c.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      });
      redrawAll();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    // Draw background template
    if (template !== 'blank') {
      const vpX = -panRef.current.x / zoomRef.current;
      const vpY = -panRef.current.y / zoomRef.current;
      const vpW = (canvas.width / dpr) / zoomRef.current;
      const vpH = (canvas.height / dpr) / zoomRef.current;
      
      ctx.save();
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1 / zoomRef.current;
      ctx.beginPath();
      
      const startX = Math.floor(vpX / 40) * 40;
      const startY = Math.floor(vpY / 40) * 40;
      
      if (template === 'ruled' || template === 'cornell') {
        for (let y = startY; y < vpY + vpH; y += 40) {
          ctx.moveTo(vpX, y); ctx.lineTo(vpX + vpW, y);
        }
        if (template === 'cornell') {
          ctx.moveTo(startX + 120, vpY); ctx.lineTo(startX + 120, vpY + vpH);
        }
      } else if (template === 'grid') {
        for (let y = startY; y < vpY + vpH; y += 40) { ctx.moveTo(vpX, y); ctx.lineTo(vpX + vpW, y); }
        for (let x = startX; x < vpX + vpW; x += 40) { ctx.moveTo(x, vpY); ctx.lineTo(x, vpY + vpH); }
      } else if (template === 'dotted') {
        ctx.fillStyle = ctx.strokeStyle;
        for (let y = startY; y < vpY + vpH; y += 40) {
          for (let x = startX; x < vpX + vpW; x += 40) {
            ctx.moveTo(x, y);
            ctx.arc(x, y, 1.5 / zoomRef.current, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw images
    committedImages.current.forEach(img => {
      const image = new Image();
      image.src = img.src;
      if (image.complete) {
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
      } else {
        image.onload = () => redrawAll();
      }
    });

    // Draw all strokes and shapes in chronological order
    committedStrokes.current.forEach(stroke => {
      if ((stroke as any).shape) {
        drawShapeStroke(ctx, stroke);
      } else {
        drawStroke(ctx, stroke);
      }
    });

    ctx.restore();
  }, []);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if ((stroke as any).shape) return; // Shapes drawn separately
    const options = getStrokeOptions(stroke.width, settings.smoothing);
    const outlinePoints = getStroke(stroke.points.map(p => [p.x, p.y, p.pressure]), options);
    const path = new Path2D(getSvgPathFromStroke(outlinePoints));

    if (stroke.tool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill(path);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : stroke.opacity;
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
      ctx.restore();
    }
  }

  function drawShapeStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const shape = (stroke as any).shape as { type: string; path: string };
    if (!shape) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.globalAlpha = stroke.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p = new Path2D(shape.path);
    if (shape.type === 'rect' || shape.type === 'circle') {
      ctx.stroke(p);
    } else {
      ctx.stroke(p);
    }
    ctx.restore();
  }

  function getPointerPos(e: React.PointerEvent): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, t: Date.now() };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (e.clientY - rect.top - panRef.current.y) / zoomRef.current,
      pressure: e.pressure || 0.5,
      t: Date.now(),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'touch' && tool !== 'ruler') return;
    if (tool === 'text') {
      // Create text box at click position
      const pos = getPointerPos(e);
      const newTextBox: TextBox = {
        id: crypto.randomUUID(),
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 40,
        text: '',
        fontSize: 16,
        fontFamily: 'var(--font-aileron), Manrope, sans-serif',
        bold: false,
        italic: false,
        underline: false,
      };
      committedTextBoxes.current = [...committedTextBoxes.current, newTextBox];
      setTextBoxes([...committedTextBoxes.current]);
      setEditingTextBox(newTextBox.id);
      triggerSave();
      return;
    }
    if (tool === 'image') {
      // Trigger file input for images and PDFs
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const pos = getPointerPos(e as any);

        if (file.type === 'application/pdf') {
          // Dynamic import for pdfjs to avoid SSR issues
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(1); // Import first page for now
          
          const viewport = page.getViewport({ scale: 1.5 });
          const tempCanvas = document.createElement('canvas');
          const ctx = tempCanvas.getContext('2d');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;
          
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const src = tempCanvas.toDataURL('image/png');
            const newImg: ImageBlock = {
              id: crypto.randomUUID(),
              x: pos.x - viewport.width / 4,
              y: pos.y - viewport.height / 4,
              width: viewport.width / 2,
              height: viewport.height / 2,
              src,
            };
            committedImages.current = [...committedImages.current, newImg];
            setImages([...committedImages.current]);
            triggerSave();
            redrawAll();
          }
        } else {
          // Standard Image Import
          const reader = new FileReader();
          reader.onload = (ev) => {
            const src = ev.target?.result as string;
            const newImg: ImageBlock = {
              id: crypto.randomUUID(),
              x: pos.x - 100,
              y: pos.y - 75,
              width: 200,
              height: 150,
              src,
            };
            committedImages.current = [...committedImages.current, newImg];
            setImages([...committedImages.current]);
            triggerSave();
            redrawAll();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }
    if (tool === 'shapes') {
      shapeStartRef.current = getPointerPos(e);
      isDrawing.current = true;
      return;
    }
    if (tool === 'lasso' || tool === 'ruler') return;

    isDrawing.current = true;
    const pos = getPointerPos(e);
    currentStroke.current = [pos];

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDrawing.current) return;
    if (e.pointerType === 'touch') return;

    const pos = getPointerPos(e);

    if (tool === 'shapes' && shapeStartRef.current) {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.strokeStyle = settings.penColor;
      ctx.lineWidth = settings.penWidth;
      ctx.setLineDash([5, 5]);
      
      const start = shapeStartRef.current;
      const w = pos.x - start.x;
      const h = pos.y - start.y;
      const type = settings.shapeType || 'rect';
      
      ctx.beginPath();
      if (type === 'rect') {
        ctx.strokeRect(start.x, start.y, w, h);
      } else if (type === 'circle') {
        const r = Math.sqrt(w*w + h*h);
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'triangle') {
        ctx.moveTo(start.x + w/2, start.y);
        ctx.lineTo(start.x + w, pos.y);
        ctx.lineTo(start.x, pos.y);
        ctx.closePath();
        ctx.stroke();
      } else if (type === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    currentStroke.current.push(pos);

    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const tempStroke: Stroke = {
      id: '',
      tool: tool as 'pen' | 'highlighter' | 'eraser',
      color: tool === 'highlighter' ? settings.highlighterColor : settings.penColor,
      width: tool === 'highlighter' ? settings.highlighterWidth : (tool === 'eraser' ? settings.eraserWidth : settings.penWidth),
      opacity: tool === 'highlighter' ? 0.35 : settings.penOpacity,
      points: currentStroke.current,
    };
    if (tool === 'eraser') {
      const mainCtx = canvasRef.current?.getContext('2d');
      if (mainCtx) {
        mainCtx.save();
        mainCtx.translate(panRef.current.x, panRef.current.y);
        mainCtx.scale(zoomRef.current, zoomRef.current);
        drawStroke(mainCtx, tempStroke);
        mainCtx.restore();
      }
    } else {
      drawStroke(ctx, tempStroke);
    }
    ctx.restore();
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (tool === 'shapes' && shapeStartRef.current) {
      const pos = getPointerPos(e);
      const start = shapeStartRef.current;
      const w = pos.x - start.x;
      const h = pos.y - start.y;
      if (Math.abs(w) > 5 || Math.abs(h) > 5) {
        const type = settings.shapeType || 'rect';
        let path = '';
        if (type === 'rect') {
          path = `M ${start.x} ${start.y} L ${pos.x} ${start.y} L ${pos.x} ${pos.y} L ${start.x} ${pos.y} Z`;
        } else if (type === 'circle') {
          const r = Math.sqrt(w*w + h*h);
          path = `M ${start.x - r} ${start.y} A ${r} ${r} 0 1 1 ${start.x + r} ${start.y} A ${r} ${r} 0 1 1 ${start.x - r} ${start.y} Z`;
        } else if (type === 'triangle') {
          path = `M ${start.x + w/2} ${start.y} L ${start.x + w} ${pos.y} L ${start.x} ${pos.y} Z`;
        } else if (type === 'line') {
          path = `M ${start.x} ${start.y} L ${pos.x} ${pos.y}`;
        }
        
        const shape = { type, path };
        const shapeStroke: any = {
          id: crypto.randomUUID(),
          tool: 'pen',
          color: settings.penColor,
          width: settings.penWidth,
          opacity: settings.penOpacity,
          points: [start, pos],
          shape,
        };
        committedStrokes.current = [...committedStrokes.current, shapeStroke as Stroke];
      }
      shapeStartRef.current = null;
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
      redrawAll();
      triggerSave();
      return;
    }

    if (currentStroke.current.length < 2) return;

    // Try shape detection for pen tool
    const detectedShape = tool === 'pen' ? detectShape(currentStroke.current) : null;

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      tool: tool as 'pen' | 'highlighter' | 'eraser',
      color: tool === 'highlighter' ? settings.highlighterColor : settings.penColor,
      width: tool === 'highlighter' ? settings.highlighterWidth : (tool === 'eraser' ? settings.eraserWidth : settings.penWidth),
      opacity: tool === 'highlighter' ? 0.35 : settings.penOpacity,
      points: currentStroke.current,
      ...(detectedShape ? { shape: detectedShape } as any : {}),
    };

    committedStrokes.current = [...committedStrokes.current, newStroke];

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }

    redrawAll();
    currentStroke.current = [];
    triggerSave();
  }

  function triggerSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave({
        ...page,
        strokes: committedStrokes.current,
        textBoxes: committedTextBoxes.current,
        images: committedImages.current,
      });
    }, 800);
  }

  function handleTextBoxChange(id: string, text: string) {
    committedTextBoxes.current = committedTextBoxes.current.map(tb =>
      tb.id === id ? { ...tb, text } : tb
    );
    setTextBoxes([...committedTextBoxes.current]);
    triggerSave();
  }

  function handleTextBoxBlur() {
    setEditingTextBox(null);
  }

  function handleDeleteTextBox(id: string) {
    committedTextBoxes.current = committedTextBoxes.current.filter(tb => tb.id !== id);
    setTextBoxes([...committedTextBoxes.current]);
    setEditingTextBox(null);
    triggerSave();
  }

  // Pinch to zoom
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        zoomRef.current = Math.min(5, Math.max(0.25, zoomRef.current * scale));
        redrawAll();
      }
      lastPinchDist.current = dist;
    }
  }

  function handleTouchEnd() {
    lastPinchDist.current = 0;
  }

  // Two-finger tap = undo
  useEffect(() => {
    let lastTap = 0;
    let touchCount = 0;
    const handleTouch = (e: TouchEvent) => {
      touchCount = e.touches.length;
    };
    const handleTouchEndEvent = (e: TouchEvent) => {
      if (touchCount === 2 && e.changedTouches.length === 2) {
        const now = Date.now();
        if (now - lastTap < 300) {
          onUndo();
        }
        lastTap = now;
      }
    };
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('touchend', handleTouchEndEvent);
    return () => {
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('touchend', handleTouchEndEvent);
    };
  }, [onUndo]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            const scale = Math.exp(-e.deltaY * 0.01);
            zoomRef.current = Math.min(5, Math.max(0.25, zoomRef.current * scale));
          } else {
            panRef.current.x -= e.deltaX;
            panRef.current.y -= e.deltaY;
          }
          redrawAll();
        }}
      />
      {/* Text boxes overlay */}
      {textBoxes.map(tb => (
        <div
          key={tb.id}
          className="absolute"
          style={{
            left: tb.x,
            top: tb.y,
            minWidth: 100,
            minHeight: 30,
            transform: `scale(${zoomRef.current})`,
            transformOrigin: 'top left',
          }}
        >
          {editingTextBox === tb.id ? (
            <div className="relative">
              <textarea
                autoFocus
                value={tb.text}
                onChange={e => handleTextBoxChange(tb.id, e.target.value)}
                onBlur={handleTextBoxBlur}
                className="w-full min-h-[40px] bg-transparent border rounded-lg p-2 text-sm resize-both outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  fontSize: tb.fontSize,
                  fontFamily: tb.fontFamily,
                  fontWeight: tb.bold ? 'bold' : 'normal',
                  fontStyle: tb.italic ? 'italic' : 'normal',
                  textDecoration: tb.underline ? 'underline' : 'none',
                  color: theme === 'dark' ? '#e8e8ed' : '#1a1a2e',
                  borderColor: 'var(--accent)',
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') handleTextBoxBlur();
                  if (e.key === 'Delete' && e.metaKey) handleDeleteTextBox(tb.id);
                }}
              />
              <button
                onClick={() => handleDeleteTextBox(tb.id)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              className="cursor-text bg-transparent rounded p-1 min-h-[24px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setEditingTextBox(tb.id)}
              style={{
                fontSize: tb.fontSize,
                fontFamily: tb.fontFamily,
                fontWeight: tb.bold ? 'bold' : 'normal',
                fontStyle: tb.italic ? 'italic' : 'normal',
                textDecoration: tb.underline ? 'underline' : 'none',
                color: theme === 'dark' ? '#e8e8ed' : '#1a1a2e',
              }}
            >
              {tb.text || <span className="opacity-40">Type here...</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
