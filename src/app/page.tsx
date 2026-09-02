'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllClasses, createClass, deleteClass, updateClass, searchAll, createNote } from '@/lib/db';
import type { ClassItem } from '@/lib/types';
import { GRADIENT_PRESETS } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
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

  const [totalNotes, setTotalNotes] = useState(0);

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
    const result = await searchAll('');
    setTotalNotes(result.notes.length);
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
    <div className="h-full flex flex-col md:flex-row overflow-hidden font-sans" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Main Content */}
      <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-16">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-muted)' }}>
            Scribe
          </h1>
          <button
            onClick={() => setShowPomodoro(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <h2 className="text-5xl md:text-6xl font-medium tracking-tight leading-[1.1] mb-12" style={{ color: 'var(--text-primary)' }}>
          Check it,<br/>Crack it!
        </h2>

        {/* Nav Pills */}
        <div className="flex gap-3 mb-12">
          <button
            className="px-6 py-3 rounded-full font-medium shadow-md transition-transform hover:scale-105"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            Home
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('search-input');
              if (el) el.focus();
            }}
            className="px-6 py-3 rounded-full font-medium transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            Search Notes
          </button>
        </div>

        {/* Classes Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>Your Classes, {classes.length}</h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-[32px] border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
            <BookOpen className="w-12 h-12 mb-4 opacity-50" style={{ color: 'var(--text-primary)' }} />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No classes yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create your first class to start taking notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className="rounded-[32px] p-6 flex flex-col justify-between cursor-pointer group aspect-[1.2] transition-transform hover:-translate-y-1 shadow-sm relative overflow-hidden glass-panel"
                  onClick={() => router.push(`/classes/${cls.id}`)}
                >
                  <div className="relative z-10 flex-1 flex justify-between items-start">
                    {editingId === cls.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => handleRename(cls.id)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(cls.id)}
                        className="bg-transparent mix-blend-difference text-white font-medium text-2xl outline-none w-full border-b border-white/40"
                        onClick={e => e.stopPropagation()}
                        
                      />
                    ) : (
                      <h3 className="mix-blend-difference text-white font-medium text-2xl line-clamp-3 leading-tight" >
                        {cls.name}
                      </h3>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickNote(cls.id); }}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 shrink-0 ml-4 mix-blend-difference text-white"
                      
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div className="relative z-10 flex items-end justify-between mt-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(cls.id); setEditName(cls.name); }}
                        className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors hover:bg-black/20 mix-blend-difference text-white"
                        
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                        className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors hover:bg-red-500/80 mix-blend-difference text-white"
                        
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl glass-panel">
        <div className="flex justify-end mb-12">
          <button onClick={toggleTheme} className="p-2 transition-transform hover:scale-110" style={{ color: 'var(--text-primary)' }}>
            {theme === 'light' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>

        <h2 className="text-3xl font-medium leading-tight mb-10" style={{ color: 'var(--text-primary)' }}>
          Hi,<br/>Scholar
        </h2>

        <div className="flex gap-4 mb-12">
          <div className="flex-1 rounded-[24px] p-6 shadow-md" style={{ background: 'var(--accent)' }}>
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--bg-primary)' }}>{classes.length}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--bg-primary)', opacity: 0.8 }}>Level (Classes)</div>
          </div>
          <div className="flex-1 rounded-[24px] p-6 shadow-md" style={{ background: 'var(--accent)' }}>
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--bg-primary)' }}>{totalNotes}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--bg-primary)', opacity: 0.8 }}>Mates (Notes)</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Search</span>
            <span>Filtering</span>
          </div>
          
          <div className="relative mb-8">
            <input
              id="search-input"
              type="text"
              placeholder="Find notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl outline-none shadow-sm"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-6">
            {/* Mock recent activity items designed like the inspiration */}
            {searchResults.notes.length > 0 ? (
              searchResults.notes.map((note) => (
                <div key={note.id} onClick={() => router.push(`/notes/${note.id}`)} className="cursor-pointer group flex flex-col items-end">
                  <div className="w-full border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{note.title || 'Untitled'}</div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      Updated Note
                    </div>
                  </div>
                  {/* Decorative bar chart mimic */}
                  <div className="flex items-end gap-1 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-4 h-6 rounded-t-sm" style={{ background: 'var(--bg-tertiary)' }}></div>
                    <div className="w-4 h-10 rounded-t-sm" style={{ background: 'var(--text-muted)' }}></div>
                    <div className="w-4 h-16 rounded-t-sm" style={{ background: 'var(--accent)' }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="opacity-60">
                <div className="flex flex-col items-end mb-8">
                  <div className="w-full border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Current week</div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {totalNotes} Notes
                    </div>
                  </div>
                  <div className="flex items-end gap-1 mt-2">
                    <div className="w-4 h-6 rounded-t-sm" style={{ background: 'var(--bg-tertiary)' }}></div>
                    <div className="w-4 h-10 rounded-t-sm" style={{ background: 'var(--text-muted)' }}></div>
                    <div className="w-4 h-16 rounded-t-sm" style={{ background: 'var(--accent)' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
              className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl glass-panel"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-medium mb-6" style={{ color: 'var(--text-primary)' }}>New Class</h2>
              <input
                autoFocus
                type="text"
                placeholder="Class name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full px-5 py-4 rounded-[20px] text-base outline-none mb-6"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-4 rounded-full font-medium transition-colors"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-4 rounded-full font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Modals */}
      <AnimatePresence>
        {showTagFilter && <TagFilter onClose={() => setShowTagFilter(false)} />}
      </AnimatePresence>
      {showPomodoro && <PomodoroTimer onClose={() => setShowPomodoro(false)} />}
      <AnimatePresence>
        {showFlashcards && flashcardNoteId && (
          <FlashcardMode noteId={flashcardNoteId} onClose={() => { setShowFlashcards(false); setFlashcardNoteId(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
