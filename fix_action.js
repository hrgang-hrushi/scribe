const fs = require('fs');
let code = fs.readFileSync('src/app/notes/[noteId]/page.tsx', 'utf8');

const search = "async function handleExportPdf() {";
const replace = `const handleToolbarAction = (action: 'export-pdf' | 'export-png' | 'import' | 'clear') => {
    if (action === 'export-pdf') {
      handleExportPdf();
    } else if (action === 'export-png') {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = \`\${note?.title || 'note'}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } else if (action === 'import') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = (fileEvent) => {
        const file = (fileEvent.target as HTMLInputElement).files?.[0];
        if (!file) return;
        canvasEditorRef.current?.importMedia(file);
      };
      input.click();
    } else if (action === 'clear') {
      if (confirm('Are you sure you want to clear the entire canvas?')) {
        canvasEditorRef.current?.clear();
      }
    }
  };

  async function handleExportPdf() {`;

code = code.replace(search, replace);
fs.writeFileSync('src/app/notes/[noteId]/page.tsx', code);
