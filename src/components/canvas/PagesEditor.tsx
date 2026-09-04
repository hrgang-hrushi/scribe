'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Page, Stroke, Point, ImageBlock, Tool, ToolSettings, PaperColor, NoteTemplate } from '@/lib/types';
import { PAPER_THEMES } from '@/lib/types';
import { drawTemplateBackground } from '@/lib/templates';
import { detectScribble, strokeIntersectsBox, detectHoldShape, isPointInPolygon } from '@/lib/canvas-gestures';
import { Plus, Trash2, Copy } from 'lucide-react';
import ImageElementOverlay from './ImageElementOverlay';

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

export interface PagesEditorProps {
  pages: Page[];
  template?: NoteTemplate | string;
  paperColor?: PaperColor;
  tool: Tool;
  settings: ToolSettings;
  theme: 'light' | 'dark';
  onSavePage: (page: Page) => void;
  onAddPage: () => void;
  onDeletePage?: (pageId: string) => void;
  onUndo?: () => void;
}

export interface PagesEditorRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  importMedia: (file: File) => void;
  scrollToPage: (index: number) => void;
  toggleAllTape: (reveal: boolean) => void;
  getTapeStats: () => { total: number; revealed: number };
  exportCompositeImage: () => Promise<string>;
}

const PAGE_WIDTH = 850;
const PAGE_HEIGHT = 1180;

export const PagesEditor = forwardRef<PagesEditorRef, PagesEditorProps>(({
  pages,
  template = 'dotted',
  paperColor = 'navy',
  tool,
  settings,
  theme,
  onSavePage,
  onAddPage,
  onDeletePage,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<string, {
    bgCanvas: HTMLCanvasElement | null;
    canvas: HTMLCanvasElement | null;
    overlayCanvas: HTMLCanvasElement | null;
  }>>(new Map());

  const [activePageId, setActivePageId] = useState<string>(pages[0]?.id || '');
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartPos = useRef<Point | null>(null);
  const autoShapeData = useRef<{ type: string; path: string } | null>(null);
  const shapeStartRef = useRef<Point | null>(null);
  const lassoPolygon = useRef<Point[]>([]);
  const isLassoing = useRef(false);
  const [selectedStrokes, setSelectedStrokes] = useState<{ pageId: string; strokeIds: string[] } | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ pageId: string; imageId: string } | null>(null);
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [, setForceRender] = useState(0);

  // Apple Pencil vs Finger distinction, 1-Finger Scrolling & Palm Rejection
  const lastPenTime = useRef(0);
  const isPenActive = useRef(false);
  const isFingerScrolling = useRef(false);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const touchVelocityY = useRef(0);
  const momentumAnimFrame = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (momentumAnimFrame.current) {
        cancelAnimationFrame(momentumAnimFrame.current);
      }
    };
  }, []);

  function handleUpdateImage(pageId: string, imageId: string, updates: Partial<ImageBlock>) {
    const page = pageDataMap.current.get(pageId);
    if (!page) return;
    page.images = (page.images || []).map(img => img.id === imageId ? { ...img, ...updates } : img);
    pageDataMap.current.set(pageId, { ...page });
    onSavePage(page);
    setForceRender(v => v + 1);
  }

  function handleDuplicateImage(pageId: string, imageId: string) {
    const page = pageDataMap.current.get(pageId);
    if (!page) return;
    const target = page.images?.find(img => img.id === imageId);
    if (!target) return;
    const copy: ImageBlock = {
      ...target,
      id: crypto.randomUUID(),
      x: target.x + 30,
      y: target.y + 30,
    };
    page.images = [...(page.images || []), copy];
    pageDataMap.current.set(pageId, { ...page });
    onSavePage(page);
    setSelectedImage({ pageId, imageId: copy.id });
    setForceRender(v => v + 1);
  }

  function handleDeleteImage(pageId: string, imageId: string) {
    const page = pageDataMap.current.get(pageId);
    if (!page) return;
    page.images = (page.images || []).filter(img => img.id !== imageId);
    pageDataMap.current.set(pageId, { ...page });
    onSavePage(page);
    setSelectedImage(null);
    if (croppingImageId === imageId) setCroppingImageId(null);
    setForceRender(v => v + 1);
  }

  // Keyboard Shortcuts for Selected Object in Pages Mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (!selectedImage) return;

      // 1. Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteImage(selectedImage.pageId, selectedImage.imageId);
        return;
      }

      // 2. Cmd + D / Ctrl + D
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateImage(selectedImage.pageId, selectedImage.imageId);
        return;
      }

      // 3. Shift + C
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setCroppingImageId(selectedImage.imageId);
        return;
      }

      // 4. Cmd + L / Ctrl + L
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const page = pageDataMap.current.get(selectedImage.pageId);
        if (page) {
          const target = page.images?.find(i => i.id === selectedImage.imageId);
          if (target) {
            handleUpdateImage(selectedImage.pageId, selectedImage.imageId, { locked: !target.locked });
          }
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  // Per-page local stroke caches for high-speed fluid 120fps rendering
  const pageDataMap = useRef<Map<string, Page>>(new Map());
  const undoStacks = useRef<Map<string, Stroke[][]>>(new Map());
  const redoStacks = useRef<Map<string, Stroke[][]>>(new Map());

  // Initialize and sync page data
  useEffect(() => {
    pages.forEach(p => {
      pageDataMap.current.set(p.id, { ...p });
      if (!undoStacks.current.has(p.id)) undoStacks.current.set(p.id, []);
      if (!redoStacks.current.has(p.id)) redoStacks.current.set(p.id, []);
    });
    if (!activePageId && pages.length > 0) {
      setActivePageId(pages[0].id);
    }
    // Redraw all pages immediately and after canvases mount
    pages.forEach(p => redrawPage(p.id));
    const timer = setTimeout(() => {
      pages.forEach(p => redrawPage(p.id));
    }, 60);
    return () => clearTimeout(timer);
  }, [pages, template, paperColor]);

  const activeTheme = PAPER_THEMES[paperColor] || PAPER_THEMES.navy;

  const redrawPage = useCallback((pageId: string) => {
    const page = pageDataMap.current.get(pageId);
    const canvases = pageRefs.current.get(pageId);
    if (!page || !canvases) return;

    const { bgCanvas, canvas } = canvases;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // 1. Draw Background Paper
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bgCtx.fillStyle = activeTheme.bg;
        bgCtx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

        drawTemplateBackground(bgCtx, (template as NoteTemplate) || 'dotted', PAGE_WIDTH, PAGE_HEIGHT, activeTheme);
      }
    }

    // 2. Draw Ink Strokes (Highlighters first, then Pen/Shapes!)
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

        // A. Draw Highlighters underneath
        page.strokes.forEach(s => {
          if (s.tool === 'highlighter') {
            drawStrokeToContext(ctx, s);
          }
        });

        // B. Draw Pen, Shapes, and Eraser marks on top
        page.strokes.forEach(s => {
          if (s.tool !== 'highlighter') {
            if ((s as any).shape) {
              drawShapeToContext(ctx, s);
            } else {
              drawStrokeToContext(ctx, s);
            }
          }
        });
      }
    }
  }, [template, activeTheme]);

  function drawStrokeToContext(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if ((stroke as any).shape) return;

    if (stroke.tool === 'tape') {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.width || 32;
      ctx.strokeStyle = stroke.color || '#f59e0b';
      ctx.globalAlpha = stroke.isRevealed ? 0.18 : 0.95;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();

      if (!stroke.isRevealed && stroke.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      return;
    }

    const options = getStrokeOptions(stroke.width, settings.smoothing);
    const outlinePoints = getStroke(stroke.points.map(p => [p.x, p.y, p.pressure]), options);
    const path = new Path2D(getSvgPathFromStroke(outlinePoints));

    ctx.save();
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill(path);
    } else {
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : stroke.opacity;
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
    }
    ctx.restore();
  }

  function drawShapeToContext(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const shape = (stroke as any).shape as { type: string; path: string };
    if (!shape) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.globalAlpha = stroke.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p = new Path2D(shape.path);
    ctx.stroke(p);
    ctx.restore();
  }

  // Imperative handle for parent actions
  useImperativeHandle(ref, () => ({
    undo: () => {
      const page = pageDataMap.current.get(activePageId);
      if (!page || page.strokes.length === 0) return;
      const lastStroke = page.strokes[page.strokes.length - 1];
      const rStack = redoStacks.current.get(activePageId) || [];
      redoStacks.current.set(activePageId, [...rStack, [lastStroke]]);

      page.strokes = page.strokes.slice(0, -1);
      pageDataMap.current.set(activePageId, { ...page });
      redrawPage(activePageId);
      onSavePage(page);
    },
    redo: () => {
      const rStack = redoStacks.current.get(activePageId) || [];
      if (rStack.length === 0) return;
      const restore = rStack[rStack.length - 1];
      redoStacks.current.set(activePageId, rStack.slice(0, -1));

      const page = pageDataMap.current.get(activePageId);
      if (!page) return;
      page.strokes = [...page.strokes, ...restore];
      pageDataMap.current.set(activePageId, { ...page });
      redrawPage(activePageId);
      onSavePage(page);
    },
    clear: () => {
      const page = pageDataMap.current.get(activePageId);
      if (!page) return;
      if (page.strokes.length > 0) {
        const rStack = redoStacks.current.get(activePageId) || [];
        redoStacks.current.set(activePageId, [...rStack, [...page.strokes]]);
      }
      page.strokes = [];
      pageDataMap.current.set(activePageId, { ...page });
      redrawPage(activePageId);
      onSavePage(page);
    },
    toggleAllTape: (reveal: boolean) => {
      const page = pageDataMap.current.get(activePageId);
      if (!page) return;
      page.strokes = page.strokes.map(s => {
        if (s.tool === 'tape') return { ...s, isRevealed: reveal };
        return s;
      });
      pageDataMap.current.set(activePageId, { ...page });
      redrawPage(activePageId);
      onSavePage(page);
    },
    getTapeStats: () => {
      const page = pageDataMap.current.get(activePageId);
      if (!page) return { total: 0, revealed: 0 };
      const tapeStrokes = page.strokes.filter(s => s.tool === 'tape');
      return {
        total: tapeStrokes.length,
        revealed: tapeStrokes.filter(s => s.isRevealed).length,
      };
    },
    exportCompositeImage: async (): Promise<string> => {
      const page = pageDataMap.current.get(activePageId);
      if (!page) return '';
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = PAGE_WIDTH * scale;
      canvas.height = PAGE_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = activeTheme.bg;
      ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

      // Images
      if (page.images) {
        for (const imgBlock of page.images) {
          try {
            const img = await new Promise<HTMLImageElement>(res => {
              const el = new Image();
              if (imgBlock.src.startsWith('http')) el.crossOrigin = 'anonymous';
              el.onload = () => res(el);
              el.onerror = () => res(el);
              el.src = imgBlock.src;
            });
            if (img.width > 0) {
              ctx.drawImage(img, imgBlock.x, imgBlock.y, imgBlock.width, imgBlock.height);
            }
          } catch {}
        }
      }

      // Strokes
      page.strokes.forEach(s => {
        if ((s as any).shape) drawShapeToContext(ctx, s);
        else drawStrokeToContext(ctx, s);
      });

      return canvas.toDataURL('image/png');
    },
    importMedia: async (file: File) => {
      const page = pageDataMap.current.get(activePageId);
      if (!page) return;

      if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        const allPages = Array.from(pageDataMap.current.values()).sort((a, b) => a.order - b.order);
        const startIdx = allPages.findIndex(p => p.id === activePageId);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const pdfPage = await pdf.getPage(pageNum);
          const viewport = pdfPage.getViewport({ scale: 2.0 });
          const tempCanvas = document.createElement('canvas');
          const ctx = tempCanvas.getContext('2d');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;
          
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            await pdfPage.render({ canvasContext: ctx, viewport } as any).promise;
            const src = tempCanvas.toDataURL('image/png');
            
            const targetW = Math.min(760, viewport.width / 2);
            const targetH = Math.round(targetW / (viewport.width / viewport.height));
            const newImg: ImageBlock = {
              id: crypto.randomUUID(),
              x: Math.round((PAGE_WIDTH - targetW) / 2),
              y: 40,
              width: targetW,
              height: targetH,
              src,
              locked: false,
            };
            
            // Distribute across sequential pages
            let destPage: Page;
            const targetPageIdx = startIdx + (pageNum - 1);
            if (targetPageIdx < allPages.length) {
              destPage = allPages[targetPageIdx];
            } else {
              destPage = {
                id: crypto.randomUUID(),
                noteId: page.noteId,
                order: targetPageIdx,
                strokes: [],
                textBoxes: [],
                images: [],
              };
              allPages.push(destPage);
            }
            
            destPage.images = [...(destPage.images || []), newImg];
            pageDataMap.current.set(destPage.id, { ...destPage });
            onSavePage(destPage);
            if (pageNum === 1) {
              setSelectedImage({ pageId: destPage.id, imageId: newImg.id });
            }
          }
        }
        await onAddPage();
        setForceRender(v => v + 1);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const imgObj = new Image();
          imgObj.onload = () => {
            const maxW = 550;
            const scale = imgObj.width > maxW ? maxW / imgObj.width : 1;
            const w = imgObj.width * scale;
            const h = imgObj.height * scale;
            const newImg: ImageBlock = {
              id: crypto.randomUUID(),
              x: Math.round((PAGE_WIDTH - w) / 2),
              y: 80,
              width: w,
              height: h,
              src,
              locked: false,
            };
            page.images = [...(page.images || []), newImg];
            pageDataMap.current.set(page.id, { ...page });
            onSavePage(page);
            setSelectedImage({ pageId: page.id, imageId: newImg.id });
            setForceRender(v => v + 1);
          };
          imgObj.src = src;
        };
        reader.readAsDataURL(file);
      }
    },
    scrollToPage: (index: number) => {
      if (pages[index]) {
        const targetPage = pages[index];
        const el = document.getElementById(`page-card-${targetPage.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setActivePageId(targetPage.id);
        }
      }
    }
  }));

  function getPointerPosOnPage(e: React.PointerEvent | PointerEvent, pageId: string): Point {
    const canvases = pageRefs.current.get(pageId);
    if (!canvases?.canvas) return { x: 0, y: 0, pressure: 0.5, t: Date.now() };
    const rect = canvases.canvas.getBoundingClientRect();
    const scaleX = PAGE_WIDTH / rect.width;
    const scaleY = PAGE_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5,
      t: Date.now(),
    };
  }

  function handlePointerDown(e: React.PointerEvent, pageId: string) {
    setActivePageId(pageId);
    setSelectedStrokes(null);
    setSelectedImage(null);

    // 1. Identify Pointer Type: Pen (Apple Pencil / Stylus) vs Touch (Finger / Palm)
    if (e.pointerType === 'pen') {
      lastPenTime.current = Date.now();
      isPenActive.current = true;
      e.preventDefault();
      try {
        (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
      } catch {}
    } else if (e.pointerType === 'touch') {
      // PALM REJECTION:
      // Drop touch if contact area is large (> 24px) or if pencil is active / recently active
      const isPalm = (e.width > 24 || e.height > 24) ||
                     isPenActive.current ||
                     (Date.now() - lastPenTime.current < 650);

      if (isPalm) {
        e.preventDefault();
        return;
      }

      // ONE-FINGER SCROLL ON NOTEBOOK PAGES:
      if (momentumAnimFrame.current) {
        cancelAnimationFrame(momentumAnimFrame.current);
        momentumAnimFrame.current = null;
      }

      isFingerScrolling.current = true;
      touchStartY.current = e.clientY;
      touchStartScrollTop.current = containerRef.current?.scrollTop || 0;
      lastTouchY.current = e.clientY;
      lastTouchTime.current = Date.now();
      touchVelocityY.current = 0;
      try {
        (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
      } catch {}
      return;
    }

    const pos = getPointerPosOnPage(e, pageId);

    // Tap on existing tape to toggle reveal
    if (tool === 'tape' || tool === 'select') {
      const page = pageDataMap.current.get(pageId);
      if (page) {
        const clickedTape = page.strokes.find(s => {
          if (s.tool !== 'tape') return false;
          const radius = (s.width || 32) / 2 + 10;
          return s.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= radius);
        });
        if (clickedTape) {
          clickedTape.isRevealed = !clickedTape.isRevealed;
          pageDataMap.current.set(pageId, { ...page });
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
          redrawPage(pageId);
          onSavePage(page);
          return;
        }
      }
    }

    if (tool === 'select') {
      setSelectedImage(null);
      return;
    }

    if (tool === 'lasso') {
      isLassoing.current = true;
      lassoPolygon.current = [pos];
      return;
    }

    if (tool === 'shapes') {
      shapeStartRef.current = pos;
      isDrawing.current = true;
      return;
    }

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser' || tool === 'tape') {
      isDrawing.current = true;
      autoShapeData.current = null;
      holdStartPos.current = pos;
      currentStroke.current = [pos];

      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

      const overlay = pageRefs.current.get(pageId)?.overlayCanvas;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        }
      }
    }
  }

  function handlePointerMove(e: React.PointerEvent, pageId: string) {
    if (e.pointerType === 'pen') {
      lastPenTime.current = Date.now();
      isPenActive.current = true;
    }

    // ONE-FINGER SCROLL MOVE:
    if (e.pointerType === 'touch') {
      if (isFingerScrolling.current && containerRef.current) {
        const now = Date.now();
        const dt = now - lastTouchTime.current;
        const dy = e.clientY - lastTouchY.current;
        if (dt > 0) {
          touchVelocityY.current = dy / dt;
        }
        lastTouchY.current = e.clientY;
        lastTouchTime.current = now;

        const totalDy = e.clientY - touchStartY.current;
        containerRef.current.scrollTop = touchStartScrollTop.current - totalDy;
      }
      return;
    }

    if (!isDrawing.current && !isLassoing.current) return;

    const pos = getPointerPosOnPage(e, pageId);
    const overlay = pageRefs.current.get(pageId)?.overlayCanvas;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    // Handle Lasso Polygon
    if (isLassoing.current) {
      lassoPolygon.current.push(pos);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      ctx.save();
      ctx.strokeStyle = '#32ADE6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      lassoPolygon.current.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Handle Manual Shapes tool preview
    if (tool === 'shapes' && shapeStartRef.current) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      ctx.save();
      ctx.strokeStyle = settings.penColor;
      ctx.lineWidth = settings.penWidth;
      ctx.setLineDash([5, 5]);

      const start = shapeStartRef.current;
      const w = pos.x - start.x;
      const h = pos.y - start.y;
      const type = settings.shapeType || 'rect';

      ctx.beginPath();
      if (type === 'rect') ctx.strokeRect(start.x, start.y, w, h);
      else if (type === 'circle') {
        const r = Math.hypot(w, h);
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Sample high-frequency coalesced events (240Hz Apple Pencil precision)
    const rawEvents: (React.PointerEvent | PointerEvent)[] = (e.nativeEvent as any).getCoalescedEvents
      ? (e.nativeEvent as any).getCoalescedEvents()
      : [e];

    if (rawEvents.length > 1) {
      for (const ev of rawEvents) {
        currentStroke.current.push(getPointerPosOnPage(ev as React.PointerEvent, pageId));
      }
    } else {
      currentStroke.current.push(pos);
    }

    // Controlled Hold-to-Shape (Triggers only when intentionally holding stationary for 650ms)
    if (tool === 'pen' && settings.holdToShape !== false) {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

      holdTimeoutRef.current = setTimeout(() => {
        const pts = currentStroke.current;
        if (!isDrawing.current || pts.length < 15) return;
        const lastPt = pts[pts.length - 1];
        const prevPt = pts[pts.length - 4];
        if (prevPt && Math.hypot(lastPt.x - prevPt.x, lastPt.y - prevPt.y) > 15) return; // Still moving

        const detected = detectHoldShape(pts);
        if (detected) {
          autoShapeData.current = detected;
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);

          // Preview snapped shape immediately on overlay canvas
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
          ctx.save();
          ctx.strokeStyle = settings.penColor;
          ctx.lineWidth = settings.penWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const p = new Path2D(detected.path);
          ctx.stroke(p);
          ctx.restore();
        }
      }, 500);
    }

    // Normal stroke preview on overlay
    if (!autoShapeData.current) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

      const strokeWidth = tool === 'tape'
        ? (settings.tapeWidth || 32)
        : tool === 'highlighter'
        ? settings.highlighterWidth
        : tool === 'eraser'
        ? settings.eraserWidth
        : settings.penWidth;

      const strokeColor = tool === 'tape'
        ? (settings.tapeColor || '#f59e0b')
        : tool === 'highlighter'
        ? settings.highlighterColor
        : settings.penColor;

      const tempStroke: Stroke = {
        id: '',
        tool: tool as 'pen' | 'highlighter' | 'eraser' | 'tape',
        color: strokeColor,
        width: strokeWidth,
        opacity: tool === 'tape' ? 0.95 : tool === 'highlighter' ? 0.35 : settings.penOpacity,
        points: currentStroke.current,
        isRevealed: false,
      };

      if (tool === 'eraser') {
        const pageCanvases = pageRefs.current.get(pageId);
        const mainCtx = pageCanvases?.canvas?.getContext('2d');
        if (mainCtx) {
          drawStrokeToContext(mainCtx, tempStroke);
        }
      } else {
        drawStrokeToContext(ctx, tempStroke);
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent, pageId: string) {
    if (e.pointerType === 'pen') {
      isPenActive.current = false;
      lastPenTime.current = Date.now();
      try {
        (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
      } catch {}
    }

    // COMPLETE FINGER SCROLL (MOMENTUM INERTIA)
    if (e.pointerType === 'touch') {
      if (isFingerScrolling.current) {
        isFingerScrolling.current = false;
        try {
          (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
        } catch {}

        let velocity = touchVelocityY.current;
        if (Math.abs(velocity) > 0.15 && containerRef.current) {
          const step = () => {
            if (!containerRef.current || Math.abs(velocity) < 0.01) {
              momentumAnimFrame.current = null;
              return;
            }
            containerRef.current.scrollTop -= velocity * 16;
            velocity *= 0.93;
            momentumAnimFrame.current = requestAnimationFrame(step);
          };
          momentumAnimFrame.current = requestAnimationFrame(step);
        }
      }
      return;
    }

    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    const overlay = pageRefs.current.get(pageId)?.overlayCanvas;
    const clearOverlay = () => {
      if (overlay) {
        const ctx = overlay.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        }
      }
    };

    // 1. Handle Lasso Selection Complete
    if (isLassoing.current) {
      isLassoing.current = false;
      clearOverlay();
      if (lassoPolygon.current.length > 5) {
        const page = pageDataMap.current.get(pageId);
        if (page) {
          const selected: string[] = [];
          page.strokes.forEach(s => {
            const hasInsidePoint = s.points.some(pt => isPointInPolygon(pt, lassoPolygon.current));
            if (hasInsidePoint) selected.push(s.id);
          });
          if (selected.length > 0) {
            setSelectedStrokes({ pageId, strokeIds: selected });
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
          }
        }
      }
      lassoPolygon.current = [];
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    const page = pageDataMap.current.get(pageId);
    if (!page) return;

    // 2. Commit Auto-Shape (Only if Hold-to-Shape was triggered by holding!)
    if (autoShapeData.current && tool === 'pen') {
      const shapeStroke: any = {
        id: crypto.randomUUID(),
        tool: 'pen',
        color: settings.penColor,
        width: settings.penWidth,
        opacity: settings.penOpacity,
        points: [],
        shape: autoShapeData.current,
      };
      page.strokes = [...page.strokes, shapeStroke];
      redoStacks.current.set(pageId, []);
      pageDataMap.current.set(pageId, { ...page });
      autoShapeData.current = null;
      currentStroke.current = [];
      clearOverlay();
      redrawPage(pageId);
      onSavePage(page);
      return;
    }

    // 3. Handle Manual Shape tool commit
    if (tool === 'shapes' && shapeStartRef.current) {
      const pos = getPointerPosOnPage(e, pageId);
      const start = shapeStartRef.current;
      const w = pos.x - start.x;
      const h = pos.y - start.y;
      if (Math.abs(w) > 5 || Math.abs(h) > 5) {
        const type = settings.shapeType || 'rect';
        let path = '';
        if (type === 'rect') {
          path = `M ${start.x} ${start.y} L ${pos.x} ${start.y} L ${pos.x} ${pos.y} L ${start.x} ${pos.y} Z`;
        } else if (type === 'circle') {
          const r = Math.hypot(w, h);
          path = `M ${start.x - r} ${start.y} A ${r} ${r} 0 1 1 ${start.x + r} ${start.y} A ${r} ${r} 0 1 1 ${start.x - r} ${start.y} Z`;
        } else if (type === 'line') {
          path = `M ${start.x} ${start.y} L ${pos.x} ${pos.y}`;
        }
        const shapeStroke: any = {
          id: crypto.randomUUID(),
          tool: 'pen',
          color: settings.penColor,
          width: settings.penWidth,
          opacity: settings.penOpacity,
          points: [start, pos],
          shape: { type, path },
        };
        page.strokes = [...page.strokes, shapeStroke];
        redoStacks.current.set(pageId, []);
        pageDataMap.current.set(pageId, { ...page });
      }
      shapeStartRef.current = null;
      currentStroke.current = [];
      clearOverlay();
      redrawPage(pageId);
      onSavePage(page);
      return;
    }

    if (currentStroke.current.length < 2) {
      clearOverlay();
      return;
    }

    // 4. Scribble-to-Erase (Signature GoodNotes Scratch-out Erase!)
    if ((tool === 'pen' || tool === 'highlighter') && settings.scribbleToErase !== false) {
      const scribble = detectScribble(currentStroke.current);
      if (scribble) {
        const originalCount = page.strokes.length;
        const remaining = page.strokes.filter(s => !strokeIntersectsBox(s, scribble.bounds));
        if (remaining.length < originalCount) {
          page.strokes = remaining;
          redoStacks.current.set(pageId, []);
          pageDataMap.current.set(pageId, { ...page });
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(35);
          }
          currentStroke.current = [];
          clearOverlay();
          redrawPage(pageId);
          onSavePage(page);
          return;
        }
      }
    }

    // 5. Normal Pure Handwriting Ink or Study Tape
    const finalWidth = tool === 'tape'
      ? (settings.tapeWidth || 32)
      : tool === 'highlighter'
      ? settings.highlighterWidth
      : tool === 'eraser'
      ? settings.eraserWidth
      : settings.penWidth;

    const finalColor = tool === 'tape'
      ? (settings.tapeColor || '#f59e0b')
      : tool === 'highlighter'
      ? settings.highlighterColor
      : settings.penColor;

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      tool: tool as 'pen' | 'highlighter' | 'eraser' | 'tape',
      color: finalColor,
      width: finalWidth,
      opacity: tool === 'tape' ? 0.95 : tool === 'highlighter' ? 0.35 : settings.penOpacity,
      points: currentStroke.current,
      isRevealed: false,
    };

    page.strokes = [...page.strokes, newStroke];
    redoStacks.current.set(pageId, []);
    pageDataMap.current.set(pageId, { ...page });

    currentStroke.current = [];
    clearOverlay();
    redrawPage(pageId);
    onSavePage(page);
  }

  // Handle Lasso Actions
  function handleDeleteSelected() {
    if (!selectedStrokes) return;
    const page = pageDataMap.current.get(selectedStrokes.pageId);
    if (!page) return;
    page.strokes = page.strokes.filter(s => !selectedStrokes.strokeIds.includes(s.id));
    pageDataMap.current.set(selectedStrokes.pageId, { ...page });
    setSelectedStrokes(null);
    redrawPage(selectedStrokes.pageId);
    onSavePage(page);
  }

  function handleDuplicateSelected() {
    if (!selectedStrokes) return;
    const page = pageDataMap.current.get(selectedStrokes.pageId);
    if (!page) return;
    const newStrokes: Stroke[] = [];
    page.strokes.forEach(s => {
      if (selectedStrokes.strokeIds.includes(s.id)) {
        const offset = 25;
        const dup: Stroke = {
          ...s,
          id: crypto.randomUUID(),
          points: s.points.map(p => ({ ...p, x: p.x + offset, y: p.y + offset })),
        };
        newStrokes.push(dup);
      }
    });
    page.strokes = [...page.strokes, ...newStrokes];
    pageDataMap.current.set(selectedStrokes.pageId, { ...page });
    setSelectedStrokes(null);
    redrawPage(selectedStrokes.pageId);
    onSavePage(page);
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto overflow-x-auto p-4 md:p-8 flex flex-col items-center gap-8 no-scrollbar select-none"
      style={{
        background: 'var(--canvas-bg)',
        touchAction: 'pan-y',
      }}
    >
      {pages.map((page, index) => (
        <div
          key={page.id}
          id={`page-card-${page.id}`}
          onClick={() => setActivePageId(page.id)}
          className={`relative flex flex-col items-center transition-shadow duration-200 rounded-[20px] ${
            activePageId === page.id ? 'ring-2 ring-[var(--accent)]/40' : ''
          }`}
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            backgroundColor: activeTheme.bg,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.12)',
            flexShrink: 0,
          }}
        >
          {/* Page Header Indicator */}
          <div className="absolute -top-6 left-2 flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md"
              style={{
                background: 'var(--toolbar-bg)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              Page {index + 1} of {pages.length}
            </span>
          </div>

          {/* Delete Page Button (if more than 1 page) */}
          {pages.length > 1 && onDeletePage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete Page ${index + 1}?`)) {
                  onDeletePage(page.id);
                }
              }}
              title="Delete Page"
              className="absolute -top-6 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
              style={{ color: 'var(--text-muted)' }}
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Canvas Layers */}
          <div className="relative w-full h-full rounded-[20px] overflow-hidden" style={{ backgroundColor: activeTheme.bg }}>
            {/* 1. Background Paper Canvas */}
            <canvas
              ref={el => {
                const item = pageRefs.current.get(page.id) || { bgCanvas: null, canvas: null, overlayCanvas: null };
                item.bgCanvas = el;
                pageRefs.current.set(page.id, item);
                if (el) {
                  const dpr = window.devicePixelRatio || 1;
                  el.width = PAGE_WIDTH * dpr;
                  el.height = PAGE_HEIGHT * dpr;
                  redrawPage(page.id);
                }
              }}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            />

            {/* 2. Document & Image Objects (Rendered UNDER ink in pen mode, and on top in select mode!) */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: (tool === 'select' || tool === 'image') ? 25 : 5 }}>
              {page.images?.map(img => (
                <ImageElementOverlay
                  key={img.id}
                  image={img}
                  isSelected={selectedImage?.pageId === page.id && selectedImage?.imageId === img.id}
                  onSelect={() => {
                    setSelectedImage({ pageId: page.id, imageId: img.id });
                  }}
                  onUpdate={(updates) => handleUpdateImage(page.id, img.id, updates)}
                  onDelete={() => handleDeleteImage(page.id, img.id)}
                  onDuplicate={() => handleDuplicateImage(page.id, img.id)}
                  zoom={1}
                  tool={tool}
                  isCropping={croppingImageId === img.id}
                  onSetCropping={(c) => setCroppingImageId(c ? img.id : null)}
                />
              ))}
            </div>

            {/* 3. Main Ink Strokes Canvas (Draws handwriting ON TOP of the PDF!) */}
            <canvas
              ref={el => {
                const item = pageRefs.current.get(page.id) || { bgCanvas: null, canvas: null, overlayCanvas: null };
                item.canvas = el;
                pageRefs.current.set(page.id, item);
                if (el) {
                  const dpr = window.devicePixelRatio || 1;
                  el.width = PAGE_WIDTH * dpr;
                  el.height = PAGE_HEIGHT * dpr;
                  redrawPage(page.id);
                }
              }}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            />

            {/* 4. Interactive Overlay Canvas (Captures Pen, Pencil, Highlighter, Eraser!) */}
            <canvas
              ref={el => {
                const item = pageRefs.current.get(page.id) || { bgCanvas: null, canvas: null, overlayCanvas: null };
                item.overlayCanvas = el;
                pageRefs.current.set(page.id, item);
                if (el) {
                  const dpr = window.devicePixelRatio || 1;
                  el.width = PAGE_WIDTH * dpr;
                  el.height = PAGE_HEIGHT * dpr;
                }
              }}
              className="absolute inset-0 w-full h-full select-none"
              style={{
                touchAction: 'pan-y',
                zIndex: 15,
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onPointerDown={(e) => handlePointerDown(e, page.id)}
              onPointerMove={(e) => handlePointerMove(e, page.id)}
              onPointerUp={(e) => handlePointerUp(e, page.id)}
              onPointerCancel={(e) => handlePointerUp(e, page.id)}
              onPointerLeave={(e) => handlePointerUp(e, page.id)}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>

          {/* Floating Lasso Actions */}
          {selectedStrokes && selectedStrokes.pageId === page.id && (
            <div
              className="absolute top-4 right-4 z-30 flex items-center gap-2 p-1.5 rounded-2xl glass-panel shadow-xl animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleDuplicateSelected}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-primary)' }}
              >
                <Copy size={14} /> Duplicate
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Seamless "Scroll to New Page" / "+ Add Page" Footer */}
      <div className="w-full flex flex-col items-center justify-center py-10 pb-24 gap-3">
        <button
          onClick={onAddPage}
          className="group px-6 py-3.5 rounded-full flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
          }}
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          <span>Add New Page</span>
        </button>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Scroll continuously or tap to add the next sheet
        </p>
      </div>
    </div>
  );
});

PagesEditor.displayName = 'PagesEditor';
export default PagesEditor;
