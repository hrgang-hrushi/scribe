const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// 1. Add refs
const refsSearch = 'const isDrawing = useRef(false);';
const refsAdd = 'const isDrawing = useRef(false);\n  const isPanningRef = useRef(false);\n  const lastTouchPanRef = useRef<{x: number, y: number} | null>(null);';
code = code.replace(refsSearch, refsAdd);

// 2. Modify handlePointerDown
const downSearch = "if (e.pointerType === 'touch' && tool !== 'ruler') return;";
const downReplace = `if (e.pointerType === 'touch' && tool !== 'ruler') {
      isPanningRef.current = true;
      lastTouchPanRef.current = { x: e.clientX, y: e.clientY };
      return;
    }`;
code = code.replace(downSearch, downReplace);

// 3. Modify handlePointerMove
const moveSearch = 'function handlePointerMove(e: React.PointerEvent) {\n    if (!isDrawing.current) return;\n    if (e.pointerType === \'touch\') return;';
const moveReplace = `function handlePointerMove(e: React.PointerEvent) {
    if (isPanningRef.current && e.pointerType === 'touch') {
      if (lastTouchPanRef.current) {
        const dx = e.clientX - lastTouchPanRef.current.x;
        const dy = e.clientY - lastTouchPanRef.current.y;
        panRef.current.x += dx;
        panRef.current.y += dy;
        lastTouchPanRef.current = { x: e.clientX, y: e.clientY };
        redrawAll();
      }
      return;
    }
    if (!isDrawing.current) return;
    if (e.pointerType === 'touch') return;`;
code = code.replace(moveSearch, moveReplace);

// 4. Modify handlePointerUp
const upSearch = 'function handlePointerUp(e: React.PointerEvent) {\n    if (!isDrawing.current) return;';
const upReplace = `function handlePointerUp(e: React.PointerEvent) {
    if (isPanningRef.current && e.pointerType === 'touch') {
      isPanningRef.current = false;
      lastTouchPanRef.current = null;
      return;
    }
    if (!isDrawing.current) return;`;
code = code.replace(upSearch, upReplace);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
