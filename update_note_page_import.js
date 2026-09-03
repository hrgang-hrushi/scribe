const fs = require('fs');
let code = fs.readFileSync('src/app/notes/[noteId]/page.tsx', 'utf8');

code = code.replace(
  /\} else if \(action === 'import'\) \{[\s\S]*?\} else if \(action === 'clear'\) \{/,
  `} else if (action === 'import') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = (fileEvent) => {
        const file = (fileEvent.target as HTMLInputElement).files?.[0];
        if (!file) return;
        canvasEditorRef.current?.importMedia(file);
      };
      input.click();
    } else if (action === 'clear') {`
);

fs.writeFileSync('src/app/notes/[noteId]/page.tsx', code);
