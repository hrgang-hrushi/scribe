'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home dashboard where notes and classes are listed
    router.replace('/');
  }, [router]);

  return (
    <div
      className="h-full w-full flex items-center justify-center font-sans"
      style={{ background: 'var(--bg-primary, #0f0f14)', color: 'var(--text-primary, #ffffff)' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent, #6366f1)] border-t-transparent animate-spin" />
        <p className="text-sm opacity-70">Redirecting to your notes...</p>
      </div>
    </div>
  );
}
