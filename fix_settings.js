const fs = require('fs');
let code = fs.readFileSync('src/components/ui/SettingsPanel.tsx', 'utf8');

// The user specifically wants the calculator description and the keyboard shortcuts list to be primary color.
code = code.replace(
  /<p className="text-xs mt-1" style={{ color: 'var\(--text-muted\)' }}>Display calculator button in top bar<\/p>/,
  '<p className="text-xs mt-1" style={{ color: \'var(--text-primary)\' }}>Display calculator button in top bar</p>'
);

code = code.replace(
  /<div className="space-y-2 text-xs" style={{ color: 'var\(--text-muted\)' }}>\s*<div className="flex justify-between"><span>Pan tool<\/span>/,
  '<div className="space-y-2 text-xs font-medium" style={{ color: \'var(--text-primary)\' }}>\n              <div className="flex justify-between"><span>Pan tool</span>'
);

// I will also just change all descriptions to primary just in case they meant the whole panel.
// But let's look at the others:
// "Save notes locally every {settings.autosaveInterval} seconds"
code = code.replace(
  /<p className="text-xs mt-1" style={{ color: 'var\(--text-muted\)' }}>Save notes locally every \{settings.autosaveInterval\} seconds<\/p>/,
  '<p className="text-xs mt-1" style={{ color: \'var(--text-primary)\' }}>Save notes locally every {settings.autosaveInterval} seconds</p>'
);

// "Show saving indicator in top right"
code = code.replace(
  /<p className="text-xs mt-1" style={{ color: 'var\(--text-muted\)' }}>Show saving indicator in top right<\/p>/,
  '<p className="text-xs mt-1" style={{ color: \'var(--text-primary)\' }}>Show saving indicator in top right</p>'
);

// "Disable finger drawing to prevent accidental marks"
code = code.replace(
  /<p className="text-xs mt-1" style={{ color: 'var\(--text-muted\)' }}>Disable finger drawing to prevent accidental marks<\/p>/,
  '<p className="text-xs mt-1" style={{ color: \'var(--text-primary)\' }}>Disable finger drawing to prevent accidental marks</p>'
);


fs.writeFileSync('src/components/ui/SettingsPanel.tsx', code);
