const fs = require('fs');

// page.tsx
let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');
// Fix edit input
pageCode = pageCode.replace(
  /className="bg-transparent mix-blend-difference text-white font-medium text-2xl outline-none w-full border-b border-white\/40"/g,
  'className="bg-transparent text-[var(--text-primary)] font-medium text-2xl outline-none w-full border-b border-[var(--border)]"'
);
// Fix title
pageCode = pageCode.replace(
  /className="mix-blend-difference text-white font-medium text-2xl line-clamp-3 leading-tight"/g,
  'className="text-[var(--text-primary)] font-medium text-2xl line-clamp-3 leading-tight"'
);
// Fix arrow button
pageCode = pageCode.replace(
  /className="w-10 h-10 rounded-full bg-white\/20 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 shrink-0 ml-4 mix-blend-difference text-white"/g,
  'className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center transition-transform hover:scale-110 shrink-0 ml-4 text-[var(--text-primary)]"'
);
// Fix rename button
pageCode = pageCode.replace(
  /className="w-8 h-8 rounded-full bg-black\/10 flex items-center justify-center transition-colors hover:bg-black\/20 mix-blend-difference text-white"/g,
  'className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors hover:bg-black/10 text-[var(--text-primary)]"'
);
// Fix delete button
pageCode = pageCode.replace(
  /className="w-8 h-8 rounded-full bg-black\/10 flex items-center justify-center transition-colors hover:bg-red-500\/80 mix-blend-difference text-white"/g,
  'className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors hover:bg-red-500/80 hover:text-white text-[var(--text-primary)]"'
);

// We still need to re-apply the glass-panel to sidebar and cards because we checked out the file
pageCode = pageCode.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl glass-panel"'
);
pageCode = pageCode.replace(
  /className="rounded-\[32px\] p-6 flex flex-col justify-between cursor-pointer group aspect-\[1\.2\] transition-transform hover:-translate-y-1 shadow-sm relative overflow-hidden"\s+style=\{\{ background: cls\.gradient \}\}/g,
  'className="rounded-[32px] p-6 flex flex-col justify-between cursor-pointer group aspect-[1.2] transition-transform hover:-translate-y-1 shadow-sm relative overflow-hidden glass-panel"'
);
pageCode = pageCode.replace(
  /className="w-full max-w-sm rounded-\[32px\] p-8 shadow-2xl"\s+style=\{\{ background: 'var\(--bg-secondary\)' \}\}/g,
  'className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl glass-panel"'
);

// Remove color picker from new class modal
pageCode = pageCode.replace(
  /<p className="text-sm font-medium mb-3" style={{ color: 'var\(--text-muted\)' }}>Choose a preset<\/p>\s*<div className="grid grid-cols-7 gap-2 mb-8">\s*\{GRADIENT_PRESETS.map\(\(g, i\) => \(\s*<button\s*key=\{i\}\s*onClick=\{\(\) => setSelectedGradient\(g\)\}\s*className="w-8 h-8 rounded-full transition-transform hover:scale-110"\s*style=\{\{\s*background: g,\s*outline: selectedGradient === g \? '2px solid var\(--accent\)' : 'none',\s*outlineOffset: '2px',\s*\}\}\s*\/>\s*\)\)\}\s*<\/div>/g,
  ''
);

fs.writeFileSync('src/app/page.tsx', pageCode);

// classes/[classId]/page.tsx
let classCode = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');

classCode = classCode.replace(
  /className="mix-blend-difference text-white text-3xl font-bold leading-tight mb-2 drop-shadow-sm"/g,
  'className="text-[var(--text-primary)] text-3xl font-bold leading-tight mb-2 drop-shadow-sm"'
);
classCode = classCode.replace(
  /className="mix-blend-difference text-white\/80 font-medium text-sm mb-8 drop-shadow-sm"/g,
  'className="text-[var(--text-secondary)] font-medium text-sm mb-8 drop-shadow-sm"'
);
classCode = classCode.replace(
  /className="px-6 py-4 rounded-full font-bold text-sm mix-blend-difference bg-white text-black transition-transform hover:scale-105 shadow-md flex items-center gap-2"/g,
  'className="px-6 py-4 rounded-full font-bold text-sm bg-[var(--accent)] text-[var(--bg-primary)] transition-transform hover:scale-105 shadow-md flex items-center gap-2"'
);

// Re-apply glass-panel
classCode = classCode.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10 glass-panel"'
);
classCode = classCode.replace(
  /className="rounded-\[32px\] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start"\s+style=\{\{ background: cls\?\.gradient \|\| 'var\(--bg-tertiary\)' \}\}/g,
  'className="rounded-[32px] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start glass-panel"'
);

fs.writeFileSync('src/app/classes/[classId]/page.tsx', classCode);

