'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getNotesForClass, createNote, deleteNote, updateNote, getAllClasses, updateClass } from '@/lib/db';
import type { Note, ClassItem } from '@/lib/types';

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const [cls, setClass] = useState<ClassItem | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quickNote, setQuickNote] = useState("");

  useEffect(() => {
    loadData();
    const savedTheme = localStorage.getItem('scribe-theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [classId]);

  async function handleAddQuickNote(e: React.FormEvent) {
    e.preventDefault();
    if (!quickNote.trim() || !cls) return;
    const reminders = cls.reminders || [];
    reminders.push({ id: Date.now().toString(), text: quickNote, createdAt: Date.now(), date: new Date().toISOString() });
    await updateClass(cls.id, { reminders });
    setQuickNote("");
    loadData();
  }
  
  async function loadData() {
    const allClasses = await getAllClasses();
    const found = allClasses.find(c => c.id === classId);
    if (found) setClass(found);
    const n = await getNotesForClass(classId);
    setNotes(n.sort((a, b) => b.updatedAt - a.updatedAt));
  }

  async function handleNewNote(dateOverride?: string) {
    // If a note already exists for this date, just open it to maintain the unified canvas feel per date
    if (dateOverride) {
      const existing = notes.find(n => n.date === dateOverride);
      if (existing) {
        router.push(`/notes/${existing.id}`);
        return;
      }
    }
    const note = await createNote(classId, undefined, dateOverride);
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

  // Group by date
  const groupedByDate = notes.reduce((acc, note) => {
    const date = note.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col md:flex-row font-sans overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Pane - Calendar (70%) */}
      <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => router.push('/')}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-primary)' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {cls?.name || 'Loading...'}
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Class Calendar & Notes</p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {monthName} <span style={{ color: 'var(--text-muted)' }}>{year}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-6 h-12 rounded-full font-bold text-sm transition-transform hover:scale-105" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
              Today
            </button>
            <button onClick={nextMonth} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3 md:gap-4 mb-8">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-xs font-bold text-center tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-[24px]" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayNotes = groupedByDate[dateStr];
            const hasNotes = !!dayNotes && dayNotes.length > 0;
            const isToday = dateStr === todayStr;
            const todayDate = new Date();
            const isFuture = year > todayDate.getFullYear() || (year === todayDate.getFullYear() && month > todayDate.getMonth()) || (year === todayDate.getFullYear() && month === todayDate.getMonth() && day > todayDate.getDate());
            
            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !isFuture && handleNewNote(dateStr)}
                className={`aspect-square rounded-[24px] p-3 md:p-4 flex flex-col justify-between items-start text-left relative overflow-hidden transition-shadow ${hasNotes ? 'shadow-md' : 'shadow-sm'} ${isFuture ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  background: hasNotes ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: hasNotes ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: isToday && !hasNotes ? '2px solid var(--accent)' : '2px solid transparent'
                }}
              >
                <span className="text-xl md:text-2xl font-bold z-10">{day}</span>
                
                {hasNotes && (
                  <div className="w-full z-10">
                    <div className="w-full h-1.5 rounded-full bg-white/30 mb-1"></div>
                    <div className="w-2/3 h-1.5 rounded-full bg-white/30"></div>
                  </div>
                )}
                
                {/* Decorative background shape for notes */}
                {hasNotes && (
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10 blur-xl"></div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right Pane - All Notes & Info (30%) */}
      <div className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10" style={{ background: 'var(--bg-secondary)' }}>
        
        {/* Unified Canvas Jump */}
        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Unified Canvas</h3>
        <div className="rounded-[32px] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start" style={{ background: cls?.gradient || 'var(--bg-tertiary)' }}>
          <div className="relative z-10">
            <h4 className="mix-blend-difference text-white text-3xl font-bold leading-tight mb-2 drop-shadow-sm">All Notes<br/>One Canvas.</h4>
            <p className="mix-blend-difference text-white/80 font-medium text-sm mb-8 drop-shadow-sm">Scroll infinitely. Write continuously.</p>
            
            <button
              onClick={() => {
                if (notes.length > 0) router.push(`/notes/${notes[0].id}`);
                else handleNewNote();
              }}
              className="px-6 py-4 rounded-full font-bold text-sm mix-blend-difference bg-white text-black transition-transform hover:scale-105 shadow-md flex items-center gap-2"
            >
              Open Notebook
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          {/* Abstract decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5"></div>
        </div>

        
        {/* Quick Notes / Reminders */}
        <h3 className="text-xl font-bold mb-4 mt-8" style={{ color: 'var(--text-primary)' }}>Quick Notes & Reminders</h3>
        <form onSubmit={handleAddQuickNote} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Remind me to..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-shadow focus:shadow-md"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          />
          <button type="submit" className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg>
          </button>
        </form>
        <div className="flex flex-col gap-3">
          {cls?.reminders?.map(rem => (
            <div key={rem.id} className="p-4 rounded-[20px] flex items-start gap-3 shadow-sm border border-black/5 dark:border-white/5" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{rem.text}</p>
            </div>
          ))}
          {!cls?.reminders?.length && (
            <p className="text-sm italic opacity-50" style={{ color: 'var(--text-muted)' }}>No reminders yet.</p>
          )}
        </div>


        {/* Timeline of recent class notes */}
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Recent in {cls?.name}</h3>
        <div className="flex-1 space-y-4">
          {notes.slice(0, 5).map(note => (
            <div 
              key={note.id} 
              onClick={() => router.push(`/notes/${note.id}`)}
              className="p-5 rounded-[24px] cursor-pointer group transition-colors shadow-sm"
              style={{ background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {new Date(note.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <h4 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>{note.title || 'Untitled Note'}</h4>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="p-6 text-center opacity-60">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No recent notes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
