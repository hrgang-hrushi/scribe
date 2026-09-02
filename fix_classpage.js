const fs = require('fs');
let code = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');

// Fix imports
code = code.replace(
  "import { getNotesForClass, createNote, deleteNote, updateNote, getAllClasses } from '@/lib/db';",
  "import { getNotesForClass, createNote, deleteNote, updateNote, getAllClasses, updateClass } from '@/lib/db';"
);

// Add quickNote state
code = code.replace(
  'const [currentDate, setCurrentDate] = useState(new Date());',
  'const [currentDate, setCurrentDate] = useState(new Date());\n  const [quickNote, setQuickNote] = useState("");'
);

// Fix event typing
code = code.replace(
  'async function handleAddQuickNote(e) {',
  'async function handleAddQuickNote(e: React.FormEvent) {'
);

// Fix isFuture
code = code.replace(
  'const isToday = dateStr === todayStr;',
  `const isToday = dateStr === todayStr;
            const todayDate = new Date();
            const isFuture = year > todayDate.getFullYear() || (year === todayDate.getFullYear() && month > todayDate.getMonth()) || (year === todayDate.getFullYear() && month === todayDate.getMonth() && day > todayDate.getDate());`
);

fs.writeFileSync('src/app/classes/[classId]/page.tsx', code);
