'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { PlaygroundDesign, ColoringTool, EyedropperState } from '@/lib/playground-types';
import { playBrushStroke, playSiliconePop, playGentleChime } from '@/lib/playground-sound';
import { Check, X } from 'lucide-react';

export interface ColoringCanvasRef {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearCanvas: () => void;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom Gesture Transform
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Multi-touch gestures (Two-finger pan and pinch zoom)
  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const panStartMidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartTransformRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const activeSegmentIdRef = useRef<string | null>(null);

  // History for Instant Reliable Undo & Redo
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [, setHistoryVersion] = useState(0);

  // Filled segments tracker for progress
  const filledSegmentsRef = useRef<Set<string>>(new Set());

  // Pre-compiled Path2D objects for lightning-fast hit-testing and clipping
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

  // Push Canvas Snapshot to History
  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > 30) undoStackRef.current.shift(); // Keep memory lean
      redoStackRef.current = [];
      setHistoryVersion(v => v + 1);
    } catch {}
  }, []);

  // Initialize Canvas & Restore or Fill Base Color
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Allocate canvas size matching design dimensions (High-DPI 2x for retina sharpness)
    const dpr = 2;
    canvas.width = design.width * dpr;
    canvas.height = design.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = design.baseColor;
    ctx.fillRect(0, 0, design.width, design.height);

    // Create offscreen canvas for hit testing
    const offscreen = document.createElement('canvas');
    offscreen.width = design.width;
    offscreen.height = design.height;
    offscreenRef.current = offscreen;

    // Reset history stacks
    undoStackRef.current = [];
    redoStackRef.current = [];
    filledSegmentsRef.current.clear();
    setTransform({ x: 0, y: 0, scale: 1 });

    // Initial base snapshot
    pushSnapshot();
  }, [design, pushSnapshot]);

  // Imperative Ref API for Parent Toolbar
  useImperativeHandle(ref, () => ({
    undo: () => {
      const canvas = canvasRef.current;
      if (!canvas || undoStackRef.current.length <= 1) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const current = undoStackRef.current.pop()!;
      redoStackRef.current.push(current);
      const prev = undoStackRef.current[undoStackRef.current.length - 1];
      ctx.putImageData(prev, 0, 0);
      setHistoryVersion(v => v + 1);
    },
    redo: () => {
      const canvas = canvasRef.current;
      if (!canvas || redoStackRef.current.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push(next);
      ctx.putImageData(next, 0, 0);
      setHistoryVersion(v => v + 1);
    },
    canUndo: undoStackRef.current.length > 1,
    canRedo: redoStackRef.current.length > 0,
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = design.baseColor;
      ctx.fillRect(0, 0, design.width, design.height);
      pushSnapshot();
      filledSegmentsRef.current.clear();
    },
    getFilledCount: () => filledSegmentsRef.current.size,
    exportImage: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/png') : '';
    },
  }));

  // Coordinate Conversion (Viewport Screen X/Y -> Artwork Design Space X/Y)
  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();

    // Center of container
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Offset from center with current pan & zoom
    const dx = clientX - centerX - transformRef.current.x;
    const dy = clientY - centerY - transformRef.current.y;

    const scaledX = dx / transformRef.current.scale;
    const scaledY = dy / transformRef.current.scale;

    // Convert to 0 -> design.width, 0 -> design.height
    return {
      x: scaledX + design.width / 2,
      y: scaledY + design.height / 2,
    };
  }, [design.width, design.height]);

  // Find Which Segment Path Was Hit
  const findHitSegment = useCallback((canvasX: number, canvasY: number): string | null => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return null;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    // Reverse iterate so top z-index segments are checked first
    for (let i = design.segments.length - 1; i >= 0; i--) {
      const seg = design.segments[i];
      const p2d = path2dMapRef.current.get(seg.id);
      if (p2d && offCtx.isPointInPath(p2d, canvasX, canvasY)) {
        return seg.id;
      }
    }
    return null;
  }, [design.segments]);

  // Sample Pixel Color at Coordinates
  const sampleColorAt = useCallback((canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#FFFFFF';
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#FFFFFF';

    const dpr = 2;
    const px = Math.floor(Math.max(0, Math.min(canvas.width - 1, canvasX * dpr)));
    const py = Math.floor(Math.max(0, Math.min(canvas.height - 1, canvasY * dpr)));

    try {
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
      return hex;
    } catch {
      return '#FFFFFF';
    }
  }, []);

  // Stroke Stamp Renderer (Draws soft anti-aliased round stamps clipped to active path)
  const drawStrokeSegment = useCallback((
    from: { x: number; y: number },
    to: { x: number; y: number },
    tool: ColoringTool,
    color: string,
    size: number,
    opacity: number,
    segmentId: string | null
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    const dpr = 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // PATH-BOUNDED CLIPPING: Restrict drawing strictly inside the touched region
    if (segmentId) {
      const clipPath = path2dMapRef.current.get(segmentId);
      if (clipPath) {
        ctx.clip(clipPath);
      }
    }

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    } else {
      // Soft Coloring Brush (Lake / Procreate style)
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity * 0.4;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    }

    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Interpolate points between from and to for silky smooth coverage
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (size * 0.25)));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    if (soundEnabled) playBrushStroke(true);
  }, [soundEnabled]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // 1. Two-finger touch gesture tracking
    if (e.pointerType === 'touch') {
      activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activeTouchesRef.current.size === 2) {
        isPinchingRef.current = true;
        isDrawingRef.current = false;
        lastPointRef.current = null;

        const pts = Array.from(activeTouchesRef.current.values());
        pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartScaleRef.current = transformRef.current.scale;
        panStartMidRef.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        panStartTransformRef.current = { x: transformRef.current.x, y: transformRef.current.y };
        return;
      }

      if (activeTouchesRef.current.size > 2) return;
    }

    // If currently pinching, ignore inking
    if (isPinchingRef.current) return;

    const pt = getCanvasPoint(e.clientX, e.clientY);

    // 2. Eyedropper Sampling Mode
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

    // 3. Find hit segment
    const hitSegId = findHitSegment(pt.x, pt.y);
    activeSegmentIdRef.current = hitSegId;

    if (hitSegId) {
      filledSegmentsRef.current.add(hitSegId);
    }

    // 4. Tap-To-Fill Bucket Tool
    if (activeTool === 'fill') {
      if (hitSegId) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const p2d = path2dMapRef.current.get(hitSegId);
        if (ctx && p2d) {
          ctx.save();
          const dpr = 2;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = activeColor;
          ctx.fill(p2d);
          ctx.restore();

          pushSnapshot();
          if (soundEnabled) playSiliconePop(true);
          if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(18);
          }
        }
      }
      return;
    }

    // 5. Inking (Brush, Marker, Eraser)
    isDrawingRef.current = true;
    lastPointRef.current = pt;

    // Draw initial dab
    drawStrokeSegment(pt, pt, activeTool, activeColor, brushSize, brushOpacity, hitSegId);

    try {
      (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Two-finger pinch & pan zoom
    if (e.pointerType === 'touch' && activeTouchesRef.current.has(e.pointerId)) {
      activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activeTouchesRef.current.size === 2 && isPinchingRef.current) {
        const pts = Array.from(activeTouchesRef.current.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const currentMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

        if (pinchStartDistRef.current > 0) {
          const scaleDelta = currentDist / pinchStartDistRef.current;
          const newScale = Math.min(4.5, Math.max(0.6, pinchStartScaleRef.current * scaleDelta));

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

    if (isPinchingRef.current) return;

    // Eyedropper Live Loupe Dragging
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

    if (!isDrawingRef.current || !lastPointRef.current) return;

    const currentPt = getCanvasPoint(e.clientX, e.clientY);

    drawStrokeSegment(
      lastPointRef.current,
      currentPt,
      activeTool,
      activeColor,
      brushSize,
      brushOpacity,
      activeSegmentIdRef.current
    );

    lastPointRef.current = currentPt;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      activeTouchesRef.current.delete(e.pointerId);
      if (activeTouchesRef.current.size < 2) {
        isPinchingRef.current = false;
      }
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      activeSegmentIdRef.current = null;
      pushSnapshot();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none bg-zinc-950/80"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Zoomable & Pannable Artwork Container */}
      <div
        className="relative shadow-2xl rounded-2xl overflow-hidden transition-transform ease-out will-change-transform bg-white border border-zinc-200 dark:border-zinc-800"
        style={{
          width: design.width,
          height: design.height,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 1. Underlying Paint & Coloring Canvas (Holds strokes, fills, watercolor textures) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: design.width, height: design.height }}
        />

        {/* 2. Top Crisp Line-Art Overlay (Never obscured by ink!) */}
        <svg
          viewBox={design.viewBox}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: design.width, height: design.height }}
        >
          {design.lineArtPaths ? (
            design.lineArtPaths.map((lp, idx) => (
              <path
                key={idx}
                d={lp.d}
                fill={lp.fill || 'none'}
                stroke={lp.color || '#18181B'}
                strokeWidth={lp.strokeWidth || 3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))
          ) : (
            design.segments.map(seg => (
              <path
                key={seg.id}
                d={seg.d}
                fill="none"
                stroke="#18181B"
                strokeWidth={seg.strokeWidth ? Math.max(3, seg.strokeWidth * 0.4) : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))
          )}
        </svg>
      </div>

      {/* 3. Eyedropper Magnifier Loupe Overlay (Matching 00:40 in Reference Video) */}
      {eyedropperState.active && eyedropperState.sampling && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[140px] flex flex-col items-center gap-2 animate-fade-in"
          style={{ left: eyedropperState.x, top: eyedropperState.y }}
        >
          {/* Circular Magnifier Loupe */}
          <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center bg-zinc-900">
            <div
              className="w-full h-full rounded-full transition-colors duration-100"
              style={{ background: eyedropperState.color }}
            />
            {/* Center Reticle Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-5 h-5 rounded-full border border-white/80 shadow" />
              <div className="absolute w-3 h-0.5 bg-white/90" />
              <div className="absolute w-0.5 h-3 bg-white/90" />
            </div>
          </div>
          {/* Color Hex Badge */}
          <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white font-mono text-xs font-bold tracking-wider shadow-lg border border-white/10">
            {eyedropperState.color}
          </div>
        </div>
      )}

      {/* Eyedropper Action Pill Bar (Matching Bottom Bar in Reference Video) */}
      {eyedropperState.active && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in">
          <span className="text-xs font-medium text-zinc-300">
            Tap anywhere to sample the color
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={() => onUpdateEyedropper({ active: false, sampling: false })}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={() => {
              onColorSampled(eyedropperState.color);
              onUpdateEyedropper({ active: false, sampling: false });
              if (soundEnabled) playGentleChime(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-white text-zinc-900 shadow-md hover:bg-zinc-100 transition-colors"
          >
            <Check size={13} /> Done
          </button>
        </div>
      )}
    </div>
  );
});

ColoringCanvas.displayName = 'ColoringCanvas';
export default ColoringCanvas;
