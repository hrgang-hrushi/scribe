const fs = require('fs');
let code = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');

// Add states for Quick Notes
code = code.replace(
  'const [year, setYear] = useState(new Date().getFullYear());',
  'const [year, setYear] = useState(new Date().getFullYear());\n  const [quickNote, setQuickNote] = useState("");'
);

// Add update logic for quick notes
code = code.replace(
  'async function loadData() {',
  `async function handleAddQuickNote(e) {
    e.preventDefault();
    if (!quickNote.trim() || !cls) return;
    const reminders = cls.reminders || [];
    reminders.push({ id: Date.now().toString(), text: quickNote, createdAt: Date.now(), date: new Date().toISOString() });
    await updateClass(cls.id, { reminders });
    setQuickNote("");
    loadData();
  }
  
  async function loadData() {`
);

// Disable future dates
// Find the day rendering loop
code = code.replace(
  'const day = i + 1;\n            const dateStr = `${year}-${String(month + 1).padStart(2, \'0\')}-${String(day).padStart(2, \'0\')}`;\n            const hasNotes = notes.some(n => n.date === dateStr);\n            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();',
  `const day = i + 1;
            const dateStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
            const hasNotes = notes.some(n => n.date === dateStr);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const todayDate = new Date();
            const isFuture = year > todayDate.getFullYear() || (year === todayDate.getFullYear() && month > todayDate.getMonth()) || (year === todayDate.getFullYear() && month === todayDate.getMonth() && day > todayDate.getDate());`
);

code = code.replace(
  'onClick={() => handleNewNote(dateStr)}',
  'onClick={() => !isFuture && handleNewNote(dateStr)}'
);

code = code.replace(
  'className={`aspect-square rounded-[24px] p-3 md:p-4 flex flex-col justify-between items-start text-left relative overflow-hidden transition-shadow ${hasNotes ? \'shadow-md\' : \'shadow-sm\'}`}',
  'className={`aspect-square rounded-[24px] p-3 md:p-4 flex flex-col justify-between items-start text-left relative overflow-hidden transition-shadow ${hasNotes ? \'shadow-md\' : \'shadow-sm\'} ${isFuture ? \'opacity-50 cursor-not-allowed\' : \'cursor-pointer\'}`}'
);

// Add Quick Note UI to Right Pane
const quickNoteUI = `
        {/* Quick Notes / Reminders */}
        <h3 className="text-xl font-bold mb-4 mt-8" style={{ color: 'var(--text-primary)' }}>Quick Notes & Reminders</h3>
        <form onSubmit={handleAddQuickNote} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Remind me to..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-shadow focus:shadow-md"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          />
          <button type="submit" className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg>
          </button>
        </form>
        <div className="flex flex-col gap-3">
          {cls?.reminders?.map(rem => (
            <div key={rem.id} className="p-4 rounded-[20px] flex items-start gap-3 shadow-sm border border-black/5 dark:border-white/5" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{rem.text}</p>
            </div>
          ))}
          {!cls?.reminders?.length && (
            <p className="text-sm italic opacity-50" style={{ color: 'var(--text-muted)' }}>No reminders yet.</p>
          )}
        </div>
`;

code = code.replace(
  '{/* Timeline of recent class notes */}',
  quickNoteUI + '\n\n        {/* Timeline of recent class notes */}'
);

fs.writeFileSync('src/app/classes/[classId]/page.tsx', code);
