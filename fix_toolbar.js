const fs = require('fs');
let toolbarCode = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');
toolbarCode = toolbarCode.replace(
  /className="rounded-2xl p-4 mb-2 animate-slide-up"\n          style={{ background: 'var\(--toolbar-bg\)', border: '1px solid var\(--border\)', backdropFilter: 'blur\(16px\)' }}/g,
  'className="rounded-2xl p-4 mb-2 animate-slide-up glass-panel"'
);
toolbarCode = toolbarCode.replace(
  /className="flex items-center gap-1 px-3 py-2 rounded-2xl shadow-lg"\n        style={{ background: 'var\(--toolbar-bg\)', border: '1px solid var\(--border\)', backdropFilter: 'blur\(16px\)' }}/g,
  'className="flex items-center gap-1 px-3 py-2 rounded-2xl shadow-lg glass-panel"'
);
fs.writeFileSync('src/components/canvas/Toolbar.tsx', toolbarCode);
