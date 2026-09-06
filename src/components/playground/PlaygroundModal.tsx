'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PLAYGROUND_DESIGNS, COLOR_PALETTES } from '@/lib/playground-designs';
import { playMeditationBell } from '@/lib/playground-sound';
import TactileMatCanvas from './TactileMatCanvas';
import PalettePicker from './PalettePicker';
import BreakTimerBar from './BreakTimerBar';
import BreakLockModal from './BreakLockModal';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle?: string;
}

export default function PlaygroundModal({
  isOpen,
  onClose,
  noteTitle,
}: PlaygroundModalProps) {
  // Active sensory board
  const [activeDesignId, setActiveDesignId] = useState<string>('curli-mat');
  const activeDesign = PLAYGROUND_DESIGNS.find(d => d.id === activeDesignId) || PLAYGROUND_DESIGNS[0];

  // Colors & Palette
  const [activePaletteId, setActivePaletteId] = useState<string>(activeDesign.recommendedPaletteId || 'silicone-pop');
  const [activeColor, setActiveColor] = useState<string>('#F97316'); // Default Tangerine Orange
  const [isEraser, setIsEraser] = useState(false);

  // Per-design stroke fills map
  const [fills, setFills] = useState<Record<string, string>>({});

  // Audio & Haptics settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Break Timer State
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Timer interval ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved state on mount or design change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedSound = localStorage.getItem('scribe-playground-sound');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');

      const savedHaptics = localStorage.getItem('scribe-playground-haptics');
      if (savedHaptics !== null) setHapticsEnabled(savedHaptics === 'true');

      const savedFills = localStorage.getItem(`scribe-playground-fills-${activeDesignId}`);
      if (savedFills) {
        setFills(JSON.parse(savedFills));
      } else {
        setFills({});
      }
    } catch {}
  }, [activeDesignId]);

  // Save fills on change
  const handleFillSegment = useCallback((segmentId: string, color: string) => {
    setFills(prev => {
      const next = { ...prev, [segmentId]: color };
      try {
        localStorage.setItem(`scribe-playground-fills-${activeDesignId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [activeDesignId]);

  // Reset current board
  const handleResetBoard = useCallback(() => {
    setFills({});
    try {
      localStorage.removeItem(`scribe-playground-fills-${activeDesignId}`);
    } catch {}
  }, [activeDesignId]);

  // Timer Countdown Logic
  useEffect(() => {
    if (!isOpen || isLocked || !isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Timer finished! Trigger Lock
          setIsTimerRunning(false);
          setIsLocked(true);
          playMeditationBell(soundEnabled);
          if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 90, 40]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isLocked, isTimerRunning, soundEnabled, hapticsEnabled]);

  // Select Duration Preset
  const handleSelectDuration = useCallback((minutes: number) => {
    setBreakDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setIsTimerRunning(true);
    setIsLocked(false);
  }, []);

  // Snooze 1 minute
  const handleSnooze = useCallback(() => {
    setSecondsLeft(60);
    setIsTimerRunning(true);
    setIsLocked(false);
  }, []);

  // Return to Work
  const handleReturnToWork = useCallback(() => {
    setIsLocked(false);
    onClose();
  }, [onClose]);

  // Toggle Sound Setting
  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('scribe-playground-sound', String(next));
      return next;
    });
  }, []);

  // Toggle Haptics Setting
  const handleToggleHaptics = useCallback(() => {
    setHapticsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('scribe-playground-haptics', String(next));
      return next;
    });
  }, []);

  // Count colored segments
  const coloredCount = Object.keys(fills).length;
  const totalSegments = activeDesign.segments.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-2xl animate-fade-in select-none overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: activeColor }}
      />

      {/* Top Header / Timer Bar */}
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 shrink-0 z-20">
        <BreakTimerBar
          secondsLeft={secondsLeft}
          totalDurationSeconds={breakDurationMinutes * 60}
          isRunning={isTimerRunning}
          onTogglePlay={() => setIsTimerRunning(!isTimerRunning)}
          onSelectDuration={handleSelectDuration}
          activeDesignId={activeDesignId}
          onSelectDesign={id => {
            setActiveDesignId(id);
            const design = PLAYGROUND_DESIGNS.find(d => d.id === id);
            if (design) {
              setActivePaletteId(design.recommendedPaletteId);
              const pal = COLOR_PALETTES.find(p => p.id === design.recommendedPaletteId);
              if (pal) setActiveColor(pal.colors[0]);
            }
          }}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          hapticsEnabled={hapticsEnabled}
          onToggleHaptics={handleToggleHaptics}
          onClosePlayground={onClose}
        />
      </div>

      {/* Center Interactive Tactile Mat Canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center relative z-10 px-2 min-h-0">
        <TactileMatCanvas
          design={activeDesign}
          activeColor={activeColor}
          isEraser={isEraser}
          fills={fills}
          onFillSegment={handleFillSegment}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
        />
      </main>

      {/* Bottom Floating Chromotherapy Palette Picker */}
      <footer className="w-full max-w-3xl mx-auto p-3 sm:p-4 shrink-0 z-20">
        <PalettePicker
          activeColor={activeColor}
          onSelectColor={setActiveColor}
          activePaletteId={activePaletteId}
          onSelectPalette={setActivePaletteId}
          isEraser={isEraser}
          onToggleEraser={setIsEraser}
          onResetBoard={handleResetBoard}
          coloredCount={coloredCount}
          totalSegments={totalSegments}
        />
      </footer>

      {/* Work Lock Screen (Triggered automatically when break timer hits 0:00) */}
      {isLocked && (
        <BreakLockModal
          minutesRested={breakDurationMinutes}
          segmentsColored={coloredCount}
          totalSegments={totalSegments}
          onReturnToWork={handleReturnToWork}
          onSnoozeOneMinute={handleSnooze}
          noteTitle={noteTitle}
        />
      )}
    </div>
  );
}
