'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { PlaygroundDesign, ColoringTool, EyedropperState } from '@/lib/playground-types';
import type { ColoringCanvasRef } from './ColoringCanvas';
import { playSiliconePop, playGentleChime, playBrushStroke } from '@/lib/playground-sound';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface TactileMatCanvasProps {
  design: PlaygroundDesign;
  activeColor: string;
  activeTool: ColoringTool;
  brushSize?: number;
  brushOpacity?: number;
  eyedropperState: EyedropperState;
  onUpdateEyedropper: (state: Partial<EyedropperState>) => void;
  onColorSampled: (color: string) => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const TactileMatCanvas = forwardRef<ColoringCanvasRef, TactileMatCanvasProps>(({
  design,
  activeColor,
  activeTool,
  eyedropperState,
  onUpdateEyedropper,
  onColorSampled,
  soundEnabled,
  hapticsEnabled,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fills state: map of segmentId -> hex color
  const [fills, setFills] = useState<Record<string, string>>({});
  const fillsRef = useRef<Record<string, string>>({});
  fillsRef.current = fills;

  // Undo & Redo History Stacks
  const undoStackRef = useRef<Record<string, string>[]>([]);
  const redoStackRef = useRef<Record<string, string>[]>([]);
  const [, setHistoryVersion] = useState(0);

  // Stroke batching for brush tool
  const strokeStartFillsRef = useRef<Record<string, string> | null>(null);
  const isTracing = useRef(false);
  const lastFilledSegmentId = useRef<string | null>(null);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  // Pan & Pinch-to-Zoom transform
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Multi-touch gestures (Pinch-to-zoom and two-finger pan)
  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const panStartMidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartTransformRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);

  // Initialize fills when design changes
  useEffect(() => {
    const initial: Record<string, string> = {};
    design.segments.forEach(seg => {
      initial[seg.id] = seg.defaultColor;
    });
    setFills(initial);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setTransform({ x: 0, y: 0, scale: 1 });
    setHistoryVersion(v => v + 1);
  }, [design]);

  // Imperative API for Parent Toolbar
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (undoStackRef.current.length === 0) return;
      const prev = undoStackRef.current.pop()!;
      redoStackRef.current.push({ ...fillsRef.current });
      setFills(prev);
      setHistoryVersion(v => v + 1);
      if (soundEnabled) playBrushStroke(true);
    },
    redo: () => {
      if (redoStackRef.current.length === 0) return;
      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push({ ...fillsRef.current });
      setFills(next);
      setHistoryVersion(v => v + 1);
      if (soundEnabled) playBrushStroke(true);
    },
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    clearCanvas: () => {
      const resetFills: Record<string, string> = {};
      design.segments.forEach(seg => {
        resetFills[seg.id] = seg.defaultColor;
      });
      undoStackRef.current.push({ ...fillsRef.current });
      redoStackRef.current = [];
      setFills(resetFills);
      setHistoryVersion(v => v + 1);
      if (soundEnabled) playGentleChime(true);
    },
    loadReferenceColors: () => {
      const resetFills: Record<string, string> = {};
      design.segments.forEach(seg => {
        resetFills[seg.id] = seg.defaultColor;
      });
      undoStackRef.current.push({ ...fillsRef.current });
      redoStackRef.current = [];
      setFills(resetFills);
      setHistoryVersion(v => v + 1);
      if (soundEnabled) playSiliconePop(true);
    },
    getFilledCount: () => {
      let count = 0;
      design.segments.forEach(seg => {
        if (fillsRef.current[seg.id] && fillsRef.current[seg.id] !== seg.defaultColor) {
          count++;
        }
      });
      return count;
    },
    exportImage: () => {
      const svg = svgRef.current;
      if (!svg) return '';
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
    },
  }));

  // Sensory Feedback Trigger (Tactile pop & haptic)
  const triggerSensoryFeedback = useCallback((isCord: boolean) => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isCord ? [12, 25, 15] : 14);
    }
    if (soundEnabled) {
      if (isCord) {
        playSiliconePop(true);
      } else {
        playBrushStroke(true);
      }
    }
  }, [hapticsEnabled, soundEnabled]);

  // Apply color to a segment with bounded cut-off
  const applyColorToSegment = useCallback((segmentId: string) => {
    const targetSegment = design.segments.find(s => s.id === segmentId);
    if (!targetSegment) return;

    const targetColor = activeTool === 'eraser' ? targetSegment.defaultColor : activeColor;
    if (fillsRef.current[segmentId] === targetColor) return;

    setFills(prev => ({
      ...prev,
      [segmentId]: targetColor,
    }));

    triggerSensoryFeedback(targetSegment.type === 'cord' || targetSegment.type === 'ridge');
  }, [design.segments, activeTool, activeColor, triggerSensoryFeedback]);

  // Color Sampling for Eyedropper Loupe
  const sampleColorAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as SVGElement | null;
    const segmentId = el?.getAttribute('data-segment-id');
    if (segmentId) {
      const seg = design.segments.find(s => s.id === segmentId);
      const color = fillsRef.current[segmentId] || seg?.defaultColor || design.baseColor;
      onUpdateEyedropper({ x: clientX, y: clientY, color, sampling: true });
      return color;
    }
    onUpdateEyedropper({ x: clientX, y: clientY, color: design.baseColor, sampling: true });
    return design.baseColor;
  }, [design.segments, design.baseColor, onUpdateEyedropper]);

  // Pointer Down handler
  function handlePointerDown(e: React.PointerEvent) {
    // If Eyedropper mode is active
    if (eyedropperState.active) {
      const sampled = sampleColorAtPoint(e.clientX, e.clientY);
      onColorSampled(sampled);
      return;
    }

    // Touch gesture tracking for pinch zoom
    if (e.pointerType === 'touch') {
      activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouchesRef.current.size === 2) {
        isPinchingRef.current = true;
        isTracing.current = false;
        strokeStartFillsRef.current = null;
        const pts = Array.from(activeTouchesRef.current.values());
        pinchStartDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        pinchStartScaleRef.current = transformRef.current.scale;
        panStartMidRef.current = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        };
        panStartTransformRef.current = { x: transformRef.current.x, y: transformRef.current.y };
        return;
      }
    }

    if (isPinchingRef.current) return;

    // Start coloring stroke
    isTracing.current = true;
    strokeStartFillsRef.current = { ...fillsRef.current };
    lastFilledSegmentId.current = null;

    const target = e.target as SVGElement;
    const segmentId = target.getAttribute('data-segment-id');
    if (segmentId) {
      applyColorToSegment(segmentId);
      lastFilledSegmentId.current = segmentId;
    }
  }

  // Pointer Move handler (Continuous tracing / hover / eyedropper)
  function handlePointerMove(e: React.PointerEvent) {
    if (eyedropperState.active) {
      sampleColorAtPoint(e.clientX, e.clientY);
      return;
    }

    // Multi-touch pinch zoom & pan
    if (e.pointerType === 'touch' && activeTouchesRef.current.has(e.pointerId)) {
      activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouchesRef.current.size === 2) {
        const pts = Array.from(activeTouchesRef.current.values());
        const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const ratio = currentDist / Math.max(1, pinchStartDistRef.current);
        const newScale = Math.min(3.5, Math.max(0.75, pinchStartScaleRef.current * ratio));

        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const dx = midX - panStartMidRef.current.x;
        const dy = midY - panStartMidRef.current.y;

        setTransform({
          scale: newScale,
          x: panStartTransformRef.current.x + dx,
          y: panStartTransformRef.current.y + dy,
        });
        return;
      }
    }

    if (isPinchingRef.current) return;

    if (!isTracing.current) {
      // Hover preview highlighting
      const target = e.target as SVGElement;
      const segmentId = target.getAttribute('data-segment-id');
      setActiveHoverId(segmentId);
      return;
    }

    // While dragging/tracing across segments with finger or pen
    const el = document.elementFromPoint(e.clientX, e.clientY) as SVGElement | null;
    const segmentId = el?.getAttribute('data-segment-id');

    if (segmentId && segmentId !== lastFilledSegmentId.current) {
      applyColorToSegment(segmentId);
      lastFilledSegmentId.current = segmentId;
      setActiveHoverId(segmentId);
    }
  }

  // Pointer Up handler (Commit stroke to undo history)
  const handlePointerUp = useCallback((e?: React.PointerEvent | PointerEvent) => {
    if (e && 'pointerId' in e) {
      activeTouchesRef.current.delete(e.pointerId);
      if (activeTouchesRef.current.size < 2) {
        isPinchingRef.current = false;
      }
    }

    if (isTracing.current) {
      isTracing.current = false;
      lastFilledSegmentId.current = null;

      // If any fills changed during this drag/tap, push snapshot to undo history
      if (strokeStartFillsRef.current) {
        let changed = false;
        const start = strokeStartFillsRef.current;
        const curr = fillsRef.current;
        for (const k in curr) {
          if (curr[k] !== start[k]) {
            changed = true;
            break;
          }
        }
        if (changed) {
          undoStackRef.current.push(start);
          if (undoStackRef.current.length > 40) undoStackRef.current.shift();
          redoStackRef.current = [];
          setHistoryVersion(v => v + 1);
        }
        strokeStartFillsRef.current = null;
      }
    }
  }, []);

  // Global pointerup listener
  useEffect(() => {
    const onWinPointerUp = (e: PointerEvent) => handlePointerUp(e);
    window.addEventListener('pointerup', onWinPointerUp);
    return () => window.removeEventListener('pointerup', onWinPointerUp);
  }, [handlePointerUp]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(3.5, Math.max(0.75, prev.scale * zoomFactor)),
      }));
    } else {
      // Pan with 2-finger scroll
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
          : 'pointer',
      }}
    >
      {/* Zoomable & Pannable Mat Canvas Wrapper */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={design.viewBox}
          className="w-full max-w-[1060px] max-h-[75vh] drop-shadow-2xl rounded-3xl"
          style={{
            aspectRatio: design.aspectRatio,
          }}
        >
          <defs>
            {/* 3D Silicone Lighting & Texture Filters */}
            {/* 1. Deep Recessed Groove Trench Shadow Filter */}
            <filter id="groove-trench" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
              <feOffset in="blur" dx="0" dy="3.5" result="offsetBlur" />
              <feComponentTransfer in="offsetBlur" result="shadow">
                <feFuncA type="linear" slope="0.85" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* 2. Tactile 3D Cylindrical Silicone Noodle Specular Gloss Filter */}
            <filter id="silicone-cord-gloss" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5.5" floodColor="#000000" floodOpacity="0.48" />
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="blur" />
              <feSpecularLighting
                in="blur"
                surfaceScale="5.2"
                specularConstant="0.8"
                specularExponent="19"
                lightingColor="#FFFFFF"
                result="specular"
              >
                <fePointLight x="460" y="-180" z="420" />
              </feSpecularLighting>
              <feComposite in="specular" in2="SourceAlpha" operator="in" result="specularCut" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specularCut" />
              </feMerge>
            </filter>

            {/* 3. Outer Silicone Border Heavy Mat Drop Shadow */}
            <filter id="mat-rim-shadow" x="-6%" y="-6%" width="112%" height="112%">
              <feDropShadow dx="0" dy="16" stdDeviation="22" floodColor="#000000" floodOpacity="0.7" />
              <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
            </filter>

            {/* Silicone Lip Outer Bevel Gradient */}
            <linearGradient id="mat-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="5%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="95%" stopColor="#000000" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* 1. Base Silicone Mat Backing with Beveled Perimeter */}
          <g filter="url(#mat-rim-shadow)">
            {/* Outer Border Lip */}
            <rect
              x="6"
              y="6"
              width="988"
              height="613"
              rx="32"
              ry="32"
              fill={design.baseColor}
              stroke="#031418"
              strokeWidth="9"
            />
            {/* Inner Recessed Working Tray */}
            <rect
              x="18"
              y="18"
              width="964"
              height="589"
              rx="24"
              ry="24"
              fill={design.baseColor}
              stroke="url(#mat-bevel)"
              strokeWidth="4"
            />
          </g>

          {/* 2. Recessed Groove Trenches ("In-Between the Curly Things") */}
          <g filter="url(#groove-trench)">
            {design.segments
              .filter(s => s.type === 'groove')
              .map(seg => {
                const currentColor = fills[seg.id] || seg.defaultColor;
                const isHovered = activeHoverId === seg.id;
                const isRecolored = fills[seg.id] && fills[seg.id] !== seg.defaultColor;

                return (
                  <g key={seg.id} className="cursor-pointer">
                    {/* Visual Recessed Channel Path */}
                    <path
                      d={seg.d}
                      fill="none"
                      stroke={currentColor}
                      strokeWidth={seg.strokeWidth || 14}
                      strokeLinecap={seg.strokeLinecap || 'round'}
                      strokeLinejoin="round"
                      className="transition-colors duration-150"
                      style={{
                        opacity: isRecolored ? 1 : 0.88,
                        filter: isHovered ? 'brightness(1.3)' : undefined,
                      }}
                    />
                    {/* Invisible Wide Hit Area for Easy Stylus & Finger Targeting */}
                    <path
                      data-segment-id={seg.id}
                      d={seg.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={Math.max(26, (seg.strokeWidth || 14) + 14)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer"
                    />
                  </g>
                );
              })}
          </g>

          {/* 3. 3D Cylindrical Silicone Noodles with Segmented Path Cut-offs */}
          <g filter="url(#silicone-cord-gloss)">
            {design.segments
              .filter(s => s.type === 'cord' || s.type === 'ridge' || s.type === 'accent')
              .sort((a, b) => (a.zIndex || 5) - (b.zIndex || 5))
              .map(seg => {
                const currentColor = fills[seg.id] || seg.defaultColor;
                const isHovered = activeHoverId === seg.id;

                return (
                  <g key={seg.id} className="cursor-pointer">
                    {/* Core 3D Silicone Cord Cylinder */}
                    <path
                      d={seg.d}
                      fill="none"
                      stroke={currentColor}
                      strokeWidth={seg.strokeWidth || 22}
                      strokeLinecap={seg.strokeLinecap || 'round'}
                      strokeLinejoin="round"
                      className="transition-all duration-150"
                      style={{
                        filter: isHovered ? 'brightness(1.18)' : undefined,
                      }}
                    />

                    {/* Specular Cylindrical Gloss Highlight Along Ridge Line */}
                    <path
                      d={seg.d}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.42)"
                      strokeWidth={Math.max(3.5, (seg.strokeWidth || 22) * 0.22)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none"
                      style={{
                        mixBlendMode: 'overlay',
                      }}
                    />

                    {/* Wide Transparent Touch Target */}
                    <path
                      data-segment-id={seg.id}
                      d={seg.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={Math.max(34, (seg.strokeWidth || 22) + 16)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer"
                    />
                  </g>
                );
              })}
          </g>
        </svg>
      </div>

      {/* Floating Eyedropper Magnifying Loupe */}
      {eyedropperState.active && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150"
          style={{
            left: eyedropperState.x,
            top: eyedropperState.y - 48,
          }}
        >
          <div className="relative flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full border-4 border-white shadow-2xl flex items-center justify-center ring-2 ring-black/40 overflow-hidden"
              style={{ background: eyedropperState.color }}
            >
              {/* Reticle Crosshair */}
              <div className="w-2.5 h-[1.5px] bg-white/80" />
              <div className="h-2.5 w-[1.5px] bg-white/80 absolute" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded-full bg-zinc-900/90 backdrop-blur border border-white/20 text-[10px] font-mono font-bold text-white shadow-md">
              {eyedropperState.color}
            </div>
          </div>
        </div>
      )}

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
              scale: Math.min(3.5, prev.scale + 0.2),
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

TactileMatCanvas.displayName = 'TactileMatCanvas';

export default TactileMatCanvas;

