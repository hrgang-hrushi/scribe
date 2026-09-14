'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export default function NoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('NotePage runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center p-6 select-none font-sans"
      style={{ background: 'var(--bg-primary, #0f0f14)', color: 'var(--text-primary, #ffffff)' }}
    >
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-[var(--border, rgba(255,255,255,0.1))] shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-5">
          <ShieldAlert size={36} />
        </div>

        <h2 className="text-xl font-bold mb-2">Could Not Load Note</h2>
        <p className="text-sm opacity-75 mb-6 leading-relaxed">
          {error?.message?.includes('quota')
            ? 'Local database storage quota reached. Please return to dashboard and optimize storage in Settings.'
            : 'An unexpected issue occurred while rendering this note. Your notes remain saved in local storage.'}
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            style={{ background: 'var(--accent, #6366f1)', color: '#ffffff' }}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border border-[var(--border, rgba(255,255,255,0.1))] flex items-center justify-center gap-2"
            style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.06))', color: 'var(--text-primary, #ffffff)' }}
          >
            <Home size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
