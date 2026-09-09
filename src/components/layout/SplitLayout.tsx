'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fluidSpring } from '@/lib/motion';

export type SplitPosition = 'left' | 'right';

const fluidSpringTransition = fluidSpring;

export interface SplitLayoutProps {
  isSplit: boolean;
  sidecar: React.ReactNode;
  main: React.ReactNode;
  defaultRatio?: number;
  onRatioChange?: (ratio: number) => void;
  position?: SplitPosition;
  onTogglePosition?: () => void;
}

export default function SplitLayout({
  isSplit,
  sidecar,
  main,
  defaultRatio = 0.45,
  onRatioChange,
  position = 'left',
  onTogglePosition,
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
        if (position === 'left') {
          const x = e.clientX - rect.left;
          newRatio = x / rect.width;
        } else {
          const x = rect.right - e.clientX;
          newRatio = x / rect.width;
        }
      } else {
        if (position === 'left') {
          const y = e.clientY - rect.top;
          newRatio = y / rect.height;
        } else {
          const y = rect.bottom - e.clientY;
          newRatio = y / rect.height;
        }
      }

      // Clamp between 20% and 80%
      const clamped = Math.min(Math.max(newRatio, 0.2), 0.8);
      setRatio(clamped);
      onRatioChange?.(clamped);
    },
    [isLandscape, position, onRatioChange]
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
      <motion.div
        layout="position"
        key="split-sidecar-pane"
        transition={isDragging.current ? { duration: 0 } : fluidSpringTransition}
        style={{
          width: isLandscape ? `${ratio * 100}%` : '100%',
          height: isLandscape ? '100%' : `${ratio * 100}%`,
          order: position === 'left' ? 1 : 3,
        }}
        className="relative flex flex-col overflow-hidden bg-[var(--bg-primary)]"
      >
        {sidecar}
      </motion.div>

      {/* Draggable Divider Bar */}
      <motion.div
        layout="position"
        key="split-divider-bar"
        transition={isDragging.current ? { duration: 0 } : fluidSpringTransition}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize split view (Double-click for 50/50 | Click icon to swap sides)"
        className={`group relative flex items-center justify-center transition-colors z-30 touch-none select-none ${
          isLandscape
            ? 'w-2.5 hover:w-3.5 cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 border-l border-r border-[var(--border)]'
            : 'h-2.5 hover:h-3.5 cursor-row-resize hover:bg-blue-500/20 active:bg-blue-500/40 border-t border-b border-[var(--border)]'
        }`}
        style={{
          order: 2,
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Grip Handle Pill */}
        <div
          className={`rounded-full transition-transform group-hover:scale-110 ${
            isLandscape ? 'w-1 h-8' : 'h-1 w-8'
          }`}
          style={{ background: 'var(--border)' }}
        />

        {/* Quick Swap Sides Button on Divider Bar */}
        {onTogglePosition && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePosition();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title={
              isLandscape
                ? (position === 'left' ? 'Move reference to right side' : 'Move reference to left side')
                : (position === 'left' ? 'Move reference to bottom' : 'Move reference to top')
            }
            className="absolute p-1 rounded-full bg-[var(--toolbar-bg)] border border-[var(--border)] shadow-md text-[var(--text-secondary)] hover:text-blue-500 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all z-40"
          >
            <ArrowLeftRight size={11} className={isLandscape ? '' : 'rotate-90'} />
          </button>
        )}
      </motion.div>

      {/* Main Workspace Pane (Notebook Pages / Canvas) */}
      <motion.div
        layout="position"
        key="split-main-pane"
        transition={isDragging.current ? { duration: 0 } : fluidSpringTransition}
        style={{
          width: isLandscape ? `${(1 - ratio) * 100}%` : '100%',
          height: isLandscape ? '100%' : `${(1 - ratio) * 100}%`,
          order: position === 'left' ? 3 : 1,
        }}
        className="relative flex flex-col overflow-hidden flex-1"
      >
        {main}
      </motion.div>
    </div>
  );
}
