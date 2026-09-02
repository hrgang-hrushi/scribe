'use client';

interface ColorPickerProps {
  colors: string[];
  activeColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ colors, activeColor, onSelect, onClose }: ColorPickerProps) {
  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl p-4 animate-slide-up"
      style={{ background: 'var(--toolbar-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}
    >
      <div className="grid grid-cols-5 gap-2 mb-3">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className="w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 relative"
            style={{
              background: color,
              outline: activeColor === color ? '2px solid var(--accent)' : '1px solid rgba(128,128,128,0.2)',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Custom:</label>
        <input
          type="color"
          value={activeColor}
          onChange={e => onSelect(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0"
        />
        <button
          onClick={onClose}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
