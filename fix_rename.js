const fs = require('fs');
let code = fs.readFileSync('src/app/notes/[noteId]/page.tsx', 'utf8');

const search = "async function handleManualSave() {";
const renameFn = `async function handleRename() {
    if (!note) return;
    setIsEditingTitle(false);
    const newTitle = editTitle.trim() || 'Untitled Note';
    await updateNote(note.id, { title: newTitle });
    setNote({ ...note, title: newTitle });
  }

  `;
code = code.replace(search, renameFn + search);

fs.writeFileSync('src/app/notes/[noteId]/page.tsx', code);
