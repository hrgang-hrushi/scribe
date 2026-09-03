const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// Update CanvasEditorRef interface
const refInterfaceSearch = 'export interface CanvasEditorRef {\n  undo: () => void;\n  redo: () => void;\n}';
const refInterfaceReplace = 'export interface CanvasEditorRef {\n  undo: () => void;\n  redo: () => void;\n  clear: () => void;\n  importMedia: (file: File) => void;\n}';
code = code.replace(refInterfaceSearch, refInterfaceReplace);

// Update useImperativeHandle
const imperativeSearch = /useImperativeHandle\(ref, \(\) => \(\{\n\s*undo: handleUndo,\n\s*redo: handleRedo,\n\s*\}\)\);/;
const imperativeReplace = `useImperativeHandle(ref, () => ({
    undo: handleUndo,
    redo: handleRedo,
    clear: () => {
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
      // Logic copied from handlePointerDown for tool === 'image'
      const pos = { x: 100 - panRef.current.x, y: 100 - panRef.current.y }; // default place
      
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
    }
  }));`;
code = code.replace(imperativeSearch, imperativeReplace);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
