'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Tool, ToolSettings, ToolbarPosition } from '@/lib/types';
import { TAPE_COLORS } from '@/lib/types';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  toolSettings: ToolSettings;
  onSettingsChange: (settings: ToolSettings) => void;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
  visible: boolean;
  onToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAction?: (action: 'export-pdf' | 'export-png' | 'import' | 'clear' | 'delete-page' | 'calculator') => void;
  theme?: 'light' | 'dark';
  paperColor?: string;
  position?: ToolbarPosition;
  onPositionChange?: (position: ToolbarPosition) => void;
  focusMode?: boolean;
}

export type ToolbarOrientation = 'horizontal' | 'vertical-left' | 'vertical-right';

const tools: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z', label: 'Select & Move', shortcut: 'V' },
  { id: 'pen', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', label: 'Pen', shortcut: 'P' },
  { id: 'highlighter', icon: 'M15.5 4.5l4 4L8 20H4v-4L15.5 4.5z', label: 'Highlight', shortcut: 'H' },
  { id: 'tape', icon: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm3 0v10m10-10v10M7 12h10', label: 'Study Tape (Active Recall)', shortcut: 'K' },
  { id: 'eraser', icon: 'M20 20H7l-4-4 9-9 7 7-4 4M18 13l-6-6', label: 'Eraser', shortcut: 'E' },
  { id: 'ruler', icon: 'M2 22L22 2M5 19l2-2m2 4l2-2m2 4l2-2m2 4l2-2m2 4l2-2', label: 'Ruler (Straightedge)', shortcut: 'R' },
  { id: 'lasso', icon: 'M12 2a9 9 0 0 0-9 9c0 4 2.5 7.5 6.2 8.6a2 2 0 1 0 2.6-1.5c-2.4-.7-4-2.8-4-5.1 0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7', label: 'Lasso', shortcut: 'L' },
  { id: 'shapes', icon: 'M3 3h18v18H3V3zm3 12l4-5 3 4 2-3 4 5', label: 'Shapes', shortcut: 'S' },
];

export default function Toolbar({
  activeTool, onToolChange, toolSettings, onSettingsChange,
  showColorPicker, onToggleColorPicker, visible, onToggle, onUndo, onRedo, onAction,
  theme = 'dark', paperColor = 'navy',
  position = 'bottom', onPositionChange, focusMode = false,
}: ToolbarProps) {
  const currentPos = position || 'bottom';
  const isVertical = currentPos === 'left' || currentPos === 'right';
  const isLeft = currentPos === 'left';
  const isTop = currentPos === 'top';

  const [showSettings, setShowSettings] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const isLightBackground = theme === 'light' || paperColor === 'white' || paperColor === 'cream';
  const defaultColors = isLightBackground
    ? ['#1a1a2e', '#ff3b30', '#007aff']
    : ['#ffffff', '#ff453a', '#32ade6'];

  const quickColors = (toolSettings.quickColors || defaultColors).map(c => {
    if (isLightBackground && (c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff')) {
      return '#1a1a2e';
    }
    if (!isLightBackground && (c.toLowerCase() === '#1a1a2e' || c.toLowerCase() === '#000000' || c.toLowerCase() === '#18181b')) {
      return '#ffffff';
    }
    return c;
  });

  // Dynamic orientation detection on drag
  const handleDrag = (_: any, info: { point: { x: number; y: number } }) => {
    if (typeof window === 'undefined') return;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const { x, y } = info.point;

    let nextPos: ToolbarPosition = 'bottom';
    if (y < screenH * 0.32) {
      nextPos = 'top';
    } else if (y > screenH * 0.68) {
      nextPos = 'bottom';
    } else if (x < screenW * 0.28) {
      nextPos = 'left';
    } else if (x > screenW * 0.72) {
      nextPos = 'right';
    } else {
      nextPos = y < screenH * 0.5 ? 'top' : 'bottom';
    }

    if (nextPos !== currentPos && onPositionChange) {
      onPositionChange(nextPos);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  };

  const handleDragEnd = (_: any, info: { point: { x: number; y: number } }) => {
    if (typeof window === 'undefined') return;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const { x, y } = info.point;

    let nextPos: ToolbarPosition = 'bottom';
    if (y < screenH * 0.32) {
      nextPos = 'top';
    } else if (y > screenH * 0.68) {
      nextPos = 'bottom';
    } else if (x < screenW * 0.28) {
      nextPos = 'left';
    } else if (x > screenW * 0.72) {
      nextPos = 'right';
    } else {
      nextPos = y < screenH * 0.5 ? 'top' : 'bottom';
    }

    onPositionChange?.(nextPos);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 glass-panel"
        style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        title="Show Toolbar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    );
  }

  const containerClasses = isVertical
    ? isLeft
      ? 'fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none'
      : 'fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none'
    : isTop
    ? 'fixed left-0 right-0 z-40 flex justify-center pointer-events-none'
    : 'fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none safe-bottom';

  return (
    <div
      className={containerClasses}
      style={
        isTop
          ? {
              top: focusMode
                ? 'max(env(safe-area-inset-top, 0px), 12px)'
                : 'calc(max(env(safe-area-inset-top, 0px), 12px) + 60px)',
            }
          : undefined
      }
    >
      <motion.div
        key={currentPos}
        layout
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        drag
        dragMomentum={false}
        dragElastic={0.06}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
        style={{ touchAction: 'none' }}
        className="relative flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing pointer-events-auto"
      >
        {/* Settings Slider Panel */}
        {showSettings && (
          <div
            className={`rounded-2xl p-4 shadow-2xl z-50 min-w-[250px] border border-[var(--border)] ${
              !isVertical
                ? isTop
                  ? 'mt-2'
                  : 'mb-2'
                : isLeft
                ? 'absolute left-full ml-3 top-0'
                : 'absolute right-full mr-3 top-0'
            }`}
            style={{
              background: 'var(--toolbar-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              order: isTop ? 2 : 0,
            }}
          >
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>{activeTool === 'tape' ? 'Tape Width' : 'Stroke Width'}</span>
                  <span>
                    {activeTool === 'tape'
                      ? (toolSettings.tapeWidth || 32)
                      : activeTool === 'highlighter'
                      ? toolSettings.highlighterWidth
                      : activeTool === 'eraser'
                      ? toolSettings.eraserWidth
                      : toolSettings.penWidth}px
                  </span>
                </label>
                <input
                  type="range"
                  min={activeTool === 'tape' ? 16 : 1}
                  max={activeTool === 'tape' ? 64 : activeTool === 'highlighter' ? 50 : activeTool === 'eraser' ? 80 : 25}
                  value={
                    activeTool === 'tape'
                      ? (toolSettings.tapeWidth || 32)
                      : activeTool === 'highlighter'
                      ? toolSettings.highlighterWidth
                      : activeTool === 'eraser'
                      ? toolSettings.eraserWidth
                      : toolSettings.penWidth
                  }
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (activeTool === 'tape') onSettingsChange({ ...toolSettings, tapeWidth: v });
                    else if (activeTool === 'highlighter') onSettingsChange({ ...toolSettings, highlighterWidth: v });
                    else if (activeTool === 'eraser') onSettingsChange({ ...toolSettings, eraserWidth: v });
                    else onSettingsChange({ ...toolSettings, penWidth: v });
                  }}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              {/* Tape Color Swatches */}
              {activeTool === 'tape' && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Tape Color</label>
                  <div className="flex items-center gap-2">
                    {TAPE_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onSettingsChange({ ...toolSettings, tapeColor: c })}
                        className={`w-6 h-6 rounded-full transition-transform border ${
                          (toolSettings.tapeColor || '#f59e0b') === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Eraser Options: Stroke vs Precision & Highlighter-only */}
              {activeTool === 'eraser' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Eraser Mode</label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-black/5 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => onSettingsChange({ ...toolSettings, eraserMode: 'stroke' })}
                        className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                          toolSettings.eraserMode === 'stroke'
                            ? 'bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                        }`}
                      >
                        Stroke
                      </button>
                      <button
                        type="button"
                        onClick={() => onSettingsChange({ ...toolSettings, eraserMode: 'pixel' })}
                        className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                          toolSettings.eraserMode !== 'stroke'
                            ? 'bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                        }`}
                      >
                        Precision
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>Erase Highlighter Only</label>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Protects handwriting & ink</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSettingsChange({ ...toolSettings, eraseHighlighterOnly: !toolSettings.eraseHighlighterOnly })}
                      className="w-9 h-5 rounded-full transition-colors relative"
                      style={{ background: toolSettings.eraseHighlighterOnly ? 'var(--accent)' : 'var(--bg-tertiary)' }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform"
                        style={{ left: toolSettings.eraseHighlighterOnly ? '18px' : '3px' }}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Hold-to-Shape Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                <div>
                  <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>Hold to Shape</label>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Hold still to snap line/circle/box</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSettingsChange({ ...toolSettings, holdToShape: toolSettings.holdToShape === false })}
                  className="w-9 h-5 rounded-full transition-colors relative"
                  style={{ background: toolSettings.holdToShape !== false ? 'var(--accent)' : 'var(--bg-tertiary)' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform"
                    style={{ left: toolSettings.holdToShape !== false ? '18px' : '3px' }}
                  />
                </button>
              </div>

              {/* Scribble to Erase Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                <div>
                  <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>Scribble to Erase</label>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rapid scratch-out deletes strokes</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSettingsChange({ ...toolSettings, scribbleToErase: toolSettings.scribbleToErase === false })}
                  className="w-9 h-5 rounded-full transition-colors relative"
                  style={{ background: toolSettings.scribbleToErase !== false ? 'var(--accent)' : 'var(--bg-tertiary)' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform"
                    style={{ left: toolSettings.scribbleToErase !== false ? '18px' : '3px' }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Toolbar Body (Switches seamlessly between flex-row and flex-col) */}
        <div
          className={`flex items-center shadow-2xl transition-all border border-[var(--border)] ${
            isVertical
              ? 'flex-col gap-1.5 py-3 px-2 rounded-2xl'
              : 'flex-row gap-1.5 px-3 py-2 rounded-2xl'
          }`}
          style={{
            background: 'var(--toolbar-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Subtle Drag Grip Indicator */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              // Tap drag handle to flip between top and bottom
              const next = currentPos === 'top' ? 'bottom' : 'top';
              onPositionChange?.(next);
            }}
            className={`flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing ${
              isVertical ? 'w-full h-2.5 my-0.5' : 'h-full w-2.5 mx-0.5'
            }`}
            title={`Drag to reposition, or tap to flip to ${currentPos === 'top' ? 'bottom' : 'top'}`}
          >
            <div
              className={`rounded-full bg-current ${
                isVertical ? 'w-5 h-1' : 'w-1 h-5'
              }`}
            />
          </div>

          {/* Undo & Redo */}
          <div className={`flex items-center gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}>
            <button
              onClick={onUndo}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-primary)' }}
              title="Undo (⌘Z)"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            <button
              onClick={onRedo}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-primary)' }}
              title="Redo (⌘⇧Z)"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div
            className={isVertical ? "h-px w-5 my-0.5" : "w-px h-5 mx-0.5"}
            style={{ background: 'var(--border)' }}
          />

          {/* Tools */}
          <div className={`flex items-center gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}>
            {tools.map(t => (
              <div key={t.id} className="relative group">
                <button
                  onClick={() => onToolChange(t.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    activeTool === t.id ? 'scale-110 shadow-sm' : 'hover:scale-105'
                  }`}
                  style={{
                    background: activeTool === t.id ? 'var(--accent)' : 'transparent',
                    color: activeTool === t.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                  }}
                  title={`${t.label} (${t.shortcut})`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={t.icon} />
                  </svg>
                </button>
                
                {/* Shapes Submenu */}
                {t.id === 'shapes' && activeTool === 'shapes' && (
                  <div
                    className={`flex items-center gap-1 p-1 rounded-xl shadow-xl border border-[var(--border)] z-50 ${
                      !isVertical
                        ? isTop
                          ? 'absolute top-full mt-3 left-1/2 -translate-x-1/2 animate-slide-down flex-row'
                          : 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2 animate-slide-up flex-row'
                        : isLeft
                        ? 'absolute left-full ml-3 top-1/2 -translate-y-1/2 animate-fade-in flex-col'
                        : 'absolute right-full mr-3 top-1/2 -translate-y-1/2 animate-fade-in flex-col'
                    }`}
                    style={{ background: 'var(--toolbar-bg)' }}
                  >
                    {(['rect', 'circle', 'triangle', 'line', 'arrow', 'axis'] as const).map(shapeType => (
                      <button
                        key={shapeType}
                        onClick={() => onSettingsChange({ ...toolSettings, shapeType })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          toolSettings.shapeType === shapeType ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'hover:bg-[var(--bg-tertiary)]'
                        }`}
                        title={shapeType === 'axis' ? 'Coordinate Axes (X/Y)' : shapeType}
                      >
                        {shapeType === 'rect' && <div className="w-4 h-4 border-2 border-current" />}
                        {shapeType === 'circle' && <div className="w-4 h-4 border-2 border-current rounded-full" />}
                        {shapeType === 'triangle' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 22 20 2 20" />
                          </svg>
                        )}
                        {shapeType === 'arrow' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <polyline points="15 5 22 12 15 19" />
                          </svg>
                        )}
                        {shapeType === 'line' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="4" y1="20" x2="20" y2="4" />
                          </svg>
                        )}
                        {shapeType === 'axis' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="3" x2="12" y2="21" />
                            <polyline points="9 6 12 3 15 6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <polyline points="18 9 21 12 18 15" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className={isVertical ? "h-px w-5 my-0.5" : "w-px h-5 mx-0.5"}
            style={{ background: 'var(--border)' }}
          />

          {/* Quick Pen Width Presets (One-tap switching for lecture writing / subscripts / headers) */}
          {activeTool === 'pen' && (
            <>
              <div className={`flex items-center gap-1.5 px-0.5 ${isVertical ? 'flex-col' : 'flex-row'}`}>
                {[
                  { label: 'Fine', width: 1.5, dotSize: 3.5 },
                  { label: 'Medium', width: 2.5, dotSize: 5.5 },
                  { label: 'Bold', width: 4.0, dotSize: 8 },
                ].map(p => {
                  const isActive = Math.abs((toolSettings.penWidth || 2.5) - p.width) < 0.4;
                  return (
                    <button
                      key={p.label}
                      onClick={() => onSettingsChange({ ...toolSettings, penWidth: p.width })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm scale-105'
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)] opacity-75 hover:opacity-100'
                      }`}
                      title={`${p.label} Pen (${p.width}px)`}
                    >
                      <div
                        className="rounded-full transition-transform"
                        style={{
                          width: `${p.dotSize}px`,
                          height: `${p.dotSize}px`,
                          backgroundColor: 'currentColor',
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div
                className={isVertical ? "h-px w-5 my-0.5" : "w-px h-5 mx-0.5"}
                style={{ background: 'var(--border)' }}
              />
            </>
          )}

          {/* Quick Color Slots */}
          <div className={`flex items-center gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}>
            {quickColors.map((color, idx) => {
              const isSelected = activeTool === 'highlighter' ? toolSettings.highlighterColor === color : toolSettings.penColor === color;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (activeTool === 'highlighter') onSettingsChange({ ...toolSettings, highlighterColor: color });
                    else onSettingsChange({ ...toolSettings, penColor: color });
                  }}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${
                    isSelected ? 'ring-2 ring-[var(--accent)] scale-110' : 'opacity-80'
                  }`}
                  style={{
                    backgroundColor: color,
                    border: color === '#ffffff' ? '1px solid rgba(0,0,0,0.2)' : '1px solid rgba(255,255,255,0.3)',
                  }}
                  title={`Color preset ${idx + 1}`}
                />
              );
            })}

            {/* Color Palette Modal Trigger (Rainbow Spectrum Wheel) */}
            <button
              onClick={onToggleColorPicker}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative group p-0.5"
              title="Full Color Palette (C)"
              aria-label="Open color palette"
            >
              <div
                className="w-5 h-5 rounded-full shadow-sm relative flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  background: 'conic-gradient(from 90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  border: '1.5px solid rgba(255,255,255,0.7)',
                }}
              >
                {/* Subtle center core */}
                <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_1px_rgba(0,0,0,0.4)]" />
              </div>
            </button>
          </div>

          {/* Divider */}
          <div
            className={isVertical ? "h-px w-5 my-0.5" : "w-px h-5 mx-0.5"}
            style={{ background: 'var(--border)' }}
          />

          {/* Settings & More Controls */}
          <div className={`flex items-center gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}>
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(v => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: showSettings ? 'var(--accent)' : 'transparent',
                color: showSettings ? 'var(--bg-primary)' : 'var(--text-primary)',
              }}
              title="Stroke & Gesture Settings"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(v => !v)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  background: showMoreMenu ? 'var(--accent)' : 'transparent',
                  color: showMoreMenu ? 'var(--bg-primary)' : 'var(--text-primary)',
                }}
                title="More Options"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              
              {showMoreMenu && (
                <div
                  className={`w-52 flex flex-col p-2 rounded-2xl shadow-xl border border-[var(--border)] z-50 ${
                    !isVertical
                      ? isTop
                        ? 'absolute top-full mt-3 right-0 animate-slide-down'
                        : 'absolute bottom-full mb-3 right-0 animate-slide-up'
                      : isLeft
                      ? 'absolute left-full ml-3 bottom-0 animate-fade-in'
                      : 'absolute right-full mr-3 bottom-0 animate-fade-in'
                  }`}
                  style={{ background: 'var(--toolbar-bg)' }}
                >
                  <button 
                    onClick={() => { setShowMoreMenu(false); onAction?.('calculator'); }}
                    className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <line x1="8" y1="6" x2="16" y2="6" />
                        <line x1="8" y1="10" x2="10" y2="10" />
                        <line x1="14" y1="10" x2="16" y2="10" />
                        <line x1="8" y1="14" x2="10" y2="14" />
                        <line x1="14" y1="14" x2="16" y2="14" />
                        <line x1="8" y1="18" x2="16" y2="18" />
                      </svg>
                      Calculator
                    </span>
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-muted)] font-mono">=</kbd>
                  </button>

                  <button 
                    onClick={() => { setShowMoreMenu(false); onAction?.('import'); }}
                    className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
                  >
                    Import Media / PDF
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportMenu(v => !v)}
                      className="w-full text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
                    >
                      Export
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    {showExportMenu && (
                      <div
                        className={`w-32 flex flex-col p-2 rounded-2xl shadow-xl border border-[var(--border)] z-50 ${
                          isLeft
                            ? 'absolute bottom-0 left-full ml-2 animate-fade-in'
                            : 'absolute bottom-0 right-full mr-2 animate-fade-in'
                        }`}
                        style={{ background: 'var(--toolbar-bg)' }}
                      >
                        <button 
                          onClick={() => { setShowMoreMenu(false); setShowExportMenu(false); onAction?.('export-pdf'); }}
                          className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          As PDF
                        </button>
                        <button 
                          onClick={() => { setShowMoreMenu(false); setShowExportMenu(false); onAction?.('export-png'); }}
                          className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          As PNG
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dock Toolbar Pill Options */}
                  <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/5">
                    <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 text-[var(--text-muted)]">
                      Dock Toolbar Pill
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-1">
                      {(['top', 'bottom', 'left', 'right'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            onPositionChange?.(p);
                          }}
                          className={`text-xs py-1 px-2 rounded-lg font-semibold capitalize text-center transition-colors ${
                            currentPos === p
                              ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                  <button 
                    onClick={() => { setShowMoreMenu(false); onAction?.('clear'); }}
                    className="text-left px-3 py-2 text-sm font-medium text-amber-500 rounded-xl hover:bg-amber-500/10 transition-colors flex items-center justify-between"
                  >
                    <span>Clear Sheet</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                  <button 
                    onClick={() => { setShowMoreMenu(false); onAction?.('delete-page'); }}
                    className="text-left px-3 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-between"
                  >
                    <span>Delete Sheet</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
