const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// Remove setStrokes
code = code.replace(/setStrokes\(\[\]\);\n/g, '');

// Fix pdfjs render type
code = code.replace(
  /await page\.render\(\{ canvasContext: ctx, viewport \}\)\.promise;/g,
  'await page.render({ canvasContext: ctx, viewport } as any).promise;'
);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
