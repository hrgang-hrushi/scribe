const fs = require('fs');

const files = [
  'src/components/ui/SettingsPanel.tsx',
  'src/components/ui/PomodoroTimer.tsx',
  'src/components/ui/FlashcardMode.tsx',
  'src/components/ui/TagFilter.tsx',
  'src/components/ui/Calculator.tsx'
];

for (let file of files) {
  let code = fs.readFileSync(file, 'utf8');
  // Find style={{ background: 'var(--bg-secondary)' }}
  code = code.replace(/style={{ background: 'var\(--bg-secondary\)' }}/g, '');
  code = code.replace(/className="(.*?)"\s*>\s*<div className="p-6">/g, 'className="$1 glass-panel">\n        <div className="p-6">');
  // For Pomodoro / Calculator which used var(--toolbar-bg)
  code = code.replace(/style={{ background: 'var\(--toolbar-bg\)', border: '1px solid var\(--border\)', backdropFilter: 'blur\(16px\)' }}/g, '');
  // Specifically for Pomodoro:
  code = code.replace(/className="absolute bottom-24 right-6 w-72 rounded-2xl p-4 shadow-xl animate-slide-up"/g, 'className="absolute bottom-24 right-6 w-72 rounded-2xl p-4 shadow-xl animate-slide-up glass-panel"');
  // Specifically for Calculator:
  code = code.replace(/className="absolute bottom-24 right-6 w-64 rounded-2xl p-4 shadow-xl animate-slide-up"/g, 'className="absolute bottom-24 right-6 w-64 rounded-2xl p-4 shadow-xl animate-slide-up glass-panel"');
  
  fs.writeFileSync(file, code);
}
