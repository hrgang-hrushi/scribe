const fs = require('fs');

// SettingsPanel.tsx
let settings = fs.readFileSync('src/components/ui/SettingsPanel.tsx', 'utf8');
settings = settings.replace(/text-blue-500/g, 'text-[var(--text-primary)]');
fs.writeFileSync('src/components/ui/SettingsPanel.tsx', settings);

// CanvasEditor.tsx
let canvas = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');
canvas = canvas.replace(/focus:ring-blue-400/g, 'focus:ring-[var(--accent)]');
fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', canvas);

