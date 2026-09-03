'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Tool, ToolSettings } from '@/lib/types';
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
  onAction?: (action: 'export-pdf' | 'export-png' | 'import' | 'clear') => void;
}

export type ToolbarOrientation = 'horizontal' | 'vertical-left' | 'vertical-right';

const tools: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z', label: 'Select & Move', shortcut: 'V' },
  { id: 'pen', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', label: 'Pen', shortcut: 'P' },
  { id: 'highlighter', icon: 'M15.5 4.5l4 4L8 20H4v-4L15.5 4.5z', label: 'Highlight', shortcut: 'H' },
  { id: 'tape', icon: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm3 0v10m10-10v10M7 12h10', label: 'Study Tape (Active Recall)', shortcut: 'K' },
  { id: 'eraser', icon: 'M20 20H7l-4-4 9-9 7 7-4 4M18 13l-6-6', label: 'Eraser', shortcut: 'E' },
  { id: 'lasso', icon: 'M12 2a9 9 0 0 0-9 9c0 4 2.5 7.5 6.2 8.6a2 2 0 1 0 2.6-1.5c-2.4-.7-4-2.8-4-5.1 0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7', label: 'Lasso', shortcut: 'L' },
  { id: 'shapes', icon: 'M3 3h18v18H3V3zm3 12l4-5 3 4 2-3 4 5', label: 'Shapes', shortcut: 'S' },
];

const DEFAULT_QUICK_COLORS = ['#ffffff', '#ff453a', '#32ade6'];

export default function Toolbar({
  activeTool, onToolChange, toolSettings, onSettingsChange,
  showColorPicker, onToggleColorPicker, visible, onToggle, onUndo, onRedo, onAction,
}: ToolbarProps) {
  const [orientation, setOrientation] = useState<ToolbarOrientation>('horizontal');
  const [showSettings, setShowSettings] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const quickColors = toolSettings.quickColors || DEFAULT_QUICK_COLORS;

  const isVertical = orientation === 'vertical-left' || orientation === 'vertical-right';
  const isLeft = orientation === 'vertical-left';

  // Dynamic orientation detection on drag
  const handleDrag = (_: any, info: { point: { x: number; y: number } }) => {
    if (typeof window === 'undefined') return;
    const screenW = window.innerWidth;
    const x = info.point.x;

    // Left side of screen (< 25% of viewport width) -> Vertical left
    if (x < screenW * 0.25) {
      if (orientation !== 'vertical-left') {
        setOrientation('vertical-left');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }
    }
    // Right side of screen (> 75% of viewport width) -> Vertical right
    else if (x > screenW * 0.75) {
      if (orientation !== 'vertical-right') {
        setOrientation('vertical-right');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }
    }
    // Middle / Bottom area -> Horizontal
    else {
      if (orientation !== 'horizontal') {
        setOrientation('horizontal');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }
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

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none safe-bottom">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        drag
        dragMomentum={false}
        onDrag={handleDrag}
        dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 50 }}
        style={{ touchAction: 'none' }}
        className="relative flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing pointer-events-auto"
        dragElastic={0}
      >
        {/* Settings Slider Panel */}
        {showSettings && (
          <div
            className={`rounded-2xl p-4 glass-panel shadow-2xl z-50 min-w-[250px] ${
              !isVertical
                ? 'mb-2 animate-slide-up'
                : isLeft
                ? 'absolute left-full ml-3 top-0 animate-fade-in'
                : 'absolute right-full mr-3 top-0 animate-fade-in'
            }`}
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
          className={`flex items-center shadow-2xl glass-panel transition-all ${
            isVertical
              ? 'flex-col gap-1.5 py-3 px-2 rounded-2xl border border-black/10 dark:border-white/10'
              : 'flex-row gap-1.5 px-3 py-2 rounded-2xl border border-black/10 dark:border-white/10'
          }`}
        >
          {/* Subtle Drag Grip Indicator */}
          <div
            className={`flex items-center justify-center opacity-30 hover:opacity-70 transition-opacity cursor-grab active:cursor-grabbing ${
              isVertical ? 'w-full h-2 my-0.5' : 'h-full w-2 mx-0.5'
            }`}
            title="Drag to reposition toolbar"
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
                    className={`flex items-center gap-1 p-1 rounded-xl shadow-xl border glass-panel z-50 ${
                      !isVertical
                        ? 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2 animate-slide-up flex-row'
                        : isLeft
                        ? 'absolute left-full ml-3 top-1/2 -translate-y-1/2 animate-fade-in flex-col'
                        : 'absolute right-full mr-3 top-1/2 -translate-y-1/2 animate-fade-in flex-col'
                    }`}
                  >
                    {(['rect', 'circle', 'triangle', 'line', 'arrow'] as const).map(shapeType => (
                      <button
                        key={shapeType}
                        onClick={() => onSettingsChange({ ...toolSettings, shapeType })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          toolSettings.shapeType === shapeType ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'hover:bg-[var(--bg-tertiary)]'
                        }`}
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

            {/* Color Palette Modal Trigger */}
            <button
              onClick={onToggleColorPicker}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
              title="Full Palette (C)"
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white/60 shadow-sm"
                style={{ background: activeTool === 'highlighter' ? toolSettings.highlighterColor : toolSettings.penColor }}
              />
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
                  className={`w-48 flex flex-col p-2 rounded-2xl shadow-xl border glass-panel z-50 ${
                    !isVertical
                      ? 'absolute bottom-full mb-3 right-0 animate-slide-up'
                      : isLeft
                      ? 'absolute left-full ml-3 bottom-0 animate-fade-in'
                      : 'absolute right-full mr-3 bottom-0 animate-fade-in'
                  }`}
                >
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
                        className={`w-32 flex flex-col p-2 rounded-2xl shadow-xl border glass-panel z-50 ${
                          isLeft
                            ? 'absolute bottom-0 left-full ml-2 animate-fade-in'
                            : 'absolute bottom-0 right-full mr-2 animate-fade-in'
                        }`}
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
                  
                  <div className="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
                  <button 
                    onClick={() => { setShowMoreMenu(false); onAction?.('clear'); }}
                    className="text-left px-3 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Clear Sheet
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
