const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

const importMediaSearch = /if \(file\.type === 'application\/pdf'\) \{[\s\S]*?\} else \{/g;

// New logic: loop through all pages, fill white background, stack them vertically
const importMediaReplace = `if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        // Let's use a standard reliable version or the local one via unpkg
        pdfjs.GlobalWorkerOptions.workerSrc = \`https://unpkg.com/pdfjs-dist@\${pdfjs.version}/build/pdf.worker.min.mjs\`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let currentY = pos.y;
        const newImages = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better resolution
          const tempCanvas = document.createElement('canvas');
          const ctx = tempCanvas.getContext('2d');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;
          
          if (ctx) {
            // MUST fill with white background first, otherwise PDFs with transparent backgrounds render poorly
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const src = tempCanvas.toDataURL('image/png');
            
            // Scaled down visually by 2 (matching the 2.0 scale)
            const displayWidth = viewport.width / 2;
            const displayHeight = viewport.height / 2;
            
            newImages.push({
              id: crypto.randomUUID(),
              x: pos.x,
              y: currentY,
              width: displayWidth,
              height: displayHeight,
              src,
            });
            
            currentY += displayHeight + 20; // 20px gap between pages
          }
        }
        
        committedImages.current = [...committedImages.current, ...newImages];
        setImages([...committedImages.current]);
        triggerSave();
        redrawAll();
      } else {`;

code = code.replace(importMediaSearch, importMediaReplace);
fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
