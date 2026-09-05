'use client';

import React from 'react';
import { Play, Pause, Volume2, VolumeX, Smartphone, ArrowLeft, Layers } from 'lucide-react';
import { PLAYGROUND_DESIGNS } from '@/lib/playground-designs';

interface BreakTimerBarProps {
  secondsLeft: number;
  totalDurationSeconds: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onSelectDuration: (minutes: number) => void;
  activeDesignId: string;
  onSelectDesign: (designId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onClosePlayground: () => void;
}

export default function BreakTimerBar({
  secondsLeft,
  totalDurationSeconds,
  isRunning,
  onTogglePlay,
  onSelectDuration,
  activeDesignId,
  onSelectDesign,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onClosePlayground,
}: BreakTimerBarProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / Math.max(1, totalDurationSeconds)));

  const activeDesign = PLAYGROUND_DESIGNS.find(d => d.id === activeDesignId) || PLAYGROUND_DESIGNS[0];

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl glass-panel shadow-2xl backdrop-blur-xl border border-white/10 dark:border-white/5 select-none">
      {/* Left: Back to Study & Design Switcher */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onClosePlayground}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-semibold transition-all hover:scale-105"
          title="Return to Note"
        >
          <ArrowLeft size={14} />
          <span>Back to Notes</span>
        </button>

        {/* Board Design Selector */}
        <div className="relative flex items-center gap-1">
          <Layers size={14} className="text-zinc-400 ml-1 hidden sm:inline" />
          <select
            value={activeDesignId}
            onChange={e => onSelectDesign(e.target.value)}
            className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-white/10 outline-none cursor-pointer"
            title="Switch Sensory Board"
          >
            {PLAYGROUND_DESIGNS.map(d => (
              <option key={d.id} value={d.id} className="bg-zinc-900 text-white">
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Breath Timer & Progress Ring */}
      <div className="flex items-center gap-3">
        {/* Progress SVG Ring */}
        <div className="relative w-9 h-9 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-white/10"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-400 transition-all duration-500 ease-out"
              strokeDasharray={`${progress * 100}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center text-white/80 hover:text-white"
            title={isRunning ? 'Pause Break' : 'Resume Break'}
          >
            {isRunning ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>
        </div>

        {/* Time Remaining */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black tracking-tight text-white font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              Break
            </span>
          </div>
        </div>

        {/* Duration Presets */}
        <div className="hidden md:flex items-center gap-1 pl-2 border-l border-white/10">
          {[3, 5, 10].map(mins => {
            const isCurrent = Math.round(totalDurationSeconds / 60) === mins;
            return (
              <button
                key={mins}
                onClick={() => onSelectDuration(mins)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Set ${mins} minute break`}
              >
                {mins}m
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Sound & Haptic Toggles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl text-xs font-semibold transition-all ${
            soundEnabled ? 'bg-white/10 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title={soundEnabled ? 'ASMR Sound Effects On' : 'Sound Effects Muted'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          onClick={onToggleHaptics}
          className={`p-2 rounded-xl text-xs font-semibold transition-all ${
            hapticsEnabled ? 'bg-white/10 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title={hapticsEnabled ? 'Tactile Haptics Enabled' : 'Haptics Disabled'}
        >
          <Smartphone size={16} />
        </button>
      </div>
    </header>
  );
}
