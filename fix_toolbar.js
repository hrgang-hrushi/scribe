const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');

// Replace all instances of var(--text-secondary) with var(--text-primary) for the tool icons
code = code.replace(/color: activeTool === t\.id \? 'var\(--bg-primary\)' : 'var\(--text-secondary\)'/g, "color: activeTool === t.id ? 'var(--bg-primary)' : 'var(--text-primary)'");
code = code.replace(/color: showSettings \? 'var\(--bg-primary\)' : 'var\(--text-secondary\)'/g, "color: showSettings ? 'var(--bg-primary)' : 'var(--text-primary)'");
code = code.replace(/color: showMoreMenu \? 'var\(--bg-primary\)' : 'var\(--text-secondary\)'/g, "color: showMoreMenu ? 'var(--bg-primary)' : 'var(--text-primary)'");
code = code.replace(/style=\{\{ color: 'var\(--text-secondary\)' \}\}/g, "style={{ color: 'var(--text-primary)' }}");

// Also let's check the submenu popups (Shapes, More menu) which currently have hardcoded bg-white dark:bg-gray-800
// "bg-white dark:bg-gray-800"
code = code.replace(/bg-white dark:bg-gray-800/g, 'glass-panel');
code = code.replace(/hover:bg-gray-100 dark:hover:bg-gray-700/g, 'hover:bg-[var(--bg-tertiary)]');

fs.writeFileSync('src/components/canvas/Toolbar.tsx', code);
