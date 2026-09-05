'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { PlaygroundDesign } from '@/lib/playground-types';
import { playSiliconePop, playGentleChime } from '@/lib/playground-sound';

interface TactileMatCanvasProps {
  design: PlaygroundDesign;
  activeColor: string;
  isEraser: boolean;
  fills: Record<string, string>;
  onFillSegment: (segmentId: string, color: string) => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export default function TactileMatCanvas({
  design,
  activeColor,
  isEraser,
  fills,
  onFillSegment,
  soundEnabled,
  hapticsEnabled,
}: TactileMatCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isTracing = useRef(false);
  const lastFilledSegmentId = useRef<string | null>(null);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  // Sound & Haptic Trigger
  const triggerSensoryFeedback = useCallback((isMajor = false) => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isMajor ? [15, 30, 20] : 16);
    }
    if (soundEnabled) {
      if (isMajor) {
        playGentleChime(true);
      } else {
        playSiliconePop(true);
      }
    }
  }, [hapticsEnabled, soundEnabled]);

  // Handle filling a single bounded segment
  const handleApplyColor = useCallback((segmentId: string) => {
    const targetSegment = design.segments.find(s => s.id === segmentId);
    if (!targetSegment) return;

    const targetColor = isEraser ? targetSegment.defaultColor : activeColor;
    if (fills[segmentId] === targetColor) return;

    onFillSegment(segmentId, targetColor);
    triggerSensoryFeedback(targetSegment.type === 'ridge');
  }, [design.segments, isEraser, activeColor, fills, onFillSegment, triggerSensoryFeedback]);

  // Handle pointer down (tap or start trace)
  function handlePointerDown(e: React.PointerEvent) {
    isTracing.current = true;
    lastFilledSegmentId.current = null;

    const target = e.target as SVGElement;
    const segmentId = target.getAttribute('data-segment-id');
    if (segmentId) {
      handleApplyColor(segmentId);
      lastFilledSegmentId.current = segmentId;
    }
  }

  // Handle pointer move for stylus / finger continuous tracing
  function handlePointerMove(e: React.PointerEvent) {
    if (!isTracing.current) {
      // Just hover preview
      const target = e.target as SVGElement;
      const segmentId = target.getAttribute('data-segment-id');
      setActiveHoverId(segmentId);
      return;
    }

    // When tracing with pen or finger, detect element underneath
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const segmentId = element?.getAttribute('data-segment-id');

    if (segmentId && segmentId !== lastFilledSegmentId.current) {
      handleApplyColor(segmentId);
      lastFilledSegmentId.current = segmentId;
      setActiveHoverId(segmentId);
    }
  }

  function handlePointerUp() {
    isTracing.current = false;
    lastFilledSegmentId.current = null;
  }

  useEffect(() => {
    const onGlobalPointerUp = () => {
      isTracing.current = false;
      lastFilledSegmentId.current = null;
    };
    window.addEventListener('pointerup', onGlobalPointerUp);
    return () => window.removeEventListener('pointerup', onGlobalPointerUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 select-none touch-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg
        ref={svgRef}
        viewBox={design.viewBox}
        className="w-full max-w-[1040px] max-h-[72vh] drop-shadow-2xl rounded-3xl transition-transform duration-300"
        style={{
          aspectRatio: design.aspectRatio,
        }}
      >
        <defs>
          {/* 3D Silicone Lighting & Shadow Filters */}
          {/* 1. Deep Recessed Groove Trench Filter */}
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

          {/* 2. Tactile 3D Silicone Noodle Cylindrical Specular Gloss Filter */}
          <filter id="silicone-cord-gloss" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="18" lightingColor="#FFFFFF" result="specular">
              <fePointLight x="450" y="-150" z="400" />
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceAlpha" operator="in" result="specularCut" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specularCut" />
            </feMerge>
          </filter>

          {/* 3. Outer Mat Bevel & Border Lip Drop Shadow */}
          <filter id="mat-rim-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.65" />
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
          </filter>

          {/* Gradient for Outer Lip Rim */}
          <linearGradient id="mat-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="6%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="94%" stopColor="#000000" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>

          <linearGradient id="cord-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* 1. Base Silicone Mat Backing with Beveled Edge */}
        <g filter="url(#mat-rim-shadow)">
          {/* Outer Border / Lip */}
          <rect
            x="8"
            y="8"
            width="984"
            height="604"
            rx="28"
            ry="28"
            fill={design.baseColor}
            stroke="#04171B"
            strokeWidth="8"
          />
          {/* Inner Recessed Working Plate */}
          <rect
            x="20"
            y="20"
            width="960"
            height="580"
            rx="20"
            ry="20"
            fill={design.baseColor}
            stroke="url(#mat-bevel)"
            strokeWidth="4"
          />
        </g>

        {/* 2. Base Trenches / Grooves (Underneath the cords) */}
        <g filter="url(#groove-trench)">
          {design.segments
            .filter(s => s.type === 'groove')
            .map(seg => {
              const currentColor = fills[seg.id] || seg.defaultColor;
              const isHovered = activeHoverId === seg.id;
              const isRecolored = fills[seg.id] && fills[seg.id] !== seg.defaultColor;

              return (
                <g key={seg.id} className="cursor-pointer transition-transform">
                  {/* Visual Trench Path */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke={currentColor}
                    strokeWidth={seg.strokeWidth || 14}
                    strokeLinecap={seg.strokeLinecap || 'round'}
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                    style={{
                      opacity: isRecolored ? 1 : 0.85,
                      filter: isHovered ? 'brightness(1.2)' : undefined,
                    }}
                  />
                  {/* Invisible Wide Hit Area for Easy Tap & Pencil Tracing */}
                  <path
                    data-segment-id={seg.id}
                    d={seg.d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(26, (seg.strokeWidth || 14) + 12)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer"
                  />
                </g>
              );
            })}
        </g>

        {/* 3. 3D Tactile Silicone Noodles & Ridges (Segmented cut-offs) */}
        <g filter="url(#silicone-cord-gloss)">
          {design.segments
            .filter(s => s.type === 'cord' || s.type === 'ridge' || s.type === 'accent')
            .sort((a, b) => (a.zIndex || 5) - (b.zIndex || 5))
            .map(seg => {
              const currentColor = fills[seg.id] || seg.defaultColor;
              const isHovered = activeHoverId === seg.id;

              return (
                <g key={seg.id} className="cursor-pointer group">
                  {/* Core 3D Silicone Cord Stroke */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke={currentColor}
                    strokeWidth={seg.strokeWidth || 20}
                    strokeLinecap={seg.strokeLinecap || 'round'}
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                    style={{
                      transformOrigin: 'center',
                      filter: isHovered ? 'brightness(1.15)' : undefined,
                    }}
                  />

                  {/* Cylindrical Sheen Highlight Ribbon along the top edge of the noodle */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth={Math.max(3, (seg.strokeWidth || 20) * 0.22)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                    style={{
                      mixBlendMode: 'overlay',
                    }}
                  />

                  {/* Wide Transparent Pointer Hit Track (Guarantees responsive stylus & finger tracking) */}
                  <path
                    data-segment-id={seg.id}
                    d={seg.d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(32, (seg.strokeWidth || 20) + 14)}
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
  );
}
