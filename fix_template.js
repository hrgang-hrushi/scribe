const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// Add bgCanvasRef
code = code.replace(
  'const canvasRef = useRef<HTMLCanvasElement>(null);',
  'const bgCanvasRef = useRef<HTMLCanvasElement>(null);\n  const canvasRef = useRef<HTMLCanvasElement>(null);'
);

// Update JSX to include bgCanvasRef
code = code.replace(
  '<canvas\n        ref={canvasRef}',
  '<canvas ref={bgCanvasRef} className="absolute inset-0" style={{ touchAction: \'none\' }} />\n      <canvas\n        ref={canvasRef}'
);

// Change resize logic to include bgCanvasRef
code = code.replace(
  'const canvases = [canvasRef.current, overlayCanvasRef.current];',
  'const canvases = [bgCanvasRef.current, canvasRef.current, overlayCanvasRef.current];'
);

// Extract template logic in redrawAll
const oldTemplateDraw = `    // Draw background template
    if (template !== 'blank') {
      const vpX = -panRef.current.x / zoomRef.current;
      const vpY = -panRef.current.y / zoomRef.current;
      const vpW = (canvas.width / dpr) / zoomRef.current;
      const vpH = (canvas.height / dpr) / zoomRef.current;
      
      ctx.save();
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1 / zoomRef.current;
      ctx.beginPath();
      
      const startX = Math.floor(vpX / 40) * 40;
      const startY = Math.floor(vpY / 40) * 40;
      
      if (template === 'ruled' || template === 'cornell') {
        for (let y = startY; y < vpY + vpH; y += 40) {
          ctx.moveTo(vpX, y); ctx.lineTo(vpX + vpW, y);
        }
        if (template === 'cornell') {
          ctx.moveTo(startX + 120, vpY); ctx.lineTo(startX + 120, vpY + vpH);
        }
      } else if (template === 'grid') {
        for (let y = startY; y < vpY + vpH; y += 40) { ctx.moveTo(vpX, y); ctx.lineTo(vpX + vpW, y); }
        for (let x = startX; x < vpX + vpW; x += 40) { ctx.moveTo(x, vpY); ctx.lineTo(x, vpY + vpH); }
      } else if (template === 'dotted') {
        ctx.fillStyle = ctx.strokeStyle;
        for (let y = startY; y < vpY + vpH; y += 40) {
          for (let x = startX; x < vpX + vpW; x += 40) {
            ctx.moveTo(x, y);
            ctx.arc(x, y, 1.5 / zoomRef.current, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    }`;

const newTemplateDraw = `    // Draw background template to bgCanvas
    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bgCtx.clearRect(0, 0, bgCanvas.width / dpr, bgCanvas.height / dpr);
        if (template !== 'blank') {
          bgCtx.save();
          bgCtx.translate(panRef.current.x, panRef.current.y);
          bgCtx.scale(zoomRef.current, zoomRef.current);
          
          const vpX = -panRef.current.x / zoomRef.current;
          const vpY = -panRef.current.y / zoomRef.current;
          const vpW = (bgCanvas.width / dpr) / zoomRef.current;
          const vpH = (bgCanvas.height / dpr) / zoomRef.current;
          
          bgCtx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
          bgCtx.lineWidth = 1 / zoomRef.current;
          bgCtx.beginPath();
          
          const startX = Math.floor(vpX / 40) * 40;
          const startY = Math.floor(vpY / 40) * 40;
          
          if (template === 'ruled' || template === 'cornell') {
            for (let y = startY; y < vpY + vpH; y += 40) {
              bgCtx.moveTo(vpX, y); bgCtx.lineTo(vpX + vpW, y);
            }
            if (template === 'cornell') {
              bgCtx.moveTo(startX + 120, vpY); bgCtx.lineTo(startX + 120, vpY + vpH);
            }
          } else if (template === 'grid') {
            for (let y = startY; y < vpY + vpH; y += 40) { bgCtx.moveTo(vpX, y); bgCtx.lineTo(vpX + vpW, y); }
            for (let x = startX; x < vpX + vpW; x += 40) { bgCtx.moveTo(x, vpY); bgCtx.lineTo(x, vpY + vpH); }
          } else if (template === 'dotted') {
            bgCtx.fillStyle = bgCtx.strokeStyle;
            for (let y = startY; y < vpY + vpH; y += 40) {
              for (let x = startX; x < vpX + vpW; x += 40) {
                bgCtx.moveTo(x, y);
                bgCtx.arc(x, y, 1.5 / zoomRef.current, 0, Math.PI * 2);
              }
            }
            bgCtx.fill();
          }
          bgCtx.stroke();
          bgCtx.restore();
        }
      }
    }`;

code = code.replace(oldTemplateDraw, newTemplateDraw);

// Add useEffect to redraw when template or theme changes
code = code.replace(
  '  const redrawAll = useCallback(() => {',
  `  useEffect(() => {
    redrawAll();
  }, [template, theme]);\n\n  const redrawAll = useCallback(() => {`
);

// We need to add dependencies to useCallback? Actually since we're using useCallback with [] we can't easily add dependencies unless we change the dependency array. 
// Wait, redrawAll is defined with useCallback(() => {...}, []). It uses template and theme from the closure! If it's [], it never gets updated closures for template and theme!
// So when template/theme change, redrawAll is still using the old values.
// Let's modify redrawAll to not use useCallback, or add dependencies.
code = code.replace(
  'const redrawAll = useCallback(() => {',
  'const redrawAll = useCallback(() => {'
);
// Let's replace the useCallback dependency array for redrawAll
code = code.replace(
  '  }, []);\n\n  function drawStroke',
  '  }, [template, theme]);\n\n  function drawStroke'
);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
