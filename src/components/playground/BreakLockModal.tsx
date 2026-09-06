'use client';

import React from 'react';
import { Brain, ArrowRight, Clock, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';

interface BreakLockModalProps {
  minutesRested: number;
  segmentsColored: number;
  totalSegments: number;
  onReturnToWork: () => void;
  onSnoozeOneMinute: () => void;
  onExportArt?: () => void;
  noteTitle?: string;
}

export default function BreakLockModal({
  minutesRested,
  segmentsColored,
  totalSegments,
  onReturnToWork,
  onSnoozeOneMinute,
  onExportArt,
  noteTitle,
}: BreakLockModalProps) {
  const percentComplete = Math.round((segmentsColored / Math.max(1, totalSegments)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel shadow-2xl border border-white/20 dark:border-white/10 text-white flex flex-col items-center text-center animate-slide-up">
        {/* Glowing Icon */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-zinc-950 shadow-xl">
            <Brain size={32} />
          </div>
        </div>

        {/* Title & Psychological Encouragement */}
        <h2 className="text-xl font-bold tracking-tight text-white mb-1.5">
          Break Complete! Mind Recharged.
        </h2>
        <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mb-6">
          Your prefrontal cortex has enjoyed non-cognitive rest. Cortisol levels have lowered, and your executive focus is primed for deep study.
        </p>

        {/* Focus Stats Cards */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold mb-0.5">
              <Clock size={13} />
              <span>Time Rested</span>
            </div>
            <span className="text-xl font-black">{minutesRested}m</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold mb-0.5">
              <Sparkles size={13} />
              <span>Sensory Flow</span>
            </div>
            <span className="text-xl font-black">{percentComplete}%</span>
          </div>
        </div>

        {/* Primary Action: Get Back to Work */}
        <button
          onClick={onReturnToWork}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
        >
          <span>{noteTitle ? `Return to "${noteTitle}"` : 'Get Back to Work'}</span>
          <ArrowRight size={16} />
        </button>

        {/* Secondary Actions: Snooze or Save Image */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={onSnoozeOneMinute}
            className="text-xs font-semibold text-zinc-400 hover:text-white py-1.5 px-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Finish current noodle (+1 min)</span>
          </button>

          {onExportArt && (
            <button
              onClick={onExportArt}
              className="text-xs font-semibold text-zinc-400 hover:text-white py-1.5 px-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5"
              title="Save your colored mat artwork"
            >
              <ImageIcon size={13} />
              <span>Save Mat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
