const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');

const oldMotionDiv = `<motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 50 }}
      style={{ touchAction: 'none' }}
      className="fixed bottom-6 z-40 flex flex-col items-center gap-2 safe-bottom cursor-grab active:cursor-grabbing"
      initial={{ x: '-50%' }}
      animate={{ x: '-50%' }}
      dragElastic={0}
      onDragStart={() => document.body.style.overflow = 'hidden'}
      onDragEnd={() => document.body.style.overflow = 'auto'}
    >`;

const newMotionDiv = `<div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none safe-bottom">
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 50 }}
      style={{ touchAction: 'none' }}
      className="flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing pointer-events-auto"
      dragElastic={0}
      onDragStart={() => document.body.style.overflow = 'hidden'}
      onDragEnd={() => document.body.style.overflow = 'auto'}
    >`;

code = code.replace(oldMotionDiv, newMotionDiv);
code = code.replace('    </motion.div>\n  );\n}', '    </motion.div>\n    </div>\n  );\n}');

fs.writeFileSync('src/components/canvas/Toolbar.tsx', code);
