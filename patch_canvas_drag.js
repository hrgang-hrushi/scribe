const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// 1. State additions
code = code.replace(
  'const [editingTextBox, setEditingTextBox] = useState<string | null>(null);',
  "const [editingTextBox, setEditingTextBox] = useState<string | null>(null);\n  const [editingImage, setEditingImage] = useState<string | null>(null);\n  const dragDataRef = useRef<{ id: string; type: 'text' | 'image'; startX: number; startY: number; initialX: number; initialY: number } | null>(null);"
);

// 2. Remove drawImage from redrawAll
const drawImageLoop = `    // Draw images
    committedImages.current.forEach(img => {
      const image = new Image();
      image.src = img.src;
      if (image.complete) {
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
      } else {
        image.onload = () => redrawAll();
      }
    });`;
code = code.replace(drawImageLoop, '    // Images are now rendered as DOM overlays');

// 3. Add handleDeleteImage
const handleDelSearch = 'const handleDeleteTextBox = (id: string) => {';
const handleDelImage = `const handleDeleteImage = (id: string) => {
    committedImages.current = committedImages.current.filter(i => i.id !== id);
    setImages([...committedImages.current]);
    setEditingImage(null);
    triggerSave();
    redrawAll();
  };
  
  `;
code = code.replace(handleDelSearch, handleDelImage + handleDelSearch);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
