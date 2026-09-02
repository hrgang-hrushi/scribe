'use client';

import { useState } from 'react';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  function handleDigit(d: string) {
    if (fresh) { setDisplay(d); setFresh(false); }
    else setDisplay(display === '0' ? d : display + d);
  }

  function handleOp(o: string) {
    if (prev !== null && op && !fresh) {
      const result = calculate(prev, parseFloat(display), op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(parseFloat(display));
    }
    setOp(o);
    setFresh(true);
  }

  function handleEquals() {
    if (prev === null || !op) return;
    const result = calculate(prev, parseFloat(display), op);
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setFresh(true);
  }

  function calculate(a: number, b: number, operator: string): number {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  }

  function handleClear() { setDisplay('0'); setPrev(null); setOp(null); setFresh(true); }
  function handleBackspace() { setDisplay(display.length > 1 ? display.slice(0, -1) : '0'); }
  function handlePercent() { setDisplay(String(parseFloat(display) / 100)); }
  function handleNegate() { setDisplay(String(-parseFloat(display))); }

  const buttons = [
    ['C', '±', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
  ];

  return (
    <div
      className="fixed bottom-24 right-6 z-50 w-56 rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
      style={{ background: 'var(--toolbar-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Calculator</span>
        <button onClick={onClose} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Display */}
      <div className="px-4 py-3 text-right">
        <div className="text-2xl font-light tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
          {display}
        </div>
      </div>
      {/* Buttons */}
      <div className="grid grid-cols-4 gap-px p-1" style={{ background: 'var(--border)' }}>
        {buttons.flat().map((btn, i) => {
          const isOp = ['/', '*', '-', '+', '='].includes(btn);
          const isSpecial = ['C', '±', '%'].includes(btn);
          return (
            <button
              key={i}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '±') handleNegate();
                else if (btn === '%') handlePercent();
                else if (btn === '⌫') handleBackspace();
                else if (btn === '=') handleEquals();
                else if (isOp) handleOp(btn);
                else handleDigit(btn);
              }}
              className={`h-11 text-sm font-medium transition-colors ${
                isOp ? 'text-white' : isSpecial ? '' : ''
              }`}
              style={{
                background: isOp ? 'var(--accent)' : 'var(--bg-secondary)',
                color: isOp ? 'var(--bg-primary)' : isSpecial ? 'var(--accent)' : 'var(--text-primary)',
                gridColumn: btn === '0' ? 'span 2' : undefined,
              }}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
