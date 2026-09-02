const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');

// Remove lasso, text, ruler
code = code.replace(/\{ id: 'lasso'.*\n/g, '');
code = code.replace(/\{ id: 'text'.*\n/g, '');
code = code.replace(/\{ id: 'ruler'.*\n/g, '');

// Make it movable and add 3-dots
code = code.replace(
  '<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 safe-bottom">',
  `<motion.div
      drag
      dragMomentum={false}
      style={{ touchAction: 'none' }}
      className="fixed bottom-6 z-40 flex flex-col items-center gap-2 safe-bottom cursor-grab active:cursor-grabbing"
      initial={{ x: '-50%' }}
      animate={{ x: '-50%' }}
      dragElastic={0}
      onDragStart={() => document.body.style.overflow = 'hidden'}
      onDragEnd={() => document.body.style.overflow = 'auto'}
    >`
);
code = code.replace(
  '    </div>\n  );\n}',
  '    </motion.div>\n  );\n}'
);

// Add arrow to shapes
code = code.replace(
  `(['rect', 'circle', 'triangle', 'line'] as const)`,
  `(['rect', 'circle', 'triangle', 'line', 'arrow'] as const)`
);
code = code.replace(
  `{shapeType === 'line' && (`,
  `{shapeType === 'arrow' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <polyline points="15 5 22 12 15 19" />
                      </svg>
                    )}
                    {shapeType === 'line' && (`
);

fs.writeFileSync('src/components/canvas/Toolbar.tsx', code);
