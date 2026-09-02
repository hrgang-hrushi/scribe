'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Tool, ToolSettings } from '@/lib/types';

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
}

const tools: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'pen', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', label: 'Pen', shortcut: 'P' },
  { id: 'highlighter', icon: 'M15.5 4.5l4 4L8 20H4v-4L15.5 4.5z', label: 'Highlight', shortcut: 'H' },
  { id: 'eraser', icon: 'M20 20H7l-4-4 9-9 7 7-4 4M18 13l-6-6', label: 'Eraser', shortcut: 'E' },
  { id: 'shapes', icon: 'M3 3h18v18H3V3zm3 12l4-5 3 4 2-3 4 5', label: 'Shapes', shortcut: 'S' },
      { id: 'image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Image', shortcut: 'I' },
  ];

export default function Toolbar({
  activeTool, onToolChange, toolSettings, onSettingsChange,
  showColorPicker, onToggleColorPicker, visible, onToggle, onUndo, onRedo,
}: ToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ background: 'var(--accent)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none safe-bottom">
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 50 }}
      style={{ touchAction: 'none' }}
      className="flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing pointer-events-auto"
      dragElastic={0}
      onDragStart={() => document.body.style.overflow = 'hidden'}
      onDragEnd={() => document.body.style.overflow = 'auto'}
    >
      {/* Settings Slider */}
      {showSettings && (
        <div
          className="rounded-2xl p-4 mb-2 animate-slide-up"
          style={{ background: 'var(--toolbar-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex flex-col gap-3 min-w-[220px]">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Width: {activeTool === 'highlighter' ? toolSettings.highlighterWidth : (activeTool === 'eraser' ? toolSettings.eraserWidth : toolSettings.penWidth)}
              </label>
              <input
                type="range"
                min="1"
                max={activeTool === 'highlighter' ? 50 : (activeTool === 'eraser' ? 80 : 20)}
                value={activeTool === 'highlighter' ? toolSettings.highlighterWidth : (activeTool === 'eraser' ? toolSettings.eraserWidth : toolSettings.penWidth)}
                onChange={e => {
                  const v = Number(e.target.value);
                  if (activeTool === 'highlighter') onSettingsChange({ ...toolSettings, highlighterWidth: v });
                  else if (activeTool === 'eraser') onSettingsChange({ ...toolSettings, eraserWidth: v });
                  else onSettingsChange({ ...toolSettings, penWidth: v });
                }}
                className="w-full accent-[var(--accent)]"
              />
            </div>
            {activeTool === 'pen' && (
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Opacity: {Math.round(toolSettings.penOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={toolSettings.penOpacity * 100}
                  onChange={e => onSettingsChange({ ...toolSettings, penOpacity: Number(e.target.value) / 100 })}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Smoothing: {Math.round(toolSettings.smoothing * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={toolSettings.smoothing * 100}
                onChange={e => onSettingsChange({ ...toolSettings, smoothing: Number(e.target.value) / 100 })}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-2xl shadow-lg"
        style={{ background: 'var(--toolbar-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}
      >
        {/* Undo */}
        <button
          onClick={onUndo}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Undo (⌘Z)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {/* Tools */}
        {tools.map(t => (
          <div key={t.id} className="relative group">
            <button
              onClick={() => onToolChange(t.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTool === t.id ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{
                background: activeTool === t.id ? 'var(--accent)' : 'transparent',
                color: activeTool === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
              title={`${t.label} (${t.shortcut})`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
            </button>
            
            {/* Shapes Submenu */}
            {t.id === 'shapes' && activeTool === 'shapes' && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl shadow-xl border animate-slide-up bg-white dark:bg-gray-800 z-50">
                {(['rect', 'circle', 'triangle', 'line', 'arrow'] as const).map(shapeType => (
                  <button
                    key={shapeType}
                    onClick={() => onSettingsChange({ ...toolSettings, shapeType })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      toolSettings.shapeType === shapeType ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {/* Color */}
        <button
          onClick={onToggleColorPicker}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
          title="Colors (C)"
        >
          <div
            className="w-5 h-5 rounded-full border-2 border-white/50"
            style={{ background: activeTool === 'highlighter' ? toolSettings.highlighterColor : toolSettings.penColor }}
          />
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(v => !v)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: showSettings ? 'var(--accent)' : 'transparent',
            color: showSettings ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: showMoreMenu ? 'var(--accent)' : 'transparent',
              color: showMoreMenu ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
            title="More Options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          
          {showMoreMenu && (
            <div className="absolute bottom-full mb-3 right-0 w-48 flex flex-col p-2 rounded-2xl shadow-xl border animate-slide-up bg-white dark:bg-gray-800 z-50">
              <button className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Export as PDF</button>
              <button className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Export as PNG</button>
              <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button className="text-left px-3 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Clear Canvas</button>
            </div>
          )}
        </div>

      </div>
    </motion.div>
    </div>
  );
}
