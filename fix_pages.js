const fs = require('fs');

// page.tsx
let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');
// Fix sidebar
pageCode = pageCode.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl glass-panel"'
);
// Fix class cards (remove gradient and add glass-panel)
pageCode = pageCode.replace(
  /<div className="aspect-square md:aspect-auto md:h-48 rounded-\[32px\] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between group transition-transform hover:scale-105 active:scale-95 cursor-pointer" style={{ background: cls.gradient \|\| 'var\(--bg-secondary\)' }}>/g,
  '<div className="aspect-square md:aspect-auto md:h-48 rounded-[32px] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between group transition-transform hover:scale-105 active:scale-95 cursor-pointer glass-panel">'
);
fs.writeFileSync('src/app/page.tsx', pageCode);

// classes/[classId]/page.tsx
let classCode = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');
// Fix sidebar
classCode = classCode.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-2xl z-10 glass-panel"'
);
// Fix unified canvas block
classCode = classCode.replace(
  /<div className="rounded-\[32px\] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start" style={{ background: cls\?\.gradient \|\| 'var\(--bg-tertiary\)' }}>/g,
  '<div className="rounded-[32px] p-8 mb-10 shadow-lg relative overflow-hidden flex flex-col items-start glass-panel">'
);
fs.writeFileSync('src/app/classes/[classId]/page.tsx', classCode);
