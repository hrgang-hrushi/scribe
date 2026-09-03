'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Page, Stroke, Point, TextBox, ImageBlock, Tool, ToolSettings, PaperColor } from '@/lib/types';
import { PAPER_THEMES } from '@/lib/types';
import { detectScribble, strokeIntersectsBox, detectHoldShape, isPointInPolygon } from '@/lib/canvas-gestures';
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

interface CanvasEditorProps {
  page: Page;
  template?: string;
  paperColor?: PaperColor;
  tool: Tool;
  settings: ToolSettings;
  theme: 'light' | 'dark';
  onSave: (page: Page) => void;
  onUndo: () => void;
}

export interface CanvasEditorRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  importMedia: (file: File) => void;
  toggleAllTape: (reveal: boolean) => void;
  getTapeStats: () => { total: number; revealed: number };
  exportCompositeImage: () => Promise<string>;
}

const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(({
  page,
  template = 'blank',
  paperColor = 'navy',
  tool,
  settings,
  theme,
  onSave,
  onUndo
}, ref) => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const isPanningRef = useRef(false);
  const lastTouchPanRef = useRef<{x: number, y: number} | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoShapeData = useRef<{ type: string; path: string } | null>(null);
  const currentStroke = useRef<Point[]>([]);
  const committedStrokes = useRef<Stroke[]>([...page.strokes]);
  const committedTextBoxes = useRef<TextBox[]>([...page.textBoxes]);
  const committedImages = useRef<ImageBlock[]>([...page.images]);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const lastPinchDist = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lasso states
  const lassoPolygon = useRef<Point[]>([]);
  const isLassoing = useRef(false);
  const [selectedStrokes, setSelectedStrokes] = useState<string[]>([]);

  const undoStackRef = useRef<Stroke[][]>([]);
  const redoStackRef = useRef<Stroke[][]>([]);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (undoStackRef.current.length === 0) return;
      const lastStrokes = undoStackRef.current.pop()!;
      redoStackRef.current.push(lastStrokes);
      const lastIdSet = new Set(lastStrokes.map(s => s.id));
      committedStrokes.current = committedStrokes.current.filter(s => !lastIdSet.has(s.id));
      redrawAll();
      triggerSave();
    },
    redo: () => {
      if (redoStackRef.current.length === 0) return;
      const strokesToRestore = redoStackRef.current.pop()!;
      undoStackRef.current.push(strokesToRestore);
      committedStrokes.current = [...committedStrokes.current, ...strokesToRestore];
      redrawAll();
      triggerSave();
    },
    clear: () => {
      if (committedStrokes.current.length > 0) {
        undoStackRef.current.push([...committedStrokes.current]);
        redoStackRef.current = [];
      }
      committedStrokes.current = [];
      committedTextBoxes.current = [];
      committedImages.current = [];
      setTextBoxes([]);
      setImages([]);
      triggerSave();
      redrawAll();
    },
    toggleAllTape: (reveal: boolean) => {
      committedStrokes.current = committedStrokes.current.map(s => {
        if (s.tool === 'tape') {
          return { ...s, isRevealed: reveal };
        }
        return s;
      });
      redrawAll();
      triggerSave();
    },
    getTapeStats: () => {
      const tapeStrokes = committedStrokes.current.filter(s => s.tool === 'tape');
      return {
        total: tapeStrokes.length,
        revealed: tapeStrokes.filter(s => s.isRevealed).length,
      };
    },
    exportCompositeImage: async (): Promise<string> => {
      const w = containerRef.current?.clientWidth || 1200;
      const h = containerRef.current?.clientHeight || 900;
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.scale(scale, scale);

      // Background
      const themeConfig = PAPER_THEMES[paperColor] || PAPER_THEMES.navy;
      ctx.fillStyle = themeConfig.bg;
      ctx.fillRect(0, 0, w, h);

      // Apply current view pan and zoom
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      // Draw images
      for (const imgBlock of committedImages.current) {
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

      // Draw strokes
      committedStrokes.current.forEach(s => drawStroke(ctx, s));
      ctx.restore();

      return canvas.toDataURL('image/png');
    },
    importMedia: async (file: File) => {
      // Position at current view center in world coordinates
      const containerW = containerRef.current?.clientWidth || window.innerWidth;
      const containerH = containerRef.current?.clientHeight || window.innerHeight;
      const centerX = Math.round((containerW / 2 - panRef.current.x) / zoomRef.current);
      const centerY = Math.round((containerH / 2 - panRef.current.y) / zoomRef.current);
      
      if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let currentY = centerY - 250;
        const newImages: ImageBlock[] = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const tempCanvas = document.createElement('canvas');
          const ctx = tempCanvas.getContext('2d');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;
          
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const src = tempCanvas.toDataURL('image/png');
            
            const displayWidth = viewport.width / 2;
            const displayHeight = viewport.height / 2;
            
            newImages.push({
              id: crypto.randomUUID(),
              x: centerX - displayWidth / 2,
              y: currentY,
              width: displayWidth,
              height: displayHeight,
              src,
              locked: false,
            });
            
            currentY += displayHeight + 30; // 30px gap between consecutive pages
          }
        }
        
        committedImages.current = [...committedImages.current, ...newImages];
        setImages([...committedImages.current]);
        if (newImages.length > 0) {
          setSelectedImageIds([newImages[0].id]);
        }
        triggerSave();
        redrawAll();
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const imgObj = new Image();
          imgObj.onload = () => {
            const maxW = 500;
            const scale = imgObj.width > maxW ? maxW / imgObj.width : 1;
            const w = imgObj.width * scale;
            const h = imgObj.height * scale;
            const newImg: ImageBlock = {
              id: crypto.randomUUID(),
              x: centerX - w / 2,
              y: centerY - h / 2,
              width: w,
              height: h,
              src,
              locked: false,
            };
            committedImages.current = [...committedImages.current, newImg];
            setImages([...committedImages.current]);
            setSelectedImageIds([newImg.id]);
            triggerSave();
            redrawAll();
          };
          imgObj.src = src;
        };
        reader.readAsDataURL(file);
      }
    }
  }));

  const shapeStartRef = useRef<Point | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(page.textBoxes);
  const [images, setImages] = useState<ImageBlock[]>(page.images);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [editingTextBox, setEditingTextBox] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const dragDataRef = useRef<{ id: string; type: 'text' | 'image'; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const multiDragInitMap = useRef<Map<string, { x: number; y: number }>>(new Map());

  function handleSelectImage(id: string, isMulti?: boolean) {
    setEditingTextBox(null);
    setSelectedStrokes([]);
    if (isMulti) {
      setSelectedImageIds(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedImageIds([id]);
    }
  }

  function handleStartMoveSelected(primaryId: string) {
    multiDragInitMap.current.clear();
    const idsToMove = selectedImageIds.includes(primaryId) ? selectedImageIds : [primaryId];
    committedImages.current.forEach(img => {
      if (idsToMove.includes(img.id)) {
        multiDragInitMap.current.set(img.id, { x: img.x, y: img.y });
      }
    });
  }

  function handleMoveDelta(dx: number, dy: number) {
    if (multiDragInitMap.current.size === 0) return;
    const updated = committedImages.current.map(img => {
      const init = multiDragInitMap.current.get(img.id);
      if (init && !img.locked) {
        return {
          ...img,
          x: Math.round(init.x + dx),
          y: Math.round(init.y + dy),
        };
      }
      return img;
    });
    committedImages.current = updated;
    setImages(updated);
  }

  function handleEndMove() {
    multiDragInitMap.current.clear();
    triggerSave();
  }

  function handleUpdateImage(id: string, updates: Partial<ImageBlock>) {
    const updated = images.map(img => img.id === id ? { ...img, ...updates } : img);
    setImages(updated);
    committedImages.current = updated;
    triggerSave();
  }

  function handleDeleteImage(id: string) {
    committedImages.current = committedImages.current.filter(i => i.id !== id);
    setImages([...committedImages.current]);
    setSelectedImageIds(prev => prev.filter(item => item !== id));
    setEditingImage(null);
    if (croppingImageId === id) setCroppingImageId(null);
    triggerSave();
  }

  function handleDeleteSelectedImages() {
    if (selectedImageIds.length === 0) return;
    const targetSet = new Set(selectedImageIds);
    committedImages.current = committedImages.current.filter(img => !targetSet.has(img.id));
    setImages([...committedImages.current]);
    setSelectedImageIds([]);
    setCroppingImageId(null);
    triggerSave();
  }

  function handleDuplicateImage(id: string) {
    const target = images.find(img => img.id === id);
    if (!target) return;
    const copy: ImageBlock = {
      ...target,
      id: crypto.randomUUID(),
      x: target.x + 30,
      y: target.y + 30,
    };
    const updated = [...images, copy];
    committedImages.current = updated;
    setImages(updated);
    setSelectedImageIds([copy.id]);
    triggerSave();
  }

  function handleDuplicateSelectedImages() {
    if (selectedImageIds.length === 0) return;
    const targets = committedImages.current.filter(img => selectedImageIds.includes(img.id));
    const duplicates: ImageBlock[] = targets.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      x: t.x + 30,
      y: t.y + 30,
    }));
    const updated = [...committedImages.current, ...duplicates];
    committedImages.current = updated;
    setImages(updated);
    setSelectedImageIds(duplicates.map(d => d.id));
    triggerSave();
  }

  function handleToggleLockSelectedImages() {
    if (selectedImageIds.length === 0) return;
    const targets = committedImages.current.filter(img => selectedImageIds.includes(img.id));
    const anyUnlocked = targets.some(img => !img.locked);
    const targetSet = new Set(selectedImageIds);
    const updated = committedImages.current.map(img => {
      if (targetSet.has(img.id)) {
        return { ...img, locked: anyUnlocked };
      }
      return img;
    });
    committedImages.current = updated;
    setImages(updated);
    triggerSave();
  }

  // Combine / Group Multiple PDF Pages into One Consolidated Document
  async function handleGroupSelectedImages() {
    const targets = committedImages.current.filter(img => selectedImageIds.includes(img.id));
    if (targets.length < 2) return;

    // Sort by vertical position (Y coordinate) from top to bottom
    targets.sort((a, b) => a.y - b.y);

    try {
      // Load all images
      const loadedImages = await Promise.all(
        targets.map(t => new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          if (t.src.startsWith('http')) img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = t.originalSrc || t.src;
        }))
      );

      const gap = 16; // 16px page break gap between consecutive pages
      const maxWidth = Math.max(...loadedImages.map(img => img.naturalWidth || 800));

      const totalHeight = loadedImages.reduce((sum, img) => {
        const naturalW = img.naturalWidth || maxWidth;
        const naturalH = img.naturalHeight || 600;
        const scaledH = (naturalH / naturalW) * maxWidth;
        return sum + scaledH;
      }, 0) + (loadedImages.length - 1) * gap;

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(maxWidth);
      canvas.height = Math.round(totalHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clean white paper background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentY = 0;
      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];
        const naturalW = img.naturalWidth || maxWidth;
        const naturalH = img.naturalHeight || 600;
        const renderW = maxWidth;
        const renderH = (naturalH / naturalW) * maxWidth;

        ctx.drawImage(img, 0, currentY, renderW, renderH);
        currentY += renderH;

        // Draw clean divider line between pages
        if (i < loadedImages.length - 1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, currentY + gap / 2);
          ctx.lineTo(maxWidth, currentY + gap / 2);
          ctx.stroke();
          ctx.restore();
          currentY += gap;
        }
      }

      const mergedDataUrl = canvas.toDataURL('image/png');

      const minX = Math.min(...targets.map(t => t.x));
      const minY = Math.min(...targets.map(t => t.y));
      const displayWidth = Math.max(...targets.map(t => t.width));
      const displayHeight = targets.reduce((sum, t) => sum + t.height, 0) + (targets.length - 1) * 8;

      const mergedBlock: ImageBlock = {
        id: crypto.randomUUID(),
        x: minX,
        y: minY,
        width: Math.round(displayWidth),
        height: Math.round(displayHeight),
        src: mergedDataUrl,
        originalSrc: mergedDataUrl,
        locked: false,
      };

      const targetIdSet = new Set(targets.map(t => t.id));
      const remaining = committedImages.current.filter(img => !targetIdSet.has(img.id));
      committedImages.current = [...remaining, mergedBlock];
      setImages([...committedImages.current]);
      setSelectedImageIds([mergedBlock.id]);
      triggerSave();
      redrawAll();
    } catch (err) {
      console.error('Error grouping PDF pages:', err);
    }
  }

  // Keyboard Shortcuts for Selected Objects (Delete, Cmd+D, Shift+C, Cmd+L, Cmd+G)
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

      if (selectedImageIds.length === 0) return;

      // 1. Delete or Backspace: Delete selected object(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedImages();
        return;
      }

      // 2. Cmd + D / Ctrl + D: Duplicate selected object(s)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelectedImages();
        return;
      }

      // 3. Shift + C: Crop selected object
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (selectedImageIds.length === 1) {
          setCroppingImageId(selectedImageIds[0]);
        }
        return;
      }

      // 4. Cmd + L / Ctrl + L: Lock / Unlock selected object(s)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleToggleLockSelectedImages();
        return;
      }

      // 5. Cmd + G / Ctrl + G: Group selected pages into one
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (selectedImageIds.length > 1) {
          handleGroupSelectedImages();
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIds]);

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
      [bgCanvasRef.current, canvasRef.current, overlayCanvasRef.current].forEach(c => {
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

  useEffect(() => {
    redrawAll();
  }, [template, theme, paperColor]);

  const redrawAll = useCallback(() => {
    setCanvasTransform({ x: panRef.current.x, y: panRef.current.y, zoom: zoomRef.current });
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

    const activePaperTheme = PAPER_THEMES[paperColor || (theme === 'dark' ? 'navy' : 'white')] || PAPER_THEMES.navy;

    // Draw background template to bgCanvas
    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bgCtx.fillStyle = activePaperTheme.bg;
        bgCtx.fillRect(0, 0, bgCanvas.width / dpr, bgCanvas.height / dpr);

        if (template !== 'blank') {
          bgCtx.save();
          bgCtx.translate(panRef.current.x, panRef.current.y);
          bgCtx.scale(zoomRef.current, zoomRef.current);
          
          const vpX = -panRef.current.x / zoomRef.current;
          const vpY = -panRef.current.y / zoomRef.current;
          const vpW = (bgCanvas.width / dpr) / zoomRef.current;
          const vpH = (bgCanvas.height / dpr) / zoomRef.current;
          
          bgCtx.strokeStyle = activePaperTheme.lineColor;
          bgCtx.fillStyle = activePaperTheme.dotColor;
          bgCtx.lineWidth = 1 / zoomRef.current;
          bgCtx.beginPath();
          
          const startX = Math.floor(vpX / 40) * 40;
          const startY = Math.floor(vpY / 40) * 40;
          
          if (template === 'ruled' || template === 'cornell') {
            for (let y = startY; y < vpY + vpH; y += 40) {
              bgCtx.moveTo(vpX, y); bgCtx.lineTo(vpX + vpW, y);
            }
            if (template === 'cornell') {
              bgCtx.moveTo(startX + 120, vpY); bgCtx.lineTo(startX + 120, vpY + vpH);
            }
            bgCtx.stroke();
          } else if (template === 'grid') {
            for (let y = startY; y < vpY + vpH; y += 40) { bgCtx.moveTo(vpX, y); bgCtx.lineTo(vpX + vpW, y); }
            for (let x = startX; x < vpX + vpW; x += 40) { bgCtx.moveTo(x, vpY); bgCtx.lineTo(x, vpY + vpH); }
            bgCtx.stroke();
          } else if (template === 'dotted') {
            for (let y = startY; y < vpY + vpH; y += 40) {
              for (let x = startX; x < vpX + vpW; x += 40) {
                bgCtx.moveTo(x, y);
                bgCtx.arc(x, y, 1.4 / zoomRef.current, 0, Math.PI * 2);
              }
            }
            bgCtx.fill();
          }
          bgCtx.restore();
        }
      }
    }

    // 1. Draw Highlighters underneath (so math notes and pen ink stay 100% visible!)
    committedStrokes.current.forEach(stroke => {
      if (stroke.tool === 'highlighter') {
        drawStroke(ctx, stroke);
      }
    });

    // 2. Draw Pen, Shapes, and Eraser marks on top
    committedStrokes.current.forEach(stroke => {
      if (stroke.tool !== 'highlighter') {
        if ((stroke as any).shape) {
          drawShapeStroke(ctx, stroke);
        } else {
          drawStroke(ctx, stroke);
        }
      }
    });

    ctx.restore();
  }, [template, theme, paperColor]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if ((stroke as any).shape) return; // Shapes drawn separately

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

      // If active/hidden, draw a subtle diagonal paper tape micro-pattern
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
    setEditingTextBox(null);
    setEditingImage(null);
    if (!e.shiftKey) {
      setSelectedImageIds([]);
      setCroppingImageId(null);
    }
    setSelectedStrokes([]);

    if (e.pointerType === 'touch' && settings.palmRejection && tool !== 'ruler') {
      return;
    }
    if (e.pointerType === 'touch' && !settings.palmRejection && tool !== 'ruler') {
      isPanningRef.current = true;
      lastTouchPanRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (tool === 'select') {
      const pos = getPointerPos(e);
      const clickedTape = committedStrokes.current.find(s => {
        if (s.tool !== 'tape') return false;
        const radius = (s.width || 32) / 2 + 10;
        return s.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= radius);
      });
      if (clickedTape) {
        clickedTape.isRevealed = !clickedTape.isRevealed;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
        redrawAll();
        triggerSave();
        return;
      }
      isPanningRef.current = true;
      lastTouchPanRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (tool === 'lasso') {
      isLassoing.current = true;
      lassoPolygon.current = [getPointerPos(e)];
      return;
    }
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
      const pos = getPointerPos(e);
      // Trigger file input for images and PDFs
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = async (fileEvent) => {
        const file = (fileEvent.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          
          let currentY = pos.y;
          const newImages = [];
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            tempCanvas.width = viewport.width;
            tempCanvas.height = viewport.height;
            
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              await page.render({ canvasContext: ctx, viewport } as any).promise;
              const src = tempCanvas.toDataURL('image/png');
              const displayWidth = viewport.width / 2;
              const displayHeight = viewport.height / 2;
              
              newImages.push({
                id: crypto.randomUUID(),
                x: pos.x,
                y: currentY,
                width: displayWidth,
                height: displayHeight,
                src,
              });
              currentY += displayHeight + 20;
            }
          }
          
          committedImages.current = [...committedImages.current, ...newImages];
          setImages([...committedImages.current]);
          triggerSave();
          redrawAll();
        } else {
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
    if (tool === 'ruler') return;

    const pos = getPointerPos(e);

    // If tool is 'tape', check if user tapped on an existing tape stroke to peel/reveal it!
    if (tool === 'tape') {
      const clickedTape = committedStrokes.current.find(s => {
        if (s.tool !== 'tape') return false;
        const radius = (s.width || 32) / 2 + 10;
        return s.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= radius);
      });
      if (clickedTape) {
        clickedTape.isRevealed = !clickedTape.isRevealed;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
        redrawAll();
        triggerSave();
        return;
      }
    }

    isDrawing.current = true;
    autoShapeData.current = null;
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    currentStroke.current = [pos];

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (isPanningRef.current && e.pointerType === 'touch') {
      if (lastTouchPanRef.current) {
        const dx = e.clientX - lastTouchPanRef.current.x;
        const dy = e.clientY - lastTouchPanRef.current.y;
        panRef.current.x += dx;
        panRef.current.y += dy;
        lastTouchPanRef.current = { x: e.clientX, y: e.clientY };
        redrawAll();
      }
      return;
    }
    if (tool === 'select') {
      if (isPanningRef.current && lastTouchPanRef.current) {
        const dx = e.clientX - lastTouchPanRef.current.x;
        const dy = e.clientY - lastTouchPanRef.current.y;
        panRef.current.x += dx;
        panRef.current.y += dy;
        lastTouchPanRef.current = { x: e.clientX, y: e.clientY };
        redrawAll();
      }
      return;
    }
    if (!isDrawing.current && !isLassoing.current) return;
    if (e.pointerType === 'touch' && settings.palmRejection) return;

    const pos = getPointerPos(e);
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    // Handle Lasso Polygon
    if (isLassoing.current) {
      lassoPolygon.current.push(pos);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.strokeStyle = '#32ADE6';
      ctx.lineWidth = 2 / zoomRef.current;
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

    if (tool === 'shapes' && shapeStartRef.current) {
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
      } else if (type === 'arrow') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        const angle = Math.atan2(h, w);
        const headlen = 15;
        ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    currentStroke.current.push(pos);

    // Controlled Hold-to-shape detection timeout (ONLY triggers if held still for 500ms!)
    if (tool === 'pen' && settings.holdToShape !== false) {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = setTimeout(() => {
        if (!isDrawing.current || currentStroke.current.length < 8) return;
        const detected = detectHoldShape(currentStroke.current);
        if (detected) {
          autoShapeData.current = detected;
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
          ctx.save();
          ctx.translate(panRef.current.x, panRef.current.y);
          ctx.scale(zoomRef.current, zoomRef.current);
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

    if (!autoShapeData.current) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

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
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (tool === 'select') {
      isPanningRef.current = false;
      lastTouchPanRef.current = null;
      return;
    }

    if (isPanningRef.current && e.pointerType === 'touch') {
      isPanningRef.current = false;
      lastTouchPanRef.current = null;
      return;
    }

    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    const clearOverlay = () => {
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    };

    // 1. Handle Lasso Completion
    if (isLassoing.current) {
      isLassoing.current = false;
      clearOverlay();
      if (lassoPolygon.current.length > 5) {
        const selected: string[] = [];
        committedStrokes.current.forEach(s => {
          if (s.points.some(pt => isPointInPolygon(pt, lassoPolygon.current))) {
            selected.push(s.id);
          }
        });
        if (selected.length > 0) {
          setSelectedStrokes(selected);
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
        }
      }
      lassoPolygon.current = [];
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    // 2. Commit auto-shape (ONLY if Hold-to-Shape was intentionally triggered)
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
      committedStrokes.current.push(shapeStroke);
      undoStackRef.current.push([shapeStroke]);
      redoStackRef.current = [];
      autoShapeData.current = null;
      clearOverlay();
      redrawAll();
      triggerSave();
      return;
    }

    // 3. Handle Manual Shapes Tool
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
        } else if (type === 'arrow') {
          const angle = Math.atan2(h, w);
          const headlen = 15;
          const x1 = pos.x - headlen * Math.cos(angle - Math.PI / 6);
          const y1 = pos.y - headlen * Math.sin(angle - Math.PI / 6);
          const x2 = pos.x - headlen * Math.cos(angle + Math.PI / 6);
          const y2 = pos.y - headlen * Math.sin(angle + Math.PI / 6);
          path = `M ${start.x} ${start.y} L ${pos.x} ${pos.y} M ${x1} ${y1} L ${pos.x} ${pos.y} L ${x2} ${y2}`;
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
        undoStackRef.current.push([shapeStroke as Stroke]);
        redoStackRef.current = [];
      }
      shapeStartRef.current = null;
      clearOverlay();
      redrawAll();
      triggerSave();
      return;
    }

    if (currentStroke.current.length < 2) {
      clearOverlay();
      return;
    }

    // 4. Scribble to Erase (GoodNotes signature scratch-out!)
    if ((tool === 'pen' || tool === 'highlighter') && settings.scribbleToErase !== false) {
      const scribble = detectScribble(currentStroke.current);
      if (scribble) {
        const originalCount = committedStrokes.current.length;
        const remaining = committedStrokes.current.filter(s => !strokeIntersectsBox(s, scribble.bounds));
        if (remaining.length < originalCount) {
          const removed = committedStrokes.current.filter(s => strokeIntersectsBox(s, scribble.bounds));
          committedStrokes.current = remaining;
          if (removed.length > 0) {
            undoStackRef.current.push(removed);
            redoStackRef.current = [];
          }
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(35);
          }
          currentStroke.current = [];
          clearOverlay();
          redrawAll();
          triggerSave();
          return;
        }
      }
    }

    // 5. Normal Handwriting Ink or Study Tape
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

    committedStrokes.current = [...committedStrokes.current, newStroke];
    undoStackRef.current.push([newStroke]);
    redoStackRef.current = [];
    currentStroke.current = [];
    clearOverlay();
    redrawAll();
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

  const handleOverlayPointerDown = (e: React.PointerEvent, id: string, type: 'text' | 'image', initialX: number, initialY: number) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragDataRef.current = { id, type, startX: e.clientX, startY: e.clientY, initialX, initialY };
    if (type === 'text') {
      setEditingTextBox(id);
      setEditingImage(null);
    } else {
      setEditingImage(id);
      setEditingTextBox(null);
    }
  };
  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!dragDataRef.current) return;
    e.stopPropagation();
    const dx = (e.clientX - dragDataRef.current.startX) / zoomRef.current;
    const dy = (e.clientY - dragDataRef.current.startY) / zoomRef.current;
    const newX = dragDataRef.current.initialX + dx;
    const newY = dragDataRef.current.initialY + dy;
    
    if (dragDataRef.current.type === 'text') {
      const updated = textBoxes.map(t => t.id === dragDataRef.current!.id ? { ...t, x: newX, y: newY } : t);
      setTextBoxes(updated);
      committedTextBoxes.current = updated;
    } else {
      const updated = images.map(i => i.id === dragDataRef.current!.id ? { ...i, x: newX, y: newY } : i);
      setImages(updated);
      committedImages.current = updated;
    }
  };
  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (!dragDataRef.current) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragDataRef.current = null;
    triggerSave();
  };

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
      {/* 1. Paper Background */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" style={{ touchAction: 'none', zIndex: 1 }} />

      {/* 2. World-space Document / Image & Text Layer (Rendered underneath ink in pen mode, and on top in select mode!) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.zoom})`,
          transformOrigin: '0 0',
          zIndex: (tool === 'select' || tool === 'image') ? 25 : 5,
        }}
      >
        {/* Interactive PDF & Image Objects */}
        {images.map(img => (
          <ImageElementOverlay
            key={img.id}
            image={img}
            isSelected={selectedImageIds.includes(img.id)}
            onSelect={(isMulti) => handleSelectImage(img.id, isMulti)}
            onUpdate={(updates) => handleUpdateImage(img.id, updates)}
            onDelete={() => handleDeleteImage(img.id)}
            onDuplicate={() => handleDuplicateImage(img.id)}
            zoom={canvasTransform.zoom}
            tool={tool}
            isCropping={croppingImageId === img.id}
            onSetCropping={(c) => setCroppingImageId(c ? img.id : null)}
            onStartMove={() => handleStartMoveSelected(img.id)}
            onMoveDelta={handleMoveDelta}
            onEndMove={handleEndMove}
            showSingleBar={selectedImageIds.length <= 1}
          />
        ))}

        {/* Text boxes overlay */}
        {textBoxes.map(tb => (
          <div
            key={tb.id}
            className="absolute"
            onPointerDown={(e) => handleOverlayPointerDown(e, tb.id, 'text', tb.x, tb.y)}
            onPointerMove={handleOverlayPointerMove}
            onPointerUp={handleOverlayPointerUp}
            onPointerCancel={handleOverlayPointerUp}
            style={{
              left: tb.x,
              top: tb.y,
              minWidth: 100,
              minHeight: 30,
              zIndex: 20,
              pointerEvents: (tool === 'text' || editingTextBox === tb.id) ? 'auto' : 'none',
            }}
          >
            {editingTextBox === tb.id ? (
              <div className="relative">
                <textarea
                  autoFocus
                  value={tb.text}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={e => handleTextBoxChange(tb.id, e.target.value)}
                  onBlur={handleTextBoxBlur}
                  className="w-full min-h-[40px] bg-transparent border rounded-lg p-2 text-sm resize-both outline-none focus:ring-2 focus:ring-[var(--accent)]"
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
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteTextBox(tb.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center pointer-events-auto z-20"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                className="cursor-move bg-transparent rounded p-1 min-h-[24px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors pointer-events-none"
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

      {/* 3. Main Handwriting Ink Canvas (Rendered ON TOP of the PDF!) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ touchAction: 'none', zIndex: 10 }}
      />

      {/* 4. Interactive Overlay Canvas (Captures Pen, Highlighter, Eraser gestures!) */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0"
        style={{ touchAction: 'none', zIndex: 15 }}
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

      {/* Floating Lasso Actions */}
      {selectedStrokes.length > 0 && (
        <div
          className="absolute top-6 right-6 z-30 flex items-center gap-2 p-1.5 rounded-2xl glass-panel shadow-2xl animate-fade-in pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xs font-semibold px-2 py-1" style={{ color: 'var(--text-muted)' }}>
            {selectedStrokes.length} selected
          </span>
          <button
            onClick={() => {
              const newStrokes: Stroke[] = [];
              committedStrokes.current.forEach(s => {
                if (selectedStrokes.includes(s.id)) {
                  newStrokes.push({
                    ...s,
                    id: crypto.randomUUID(),
                    points: s.points.map(p => ({ ...p, x: p.x + 30, y: p.y + 30 })),
                  });
                }
              });
              committedStrokes.current = [...committedStrokes.current, ...newStrokes];
              setSelectedStrokes([]);
              redrawAll();
              triggerSave();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: 'var(--text-primary)' }}
          >
            Duplicate
          </button>
          <button
            onClick={() => {
              committedStrokes.current = committedStrokes.current.filter(s => !selectedStrokes.includes(s.id));
              setSelectedStrokes([]);
              redrawAll();
              triggerSave();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-1.5"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedStrokes([])}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Multi-Selection Action Bar for Images / PDF Pages */}
      {selectedImageIds.length > 1 && (
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 rounded-2xl glass-panel shadow-2xl animate-fade-in pointer-events-auto border border-black/10 dark:border-white/10"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xs font-bold px-2 py-1 text-[var(--text-muted)]">
            {selectedImageIds.length} pages selected
          </span>
          <button
            type="button"
            onClick={handleGroupSelectedImages}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            title="Group selected pages into one continuous document (⌘G)"
          >
            <span>⧉ Group Pages into One</span>
          </button>
          <button
            type="button"
            onClick={handleToggleLockSelectedImages}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)] flex items-center gap-1.5 transition-all shadow-sm"
            title="Lock / Unlock all selected (⌘L)"
          >
            <span>Lock / Unlock</span>
          </button>
          <button
            type="button"
            onClick={handleDuplicateSelectedImages}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)] flex items-center gap-1.5 transition-all shadow-sm"
            title="Duplicate all selected (⌘D)"
          >
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteSelectedImages}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1.5 transition-all shadow-sm"
            title="Delete all selected (Delete / Backspace)"
          >
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
});

CanvasEditor.displayName = 'CanvasEditor';
export default CanvasEditor;
