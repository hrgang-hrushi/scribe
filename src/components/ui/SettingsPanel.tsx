'use client';

import { useState, useEffect } from 'react';
import type { AppSettings } from '@/lib/types';

interface SettingsPanelProps {
  onClose: () => void;
}

const PAGE_TEMPLATES = [
  { id: 'blank', label: 'Blank', icon: '📄' },
  { id: 'ruled', label: 'Ruled', icon: '📝' },
  { id: 'grid', label: 'Grid', icon: '📊' },
  { id: 'dotted', label: 'Dotted', icon: '🔵' },
  { id: 'cornell', label: 'Cornell', icon: '📋' },
] as const;

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
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
                    color: settings.theme === t ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {t === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              ))}
            </div>
          </div>

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
                    color: settings.defaultTemplate === t.id ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <span className="text-lg">{t.icon}</span>
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
