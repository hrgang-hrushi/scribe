'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPagesForNote, updatePage, updateNote, db, addPage } from '@/lib/db';
import type { Note, Page, Tool, ToolSettings, PaperColor } from '@/lib/types';
import { INK_COLORS, PAPER_THEMES } from '@/lib/types';
import CanvasEditor from '@/components/canvas/CanvasEditor';
import PagesEditor from '@/components/canvas/PagesEditor';
import Toolbar from '@/components/canvas/Toolbar';
import ColorPicker from '@/components/canvas/ColorPicker';
import Calculator from '@/components/ui/Calculator';
import SettingsPanel from '@/components/ui/SettingsPanel';
import FlashcardMode from '@/components/ui/FlashcardMode';
import { exportToPdf, exportToPng } from '@/lib/pdf-export';
import {
  Check,
  Eye,
  EyeOff,
  FileText,
  Maximize2,
  Play,
  Pause,
  Clock,
  Palette,
  ChevronLeft
} from 'lucide-react';

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
    penColor: '#ffffff',
    penWidth: 3,
    penOpacity: 1,
    highlighterWidth: 20,
    highlighterColor: '#f1c40f',
    eraserWidth: 20,
    eraserMode: 'stroke',
    tapeWidth: 32,
    tapeColor: '#f59e0b',
    smoothing: 0.5,
    holdToShape: true,
    scribbleToErase: true,
    quickColors: ['#ffffff', '#ff453a', '#32ade6'],
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showPaperMenu, setShowPaperMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showToolbar, setShowToolbar] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [appSettings, setAppSettings] = useState<any>({});
  const editorRef = useRef<any>(null);

  // Study Session Timer (3-Hour Deep Work Default)
  const [timerSeconds, setTimerSeconds] = useState(3 * 3600); // 3 hours
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  function formatTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  useEffect(() => {
    loadData();
    const savedTheme = (localStorage.getItem('scribe-theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    const savedSettings = localStorage.getItem('scribe-settings');
    if (savedSettings) setAppSettings(JSON.parse(savedSettings));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo(); }
        if (e.key === 's') { e.preventDefault(); handleManualSave(); }
      }
      if (!e.metaKey && !e.ctrlKey) {
        const toolMap: Record<string, Tool> = {
          v: 'select',
          m: 'select',
          p: 'pen',
          h: 'highlighter',
          k: 'tape',
          e: 'eraser',
          s: 'shapes',
          l: 'lasso',
          t: 'text',
        };
        if (toolMap[e.key]) setActiveTool(toolMap[e.key]);
        if (e.key === 'c') setShowColorPicker(v => !v);
        if (e.key === '=') setShowCalculator(v => !v);
        if (e.key === 'f') setFocusMode(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Block native iOS text selection callouts and context menu popups
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      e.preventDefault();
    };

    const handleSelectionChange = () => {
      const active = document.activeElement;
      if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA' && !active?.getAttribute('contenteditable')) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          sel.removeAllRanges();
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [noteId]);

  async function loadData() {
    setIsLoading(true);
    const n = await db.notes.get(noteId);
    if (n) {
      setNote(n);
      // Auto-adapt pen color if paper is dark navy vs light
      if (n.paperColor === 'navy' || n.paperColor === 'dark') {
        setToolSettings(prev => ({
          ...prev,
          penColor: prev.penColor === '#000000' ? '#ffffff' : prev.penColor,
          quickColors: ['#ffffff', '#ff453a', '#32ade6'],
        }));
      } else if (n.paperColor === 'white' || n.paperColor === 'cream') {
        setToolSettings(prev => ({
          ...prev,
          penColor: prev.penColor === '#ffffff' ? '#1a1a2e' : prev.penColor,
          quickColors: ['#1a1a2e', '#ff453a', '#32ade6'],
        }));
      }
    }
    const p = await getPagesForNote(noteId);
    setPages(p);
    setIsLoading(false);
  }

  function handleUndo() {
    editorRef.current?.undo();
  }

  function handleRedo() {
    editorRef.current?.redo();
  }

  async function handleSave(pageData: Page) {
    setSaveStatus('saving');
    try {
      await updatePage(pageData.id, {
        strokes: pageData.strokes,
        textBoxes: pageData.textBoxes,
        images: pageData.images,
      });
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

  async function handleSwitchMode(newType: 'infinite' | 'paginated') {
    if (!note) return;
    await updateNote(noteId, { pageType: newType });
    setNote({ ...note, pageType: newType });
  }

  async function handleSwitchPaperColor(newColor: PaperColor) {
    if (!note) return;
    await updateNote(noteId, { paperColor: newColor });
    setNote({ ...note, paperColor: newColor });
    setShowPaperMenu(false);
  }

  const handleToolbarAction = async (action: 'export-pdf' | 'export-png' | 'import' | 'clear') => {
    if (action === 'export-pdf') {
      await handleExportPdf();
    } else if (action === 'export-png') {
      if (editorRef.current?.exportCompositeImage) {
        const dataUrl = await editorRef.current.exportCompositeImage();
        if (dataUrl) {
          const link = document.createElement('a');
          link.download = `${(note?.title || 'note').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
          return;
        }
      }
      if (note && pages.length > 0) {
        await exportToPng(note.title, pages[currentPage] || pages[0], note.paperColor);
      }
    } else if (action === 'import') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = fileEvent => {
        const file = (fileEvent.target as HTMLInputElement).files?.[0];
        if (!file) return;
        editorRef.current?.importMedia(file);
      };
      input.click();
    } else if (action === 'clear') {
      if (confirm('Clear the current sheet?')) {
        editorRef.current?.clear();
      }
    }
  };

  async function handleExportPdf() {
    if (note && pages.length > 0) {
      await exportToPdf(note.title, pages, note.paperColor);
    }
  }

  async function handleNewPage() {
    const newPage = await addPage(noteId);
    setPages([...pages, newPage]);
    setCurrentPage(pages.length);
  }

  async function handleDeletePage(pageId: string) {
    if (pages.length <= 1) return;
    await db.pages.delete(pageId);
    const updated = pages.filter(p => p.id !== pageId);
    setPages(updated);
    if (currentPage >= updated.length) {
      setCurrentPage(Math.max(0, updated.length - 1));
    }
  }

  const activePaperTheme = PAPER_THEMES[note?.paperColor || 'navy'] || PAPER_THEMES.navy;

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative font-sans"
      style={{ background: activePaperTheme.bg }}
    >
      {/* Top Bar (Distraction-Free Zen Mode Support) */}
      {!focusMode && (
        <div
          className="safe-top flex items-center justify-between px-3 md:px-5 py-2 z-20 transition-all duration-300 glass-panel"
          style={{
            background: 'var(--toolbar-bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Left: Back & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: 'var(--bg-tertiary)' }}
              title="Back"
            >
              <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>

            <div
              className="min-w-0 flex items-center gap-1.5 cursor-text"
              onClick={() => {
                setEditTitle(note?.title || '');
                setIsEditingTitle(true);
              }}
            >
              {isEditingTitle ? (
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                  className="text-sm font-bold bg-transparent outline-none border-b border-[var(--accent)]"
                  style={{ color: 'var(--text-primary)' }}
                />
              ) : (
                <h2
                  className="text-sm font-bold truncate max-w-[160px] md:max-w-[240px]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {note?.title || 'Untitled Note'}
                </h2>
              )}
              {note?.date && (
                <span className="text-xs font-semibold opacity-40 hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                  ({note.date})
                </span>
              )}
            </div>

            {/* Note Format Badge (Pages vs Canvas Toggle) */}
            <button
              onClick={() => handleSwitchMode(note?.pageType === 'infinite' ? 'paginated' : 'infinite')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
              title="Click to switch between Pages and Infinite Canvas"
            >
              {note?.pageType === 'infinite' ? (
                <>
                  <Maximize2 size={12} />
                  <span>Canvas</span>
                </>
              ) : (
                <>
                  <FileText size={12} />
                  <span>Pages</span>
                </>
              )}
            </button>
          </div>

          {/* Center: Deep Work Study Timer (for 3-hour sessions without distractions) */}
          <div className="relative flex items-center">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm"
              style={{
                background: isTimerRunning ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: isTimerRunning ? 'var(--bg-primary)' : 'var(--text-primary)',
              }}
            >
              <Clock size={13} className={isTimerRunning ? 'animate-pulse' : ''} />
              <button
                onClick={() => setShowTimerMenu(v => !v)}
                className="hover:underline tracking-tight"
                title="Change Study Timer Block"
              >
                {formatTime(timerSeconds)}
              </button>
              <button
                onClick={() => setIsTimerRunning(v => !v)}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-80"
                title={isTimerRunning ? 'Pause' : 'Start'}
              >
                {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
            </div>

            {/* Timer Options Dropdown */}
            {showTimerMenu && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-2 rounded-2xl shadow-2xl glass-panel flex flex-col gap-1 z-50 min-w-[170px] animate-slide-up"
              >
                <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 text-[var(--text-muted)]">
                  Deep Work Blocks
                </div>
                <button
                  onClick={() => { setTimerSeconds(3 * 3600); setIsTimerRunning(true); setShowTimerMenu(false); }}
                  className="text-left px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ⚡ 3-Hour Marathon (GoodNotes)
                </button>
                <button
                  onClick={() => { setTimerSeconds(50 * 60); setIsTimerRunning(true); setShowTimerMenu(false); }}
                  className="text-left px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ⏱️ 50-Minute Sprint
                </button>
                <button
                  onClick={() => { setTimerSeconds(25 * 60); setIsTimerRunning(true); setShowTimerMenu(false); }}
                  className="text-left px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-primary)' }}
                >
                  🍅 25-Minute Pomodoro
                </button>
                <button
                  onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); setShowTimerMenu(false); }}
                  className="text-left px-3 py-1.5 text-xs font-semibold text-red-500 rounded-xl hover:bg-red-500/10"
                >
                  Reset Timer
                </button>
              </div>
            )}
          </div>

          {/* Active Recall / Study Tape Control */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <span className="text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Active Recall
            </span>
            <div className="h-3 w-px bg-amber-500/30 mx-1" />
            <button
              onClick={() => editorRef.current?.toggleAllTape(false)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
              title="Mask all study tape to quiz yourself"
            >
              Hide All
            </button>
            <button
              onClick={() => editorRef.current?.toggleAllTape(true)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
              title="Reveal all study tape"
            >
              Reveal All
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Save indicator */}
            <span
              className="text-xs px-2 py-1 rounded-md font-medium"
              style={{
                color:
                  saveStatus === 'saved'
                    ? '#22c55e'
                    : saveStatus === 'saving'
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check size={13} className="inline mr-1" />
                  Saved
                </>
              ) : saveStatus === 'saving' ? (
                'Saving...'
              ) : (
                'Offline'
              )}
            </span>

            {/* Paper Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPaperMenu(v => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:scale-105"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                title="Paper Themes"
              >
                <Palette size={16} />
              </button>
              {showPaperMenu && (
                <div className="absolute top-full right-0 mt-2 p-2 rounded-2xl shadow-2xl glass-panel flex flex-col gap-1 z-50 min-w-[190px] animate-slide-up">
                  <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 text-[var(--text-muted)]">
                    Paper Themes
                  </div>
                  {(['navy', 'cream', 'white', 'dark'] as PaperColor[]).map(c => (
                    <button
                      key={c}
                      onClick={() => handleSwitchPaperColor(c)}
                      className={`text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between ${
                        note?.paperColor === c ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{PAPER_THEMES[c].label}</span>
                      <div className="w-3 h-3 rounded-full border border-black/20" style={{ background: PAPER_THEMES[c].bg }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zen Focus Mode Button */}
            <button
              onClick={() => setFocusMode(true)}
              className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
              title="Enter Distraction-Free Study Mode (Press F)"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Focus</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Zen Mode Exit Pill (When Focus Mode is active) */}
      {focusMode && (
        <div className="absolute top-4 right-4 z-50 animate-fade-in flex items-center gap-2">
          <button
            onClick={() => setFocusMode(false)}
            className="px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold shadow-xl backdrop-blur-xl transition-all hover:scale-105"
            style={{
              background: 'var(--toolbar-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <EyeOff size={14} />
            <span>Exit Focus</span>
          </button>
        </div>
      )}

      {/* Active Editor Canvas Area */}
      <div
        className="flex-1 relative overflow-hidden select-none"
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {pages.length > 0 && (
          note?.pageType === 'infinite' ? (
            <CanvasEditor
              ref={editorRef}
              page={pages[currentPage]}
              template={note?.template || 'dotted'}
              paperColor={note?.paperColor || 'navy'}
              tool={activeTool}
              settings={toolSettings}
              theme={theme}
              onSave={handleSave}
              onUndo={handleUndo}
            />
          ) : (
            <PagesEditor
              ref={editorRef}
              pages={pages}
              template={note?.template || 'dotted'}
              paperColor={note?.paperColor || 'navy'}
              tool={activeTool}
              settings={toolSettings}
              theme={theme}
              onSavePage={handleSave}
              onAddPage={handleNewPage}
              onDeletePage={handleDeletePage}
              onUndo={handleUndo}
            />
          )
        )}

        {pages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p style={{ color: 'var(--text-muted)' }}>Preparing notebook sheets...</p>
          </div>
        )}
      </div>

      {/* Unified Floating Toolbar */}
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
        onAction={handleToolbarAction}
      />

      {/* Full Color Picker Dialog */}
      {showColorPicker && (
        <ColorPicker
          colors={INK_COLORS}
          activeColor={activeTool === 'highlighter' ? toolSettings.highlighterColor : toolSettings.penColor}
          onSelect={color => {
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

      {/* Calculator Modal */}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          currentNoteTemplate={note?.template}
          onUpdateCurrentNoteTemplate={async t => {
            if (note) {
              await updateNote(noteId, { template: t });
              setNote({ ...note, template: t });
            }
          }}
        />
      )}

      {/* Flashcards Modal */}
      {showFlashcards && (
        <FlashcardMode noteId={noteId} onClose={() => setShowFlashcards(false)} />
      )}
    </div>
  );
}
