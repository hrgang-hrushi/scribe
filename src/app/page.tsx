'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllClasses, createClass, deleteClass, updateClass, searchAll, createNote } from '@/lib/db';
import type { ClassItem } from '@/lib/types';
import { GRADIENT_PRESETS } from '@/lib/types';
import { useRouter } from 'next/navigation';
import TagFilter from '@/components/ui/TagFilter';
import FlashcardMode from '@/components/ui/FlashcardMode';
import PomodoroTimer from '@/components/ui/PomodoroTimer';

export default function Home() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ notes: any[]; classes: ClassItem[] }>({ notes: [], classes: [] });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardNoteId, setFlashcardNoteId] = useState<string | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadClasses();
    const savedTheme = localStorage.getItem('scribe-theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchAll(searchQuery).then(setSearchResults);
    } else {
      setSearchResults({ notes: [], classes: [] });
    }
  }, [searchQuery]);

  async function loadClasses() {
    const all = await getAllClasses();
    setClasses(all);
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('scribe-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    await createClass(newName.trim(), selectedGradient);
    setNewName('');
    setShowCreate(false);
    loadClasses();
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this class and all its notes?')) {
      await deleteClass(id);
      loadClasses();
    }
  }

  async function handleRename(id: string) {
    if (editName.trim()) {
      await updateClass(id, { name: editName.trim() });
      setEditingId(null);
      loadClasses();
    }
  }

  async function handleQuickNote(classId: string) {
    const note = await createNote(classId);
    router.push(`/notes/${note.id}`);
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="safe-top px-6 pt-4 pb-3 flex items-center justify-between" style={{ background: 'var(--bg-primary)' }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Scribe
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowTagFilter(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
            title="Filter by tag"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </button>
          <button
            onClick={() => setShowPomodoro(v => !v)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: showPomodoro ? 'var(--accent)' : 'var(--bg-tertiary)', color: showPomodoro ? 'white' : 'var(--text-primary)' }}
            title="Pomodoro timer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium text-xl transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search notes, classes, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </div>
        {searchQuery.length >= 2 && (searchResults.notes.length > 0 || searchResults.classes.length > 0) && (
          <div className="mt-2 rounded-xl p-3 max-h-60 overflow-y-auto no-scrollbar" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {searchResults.classes.map(c => (
              <button
                key={c.id}
                onClick={() => router.push(`/classes/${c.id}`)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-primary)' }}
              >
                📁 {c.name}
              </button>
            ))}
            {searchResults.notes.map(n => (
              <button
                key={n.id}
                onClick={() => router.push(`/notes/${n.id}`)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-primary)' }}
              >
                📝 {n.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Class Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No classes yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first class to start taking notes</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl text-white font-medium transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'var(--accent)' }}
            >
              Create Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {classes.map((cls, i) => {
              // Extract a base color for the glow from the hex/gradient
              const glowColor = cls.gradient.includes('#') ? cls.gradient.match(/#[0-9a-fA-F]{6}/)?.[0] || 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)';
              return (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className="rounded-2xl p-4 flex flex-col justify-between cursor-pointer group aspect-[8.5/11] border border-black/5 dark:border-white/5 transition-all hover:-translate-y-1"
                    style={{ 
                      background: cls.gradient.includes('gradient') ? 'var(--bg-secondary)' : cls.gradient,
                      boxShadow: `0 10px 30px -10px ${glowColor}66`,
                    }}
                    onClick={() => router.push(`/classes/${cls.id}`)}
                  >
                    <div className="relative z-10 flex-1">
                      {editingId === cls.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => handleRename(cls.id)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(cls.id)}
                          className="bg-transparent text-gray-900 dark:text-gray-100 font-semibold text-lg outline-none w-full border-b border-gray-400"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-3 leading-tight">
                          {cls.name}
                        </h3>
                      )}
                    </div>
                    <div className="relative z-10 flex items-end justify-between mt-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(cls.id); setEditName(cls.name); }}
                          className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                          className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickNote(cls.id); }}
                        className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-gray-900 dark:text-gray-100 hover:scale-110 transition-transform"
                        title="Quick new note"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: 'var(--bg-secondary)' }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Class</h2>
              <input
                autoFocus
                type="text"
                placeholder="Class name (e.g. Organic Chemistry)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Choose a color</p>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {GRADIENT_PRESETS.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedGradient(g)}
                    className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                    style={{
                      background: g,
                      outline: selectedGradient === g ? '2px solid var(--accent)' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'var(--accent)' }}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Filter */}
      <AnimatePresence>
        {showTagFilter && (
          <TagFilter onClose={() => setShowTagFilter(false)} />
        )}
      </AnimatePresence>

      {/* Pomodoro Timer */}
      {showPomodoro && (
        <PomodoroTimer onClose={() => setShowPomodoro(false)} />
      )}

      {/* Flashcard Mode */}
      <AnimatePresence>
        {showFlashcards && flashcardNoteId && (
          <FlashcardMode noteId={flashcardNoteId} onClose={() => { setShowFlashcards(false); setFlashcardNoteId(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
