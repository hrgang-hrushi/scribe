'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Coffee } from 'lucide-react';

interface PomodoroTimerProps {
  onClose: () => void;
}

type Mode = 'work' | 'break';

export default function PomodoroTimer({ onClose }: PomodoroTimerProps) {
  const [mode, setMode] = useState<Mode>('work');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            // Switch mode
            if (mode === 'work') {
              setSessions(s => s + 1);
              setMode('break');
              return breakMinutes * 60;
            } else {
              setMode('work');
              return workMinutes * 60;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, workMinutes, breakMinutes]);

  function toggle() {
    setIsRunning(!isRunning);
  }

  function reset() {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(workMinutes * 60);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (mode === 'work' ? workMinutes * 60 : breakMinutes * 60);

  return (
    <div
      className="fixed bottom-24 right-6 z-50 w-56 rounded-2xl overflow-hidden shadow-2xl animate-slide-up glass-panel border border-black/10 dark:border-white/10"
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          {mode === 'work' ? <><Brain size={14}/> Focus</> : <><Coffee size={14}/> Break</>}
        </span>
        <button onClick={onClose} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timer */}
      <div className="p-4 text-center">
        {/* Progress ring */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={mode === 'work' ? 'var(--accent)' : '#22c55e'}
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{ background: 'var(--accent)' }}
          >
            {isRunning ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button
            onClick={reset}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
        </div>

        {/* Sessions */}
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Sessions completed: {sessions}
        </p>

        {/* Time settings */}
        <div className="flex gap-4 mt-3 justify-center">
          <div className="text-center">
            <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Focus</label>
            <select
              value={workMinutes}
              onChange={e => { setWorkMinutes(Number(e.target.value)); if (!isRunning) setTimeLeft(Number(e.target.value) * 60); }}
              className="text-xs bg-transparent border rounded px-2 py-1"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            >
              {[15, 20, 25, 30, 45, 60].map(m => (
                <option key={m} value={m}>{m}m</option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Break</label>
            <select
              value={breakMinutes}
              onChange={e => setBreakMinutes(Number(e.target.value))}
              className="text-xs bg-transparent border rounded px-2 py-1"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            >
              {[5, 10, 15].map(m => (
                <option key={m} value={m}>{m}m</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
