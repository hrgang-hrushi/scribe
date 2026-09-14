'use client';

import { useState, useEffect } from 'react';
import { File, AlignJustify, Grid3X3, CircleDot, LayoutTemplate, Sun, Moon, Stethoscope, Cpu, Code2, Rocket, Layers, Database, HardDrive, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppSettings, NoteTemplate } from '@/lib/types';
import { TEMPLATE_METADATA, TemplateMeta } from '@/lib/templates';
import { getStorageStats, optimizeAllNotesStorage, optimizeNoteStorage, requestPersistentStorage, type StorageStats } from '@/lib/db';

interface SettingsPanelProps {
  onClose: () => void;
  currentNoteTemplate?: NoteTemplate | string;
  onUpdateCurrentNoteTemplate?: (template: NoteTemplate) => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'computer_science', label: 'CS & Code' },
  { id: 'founder', label: 'Founders' },
] as const;

export default function SettingsPanel({ onClose, currentNoteTemplate, onUpdateCurrentNoteTemplate }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    defaultTemplate: 'blank',
    palmRejection: true,
    holdToShape: true,
    scribbleToErase: true,
    autosaveInterval: 1,
    showSaveStatus: true,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isOptimizingStorage, setIsOptimizingStorage] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);
  const [showNotesBreakdown, setShowNotesBreakdown] = useState(false);

  const filteredTemplates = TEMPLATE_METADATA.filter(
    t => selectedCategory === 'all' || t.category === selectedCategory
  );

  useEffect(() => {
    const saved = localStorage.getItem('scribe-settings');
    if (saved) setSettings(JSON.parse(saved));
    refreshStorage();
  }, []);

  async function refreshStorage() {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (e) {
      console.warn('Storage fetch warning:', e);
    }
  }

  async function handleOptimizeAll() {
    setIsOptimizingStorage(true);
    setOptimizeMessage(null);
    try {
      const res = await optimizeAllNotesStorage();
      const mb = (res.totalSavedBytes / (1024 * 1024)).toFixed(1);
      setOptimizeMessage(`Saved ${mb} MB across ${res.notesProcessed} notes (${res.imagesCompressed} images compressed)!`);
      await refreshStorage();
    } catch (e: any) {
      setOptimizeMessage(`Optimization failed: ${e?.message || e}`);
    } finally {
      setIsOptimizingStorage(false);
    }
  }

  async function handleOptimizeSingleNote(noteId: string) {
    try {
      const res = await optimizeNoteStorage(noteId);
      const mb = (res.savedBytes / (1024 * 1024)).toFixed(1);
      setOptimizeMessage(`Freed ${mb} MB on note!`);
      await refreshStorage();
    } catch (e: any) {
      alert(`Optimization failed: ${e?.message || e}`);
    }
  }

  async function handleEnablePersistence() {
    const granted = await requestPersistentStorage();
    if (granted) {
      await refreshStorage();
    } else {
      alert('Persistent storage could not be enabled by Safari. Please add Scribe to your Home Screen as a PWA for unlimited persistent storage.');
    }
  }

  function updateSettings(updates: Partial<AppSettings>) {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem('scribe-settings', JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scribe-settings-updated', { detail: next }));
    }
    if (updates.theme) {
      document.documentElement.setAttribute('data-theme', updates.theme);
      localStorage.setItem('scribe-theme', updates.theme);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto glass-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-primary)' }}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Theme */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>Theme</label>
            <div className="flex gap-3">
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: settings.theme === t ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: settings.theme === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {t === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="capitalize">{t}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium block text-[var(--text-primary)]">
                {onUpdateCurrentNoteTemplate ? 'Current Note Template' : 'Default Page Template'}
              </label>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                {filteredTemplates.length} Templates
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredTemplates.map(t => {
                const isSelected = onUpdateCurrentNoteTemplate
                  ? currentNoteTemplate === t.id
                  : settings.defaultTemplate === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (onUpdateCurrentNoteTemplate) onUpdateCurrentNoteTemplate(t.id);
                      else updateSettings({ defaultTemplate: t.id });
                    }}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col gap-1 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500 text-[var(--text-primary)]'
                        : 'border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{t.name}</span>
                      {t.badge && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold shrink-0">
                          {t.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-snug text-[var(--text-muted)]">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palm Rejection */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>Palm Rejection</label>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ignore touch while writing with Apple Pencil</p>
            </div>
            <button
              onClick={() => updateSettings({ palmRejection: !settings.palmRejection })}
              className="w-12 h-7 rounded-full transition-colors relative"
              style={{ background: settings.palmRejection ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: settings.palmRejection ? '26px' : '4px' }}
              />
            </button>
          </div>

          {/* Hold to Shape */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>Hold to Shape</label>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Hold pen still at stroke end to snap lines/circles</p>
            </div>
            <button
              onClick={() => updateSettings({ holdToShape: settings.holdToShape === false })}
              className="w-12 h-7 rounded-full transition-colors relative"
              style={{ background: settings.holdToShape !== false ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: settings.holdToShape !== false ? '26px' : '4px' }}
              />
            </button>
          </div>

          {/* Scribble to Erase */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>Scribble to Erase</label>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Scratch out handwriting strokes to delete them</p>
            </div>
            <button
              onClick={() => updateSettings({ scribbleToErase: settings.scribbleToErase === false })}
              className="w-12 h-7 rounded-full transition-colors relative"
              style={{ background: settings.scribbleToErase !== false ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: settings.scribbleToErase !== false ? '26px' : '4px' }}
              />
            </button>
          </div>

          {/* Autosave */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
              Autosave: every {settings.autosaveInterval}s
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.autosaveInterval}
              onChange={e => updateSettings({ autosaveInterval: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          {/* Calculator Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>Show Calculator</label>
              <p className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>Display calculator button in top bar</p>
            </div>
            <button
              onClick={() => updateSettings({ showCalculator: !settings.showCalculator })}
              className="w-12 h-7 rounded-full transition-colors relative"
              style={{ background: settings.showCalculator !== false ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: settings.showCalculator !== false ? '26px' : '4px' }}
              />
            </button>
          </div>

          {/* Database & Storage Health */}
          <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[var(--accent)]" />
                <label className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Storage & Database Health
                </label>
              </div>
              <button
                onClick={refreshStorage}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                title="Refresh Storage Stats"
              >
                <RefreshCw size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {storageStats && (
              <div className="space-y-3">
                {/* Usage meter */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span style={{ color: 'var(--text-secondary)' }}>Used Storage</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {(storageStats.usageBytes / (1024 * 1024)).toFixed(1)} MB
                      {storageStats.quotaBytes > 0 && (
                        <span className="opacity-60"> / {(storageStats.quotaBytes / (1024 * 1024)).toFixed(0)} MB</span>
                      )}
                    </span>
                  </div>
                  {storageStats.quotaBytes > 0 && (
                    <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(2, (storageStats.usageBytes / storageStats.quotaBytes) * 100))}%`,
                          backgroundColor:
                            storageStats.usageBytes / storageStats.quotaBytes > 0.8 ? '#ef4444' : 'var(--accent)',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Persistence status */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span style={{ color: 'var(--text-secondary)' }}>Storage Mode</span>
                  {storageStats.persisted ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Permanent (PWA Quota)
                    </span>
                  ) : (
                    <button
                      onClick={handleEnablePersistence}
                      className="text-[var(--accent)] font-semibold underline hover:opacity-80"
                    >
                      Request Persistent Storage
                    </button>
                  )}
                </div>

                {optimizeMessage && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-medium animate-fade-in">
                    {optimizeMessage}
                  </div>
                )}

                {/* 1-Click Optimize Button */}
                <button
                  onClick={handleOptimizeAll}
                  disabled={isOptimizingStorage}
                  className="w-full py-2.5 px-3 rounded-lg font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  <Sparkles size={14} />
                  <span>{isOptimizingStorage ? 'Optimizing & Compressing...' : 'Optimize & Free Up Storage'}</span>
                </button>

                {/* Expandable Breakdown */}
                {storageStats.notes.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowNotesBreakdown(v => !v)}
                      className="text-[11px] font-semibold flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {showNotesBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      <span>Note Storage Breakdown ({storageStats.notes.length} notes)</span>
                    </button>

                    {showNotesBreakdown && (
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {storageStats.notes.map(n => (
                          <div
                            key={n.id}
                            className="flex items-center justify-between p-2 rounded-lg text-xs"
                            style={{ background: 'var(--bg-secondary)' }}
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {n.title}
                              </p>
                              <p className="text-[10px] opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                {n.pageCount} sheets • {n.imageCount} images • {(n.approximateBytes / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                            {n.imageCount > 0 && (
                              <button
                                onClick={() => handleOptimizeSingleNote(n.id)}
                                className="px-2 py-1 rounded text-[10px] font-bold shrink-0 hover:opacity-80"
                                style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}
                              >
                                Optimize
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</label>
            <div className="space-y-2 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              <div className="flex justify-between"><span>Select & Move</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>V / M</kbd></div>
              <div className="flex justify-between"><span>Pen</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>P</kbd></div>
              <div className="flex justify-between"><span>Highlighter</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>H</kbd></div>
              <div className="flex justify-between"><span>Study Tape (Active Recall)</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>K</kbd></div>
              <div className="flex justify-between"><span>Eraser</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>E</kbd></div>
              <div className="flex justify-between"><span>Shapes</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>S</kbd></div>
              <div className="flex justify-between"><span>Lasso</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>L</kbd></div>
              <div className="flex justify-between"><span>Text Box</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>T</kbd></div>
              <div className="flex justify-between"><span>Color Palette</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>C</kbd></div>
              <div className="flex justify-between"><span>Calculator</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>=</kbd></div>
              <div className="flex justify-between"><span>Focus Mode</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>F</kbd></div>
              <div className="flex justify-between"><span>Undo / Redo</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘Z / ⌘⇧Z</kbd></div>
              <div className="flex justify-between"><span>Duplicate Object</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘D</kbd></div>
              <div className="flex justify-between"><span>Lock / Unlock</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘L</kbd></div>
              <div className="flex justify-between"><span>Crop Image</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>Shift + C</kbd></div>
              <div className="flex justify-between"><span>Group PDF Pages</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘G</kbd></div>
              <div className="flex justify-between"><span>Delete Selection</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>Delete / ⌫</kbd></div>
              <div className="flex justify-between"><span>Save Note</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘S</kbd></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
