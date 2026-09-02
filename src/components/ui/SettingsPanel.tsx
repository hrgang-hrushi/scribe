'use client';

import { useState, useEffect } from 'react';
import type { AppSettings } from '@/lib/types';

interface SettingsPanelProps {
  onClose: () => void;
  currentNoteTemplate?: string;
  onUpdateCurrentNoteTemplate?: (template: any) => void;
}

import { File, AlignJustify, Grid3X3, CircleDot, LayoutTemplate, Sun, Moon } from 'lucide-react';

const PAGE_TEMPLATES = [
  { id: 'blank', label: 'Blank', icon: File },
  { id: 'ruled', label: 'Ruled', icon: AlignJustify },
  { id: 'grid', label: 'Grid', icon: Grid3X3 },
  { id: 'dotted', label: 'Dotted', icon: CircleDot },
  { id: 'cornell', label: 'Cornell', icon: LayoutTemplate },
] as const;

export default function SettingsPanel({ onClose, currentNoteTemplate, onUpdateCurrentNoteTemplate }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    defaultTemplate: 'blank',
    palmRejection: true,
    autosaveInterval: 1,
    showSaveStatus: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('scribe-settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  function updateSettings(updates: Partial<AppSettings>) {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem('scribe-settings', JSON.stringify(next));
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
        className="w-full max-w-md rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--bg-secondary)' }}
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

          {/* Current Note Template */}
          {onUpdateCurrentNoteTemplate && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block text-blue-500">Current Note Template</label>
              <div className="grid grid-cols-3 gap-2">
                {PAGE_TEMPLATES.map(t => (
                  <button
                    key={'current-'+t.id}
                    onClick={() => onUpdateCurrentNoteTemplate(t.id)}
                    className="py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 shadow-sm"
                    style={{
                      background: currentNoteTemplate === t.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: currentNoteTemplate === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <t.icon size={18} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default Template */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>Default Page Template</label>
            <div className="grid grid-cols-3 gap-2">
              {PAGE_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ defaultTemplate: t.id })}
                  className="py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1"
                  style={{
                    background: settings.defaultTemplate === t.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: settings.defaultTemplate === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <t.icon size={18} />
                  <span>{t.label}</span>
                </button>
              ))}
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
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Display calculator button in top bar</p>
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

          {/* Keyboard Shortcuts */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</label>
            <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex justify-between"><span>Pan tool</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>P</kbd></div>
              <div className="flex justify-between"><span>Highlighter</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>H</kbd></div>
              <div className="flex justify-between"><span>Eraser</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>E</kbd></div>
              <div className="flex justify-between"><span>Shapes</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>S</kbd></div>
              <div className="flex justify-between"><span>Text</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>T</kbd></div>
              <div className="flex justify-between"><span>Colors</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>C</kbd></div>
              <div className="flex justify-between"><span>Calculator</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>=</kbd></div>
              <div className="flex justify-between"><span>Undo</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘Z</kbd></div>
              <div className="flex justify-between"><span>Save</span><kbd className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>⌘S</kbd></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
