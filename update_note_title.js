const fs = require('fs');
let code = fs.readFileSync('src/app/notes/[noteId]/page.tsx', 'utf8');

// Add state for editing title
code = code.replace(
  /const \[saveStatus, setSaveStatus\] = useState<'saved' \| 'saving' \| 'error'>\('saved'\);/,
  "const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');\n  const [isEditingTitle, setIsEditingTitle] = useState(false);\n  const [editTitle, setEditTitle] = useState('');"
);

// Populate editTitle when note loads
code = code.replace(
  /setNote\(data\);/,
  "setNote(data);\n        setEditTitle(data.title || 'Untitled');"
);

// Add rename handler
const saveFnIndex = code.indexOf('const handleManualSave = async () => {');
const renameHandler = `
  const handleRename = async () => {
    if (!note) return;
    setIsEditingTitle(false);
    const newTitle = editTitle.trim() || 'Untitled Note';
    await updateNote(note.id, { title: newTitle });
    setNote({ ...note, title: newTitle });
  };
`;
code = code.slice(0, saveFnIndex) + renameHandler + '\n' + code.slice(saveFnIndex);

// Replace title display
const titleRender = `<div className="min-w-0 flex items-center gap-1 cursor-text" onClick={() => setIsEditingTitle(true)}>
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="text-sm font-semibold bg-transparent outline-none border-b border-gray-400"
                style={{ color: 'var(--text-primary)' }}
              />
            ) : (
              <h2 className="text-sm font-semibold truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
                {note?.title || 'Untitled'}
              </h2>
            )}
            {note?.date && (
              <span className="text-sm font-semibold opacity-50" style={{ color: 'var(--text-primary)' }}>.({note.date})</span>
            )}
          </div>`;

code = code.replace(/<div className="min-w-0">\s*<h2 className="text-sm font-semibold truncate max-w-\[180px\]" style=\{\{ color: 'var\(--text-primary\)' \}\}>\s*\{note\?\.title \|\| 'Loading\.\.\.'\}\s*<\/h2>\s*<\/div>/, titleRender);

fs.writeFileSync('src/app/notes/[noteId]/page.tsx', code);
