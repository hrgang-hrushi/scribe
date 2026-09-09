'use client';

import React, { useState } from 'react';
import type { ColoringTool } from '@/lib/playground-types';
import { COLOR_PALETTES, PLAYGROUND_DESIGNS } from '@/lib/playground-designs';
import {
  X,
  ArrowLeftRight,
  Paintbrush,
  PenTool,
  Eraser,
  PaintBucket,
  Pipette,
  ChevronLeft,
  ChevronRight,
  Palette,
  Undo2,
  Redo2,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
} from 'lucide-react';

interface ColoringToolbarProps {
  activeTool: ColoringTool;
  onSelectTool: (tool: ColoringTool) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  brushOpacity: number;
  onChangeBrushOpacity: (opacity: number) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  activePaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  onToggleEyedropper: () => void;
  isEyedropperActive: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClose: () => void;
  onReset: () => void;
  // Timer props
  secondsLeft: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onSelectDuration: (minutes: number) => void;
  // Design switching
  activeDesignId: string;
  onSelectDesign: (designId: string) => void;
  // Sound & Haptics
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onLoadReference?: () => void;
}

export default function ColoringToolbar({
  activeTool,
  onSelectTool,
  brushSize,
  onChangeBrushSize,
  brushOpacity,
  onChangeBrushOpacity,
  activeColor,
  onSelectColor,
  activePaletteId,
  onSelectPalette,
  onToggleEyedropper,
  isEyedropperActive,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClose,
  onReset,
  secondsLeft,
  isTimerRunning,
  onToggleTimer,
  onSelectDuration,
  activeDesignId,
  onSelectDesign,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onLoadReference,
}: ColoringToolbarProps) {
  // Left or right side dock for left-handed / right-handed ergonomics
  const [dockSide, setDockSide] = useState<'left' | 'right'>('left');
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentPaletteIndex = COLOR_PALETTES.findIndex(p => p.id === activePaletteId);
  const currentPalette = COLOR_PALETTES[currentPaletteIndex >= 0 ? currentPaletteIndex : 0];

  const handlePrevPalette = () => {
    const nextIdx = (currentPaletteIndex - 1 + COLOR_PALETTES.length) % COLOR_PALETTES.length;
    onSelectPalette(COLOR_PALETTES[nextIdx].id);
    onSelectColor(COLOR_PALETTES[nextIdx].colors[0]);
  };

  const handleNextPalette = () => {
    const nextIdx = (currentPaletteIndex + 1) % COLOR_PALETTES.length;
    onSelectPalette(COLOR_PALETTES[nextIdx].id);
    onSelectColor(COLOR_PALETTES[nextIdx].colors[0]);
  };

  // Timer format (mm:ss)
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <>
      {/* 1. TOP HEADER (Undo, Redo, Timer Pill & Overflow Menu) */}
      <header className="absolute top-4 inset-x-4 z-40 flex items-center justify-between pointer-events-none">
        <div />

        {/* Right Top Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Break Timer Capsule */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-xl text-xs font-semibold text-zinc-200">
            <button
              onClick={onToggleTimer}
              className="p-1 rounded-full hover:bg-white/10 text-emerald-400 transition-colors"
              title={isTimerRunning ? 'Pause break timer' : 'Resume break timer'}
            >
              {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <span className="font-mono tracking-wider">{timeFormatted}</span>
          </div>

          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            title="Undo stroke"
          >
            <Undo2 size={16} />
          </button>

          {/* Redo Button */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            title="Redo stroke"
          >
            <Redo2 size={16} />
          </button>

          {/* Overflow Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
              title="Menu & Settings"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 w-64 p-3 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-3 text-xs text-zinc-300 animate-fade-in z-50">
                <div className="font-semibold text-zinc-100 flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Break Playground</span>
                  <Sparkles size={13} className="text-amber-400" />
                </div>

                {/* Switch Design */}
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Select Artwork:</label>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                    {PLAYGROUND_DESIGNS.map(d => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onSelectDesign(d.id);
                          setShowMenu(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                          activeDesignId === d.id
                            ? 'bg-purple-500/20 text-purple-300 font-semibold'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{d.title}</span>
                        {activeDesignId === d.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Break Duration Preset */}
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Break Timer:</label>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 10].map(duration => (
                      <button
                        key={duration}
                        onClick={() => onSelectDuration(duration)}
                        className={`flex-1 py-1 rounded-md text-center font-semibold transition-all ${
                          Math.round(secondsLeft / 60) === duration
                            ? 'bg-white text-zinc-950 shadow'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {duration}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound & Haptics Toggles */}
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <span className="text-xs">ASMR Brush Sounds</span>
                  <button
                    onClick={onToggleSound}
                    className={`p-1.5 rounded-lg transition-colors ${
                      soundEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:bg-white/5'
                    }`}
                  >
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Haptics</span>
                  <button
                    onClick={onToggleHaptics}
                    className={`p-1.5 rounded-lg transition-colors ${
                      hapticsEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:bg-white/5'
                    }`}
                  >
                    <Vibrate size={15} />
                  </button>
                </div>

                {/* Template & Color Actions */}
                <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                  {onLoadReference && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onLoadReference();
                      }}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-semibold transition-colors"
                      title="Fill noodles with original reference photo colors"
                    >
                      <Sparkles size={13} /> Load Reference Colors
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onReset();
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold transition-colors"
                    title="Clear paint to blank silicone template"
                  >
                    <RotateCcw size={13} /> Blank Silicone Sheet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. DOCKED VERTICAL CONTROL RAIL (Left or Right) */}
      <aside
        className={`absolute top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 p-2 rounded-full bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl animate-fade-in ${
          dockSide === 'left' ? 'left-4' : 'right-4'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Exit Playground back to Notes"
        >
          <X size={18} />
        </button>

        {/* Side-Swap Button */}
        <button
          onClick={() => setDockSide(dockSide === 'left' ? 'right' : 'left')}
          className="p-2 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
          title="Swap toolbar side"
        >
          <ArrowLeftRight size={14} />
        </button>

        <div className="w-6 h-px bg-white/10 my-0.5" />

        {/* Vertical Brush Size Slider */}
        <div className="flex flex-col items-center gap-1.5 py-1" title={`Brush Size: ${brushSize}px`}>
          <div className="relative h-28 w-6 flex items-center justify-center">
            <input
              type="range"
              min="4"
              max="64"
              value={brushSize}
              onChange={e => onChangeBrushSize(Number(e.target.value))}
              className="h-28 w-2 appearance-none rounded-full bg-zinc-700/60 accent-purple-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>
          {/* Dynamic Brush Size Preview Indicator */}
          <div
            className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center pointer-events-none"
            title={`${brushSize}px`}
          >
            <div
              className="rounded-full bg-white transition-all duration-150"
              style={{
                width: Math.max(3, Math.min(14, brushSize * 0.25)),
                height: Math.max(3, Math.min(14, brushSize * 0.25)),
              }}
            />
          </div>
        </div>

        {/* Vertical Brush Opacity Slider */}
        <div className="flex flex-col items-center gap-1.5 py-1" title={`Opacity: ${Math.round(brushOpacity * 100)}%`}>
          <div className="relative h-24 w-6 flex items-center justify-center">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={brushOpacity}
              onChange={e => onChangeBrushOpacity(Number(e.target.value))}
              className="h-24 w-2 appearance-none rounded-full bg-zinc-700/60 accent-purple-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 font-semibold">
            {Math.round(brushOpacity * 100)}%
          </span>
        </div>

        <div className="w-6 h-px bg-white/10 my-0.5" />

        {/* Tool Selectors */}
        {/* 1. Soft Brush */}
        <button
          onClick={() => onSelectTool('brush')}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            activeTool === 'brush'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Soft Watercolor Brush (Clipped inside lines)"
        >
          <Paintbrush size={17} />
        </button>

        {/* 2. Marker */}
        <button
          onClick={() => onSelectTool('marker')}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            activeTool === 'marker'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Marker Pen (Smooth opaque strokes)"
        >
          <PenTool size={17} />
        </button>

        {/* 3. Eraser */}
        <button
          onClick={() => onSelectTool('eraser')}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            activeTool === 'eraser'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30 scale-110'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Eraser (Erase colors within section)"
        >
          <Eraser size={17} />
        </button>

        {/* 4. Tap-To-Fill Bucket */}
        <button
          onClick={() => onSelectTool('fill')}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            activeTool === 'fill'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Bucket Fill (Instant tap to fill segment)"
        >
          <PaintBucket size={17} />
        </button>
      </aside>

      {/* 3. FLOATING BOTTOM CHROMOTHERAPY PALETTE BAR */}
      <footer className="absolute bottom-4 inset-x-4 z-40 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto max-w-full overflow-hidden">
          {/* Eyedropper Button */}
          <button
            onClick={onToggleEyedropper}
            className={`p-2 rounded-full transition-all ${
              isEyedropperActive
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30 scale-110'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Eyedropper: Sample any color on the artwork"
          >
            <Pipette size={17} />
          </button>

          <div className="h-5 w-px bg-white/15 mx-1" />

          {/* Left Palette Arrow */}
          <button
            onClick={handlePrevPalette}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Previous Palette"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Swatches Container */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
            {currentPalette.colors.map(color => {
              const isSelected = activeColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  onClick={() => onSelectColor(color)}
                  className={`relative w-8 h-8 rounded-full transition-all duration-200 shrink-0 flex items-center justify-center ${
                    isSelected
                      ? 'scale-125 shadow-lg shadow-black/50 ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                      : 'hover:scale-110 opacity-90 hover:opacity-100'
                  }`}
                  style={{ background: color }}
                  title={color}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-black/40 shadow-inner" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Palette Arrow */}
          <button
            onClick={handleNextPalette}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Next Palette"
          >
            <ChevronRight size={16} />
          </button>

          <div className="h-5 w-px bg-white/15 mx-1" />

          {/* Rainbow Color Wheel Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Custom Color Wheel"
            >
              <Palette size={17} />
            </button>

            {/* Custom Color Input Popup */}
            {showColorPicker && (
              <div className="absolute bottom-12 right-0 p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col gap-2 items-center z-50 animate-fade-in">
                <input
                  type="color"
                  value={activeColor}
                  onChange={e => onSelectColor(e.target.value)}
                  className="w-28 h-28 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="font-mono text-xs font-bold text-white uppercase">{activeColor}</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
