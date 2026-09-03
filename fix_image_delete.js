const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// 1. Add handleDeleteImage
const delSearch = "function handleDeleteTextBox(id: string) {";
const delReplace = `function handleDeleteImage(id: string) {
    committedImages.current = committedImages.current.filter(i => i.id !== id);
    setImages([...committedImages.current]);
    setEditingImage(null);
    triggerSave();
  }
  
  function handleDeleteTextBox(id: string) {`;
code = code.replace(delSearch, delReplace);

// 2. Fix dragDataRef.current.id to dragDataRef.current!.id
code = code.replace(/dragDataRef\.current\.id/g, 'dragDataRef.current!.id');

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
