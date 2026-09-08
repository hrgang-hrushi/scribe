'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PLAYGROUND_DESIGNS, COLOR_PALETTES } from '@/lib/playground-designs';
import { playMeditationBell } from '@/lib/playground-sound';
import type { ColoringTool, EyedropperState } from '@/lib/playground-types';
import ColoringCanvas, { type ColoringCanvasRef } from './ColoringCanvas';
import ColoringToolbar from './ColoringToolbar';
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
  // Active design (Default: 3D Curly Silicone Fidget Mat from user reference image)
  const [activeDesignId, setActiveDesignId] = useState<string>('curli-original');
  const activeDesign = PLAYGROUND_DESIGNS.find(d => d.id === activeDesignId) || PLAYGROUND_DESIGNS[0];

  // Palette & Active Color (Default: Silicone Pop Electric Cyan)
  const [activePaletteId, setActivePaletteId] = useState<string>(activeDesign.recommendedPaletteId || 'silicone-pop');
  const [activeColor, setActiveColor] = useState<string>('#06B6D4'); // Electric cyan

  // Tool & Brush Settings
  const [activeTool, setActiveTool] = useState<ColoringTool>('brush');
  const [brushSize, setBrushSize] = useState<number>(20);
  const [brushOpacity, setBrushOpacity] = useState<number>(0.85);

  // Eyedropper Loupe State
  const [eyedropperState, setEyedropperState] = useState<EyedropperState>({
    active: false,
    sampling: false,
    x: 0,
    y: 0,
    color: '#9C5238',
  });

  // Sound & Haptics settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Break Timer State
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Ref to canvas handle
  const canvasRef = useRef<ColoringCanvasRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedSound = localStorage.getItem('scribe-playground-sound');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');

      const savedHaptics = localStorage.getItem('scribe-playground-haptics');
      if (savedHaptics !== null) setHapticsEnabled(savedHaptics === 'true');
    } catch {}
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    if (!isOpen || isLocked || !isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Timer finished! Trigger Study Lock
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

  // Eyedropper state updater
  const handleUpdateEyedropper = useCallback((updates: Partial<EyedropperState>) => {
    setEyedropperState(prev => ({ ...prev, ...updates }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-2xl animate-fade-in select-none overflow-hidden touch-none">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full blur-[160px] pointer-events-none opacity-25 transition-colors duration-500"
        style={{ background: activeColor }}
      />

      {/* Main Interactive Tactile Silicone Mat Real Drawing Canvas */}
      <main className="flex-1 w-full h-full relative z-10 overflow-hidden">
        <ColoringCanvas
          ref={canvasRef}
          design={activeDesign}
          activeColor={activeColor}
          activeTool={activeTool}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          eyedropperState={eyedropperState}
          onUpdateEyedropper={handleUpdateEyedropper}
          onColorSampled={color => {
            setActiveColor(color);
            setActiveTool('brush');
          }}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
        />
      </main>

      {/* Floating Video-Matched Toolbar (Top Bar, Left/Right Docked Rail, Bottom Palette) */}
      <ColoringToolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        brushSize={brushSize}
        onChangeBrushSize={setBrushSize}
        brushOpacity={brushOpacity}
        onChangeBrushOpacity={setBrushOpacity}
        activeColor={activeColor}
        onSelectColor={setActiveColor}
        activePaletteId={activePaletteId}
        onSelectPalette={setActivePaletteId}
        onToggleEyedropper={() =>
          setEyedropperState(prev => ({
            ...prev,
            active: !prev.active,
            sampling: false,
          }))
        }
        isEyedropperActive={eyedropperState.active}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        canUndo={canvasRef.current?.canUndo ?? true}
        canRedo={canvasRef.current?.canRedo ?? false}
        onClose={onClose}
        onReset={() => canvasRef.current?.clearCanvas()}
        onLoadReference={() => canvasRef.current?.loadReferenceColors?.()}
        secondsLeft={secondsLeft}
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
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
      />

      {/* Work Lock Screen (Triggered automatically when break timer hits 0:00) */}
      {isLocked && (
        <BreakLockModal
          minutesRested={breakDurationMinutes}
          segmentsColored={canvasRef.current?.getFilledCount() || 0}
          totalSegments={activeDesign.segments.length}
          onReturnToWork={handleReturnToWork}
          onSnoozeOneMinute={handleSnooze}
          noteTitle={noteTitle}
        />
      )}
    </div>
  );
}
