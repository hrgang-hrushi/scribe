'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotesForClass, createNote, deleteNote, updateNote, getAllClasses } from '@/lib/db';
import type { Note, ClassItem } from '@/lib/types';

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const [cls, setClass] = useState<ClassItem | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<'date' | 'all'>('date');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadData();
    const savedTheme = localStorage.getItem('scribe-theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [classId]);

  async function loadData() {
    const allClasses = await getAllClasses();
    const found = allClasses.find(c => c.id === classId);
    if (found) setClass(found);
    const n = await getNotesForClass(classId);
    setNotes(n.sort((a, b) => b.updatedAt - a.updatedAt));
  }

  async function handleNewNote() {
    const note = await createNote(classId);
    router.push(`/notes/${note.id}`);
  }

  async function handleDeleteNote(id: string) {
    if (confirm('Delete this note?')) {
      await deleteNote(id);
      loadData();
    }
  }

  async function handleRenameNote(id: string) {
    if (editTitle.trim()) {
      await updateNote(id, { title: editTitle.trim() });
      setEditingNoteId(null);
      loadData();
    }
  }

  const groupedByDate = notes.reduce((acc, note) => {
    const date = note.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="safe-top px-4 pt-4 pb-3"
        style={{ background: cls?.gradient || 'var(--bg-primary)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white flex-1 drop-shadow-sm">{cls?.name || 'Loading...'}</h1>
          <button
            onClick={handleNewNote}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm text-white font-bold"
          >
            +
          </button>
        </div>
        {/* View Toggle */}
        <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
          <button
            onClick={() => setView('date')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'date' ? 'bg-white text-gray-900' : 'text-white/80'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={async () => {
              if (notes.length > 0) {
                router.push(`/notes/${notes[0].id}`);
              } else {
                handleNewNote();
              }
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all text-white/80`}
          >
            All Notes
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 pt-4">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No notes yet</p>
            <button
              onClick={handleNewNote}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'var(--accent)' }}
            >
              Start First Note
            </button>
          </div>
        ) : view === 'date' ? (
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 md:p-6 shadow-sm border border-black/5 dark:border-white/5">
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Simple calendar generation for current month */}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-4" />
              ))}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasNotes = groupedByDate[dateStr];
                
                return (
                  <button
                    key={day}
                    onClick={() => hasNotes ? router.push(`/notes/${hasNotes[0].id}`) : handleNewNote()}
                    className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center transition-all ${
                      hasNotes 
                        ? 'bg-[var(--accent)] text-white shadow-md hover:scale-110' 
                        : 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg font-medium">{day}</span>
                    {hasNotes && <span className="w-1.5 h-1.5 rounded-full bg-white mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {notes.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                index={i}
                editingNoteId={editingNoteId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                setEditingNoteId={setEditingNoteId}
                onRename={handleRenameNote}
                onDelete={handleDeleteNote}
                onOpen={() => router.push(`/notes/${note.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, index, editingNoteId, editTitle, setEditTitle, setEditingNoteId, onRename, onDelete, onOpen }: {
  note: Note;
  index: number;
  editingNoteId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  setEditingNoteId: (v: string | null) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl p-4 mb-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editingNoteId === note.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => onRename(note.id)}
              onKeyDown={e => e.key === 'Enter' && onRename(note.id)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent font-medium text-sm outline-none border-b"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
            />
          ) : (
            <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {note.title}
            </h3>
          )}
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date(note.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {note.tags.length > 0 && ` · ${note.tags.join(', ')}`}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingNoteId(note.id); setEditTitle(note.title); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-secondary)' }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-secondary)' }}>
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
