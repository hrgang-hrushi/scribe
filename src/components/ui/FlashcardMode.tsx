'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface FlashcardModeProps {
  noteId: string;
  onClose: () => void;
}

interface Flashcard {
  front: string;
  back: string;
}

export default function FlashcardMode({ noteId, onClose }: FlashcardModeProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [reviewMode, setReviewMode] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    loadCards();
  }, [noteId]);

  async function loadCards() {
    // Load custom flashcards from localStorage
    const saved = localStorage.getItem(`flashcards-${noteId}`);
    if (saved) {
      setCards(JSON.parse(saved));
    }
  }

  function saveCards(newCards: Flashcard[]) {
    setCards(newCards);
    localStorage.setItem(`flashcards-${noteId}`, JSON.stringify(newCards));
  }

  function handleAddCard() {
    if (!newFront.trim() || !newBack.trim()) return;
    const updated = [...cards, { front: newFront.trim(), back: newBack.trim() }];
    saveCards(updated);
    setNewFront('');
    setNewBack('');
    setShowCreate(false);
  }

  function handleDeleteCard(index: number) {
    const updated = cards.filter((_, i) => i !== index);
    saveCards(updated);
    if (currentIndex >= updated.length) setCurrentIndex(Math.max(0, updated.length - 1));
  }

  function handleAnswer(correct: boolean) {
    setScore(s => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
    setFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setReviewMode(false);
    }
  }

  if (cards.length === 0 && !showCreate) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6 text-center glass-panel shadow-2xl border border-black/10 dark:border-white/10"
          
          onClick={e => e.stopPropagation()}
        >
          <div className="text-4xl mb-3">🃏</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Flashcards</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Create flashcards from your notes to study with spaced repetition
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Create First Card
          </button>
        </div>
      </div>
    );
  }

  if (showCreate) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6 glass-panel shadow-2xl border border-black/10 dark:border-white/10"
          
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Flashcard</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Front (Question)</label>
              <textarea
                value={newFront}
                onChange={e => setNewFront(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                rows={3}
                placeholder="Enter question or term..."
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Back (Answer)</label>
              <textarea
                value={newBack}
                onChange={e => setNewBack(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                rows={3}
                placeholder="Enter answer or definition..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
              Cancel
            </button>
            <button onClick={handleAddCard} className="flex-1 py-2.5 rounded-xl text-sm font-medium " style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
              Add Card
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reviewMode) {
    const card = cards[currentIndex];
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      >
        <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="text-center mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {currentIndex + 1} / {cards.length} · Score: {score.correct}/{score.total}
            </span>
          </div>
          <motion.div
            className="w-full aspect-[3/2] rounded-2xl p-6 flex items-center justify-center cursor-pointer"
            style={{ background: flipped ? 'var(--accent)' : 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            onClick={() => setFlipped(!flipped)}
            whileTap={{ scale: 0.98 }}
          >
            <p className="text-center text-sm font-medium" style={{ color: flipped ? 'var(--bg-primary)' : 'var(--text-primary)' }}>
              {flipped ? card.back : card.front}
            </p>
          </motion.div>
          {flipped && (
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleAnswer(false)} className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500 flex items-center justify-center gap-1.5">
                <X size={16} /> Again
              </button>
              <button onClick={() => handleAnswer(true)} className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-green-500 flex items-center justify-center gap-1.5">
                <Check size={16} /> Got it
              </button>
            </div>
          )}
          <button onClick={() => { setReviewMode(false); setFlipped(false); }} className="w-full mt-3 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            End Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden max-h-[80vh] flex flex-col glass-panel shadow-2xl border border-black/10 dark:border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Flashcards ({cards.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setReviewMode(true); setCurrentIndex(0); setScore({ correct: 0, total: 0 }); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                Review
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cards.map((card, i) => (
            <div key={i} className="rounded-xl p-3 flex items-start justify-between gap-2" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{card.front}</p>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{card.back}</p>
              </div>
              <button onClick={() => handleDeleteCard(i)} className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
