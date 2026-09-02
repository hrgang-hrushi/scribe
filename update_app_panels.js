const fs = require('fs');

// Update page.tsx
let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');
pageCode = pageCode.replace(/style={{ background: 'var\(--bg-secondary\)' }}/g, 'className="... glass-panel"'); 
// The regex above is too simple, let's do a more robust replace for sidebar:
pageCode = pageCode.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl glass-panel"'
);

// Update class cards to remove gradient and use glass-panel
pageCode = pageCode.replace(
  /<div className="aspect-square md:aspect-auto md:h-48 rounded-\[32px\] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between group transition-transform hover:scale-105 active:scale-95 cursor-pointer" style={{ background: cls.gradient \|\| 'var\(--bg-secondary\)' }}>/g,
  '<div className="aspect-square md:aspect-auto md:h-48 rounded-[32px] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between group transition-transform hover:scale-105 active:scale-95 cursor-pointer glass-panel">'
);
fs.writeFileSync('src/app/page.tsx', pageCode);

// Update classes/[classId]/page.tsx
let classCode = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');
classCode = classCode.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10 glass-panel"'
);
// Remove gradient from Unified Canvas card
classCode = classCode.replace(
  /<div className="rounded-\[32px\] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start" style={{ background: cls\?\.gradient \|\| 'var\(--bg-tertiary\)' }}>/g,
  '<div className="rounded-[32px] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start glass-panel">'
);
fs.writeFileSync('src/app/classes/[classId]/page.tsx', classCode);

// Update Toolbar.tsx
let toolbarCode = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');
toolbarCode = toolbarCode.replace(
  /style={{ background: 'var\(--toolbar-bg\)', border: '1px solid var\(--border\)', backdropFilter: 'blur\(16px\)' }}/g,
  'className="... glass-panel"' // Wait, let's just use regex safely
);
fs.writeFileSync('src/components/canvas/Toolbar.tsx', toolbarCode);
