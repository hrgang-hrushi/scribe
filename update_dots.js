const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');

// Add state
code = code.replace(
  'const [expanded, setExpanded] = useState(true);',
  'const [expanded, setExpanded] = useState(true);\n  const [showMoreMenu, setShowMoreMenu] = useState(false);'
);

// Add 3-dots button
const dotsButton = `
        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: showMoreMenu ? 'var(--accent)' : 'transparent',
              color: showMoreMenu ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
            title="More Options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          
          {showMoreMenu && (
            <div className="absolute bottom-full mb-3 right-0 w-48 flex flex-col p-2 rounded-2xl shadow-xl border animate-slide-up bg-white dark:bg-gray-800 z-50">
              <button className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Export as PDF</button>
              <button className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Export as PNG</button>
              <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button className="text-left px-3 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Clear Canvas</button>
            </div>
          )}
        </div>
`;

code = code.replace('</button>\n      </div>\n    </motion.div>', '</button>\n' + dotsButton + '\n      </div>\n    </motion.div>');

fs.writeFileSync('src/components/canvas/Toolbar.tsx', code);
