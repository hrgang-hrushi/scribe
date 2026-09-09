'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { PlaygroundDesign, ColoringTool, EyedropperState } from '@/lib/playground-types';
import { playBrushStroke, playSiliconePop, playGentleChime } from '@/lib/playground-sound';
import { ZoomIn, ZoomOut, Maximize2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { isPalmTouch, calibratePressure } from '@/lib/canvas-gestures';

export interface ColoringCanvasRef {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearCanvas: () => void;
  loadReferenceColors?: () => void;
  getFilledCount: () => number;
  exportImage: () => string;
}

interface ColoringCanvasProps {
  design: PlaygroundDesign;
  activeColor: string;
  activeTool: ColoringTool;
  brushSize: number;
  brushOpacity: number;
  eyedropperState: EyedropperState;
  onUpdateEyedropper: (state: Partial<EyedropperState>) => void;
  onColorSampled: (color: string) => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const ColoringCanvas = forwardRef<ColoringCanvasRef, ColoringCanvasProps>(({
  design,
  activeColor,
  activeTool,
  brushSize,
  brushOpacity,
  eyedropperState,
  onUpdateEyedropper,
  onColorSampled,
  soundEnabled,
  hapticsEnabled,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenHitRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom Gesture Transform
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // "Inside The Lines" Path-Bounded Drawing Mode (default true)
  const [clipToPath, setClipToPath] = useState(true);
  const clipToPathRef = useRef(clipToPath);
  clipToPathRef.current = clipToPath;

  // Multi-touch gestures (Two-finger pan and pinch zoom)
  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const panStartMidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartTransformRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);
  const lastPenTime = useRef(0);
  const isPenActive = useRef(false);
  const hasStylusDevice = useRef(false);

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const activeSegmentIdRef = useRef<string | null>(null);
  const [hoverSegmentId, setHoverSegmentId] = useState<string | null>(null);
  const soundThrottleRef = useRef<number>(0);

  // History for Instant Reliable Undo & Redo
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [, setHistoryVersion] = useState(0);

  // Colored segments tracker for progress
  const coloredSegmentsRef = useRef<Set<string>>(new Set());

  // Pre-compiled Path2D objects for hit-testing and masking
  const path2dMapRef = useRef<Map<string, Path2D>>(new Map());

  // Compile Path2D objects whenever design changes
  useEffect(() => {
    const map = new Map<string, Path2D>();
    design.segments.forEach(seg => {
      try {
        map.set(seg.id, new Path2D(seg.d));
      } catch (e) {
        console.error('Error compiling Path2D for segment', seg.id, e);
      }
    });
    path2dMapRef.current = map;
  }, [design]);

  // Push Drawing Canvas Snapshot to History
  const pushSnapshot = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > 35) undoStackRef.current.shift();
      redoStackRef.current = [];
      setHistoryVersion(v => v + 1);
    } catch {}
  }, []);

  // Initialize Base Mat Canvas, Drawing Canvas, and Masking Buffers
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!baseCanvas || !drawingCanvas) return;

    const baseCtx = baseCanvas.getContext('2d');
    const drawCtx = drawingCanvas.getContext('2d');
    if (!baseCtx || !drawCtx) return;

    const dpr = 2;
    const width = design.width;
    const height = design.height;

    baseCanvas.width = width * dpr;
    baseCanvas.height = height * dpr;
    drawingCanvas.width = width * dpr;
    drawingCanvas.height = height * dpr;

    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Render Base Silicone Mat Background with Beveled Rim
    baseCtx.clearRect(0, 0, width, height);

    // Heavy mat border
    baseCtx.fillStyle = '#031418';
    baseCtx.beginPath();
    baseCtx.roundRect(4, 4, width - 8, height - 8, 30);
    baseCtx.fill();

    // Inner silicone plate
    baseCtx.fillStyle = design.baseColor;
    baseCtx.beginPath();
    baseCtx.roundRect(14, 14, width - 28, height - 28, 22);
    baseCtx.fill();

    // 2. Render Grooves on Base Plate (Recessed dark trenches)
    design.segments
      .filter(s => s.type === 'groove')
      .forEach(seg => {
        const p2d = path2dMapRef.current.get(seg.id);
        if (!p2d) return;

        // Shadow trench
        baseCtx.save();
        baseCtx.strokeStyle = design.grooveColor || '#041A20';
        baseCtx.lineWidth = seg.strokeWidth || 14;
        baseCtx.lineCap = seg.strokeLinecap || 'round';
        baseCtx.lineJoin = 'round';
        baseCtx.stroke(p2d);
        baseCtx.restore();
      });

    // 3. Render Baseline 3D Silicone Noodles (Tactile Frosted Uncolored Template)
    design.segments
      .filter(s => s.type === 'cord' || s.type === 'ridge' || s.type === 'accent')
      .sort((a, b) => (a.zIndex || 5) - (b.zIndex || 5))
      .forEach(seg => {
        const p2d = path2dMapRef.current.get(seg.id);
        if (!p2d) return;

        baseCtx.save();
        // Base cord body: tactile frosted silicone template (deep teal-grey cord channel)
        // Provides the 3D tactile shape waiting for user's vibrant hand-painted color!
        baseCtx.strokeStyle = '#0E3E48';
        baseCtx.lineWidth = seg.strokeWidth || 22;
        baseCtx.lineCap = seg.strokeLinecap || 'round';
        baseCtx.lineJoin = 'round';
        baseCtx.stroke(p2d);

        // Core soft highlight for authentic 3D cylindrical volume
        baseCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        baseCtx.lineWidth = (seg.strokeWidth || 22) * 0.42;
        baseCtx.stroke(p2d);
        baseCtx.restore();
      });

    // Clear Drawing Canvas
    drawCtx.clearRect(0, 0, width, height);

    // Setup Scratch & Mask Buffers for 120 FPS Bounded Stamping
    const scratch = document.createElement('canvas');
    scratch.width = width * dpr;
    scratch.height = height * dpr;
    scratchCanvasRef.current = scratch;

    const mask = document.createElement('canvas');
    mask.width = width * dpr;
    mask.height = height * dpr;
    maskCanvasRef.current = mask;

    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = width;
    hitCanvas.height = height;
    offscreenHitRef.current = hitCanvas;

    // Reset history
    undoStackRef.current = [];
    redoStackRef.current = [];
    coloredSegmentsRef.current.clear();
    setTransform({ x: 0, y: 0, scale: 1 });

    // Initial snapshot
    pushSnapshot();
  }, [design, pushSnapshot]);

  // Imperative Ref API for Undo / Redo / Reset / Export
  useImperativeHandle(ref, () => ({
    undo: () => {
      const canvas = drawingCanvasRef.current;
      if (!canvas || undoStackRef.current.length <= 1) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const current = undoStackRef.current.pop()!;
      redoStackRef.current.push(current);
      const prev = undoStackRef.current[undoStackRef.current.length - 1];
      ctx.putImageData(prev, 0, 0);
      setHistoryVersion(v => v + 1);
      if (soundEnabled) playBrushStroke(true);
    },
    redo: () => {
      const canvas = drawingCanvasRef.current;
      if (!canvas || redoStackRef.current.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push(next);
      ctx.putImageData(next, 0, 0);
      setHistoryVersion(v => v + 1);
      if (soundEnabled) playBrushStroke(true);
    },
    canUndo: undoStackRef.current.length > 1,
    canRedo: redoStackRef.current.length > 0,
    clearCanvas: () => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pushSnapshot();
      coloredSegmentsRef.current.clear();
      if (soundEnabled) playGentleChime(true);
    },
    loadReferenceColors: () => {
      const drawCanvas = drawingCanvasRef.current;
      if (!drawCanvas) return;
      const ctx = drawCanvas.getContext('2d');
      if (!ctx) return;

      const dpr = 2;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      design.segments
        .filter(s => s.type === 'cord' || s.type === 'ridge' || s.type === 'accent')
        .sort((a, b) => (a.zIndex || 5) - (b.zIndex || 5))
        .forEach(seg => {
          const p2d = path2dMapRef.current.get(seg.id);
          if (!p2d) return;
          ctx.lineCap = seg.strokeLinecap || 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = seg.strokeWidth || 22;
          ctx.strokeStyle = seg.defaultColor;
          ctx.stroke(p2d);
          coloredSegmentsRef.current.add(seg.id);
        });

      ctx.restore();
      pushSnapshot();
      if (soundEnabled) playSiliconePop(true);
    },
    getFilledCount: () => coloredSegmentsRef.current.size,
    exportImage: () => {
      // Merge Base Canvas + Drawing Canvas into single PNG
      const width = design.width;
      const height = design.height;
      const merged = document.createElement('canvas');
      const dpr = 2;
      merged.width = width * dpr;
      merged.height = height * dpr;
      const ctx = merged.getContext('2d');
      if (!ctx) return '';

      if (baseCanvasRef.current) ctx.drawImage(baseCanvasRef.current, 0, 0);
      if (drawingCanvasRef.current) ctx.drawImage(drawingCanvasRef.current, 0, 0);
      return merged.toDataURL('image/png');
    },
  }));

  // Coordinate Conversion (Viewport Screen X/Y -> Canvas Artwork Space X/Y)
  // Uses getBoundingClientRect on the artwork element directly to guarantee 100% pixel-perfect accuracy across any screen size, aspect ratio, or zoom level!
  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const artwork = artworkRef.current;
    if (!artwork) return { x: 0, y: 0 };
    const rect = artwork.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

    const x = ((clientX - rect.left) / rect.width) * design.width;
    const y = ((clientY - rect.top) / rect.height) * design.height;

    return {
      x: Math.max(0, Math.min(design.width, x)),
      y: Math.max(0, Math.min(design.height, y)),
    };
  }, [design.width, design.height]);

  // Robust Hit-Testing: Accurately detects which curly noodle or groove was touched
  const findHitSegment = useCallback((canvasX: number, canvasY: number): string | null => {
    const offscreen = offscreenHitRef.current;
    if (!offscreen) return null;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    // Check top-level cords first (reverse z-order)
    const cords = design.segments.filter(s => s.type !== 'groove');
    for (let i = cords.length - 1; i >= 0; i--) {
      const seg = cords[i];
      const p2d = path2dMapRef.current.get(seg.id);
      if (!p2d) continue;

      offCtx.lineWidth = (seg.strokeWidth || 22) + 12;
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';

      if (offCtx.isPointInStroke(p2d, canvasX, canvasY)) {
        return seg.id;
      }
      if (seg.type === 'region' && offCtx.isPointInPath(p2d, canvasX, canvasY)) {
        return seg.id;
      }
    }

    // Then check groove channels in between
    const grooves = design.segments.filter(s => s.type === 'groove');
    for (let i = grooves.length - 1; i >= 0; i--) {
      const seg = grooves[i];
      const p2d = path2dMapRef.current.get(seg.id);
      if (!p2d) continue;

      offCtx.lineWidth = (seg.strokeWidth || 14) + 10;
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';

      if (offCtx.isPointInStroke(p2d, canvasX, canvasY)) {
        return seg.id;
      }
    }

    return null;
  }, [design.segments]);

  // Sample Pixel Color for Eyedropper Loupe
  const sampleColorAt = useCallback((canvasX: number, canvasY: number) => {
    const dpr = 2;
    const px = Math.floor(Math.max(0, Math.min(design.width * dpr - 1, canvasX * dpr)));
    const py = Math.floor(Math.max(0, Math.min(design.height * dpr - 1, canvasY * dpr)));

    // Try drawing canvas first (user's paint), then base canvas
    const drawCanvas = drawingCanvasRef.current;
    if (drawCanvas) {
      const dCtx = drawCanvas.getContext('2d');
      if (dCtx) {
        try {
          const pixel = dCtx.getImageData(px, py, 1, 1).data;
          if (pixel[3] > 20) {
            return `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
          }
        } catch {}
      }
    }

    const baseCanvas = baseCanvasRef.current;
    if (baseCanvas) {
      const bCtx = baseCanvas.getContext('2d');
      if (bCtx) {
        try {
          const pixel = bCtx.getImageData(px, py, 1, 1).data;
          return `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
        } catch {}
      }
    }

    return design.baseColor;
  }, [design.width, design.height, design.baseColor]);

  // Prepare Segment Mask: Creates the exact clipping boundary for the active curly noodle/groove
  const prepareMaskForSegment = useCallback((segmentId: string | null) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const dpr = 2;
    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    if (!segmentId) {
      // Freehand or unsegmented: mask the entire mat plate
      maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maskCtx.fillStyle = '#FFFFFF';
      maskCtx.beginPath();
      maskCtx.roundRect(14, 14, design.width - 28, design.height - 28, 22);
      maskCtx.fill();
      return;
    }

    const seg = design.segments.find(s => s.id === segmentId);
    const p2d = path2dMapRef.current.get(segmentId);
    if (seg && p2d) {
      maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maskCtx.lineCap = seg.strokeLinecap || 'round';
      maskCtx.lineJoin = 'round';
      maskCtx.lineWidth = seg.strokeWidth || (seg.type === 'groove' ? 14 : 22);
      maskCtx.strokeStyle = '#FFFFFF';
      maskCtx.fillStyle = '#FFFFFF';

      if (seg.type === 'region') {
        maskCtx.fill(p2d);
      } else {
        maskCtx.stroke(p2d);
      }
    }
  }, [design]);

  // Real Brush Inking Engine: Draws authentic paint strokes masked cleanly to the active path
  const drawBrushStroke = useCallback((
    from: { x: number; y: number },
    to: { x: number; y: number },
    tool: ColoringTool,
    color: string,
    size: number,
    opacity: number,
    segmentId: string | null
  ) => {
    const drawCanvas = drawingCanvasRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!drawCanvas || !scratchCanvas || !maskCanvas) return;

    const drawCtx = drawCanvas.getContext('2d');
    const scratchCtx = scratchCanvas.getContext('2d');
    if (!drawCtx || !scratchCtx) return;

    const dpr = 2;

    if (tool === 'eraser') {
      drawCtx.save();
      drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawCtx.globalCompositeOperation = 'destination-out';
      drawCtx.lineCap = 'round';
      drawCtx.lineJoin = 'round';
      drawCtx.lineWidth = size;
      drawCtx.beginPath();
      drawCtx.moveTo(from.x, from.y);
      drawCtx.lineTo(to.x, to.y);
      drawCtx.stroke();
      drawCtx.restore();
      return;
    }

    // 1. Draw raw brush strokes onto clean scratch canvas in 2x retina space
    scratchCtx.save();
    scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scratchCtx.lineCap = 'round';
    scratchCtx.lineJoin = 'round';

    if (tool === 'marker') {
      scratchCtx.strokeStyle = color;
      scratchCtx.globalAlpha = opacity;
      scratchCtx.lineWidth = size;
      scratchCtx.beginPath();
      scratchCtx.moveTo(from.x, from.y);
      scratchCtx.lineTo(to.x, to.y);
      scratchCtx.stroke();
    } else {
      // Soft watercolor / pastel brush: interpolated round soft dabs
      scratchCtx.fillStyle = color;
      scratchCtx.globalAlpha = opacity * 0.35;
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(dist / Math.max(2, size * 0.2)));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;
        scratchCtx.beginPath();
        scratchCtx.arc(x, y, size / 2, 0, Math.PI * 2);
        scratchCtx.fill();
      }
    }
    scratchCtx.restore();

    // 2. If path clipping is enabled, mask the stroke strictly inside the active noodle/groove
    if (clipToPathRef.current && segmentId) {
      scratchCtx.save();
      scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
      scratchCtx.globalCompositeOperation = 'destination-in';
      scratchCtx.drawImage(maskCanvas, 0, 0);
      scratchCtx.restore();
    }

    // 3. Blit masked paint stroke onto main drawing canvas (1:1 pixel blit at identity transform)
    drawCtx.save();
    drawCtx.setTransform(1, 0, 0, 1, 0, 0);
    drawCtx.globalCompositeOperation = 'source-over';
    drawCtx.drawImage(scratchCanvas, 0, 0);
    drawCtx.restore();

    // 4. Clear scratch canvas for next stamp
    scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);

    // Audio ASMR feedback
    const now = performance.now();
    if (soundEnabled && now - soundThrottleRef.current > 140) {
      playBrushStroke(true);
      soundThrottleRef.current = now;
    }
  }, [design.width, design.height, soundEnabled]);

  // Pointer Down (Start drawing / Eyedropper / Bucket fill)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') {
      lastPenTime.current = Date.now();
      isPenActive.current = true;
      hasStylusDevice.current = true;
    }

    // Multi-touch gestures (Pinch zoom & pan)
    if (e.pointerType === 'touch') {
      activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const inStylusSession =
        hasStylusDevice.current ||
        isPenActive.current ||
        Date.now() - lastPenTime.current < 4500;

      // Multi-layer palm rejection:
      if (isPalmTouch(e, inStylusSession)) {
        e.preventDefault();
        return;
      }

      // Clustered 3+ touch slap rejection
      if (activeTouchesRef.current.size >= 3) {
        e.preventDefault();
        return;
      }

      if (activeTouchesRef.current.size === 2) {
        const pts = Array.from(activeTouchesRef.current.values());
        const touchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (touchDist < 45) {
          e.preventDefault();
          return;
        }

        isPinchingRef.current = true;
        isDrawingRef.current = false;
        lastPointRef.current = null;

        pinchStartDistRef.current = touchDist;
        pinchStartScaleRef.current = transformRef.current.scale;
        panStartMidRef.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        panStartTransformRef.current = { x: transformRef.current.x, y: transformRef.current.y };
        return;
      }

      // In stylus session, single touches from palm or resting fingers should NEVER draw or fill paint
      if (inStylusSession) {
        e.preventDefault();
        return;
      }
    }

    if (isPinchingRef.current) return;

    const pt = getCanvasPoint(e.clientX, e.clientY);

    // Eyedropper sampling
    if (eyedropperState.active) {
      const sampledHex = sampleColorAt(pt.x, pt.y);
      onUpdateEyedropper({
        sampling: true,
        x: e.clientX,
        y: e.clientY,
        color: sampledHex,
      });
      return;
    }

    // Find touched segment
    const hitSegId = findHitSegment(pt.x, pt.y);
    activeSegmentIdRef.current = hitSegId;

    if (hitSegId) {
      coloredSegmentsRef.current.add(hitSegId);
    }

    // Bucket Tool: Flood-fills the touched curly noodle or groove
    if (activeTool === 'fill') {
      if (hitSegId) {
        const drawCanvas = drawingCanvasRef.current;
        if (!drawCanvas) return;
        const drawCtx = drawCanvas.getContext('2d');
        if (!drawCtx) return;

        const seg = design.segments.find(s => s.id === hitSegId);
        const p2d = path2dMapRef.current.get(hitSegId);
        if (seg && p2d) {
          const dpr = 2;
          drawCtx.save();
          drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawCtx.lineCap = seg.strokeLinecap || 'round';
          drawCtx.lineJoin = 'round';
          drawCtx.lineWidth = seg.strokeWidth || (seg.type === 'groove' ? 14 : 22);
          drawCtx.strokeStyle = activeColor;
          drawCtx.fillStyle = activeColor;

          if (seg.type === 'region') {
            drawCtx.fill(p2d);
          } else {
            drawCtx.stroke(p2d);
          }
          drawCtx.restore();

          pushSnapshot();
          if (soundEnabled) playSiliconePop(true);
          if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(18);
          }
        }
      }
      return;
    }

    // Setup mask for path-bounded drawing
    if (clipToPathRef.current) {
      prepareMaskForSegment(hitSegId);
    }

    // Start physical drawing stroke
    isDrawingRef.current = true;
    lastPointRef.current = pt;

    // Organic Apple Pencil pressure calibration
    const pressureFactor = calibratePressure(e.pressure, e.pointerType);
    const effectiveSize = brushSize * (0.75 + pressureFactor * 0.45);
    const effectiveOpacity = Math.min(1, brushOpacity * (0.8 + pressureFactor * 0.35));

    // Draw initial dab under pen
    drawBrushStroke(pt, pt, activeTool, activeColor, effectiveSize, effectiveOpacity, hitSegId);

    try {
      (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
    } catch {}
  };

  // Pointer Move (Drawing ink strokes / Eyedropper drag)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') {
      lastPenTime.current = Date.now();
      isPenActive.current = true;
      hasStylusDevice.current = true;
    }

    if (e.pointerType === 'touch') {
      const inStylusSession =
        hasStylusDevice.current ||
        isPenActive.current ||
        Date.now() - lastPenTime.current < 4500;

      if (isPalmTouch(e, inStylusSession)) {
        e.preventDefault();
        return;
      }

      // Two-finger pinch zoom & pan
      if (activeTouchesRef.current.has(e.pointerId)) {
        activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activeTouchesRef.current.size === 2 && isPinchingRef.current) {
          const pts = Array.from(activeTouchesRef.current.values());
          const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const currentMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

          if (pinchStartDistRef.current > 0) {
            const scaleDelta = currentDist / pinchStartDistRef.current;
            const newScale = Math.min(4.0, Math.max(0.75, pinchStartScaleRef.current * scaleDelta));

            const panDx = currentMid.x - panStartMidRef.current.x;
            const panDy = currentMid.y - panStartMidRef.current.y;

            setTransform({
              scale: newScale,
              x: panStartTransformRef.current.x + panDx,
              y: panStartTransformRef.current.y + panDy,
            });
          }
          return;
        }
      }

      if (inStylusSession && activeTouchesRef.current.size === 1) {
        e.preventDefault();
        return;
      }
    }

    if (isPinchingRef.current) return;

    // Eyedropper sampling
    if (eyedropperState.active && eyedropperState.sampling) {
      const pt = getCanvasPoint(e.clientX, e.clientY);
      const sampledHex = sampleColorAt(pt.x, pt.y);
      onUpdateEyedropper({
        x: e.clientX,
        y: e.clientY,
        color: sampledHex,
      });
      return;
    }

    const currentPt = getCanvasPoint(e.clientX, e.clientY);

    if (!isDrawingRef.current || !lastPointRef.current) {
      // Hover detection
      const hit = findHitSegment(currentPt.x, currentPt.y);
      setHoverSegmentId(hit);
      return;
    }

    // DRAW STROKE: Deposits smooth paint clipped to the active noodle/groove!
    const pressureFactor = calibratePressure(e.pressure, e.pointerType);
    const effectiveSize = brushSize * (0.75 + pressureFactor * 0.45);
    const effectiveOpacity = Math.min(1, brushOpacity * (0.8 + pressureFactor * 0.35));

    drawBrushStroke(
      lastPointRef.current,
      currentPt,
      activeTool,
      activeColor,
      effectiveSize,
      effectiveOpacity,
      activeSegmentIdRef.current
    );

    lastPointRef.current = currentPt;
  };

  // Pointer Up (Commit stroke to undo history)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') {
      isPenActive.current = false;
      lastPenTime.current = Date.now();
      try {
        (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (e.pointerType === 'touch') {
      activeTouchesRef.current.delete(e.pointerId);
      if (activeTouchesRef.current.size < 2) {
        isPinchingRef.current = false;
      }
    }

    if (eyedropperState.active && eyedropperState.sampling) {
      onColorSampled(eyedropperState.color);
      onUpdateEyedropper({ active: false, sampling: false });
      if (soundEnabled) playGentleChime(true);
      return;
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      activeSegmentIdRef.current = null;
      pushSnapshot();

      if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(14);
      }
    }
  };

  // Wheel zoom & pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(4.0, Math.max(0.75, prev.scale * zoomFactor)),
      }));
    } else {
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX * 0.75,
        y: prev.y - e.deltaY * 0.75,
      }));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 select-none touch-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
      style={{
        cursor: eyedropperState.active
          ? 'crosshair'
          : activeTool === 'eraser'
          ? 'cell'
          : 'crosshair',
      }}
    >
      {/* Zoomable & Pannable Artwork Container */}
      <div
        ref={artworkRef}
        className="relative shadow-2xl rounded-3xl overflow-hidden transition-transform duration-75 ease-out will-change-transform max-w-[calc(100vw-80px)] max-h-[calc(100vh-140px)]"
        style={{
          width: 'min(94vw, 1000px)',
          aspectRatio: design.aspectRatio,
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Layer 1: Base Silicone Mat & Groove Trenches */}
        <canvas
          ref={baseCanvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Layer 2: True Interactive Paint Canvas (Holds user's brush strokes & shading) */}
        <canvas
          ref={drawingCanvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Layer 3: 3D Silicone Lighting & Gloss Overlay (Specular Highlights on top) */}
        <svg
          viewBox={design.viewBox}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: design.width, height: design.height }}
        >
          <defs>
            <filter id="overlay-specular-sheen" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 3D Cylindrical Highlight Ribbons on Noodle Ridges */}
          <g filter="url(#overlay-specular-sheen)">
            {design.segments
              .filter(s => s.type === 'cord' || s.type === 'ridge' || s.type === 'accent')
              .sort((a, b) => (a.zIndex || 5) - (b.zIndex || 5))
              .map(seg => {
                const isHovered = hoverSegmentId === seg.id;
                return (
                  <g key={seg.id}>
                    {/* Ridge Specular Ribbon */}
                    <path
                      d={seg.d}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.45)"
                      strokeWidth={Math.max(3.5, (seg.strokeWidth || 22) * 0.22)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        mixBlendMode: 'overlay',
                      }}
                    />

                    {/* Subtle Hover Boundary Outline */}
                    {isHovered && (
                      <path
                        d={seg.d}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.6)"
                        strokeWidth={(seg.strokeWidth || 22) + 2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          opacity: 0.35,
                        }}
                      />
                    )}
                  </g>
                );
              })}
          </g>

          {/* Groove Channel Hover Boundary */}
          {hoverSegmentId && (
            <g>
              {design.segments
                .filter(s => s.id === hoverSegmentId && s.type === 'groove')
                .map(seg => (
                  <path
                    key={seg.id}
                    d={seg.d}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={(seg.strokeWidth || 14) + 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      opacity: 0.4,
                    }}
                  />
                ))}
            </g>
          )}
        </svg>
      </div>

      {/* Eyedropper Magnifier Loupe Overlay */}
      {eyedropperState.active && eyedropperState.sampling && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[130px] flex flex-col items-center gap-1.5 animate-fade-in"
          style={{ left: eyedropperState.x, top: eyedropperState.y }}
        >
          <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center bg-zinc-900 ring-2 ring-black/30">
            <div
              className="w-full h-full rounded-full transition-colors duration-75"
              style={{ background: eyedropperState.color }}
            />
            {/* Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full border border-white/80 shadow" />
              <div className="absolute w-2.5 h-[1.5px] bg-white/90" />
              <div className="absolute w-[1.5px] h-2.5 bg-white/90" />
            </div>
          </div>
          <div className="px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md text-white font-mono text-[11px] font-bold shadow-lg border border-white/15">
            {eyedropperState.color}
          </div>
        </div>
      )}

      {/* Floating Mode Indicator: Color Inside Lines vs Freehand */}
      <div className="absolute bottom-20 left-4 z-20 flex items-center gap-2 select-none">
        <button
          onClick={() => setClipToPath(!clipToPath)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold backdrop-blur-xl border transition-all shadow-lg ${
            clipToPath
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
              : 'bg-zinc-900/80 text-zinc-400 border-white/15 hover:text-white'
          }`}
          title={clipToPath ? 'Ink stays inside the current curly noodle/groove' : 'Draw freely anywhere across the mat'}
        >
          {clipToPath ? <ShieldCheck size={14} className="text-cyan-400" /> : <ShieldAlert size={14} />}
          <span>{clipToPath ? 'Inside Lines: ON' : 'Freehand: ON'}</span>
        </button>
      </div>

      {/* Bottom Corner Floating Zoom Controls */}
      <div className="absolute bottom-20 right-4 z-20 flex items-center gap-1 p-1 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/15 text-zinc-300 shadow-xl select-none">
        <button
          onClick={() =>
            setTransform(prev => ({
              ...prev,
              scale: Math.max(0.75, prev.scale - 0.2),
            }))
          }
          className="p-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="px-2 py-0.5 rounded-xl hover:bg-white/10 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors font-mono"
          title="Reset Zoom to 100%"
        >
          {Math.round(transform.scale * 100)}%
        </button>
        <button
          onClick={() =>
            setTransform(prev => ({
              ...prev,
              scale: Math.min(4.0, prev.scale + 0.2),
            }))
          }
          className="p-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="p-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors border-l border-white/10 ml-0.5"
          title="Fit to Screen"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
});

ColoringCanvas.displayName = 'ColoringCanvas';
export default ColoringCanvas;
