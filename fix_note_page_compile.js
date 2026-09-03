const fs = require('fs');
let code = fs.readFileSync('src/app/notes/[noteId]/page.tsx', 'utf8');

// 1. Remove the broken handleRename from the end of the file
code = code.replace(/  const handleRename = async \(\) => \{\n    if \(!note\) return;\n    setIsEditingTitle\(false\);\n    const newTitle = editTitle.trim\(\) \|\| 'Untitled Note';\n    await updateNote\(note.id, \{ title: newTitle \}\);\n    setNote\(\{ ...note, title: newTitle \}\);\n  \};\n/g, '');

// 2. Declare the state correctly
const stateSearch = "const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');";
const stateReplace = "const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');\n  const [isEditingTitle, setIsEditingTitle] = useState(false);\n  const [editTitle, setEditTitle] = useState('');";
code = code.replace(stateSearch, stateReplace);

// 3. Add handleRename inside the component
const saveSearch = "const handleManualSave = async () => {";
const renameFn = `const handleRename = async () => {
    if (!note) return;
    setIsEditingTitle(false);
    const newTitle = editTitle.trim() || 'Untitled Note';
    await updateNote(note.id, { title: newTitle });
    setNote({ ...note, title: newTitle });
  };

  `;
code = code.replace(saveSearch, renameFn + saveSearch);

fs.writeFileSync('src/app/notes/[noteId]/page.tsx', code);
