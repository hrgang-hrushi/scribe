const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

const search = "redo: () => {";
const replace = `clear: () => {
      committedStrokes.current = [];
      committedTextBoxes.current = [];
      committedImages.current = [];
      setStrokes([]);
      setTextBoxes([]);
      setImages([]);
      triggerSave();
      redrawAll();
    },
    importMedia: async (file: File) => {
      const pos = { x: 100 - panRef.current.x, y: 100 - panRef.current.y };
      
      if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = \`//cdnjs.cloudflare.com/ajax/libs/pdf.js/\${pdfjs.version}/pdf.worker.min.js\`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const src = tempCanvas.toDataURL('image/png');
          const newImg = {
            id: crypto.randomUUID(),
            x: pos.x,
            y: pos.y,
            width: viewport.width / 2,
            height: viewport.height / 2,
            src,
          };
          committedImages.current = [...committedImages.current, newImg];
          setImages([...committedImages.current]);
          triggerSave();
          redrawAll();
        }
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const newImg = {
            id: crypto.randomUUID(),
            x: pos.x,
            y: pos.y,
            width: 300,
            height: 200,
            src,
          };
          committedImages.current = [...committedImages.current, newImg];
          setImages([...committedImages.current]);
          triggerSave();
          redrawAll();
        };
        reader.readAsDataURL(file);
      }
    },
    redo: () => {`;

code = code.replace(search, replace);
fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
