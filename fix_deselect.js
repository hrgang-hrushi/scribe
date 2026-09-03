const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

code = code.replace(
  'function handlePointerDown(e: React.PointerEvent) {\n    if (e.pointerType',
  'function handlePointerDown(e: React.PointerEvent) {\n    setEditingTextBox(null);\n    setEditingImage(null);\n    if (e.pointerType'
);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
