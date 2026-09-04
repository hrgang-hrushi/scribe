'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SplitLayoutProps {
  isSplit: boolean;
  sidecar: React.ReactNode;
  main: React.ReactNode;
  defaultRatio?: number;
  onRatioChange?: (ratio: number) => void;
}

export default function SplitLayout({
  isSplit,
  sidecar,
  main,
  defaultRatio = 0.45,
  onRatioChange,
}: SplitLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLandscape, setIsLandscape] = useState(true);
  const [ratio, setRatio] = useState(defaultRatio);
  const isDragging = useRef(false);

  // Detect orientation (Landscape vs Portrait)
  useEffect(() => {
    function checkOrientation() {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setIsLandscape(width >= height);
      } else if (typeof window !== 'undefined') {
        setIsLandscape(window.innerWidth >= window.innerHeight);
      }
    }

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let newRatio: number;
      if (isLandscape) {
        const x = e.clientX - rect.left;
        newRatio = x / rect.width;
      } else {
        const y = e.clientY - rect.top;
        newRatio = y / rect.height;
      }

      // Clamp between 20% and 80%
      const clamped = Math.min(Math.max(newRatio, 0.2), 0.8);
      setRatio(clamped);
      onRatioChange?.(clamped);
    },
    [isLandscape, onRatioChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    // Reset to 50/50 on double tap/click
    setRatio(0.5);
    onRatioChange?.(0.5);
  }, [onRatioChange]);

  if (!isSplit) {
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col relative overflow-hidden">
        {main}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`w-full h-full flex relative overflow-hidden select-none ${
        isLandscape ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Sidecar Pane (Reference PDF) */}
      <div
        style={{
          width: isLandscape ? `${ratio * 100}%` : '100%',
          height: isLandscape ? '100%' : `${ratio * 100}%`,
        }}
        className="relative flex flex-col overflow-hidden bg-[var(--bg-primary)] border-[var(--border)] transition-[width,height] duration-75"
      >
        {sidecar}
      </div>

      {/* Draggable Divider Bar */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize split view (Double click to reset 50/50)"
        className={`group relative flex items-center justify-center transition-colors z-30 touch-none ${
          isLandscape
            ? 'w-2.5 hover:w-3 cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 border-l border-r border-[var(--border)]'
            : 'h-2.5 hover:h-3 cursor-row-resize hover:bg-blue-500/20 active:bg-blue-500/40 border-t border-b border-[var(--border)]'
        }`}
        style={{ background: 'var(--bg-secondary)' }}
      >
        {/* Subtle Grip Handle Pill */}
        <div
          className={`rounded-full transition-transform group-hover:scale-110 ${
            isLandscape ? 'w-1 h-8' : 'h-1 w-8'
          }`}
          style={{ background: 'var(--border)' }}
        />
      </div>

      {/* Main Workspace Pane (Notebook Pages / Canvas) */}
      <div
        style={{
          width: isLandscape ? `${(1 - ratio) * 100}%` : '100%',
          height: isLandscape ? '100%' : `${(1 - ratio) * 100}%`,
        }}
        className="relative flex flex-col overflow-hidden flex-1"
      >
        {main}
      </div>
    </div>
  );
}
