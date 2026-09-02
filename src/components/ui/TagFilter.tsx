'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllClasses, getNotesForClass, searchAll } from '@/lib/db';
import type { Note, ClassItem } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface TagFilterProps {
  onClose: () => void;
}

export default function TagFilter({ onClose }: TagFilterProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filteredNotes, setFilteredNotes] = useState<(Note & { className?: string })[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      filterByTag(selectedTag);
    }
  }, [selectedTag]);

  async function loadTags() {
    const classes = await getAllClasses();
    const tagSet = new Set<string>();
    for (const cls of classes) {
      const notes = await getNotesForClass(cls.id);
      notes.forEach(n => n.tags.forEach(t => tagSet.add(t)));
    }
    setAllTags(Array.from(tagSet).sort());
  }

  async function filterByTag(tag: string) {
    const classes = await getAllClasses();
    const results: (Note & { className?: string })[] = [];
    for (const cls of classes) {
      const notes = await getNotesForClass(cls.id);
      notes.filter(n => n.tags.includes(tag)).forEach(n => {
        results.push({ ...n, className: cls.name });
      });
    }
    setFilteredNotes(results.sort((a, b) => b.updatedAt - a.updatedAt));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
        style={{ background: 'var(--bg-secondary)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Filter by Tag</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {allTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: selectedTag === tag ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: selectedTag === tag ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags found. Add tags to your notes to filter them here.</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNotes.map(note => (
            <TagNoteCard key={note.id} note={note} />
          ))}
          {selectedTag && filteredNotes.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No notes with this tag</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function TagNoteCard({ note }: { note: Note & { className?: string } }) {
  const router = useRouter();
  return (
    <div
      className="rounded-xl p-3 mb-2 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'var(--bg-tertiary)' }}
      onClick={() => { router.push(`/notes/${note.id}`); }}
    >
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{note.title}</h3>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {note.className && `${note.className} · `}
        {new Date(note.updatedAt).toLocaleDateString()}
        {note.tags.length > 0 && ` · ${note.tags.map(t => `#${t}`).join(' ')}`}
      </p>
    </div>
  );
}
