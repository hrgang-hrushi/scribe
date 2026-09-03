'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPagesForNote, updatePage, updateNote, db } from '@/lib/db';
import type { Note, Page, Stroke, TextBox, ImageBlock, Tool, ToolSettings } from '@/lib/types';
import { INK_COLORS } from '@/lib/types';
import CanvasEditor from '@/components/canvas/CanvasEditor';
import Toolbar from '@/components/canvas/Toolbar';
import ColorPicker from '@/components/canvas/ColorPicker';
import Calculator from '@/components/ui/Calculator';
import SettingsPanel from '@/components/ui/SettingsPanel';
import FlashcardMode from '@/components/ui/FlashcardMode';
import { exportToPdf } from '@/lib/pdf-export';
import { Check } from 'lucide-react';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;
  const [note, setNote] = useState<Note | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    penColor: INK_COLORS[0],
    penWidth: 3,
    penOpacity: 1,
    highlighterWidth: 20,
    highlighterColor: '#FEF08A',
    eraserWidth: 20,
    eraserMode: 'stroke',
    smoothing: 0.5,
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showToolbar, setShowToolbar] = useState(true);
  const [appSettings, setAppSettings] = useState<any>({});
  const canvasEditorRef = useRef<any>(null);

  useEffect(() => {
    loadData();
    const savedTheme = localStorage.getItem('scribe-theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    const savedSettings = localStorage.getItem('scribe-settings');
    if (savedSettings) setAppSettings(JSON.parse(savedSettings));

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo(); }
        if (e.key === 's') { e.preventDefault(); handleManualSave(); }
        if (e.key === 'f') { e.preventDefault(); /* TODO: search */ }
      }
      // Tool shortcuts
      if (!e.metaKey && !e.ctrlKey) {
        const toolMap: Record<string, Tool> = { 'p': 'pen', 'h': 'highlighter', 'e': 'eraser', 's': 'shapes', 'l': 'lasso', 't': 'text', 'r': 'ruler' };
        if (toolMap[e.key]) setActiveTool(toolMap[e.key]);
        if (e.key === 'c') setShowColorPicker(v => !v);
        if (e.key === '=') setShowCalculator(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [noteId]);

  async function loadData() {
    setIsLoading(true);
    const n = await db.notes.get(noteId);
    if (n) setNote(n);
    const p = await getPagesForNote(noteId);
    setPages(p);
    setIsLoading(false);
  }

  function handleUndo() {
    if (canvasEditorRef.current) canvasEditorRef.current.undo();
  }

  function handleRedo() {
    if (canvasEditorRef.current) canvasEditorRef.current.redo();
  }

  async function handleSave(pageData: Page) {
    setSaveStatus('saving');
    try {
      await updatePage(pageData.id, { strokes: pageData.strokes, textBoxes: pageData.textBoxes, images: pageData.images });
      if (note) await updateNote(noteId, {});
      setSaveStatus('saved');
    } catch {
      setSaveStatus('offline');
    }
  }

  async function handleRename() {
    if (!note) return;
    setIsEditingTitle(false);
    const newTitle = editTitle.trim() || 'Untitled Note';
    await updateNote(note.id, { title: newTitle });
    setNote({ ...note, title: newTitle });
  }

  async function handleManualSave() {
    if (pages[currentPage]) {
      await handleSave(pages[currentPage]);
    }
  }

  async function handleExportPdf() {
    if (note && pages.length > 0) {
      await exportToPdf(note.title, pages);
    }
  }

  async function handleNewPage() {
    const newPage: Page = {
      id: crypto.randomUUID(),
      noteId,
      order: pages.length,
      strokes: [],
      textBoxes: [],
      images: [],
    };
    await db.pages.add(newPage);
    setPages([...pages, newPage]);
    setCurrentPage(pages.length);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--canvas-bg)' }}>
      {/* Top Bar */}
      <div
        className="safe-top flex items-center justify-between px-4 py-2 z-20"
        style={{ background: 'var(--toolbar-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="min-w-0 flex items-center gap-1 cursor-text" onClick={() => setIsEditingTitle(true)}>
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="text-sm font-semibold bg-transparent outline-none border-b border-gray-400"
                style={{ color: 'var(--text-primary)' }}
              />
            ) : (
              <h2 className="text-sm font-semibold truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
                {note?.title || 'Untitled'}
              </h2>
            )}
            {note?.date && (
              <span className="text-sm font-semibold opacity-50" style={{ color: 'var(--text-primary)' }}>.({note.date})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-md" style={{
            color: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'saving' ? '#f59e0b' : '#ef4444',
          }}>
            {saveStatus === 'saved' ? <><Check size={14} className="inline mr-1" />Saved</> : saveStatus === 'saving' ? 'Saving...' : 'Offline'}
          </span>
          {appSettings.showCalculator !== false && (
            <button
              onClick={() => setShowCalculator(v => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: showCalculator ? 'var(--accent)' : 'var(--bg-tertiary)', color: showCalculator ? 'var(--bg-primary)' : 'var(--text-primary)' }}
              title="Calculator (press =)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="10" y2="14" />
                <line x1="14" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
            </button>
          )}
          <button
            onClick={handleManualSave}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
            title="Save (⌘S)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
          </button>
          <button
            onClick={handleExportPdf}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
            title="Export PDF"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
          <button
            onClick={() => setShowFlashcards(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
            title="Flashcards"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-tertiary)' }}
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {pages.length > 0 && (
          <CanvasEditor
            ref={canvasEditorRef}
            page={pages[currentPage]}
            template={note?.template || 'blank'}
            tool={activeTool}
            settings={toolSettings}
            theme={theme}
            onSave={handleSave}
            onUndo={handleUndo}
          />
        )}

        {/* Page indicator */}
        {pages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
            style={{ background: 'var(--toolbar-bg)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {currentPage + 1} / {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
              disabled={currentPage === pages.length - 1}
              className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <button
              onClick={handleNewPage}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ color: 'var(--accent)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}

        {pages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p style={{ color: 'var(--text-muted)' }}>Loading canvas...</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        toolSettings={toolSettings}
        onSettingsChange={setToolSettings}
        showColorPicker={showColorPicker}
        onToggleColorPicker={() => setShowColorPicker(v => !v)}
        visible={showToolbar}
        onToggle={() => setShowToolbar(v => !v)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Color Picker */}
      {showColorPicker && (
        <ColorPicker
          colors={INK_COLORS}
          activeColor={activeTool === 'highlighter' ? toolSettings.highlighterColor : toolSettings.penColor}
          onSelect={(color) => {
            if (activeTool === 'highlighter') {
              setToolSettings(s => ({ ...s, highlighterColor: color }));
            } else {
              setToolSettings(s => ({ ...s, penColor: color }));
            }
            setShowColorPicker(false);
          }}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {/* Calculator */}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}

      {/* Settings */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          currentNoteTemplate={note?.template}
          onUpdateCurrentNoteTemplate={async (t) => {
            if (note) {
              await updateNote(noteId, { template: t });
              setNote({ ...note, template: t });
            }
          }}
        />
      )}

      {/* Flashcards */}
      {showFlashcards && (
        <FlashcardMode noteId={noteId} onClose={() => setShowFlashcards(false)} />
      )}
    </div>
  );
}


