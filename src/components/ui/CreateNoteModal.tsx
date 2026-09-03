'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Maximize2, AlignJustify, Grid3X3, CircleDot, LayoutTemplate, Sparkles } from 'lucide-react';
import type { Note, PaperColor } from '@/lib/types';
import { PAPER_THEMES } from '@/lib/types';
import { createNote } from '@/lib/db';
import { useRouter } from 'next/navigation';

interface CreateNoteModalProps {
  classId: string;
  classNameTitle?: string;
  onClose: () => void;
  dateOverride?: string;
}

const TEMPLATES: { id: Note['template']; label: string; icon: any }[] = [
  { id: 'dotted', label: 'Dotted', icon: CircleDot },
  { id: 'ruled', label: 'Ruled', icon: AlignJustify },
  { id: 'grid', label: 'Grid', icon: Grid3X3 },
  { id: 'cornell', label: 'Cornell', icon: LayoutTemplate },
  { id: 'blank', label: 'Blank', icon: FileText },
];

const PAPER_COLORS: { id: PaperColor; label: string; preview: string; text: string }[] = [
  { id: 'navy', label: 'Midnight Navy', preview: '#0f1f38', text: '#ffffff' },
  { id: 'cream', label: 'Warm Cream', preview: '#fcf8ec', text: '#2c251e' },
  { id: 'white', label: 'Pure White', preview: '#ffffff', text: '#000000' },
  { id: 'dark', label: 'Charcoal', preview: '#161618', text: '#ffffff' },
];

export default function CreateNoteModal({
  classId,
  classNameTitle,
  onClose,
  dateOverride,
}: CreateNoteModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState(
    `Note ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  );
  const [pageType, setPageType] = useState<Note['pageType']>('paginated');
  const [template, setTemplate] = useState<Note['template']>('dotted');
  const [paperColor, setPaperColor] = useState<PaperColor>('navy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const newNote = await createNote(classId, title.trim() || undefined, dateOverride, {
        template,
        pageType,
        paperColor,
      });
      onClose();
      router.push(`/notes/${newNote.id}`);
    } catch (err) {
      console.error('Failed to create note:', err);
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 10, opacity: 0 }}
        className="w-full max-w-lg rounded-[28px] p-6 md:p-8 shadow-2xl glass-panel relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              New Note
            </h2>
            {classNameTitle && (
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                in {classNameTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Note Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
              Title
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Calculus Lecture 4"
              className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none transition-shadow shadow-sm focus:ring-2 focus:ring-[var(--accent)]"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Format Selection: Pages vs Canvas */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
              Notebook Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPageType('paginated')}
                className={`p-3.5 rounded-2xl flex flex-col items-start text-left transition-all border ${
                  pageType === 'paginated'
                    ? 'border-[var(--accent)] shadow-md bg-[var(--accent)] text-[var(--bg-primary)]'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={18} />
                  <span className="font-bold text-sm">Notebook Pages</span>
                </div>
                <span className="text-xs opacity-75 font-normal">
                  Standard sheets, continuous scroll to new page
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPageType('infinite')}
                className={`p-3.5 rounded-2xl flex flex-col items-start text-left transition-all border ${
                  pageType === 'infinite'
                    ? 'border-[var(--accent)] shadow-md bg-[var(--accent)] text-[var(--bg-primary)]'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Maximize2 size={18} />
                  <span className="font-bold text-sm">Infinite Canvas</span>
                </div>
                <span className="text-xs opacity-75 font-normal">
                  Unbounded 2D board for mindmaps & proofs
                </span>
              </button>
            </div>
          </div>

          {/* Paper Color Palette */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
              Paper Theme
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PAPER_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPaperColor(c.id)}
                  className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all relative overflow-hidden border ${
                    paperColor === c.id
                      ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 scale-105 shadow-md'
                      : 'border-black/10 dark:border-white/10 opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.preview, color: c.text }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border shadow-inner"
                    style={{
                      backgroundColor: c.preview,
                      borderColor: c.id === 'white' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                  <span className="text-[11px] font-semibold truncate max-w-full">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paper Pattern Template */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
              Paper Template
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATES.map(t => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`py-2.5 px-2 rounded-2xl flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Opening...' : 'Start Writing'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
