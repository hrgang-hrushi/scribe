const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/Toolbar.tsx', 'utf8');

// 1. Add onAction prop
code = code.replace(
  'onRedo: () => void;\n}',
  "onRedo: () => void;\n  onAction?: (action: 'export-pdf' | 'export-png' | 'import' | 'clear') => void;\n}"
);

code = code.replace(
  'showColorPicker, onToggleColorPicker, visible, onToggle, onUndo, onRedo,\n}: ToolbarProps',
  'showColorPicker, onToggleColorPicker, visible, onToggle, onUndo, onRedo, onAction,\n}: ToolbarProps'
);

// 2. Add state for export submenu
const stateSearch = "const [showMoreMenu, setShowMoreMenu] = useState(false);";
const stateReplace = "const [showMoreMenu, setShowMoreMenu] = useState(false);\n  const [showExportMenu, setShowExportMenu] = useState(false);";
code = code.replace(stateSearch, stateReplace);

// 3. Update the More Menu UI
// Replace the old more menu dropdown with the new one
const menuSearch = /\{showMoreMenu && \([\s\S]*?<\/div>\s*\)\}/;
const menuReplace = `{showMoreMenu && (
            <div className="absolute bottom-full mb-3 right-0 w-48 flex flex-col p-2 rounded-2xl shadow-xl border animate-slide-up glass-panel z-50">
              <button 
                onClick={() => { setShowMoreMenu(false); onAction?.('import'); }}
                className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
              >
                Import
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(v => !v)}
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
                >
                  Export
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-0 right-full mr-2 w-32 flex flex-col p-2 rounded-2xl shadow-xl border animate-slide-up glass-panel z-50">
                    <button 
                      onClick={() => { setShowMoreMenu(false); setShowExportMenu(false); onAction?.('export-pdf'); }}
                      className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      As PDF
                    </button>
                    <button 
                      onClick={() => { setShowMoreMenu(false); setShowExportMenu(false); onAction?.('export-png'); }}
                      className="text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      As PNG
                    </button>
                  </div>
                )}
              </div>
              
              <div className="w-full h-px bg-black/10 dark:bg-white/10 my-1" />
              <button 
                onClick={() => { setShowMoreMenu(false); onAction?.('clear'); }}
                className="text-left px-3 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                Clear Canvas
              </button>
            </div>
          )}`;
code = code.replace(menuSearch, menuReplace);

// We should also remove 'image' from the main tools array so it's not redundant, but maybe they want it there too. Let's keep it or remove it?
// They said "let's do export and import button under the 3 dots". Removing 'image' from tools cleans up the toolbar.
// Let's remove the image tool from the tools array.
code = code.replace(/.*\{ id: 'image', icon: 'M4 16l4\.586-4\.586.*label: 'Image', shortcut: 'I' \},\n/, '');

fs.writeFileSync('src/components/canvas/Toolbar.tsx', code);
