const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace(
  /className="w-full max-w-sm rounded-\[32px\] p-8 shadow-2xl glass-panel"\n\s*style={{ background: 'var\(--bg-secondary\)' }}/g,
  'className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl glass-panel"'
);
// Also let's completely remove the color picker from the new class modal
code = code.replace(
  /<p className="text-sm font-medium mb-3" style={{ color: 'var\(--text-muted\)' }}>Choose a preset<\/p>\s*<div className="grid grid-cols-7 gap-2 mb-8">\s*\{GRADIENT_PRESETS.map\(\(g, i\) => \(\s*<button\s*key=\{i\}\s*onClick=\{\(\) => setSelectedGradient\(g\)\}\s*className="w-8 h-8 rounded-full transition-transform hover:scale-110"\s*style=\{\{\s*background: g,\s*outline: selectedGradient === g \? '2px solid var\(--accent\)' : 'none',\s*outlineOffset: '2px',\s*\}\}\s*\/>\s*\)\)\}\s*<\/div>/,
  ''
);
fs.writeFileSync('src/app/page.tsx', code);
