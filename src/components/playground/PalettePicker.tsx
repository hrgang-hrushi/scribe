'use client';

import React from 'react';
import { COLOR_PALETTES } from '@/lib/playground-designs';
import { Eraser, RotateCcw, Sparkles } from 'lucide-react';

interface PalettePickerProps {
  activeColor: string;
  onSelectColor: (color: string) => void;
  activePaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  isEraser: boolean;
  onToggleEraser: (eraser: boolean) => void;
  onResetBoard: () => void;
  coloredCount: number;
  totalSegments: number;
}

export default function PalettePicker({
  activeColor,
  onSelectColor,
  activePaletteId,
  onSelectPalette,
  isEraser,
  onToggleEraser,
  onResetBoard,
  coloredCount,
  totalSegments,
}: PalettePickerProps) {
  const currentPalette = COLOR_PALETTES.find(p => p.id === activePaletteId) || COLOR_PALETTES[0];

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-2xl glass-panel shadow-2xl backdrop-blur-xl border border-white/10 dark:border-white/5 max-w-full overflow-hidden select-none">
      {/* Top Header: Palettes & Progress */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {COLOR_PALETTES.map(palette => (
            <button
              key={palette.id}
              onClick={() => {
                onSelectPalette(palette.id);
                onToggleEraser(false);
                onSelectColor(palette.colors[0]);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePaletteId === palette.id
                  ? 'bg-white text-zinc-900 shadow-md scale-105'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
              title={palette.psychologicalEffect}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: palette.colors[0] }}
              />
              <span>{palette.name}</span>
            </button>
          ))}
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Sparkles size={12} />
          <span>
            {Math.round((coloredCount / Math.max(1, totalSegments)) * 100)}% Relaxed
          </span>
        </div>
      </div>

      {/* Psychological Effect Notice */}
      <p className="text-[11px] text-zinc-400 italic px-1 truncate">
        {currentPalette.psychologicalEffect}
      </p>

      {/* Color Swatches & Action Tools */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
        {/* Swatches */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {currentPalette.colors.map(color => {
            const isSelected = !isEraser && activeColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                onClick={() => {
                  onToggleEraser(false);
                  onSelectColor(color);
                }}
                className={`relative w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isSelected
                    ? 'scale-125 shadow-lg shadow-black/40 ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                    : 'hover:scale-110 opacity-85 hover:opacity-100'
                }`}
                style={{ background: color }}
                title={`Select ${color}`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-black/40 shadow-inner" />
                )}
              </button>
            );
          })}

          {/* Custom Color Input */}
          <label
            className={`w-9 h-9 rounded-full border-2 border-dashed border-white/30 hover:border-white flex items-center justify-center cursor-pointer transition-all hover:scale-110 shrink-0 ${
              !isEraser && !currentPalette.colors.includes(activeColor) ? 'ring-2 ring-white' : ''
            }`}
            style={{
              background: !isEraser && !currentPalette.colors.includes(activeColor) ? activeColor : 'transparent',
            }}
            title="Choose custom color"
          >
            <input
              type="color"
              value={activeColor}
              onChange={e => {
                onToggleEraser(false);
                onSelectColor(e.target.value);
              }}
              className="sr-only"
            />
            <span className="text-xs font-bold text-white/80">+</span>
          </label>
        </div>

        {/* Tools: Eraser & Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleEraser(!isEraser)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isEraser
                ? 'bg-amber-500 text-zinc-950 shadow-lg scale-105'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
            title="Eraser: Reset individual channels back to raw silicone"
          >
            <Eraser size={14} />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <button
            onClick={() => {
              if (coloredCount > 0 && confirm('Clear the board to start fresh?')) {
                onResetBoard();
              }
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Reset Board"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
