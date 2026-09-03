const fs = require('fs');
let code = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');

code = code.replace(
  /<h4 className="text-lg font-bold truncate" style=\{\{ color: 'var\(--text-primary\)' \}\}>\{note\.title \|\| 'Untitled Note'\}<\/h4>/,
  '<h4 className="text-lg font-bold truncate" style={{ color: \'var(--text-primary)\' }}>{note.title || \'Untitled Note\'}<span className="opacity-50 text-sm ml-1">.({note.date})</span></h4>'
);

fs.writeFileSync('src/app/classes/[classId]/page.tsx', code);
