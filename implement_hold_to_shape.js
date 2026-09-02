const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// Add refs for hold-to-shape
code = code.replace(
  'const isDrawing = useRef(false);',
  `const isDrawing = useRef(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoShapeData = useRef<{ type: string; start: {x: number, y: number}; end: {x: number, y: number} } | null>(null);`
);

// handlePointerDown: reset state
code = code.replace(
  'isDrawing.current = true;\n    const pos = getPointerPos(e);',
  `isDrawing.current = true;
    autoShapeData.current = null;
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    const pos = getPointerPos(e);`
);

// handlePointerMove: timeout and shape logic
const oldMove = `    currentStroke.current.push(pos);

    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const tempStroke: Stroke = {
      id: '',
      tool: tool as 'pen' | 'highlighter' | 'eraser',
      color: tool === 'highlighter' ? settings.highlighterColor : settings.penColor,
      width: tool === 'highlighter' ? settings.highlighterWidth : (tool === 'eraser' ? settings.eraserWidth : settings.penWidth),
      opacity: tool === 'highlighter' ? 0.35 : settings.penOpacity,
      points: currentStroke.current,
    };`;

const newMove = `    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    // Handle Auto Shape Update
    if (autoShapeData.current && tool === 'pen') {
      autoShapeData.current.end = pos;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      
      ctx.strokeStyle = settings.penColor;
      ctx.lineWidth = settings.penWidth;
      
      const { type, start, end } = autoShapeData.current;
      const w = end.x - start.x;
      const h = end.y - start.y;
      
      ctx.beginPath();
      if (type === 'rect') {
        ctx.strokeRect(start.x, start.y, w, h);
      } else if (type === 'circle') {
        const r = Math.sqrt(w*w + h*h);
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    currentStroke.current.push(pos);

    // Hold-to-shape detection timeout
    if (tool === 'pen') {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = setTimeout(() => {
        if (!isDrawing.current || currentStroke.current.length < 10) return;
        const pts = currentStroke.current;
        const start = pts[0];
        const end = pts[pts.length - 1];
        const dist = Math.hypot(end.x - start.x, end.y - start.y);
        let pathLen = 0;
        for (let i = 1; i < pts.length; i++) {
          pathLen += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
        }
        
        let detectedType = null;
        let shapeStart = start;
        let shapeEnd = end;

        if (dist > pathLen * 0.85) {
          detectedType = 'line';
        } else if (dist < pathLen * 0.3) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          pts.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });
          const w = maxX - minX;
          const h = maxY - minY;
          detectedType = Math.abs(w - h) < Math.max(w, h) * 0.3 ? 'circle' : 'rect';
          
          if (detectedType === 'circle') {
            shapeStart = { x: minX + w/2, y: minY + h/2 }; // center
            shapeEnd = { x: shapeStart.x + w/2, y: shapeStart.y }; // radius point
          } else {
            shapeStart = { x: minX, y: minY };
            shapeEnd = { x: maxX, y: maxY };
          }
        }
        
        if (detectedType) {
          autoShapeData.current = { type: detectedType, start: shapeStart, end: shapeEnd };
          // Vibrate if supported to indicate snapping
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
          
          // Force a re-render of the overlay immediately with the new shape
          handlePointerMove({ ...e, clientX: e.clientX, clientY: e.clientY } as any);
        }
      }, 500); // 500ms hold
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const tempStroke: Stroke = {
      id: '',
      tool: tool as 'pen' | 'highlighter' | 'eraser',
      color: tool === 'highlighter' ? settings.highlighterColor : settings.penColor,
      width: tool === 'highlighter' ? settings.highlighterWidth : (tool === 'eraser' ? settings.eraserWidth : settings.penWidth),
      opacity: tool === 'highlighter' ? 0.35 : settings.penOpacity,
      points: currentStroke.current,
    };`;

code = code.replace(oldMove, newMove);

// handlePointerUp: save shape if active
const oldUp = `    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (tool === 'shapes' && shapeStartRef.current) {`;

const newUp = `    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    // Commit auto-shape if it was created
    if (autoShapeData.current && tool === 'pen') {
      const { type, start, end } = autoShapeData.current;
      const w = end.x - start.x;
      const h = end.y - start.y;
      let path = '';
      if (type === 'rect') {
        path = \`M \${start.x} \${start.y} L \${end.x} \${start.y} L \${end.x} \${end.y} L \${start.x} \${end.y} Z\`;
      } else if (type === 'circle') {
        const r = Math.sqrt(w*w + h*h);
        path = \`M \${start.x - r} \${start.y} A \${r} \${r} 0 1 1 \${start.x + r} \${start.y} A \${r} \${r} 0 1 1 \${start.x - r} \${start.y} Z\`;
      } else if (type === 'line') {
        path = \`M \${start.x} \${start.y} L \${end.x} \${end.y}\`;
      }
      
      const shapeStroke: any = {
        id: crypto.randomUUID(),
        tool: 'shapes',
        color: settings.penColor,
        width: settings.penWidth,
        opacity: 1,
        points: [],
        shape: { type, path }
      };
      
      committedStrokes.current.push(shapeStroke);
      setUndoStack([]);
      
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
      redrawAll();
      triggerSave();
      autoShapeData.current = null;
      return;
    }

    if (tool === 'shapes' && shapeStartRef.current) {`;

code = code.replace(oldUp, newUp);

// Also handlePointerLeave should clear timeout
code = code.replace(
  '  function handlePointerLeave(e: React.PointerEvent) {',
  '  function handlePointerLeave(e: React.PointerEvent) {\n    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);'
);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
