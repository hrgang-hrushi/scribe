const fs = require('fs');
let code = fs.readFileSync('src/app/notes/[noteId]/page.tsx', 'utf8');

// Find where we can insert handleToolbarAction
const exportPdfSearch = 'const handleExportPdf = async () => {';
const toolbarAction = `
  const handleToolbarAction = (action: 'export-pdf' | 'export-png' | 'import' | 'clear') => {
    if (action === 'export-pdf') {
      handleExportPdf();
    } else if (action === 'export-png') {
      // For PNG, just export from canvas
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = \`\${note?.title || 'note'}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } else if (action === 'import') {
      // Trigger the image tool logic which opens the file picker.
      // Wait, CanvasEditor intercepts the file if the tool is 'image' and the user clicks on canvas.
      // If we want it to immediately prompt without clicking canvas, we can do it here!
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = async (fileEvent) => {
        const file = fileEvent.target.files?.[0];
        if (!file) return;
        
        // Let's pass this file to CanvasEditor using a ref method, or we just set activeTool to 'image' and let them click?
        // Let's just set active tool to 'image' and let them click to place it!
        setActiveTool('image');
      };
      // Actually, if we just set activeTool('image'), we don't even need to open the file picker here.
      // But the user said "import directly from files" meaning it should pop the file browser IMMEDIATELY.
      // Let's call a method on canvasEditorRef: canvasEditorRef.current?.importMedia()
    } else if (action === 'clear') {
      if (confirm('Are you sure you want to clear the entire canvas?')) {
        canvasEditorRef.current?.clear();
      }
    }
  };

`;

code = code.replace(exportPdfSearch, toolbarAction + exportPdfSearch);

// Add clear() and importMedia() to CanvasEditorRef in CanvasEditor.tsx in the next step.
// For now, let's pass onAction to Toolbar
code = code.replace(
  'onRedo={handleRedo}\n      />',
  'onRedo={handleRedo}\n        onAction={handleToolbarAction}\n      />'
);

fs.writeFileSync('src/app/notes/[noteId]/page.tsx', code);
