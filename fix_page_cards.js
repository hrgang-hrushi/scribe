const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// The regex above is too simple, let's do a more robust replace for sidebar:
code = code.replace(
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl" style={{ background: \'var(--bg-secondary)\' }}',
  'className="w-full md:w-96 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar shadow-xl glass-panel"'
);

// We need to replace the style={{ background: cls.gradient }} in the cards
code = code.replace(
  'className="rounded-[32px] p-6 flex flex-col justify-between cursor-pointer group aspect-[1.2] transition-transform hover:-translate-y-1 shadow-sm relative overflow-hidden"\n                  style={{ background: cls.gradient }}',
  'className="rounded-[32px] p-6 flex flex-col justify-between cursor-pointer group aspect-[1.2] transition-transform hover:-translate-y-1 shadow-sm relative overflow-hidden glass-panel"'
);

// We should also remove the new class modal background colors:
code = code.replace(
  '<div\n              initial={{ scale: 0.9, opacity: 0 }}\n              animate={{ scale: 1, opacity: 1 }}\n              exit={{ scale: 0.9, opacity: 0 }}\n              className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl"\n              style={{ background: \'var(--bg-secondary)\' }}',
  '<div\n              initial={{ scale: 0.9, opacity: 0 }}\n              animate={{ scale: 1, opacity: 1 }}\n              exit={{ scale: 0.9, opacity: 0 }}\n              className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl glass-panel"'
);

fs.writeFileSync('src/app/page.tsx', code);
