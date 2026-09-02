const fs = require('fs');

function applyGlass(file, oldClass, oldStyle) {
  let code = fs.readFileSync(file, 'utf8');
  if (oldStyle) {
    code = code.replace(oldStyle, '');
  }
  code = code.replace(oldClass, oldClass + ' glass-panel');
  fs.writeFileSync(file, code);
}

applyGlass('src/components/ui/SettingsPanel.tsx', 
  'className="w-full max-w-md rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto"',
  /style={{ background: 'var\(--bg-secondary\)' }}/g);

applyGlass('src/components/ui/FlashcardMode.tsx', 
  'className="w-full max-w-md rounded-3xl overflow-hidden max-h-[80vh] flex flex-col shadow-2xl"',
  /style={{ background: 'var\(--bg-secondary\)' }}/g);
  
applyGlass('src/components/ui/TagFilter.tsx', 
  'className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"',
  /style={{ background: 'var\(--bg-secondary\)' }}/g);

applyGlass('src/components/ui/PomodoroTimer.tsx', 
  'className="absolute bottom-24 right-6 w-72 rounded-2xl p-4 shadow-xl animate-slide-up"',
  /style={{ background: 'var\(--toolbar-bg\)', border: '1px solid var\(--border\)', backdropFilter: 'blur\(16px\)' }}/g);

applyGlass('src/components/ui/Calculator.tsx', 
  'className="absolute bottom-24 right-6 w-64 rounded-2xl p-4 shadow-xl animate-slide-up"',
  /style={{ background: 'var\(--toolbar-bg\)', border: '1px solid var\(--border\)', backdropFilter: 'blur\(16px\)' }}/g);

