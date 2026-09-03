const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// 1. Add handlers before handleDeleteTextBox
const handlerSearch = 'function handleDeleteTextBox(id: string) {';
const dragHandlers = `const handleOverlayPointerDown = (e: React.PointerEvent, id: string, type: 'text' | 'image', initialX: number, initialY: number) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragDataRef.current = { id, type, startX: e.clientX, startY: e.clientY, initialX, initialY };
    if (type === 'text') {
      setEditingTextBox(id);
      setEditingImage(null);
    } else {
      setEditingImage(id);
      setEditingTextBox(null);
    }
  };
  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!dragDataRef.current) return;
    e.stopPropagation();
    const dx = (e.clientX - dragDataRef.current.startX) / zoomRef.current;
    const dy = (e.clientY - dragDataRef.current.startY) / zoomRef.current;
    const newX = dragDataRef.current.initialX + dx;
    const newY = dragDataRef.current.initialY + dy;
    
    if (dragDataRef.current.type === 'text') {
      const updated = textBoxes.map(t => t.id === dragDataRef.current.id ? { ...t, x: newX, y: newY } : t);
      setTextBoxes(updated);
      committedTextBoxes.current = updated;
    } else {
      const updated = images.map(i => i.id === dragDataRef.current.id ? { ...i, x: newX, y: newY } : i);
      setImages(updated);
      committedImages.current = updated;
    }
  };
  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (!dragDataRef.current) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragDataRef.current = null;
    triggerSave();
  };

  `;
code = code.replace(handlerSearch, dragHandlers + handlerSearch);


// 2. Replace the TextBox overlays and add Image overlays
// Let's use a very reliable replacement: split the string!
const overlayToken = '{/* Text boxes overlay */}';
const parts = code.split(overlayToken);
if (parts.length === 2) {
  // We keep the first part up to the overlayToken, and append our new overlays
  
  const closingToken = 'CanvasEditor.displayName =';
  const endParts = parts[1].split(closingToken);
  
  const newOverlays = `{/* Image overlays */}
      {images.map(img => (
        <div
          key={img.id}
          className="absolute group"
          onPointerDown={(e) => handleOverlayPointerDown(e, img.id, 'image', img.x, img.y)}
          onPointerMove={handleOverlayPointerMove}
          onPointerUp={handleOverlayPointerUp}
          onPointerCancel={handleOverlayPointerUp}
          style={{
            left: img.x,
            top: img.y,
            width: img.width,
            height: img.height,
            transform: \`scale(\${zoomRef.current})\`,
            transformOrigin: 'top left',
            pointerEvents: (tool === 'image' || editingImage === img.id) ? 'auto' : 'none',
            zIndex: 10,
          }}
        >
          <img 
            src={img.src} 
            alt="Imported" 
            draggable={false}
            className="w-full h-full object-contain pointer-events-none" 
            style={{ pointerEvents: 'none' }}
          />
          {(editingImage === img.id || tool === 'image') && (
            <div className="absolute inset-0 border-2 border-[var(--accent)] border-dashed pointer-events-none" />
          )}
          {editingImage === img.id && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => handleDeleteImage(img.id)}
              className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center shadow-md hover:bg-red-600 transition-colors pointer-events-auto z-20"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* Text boxes overlay */}
      {textBoxes.map(tb => (
        <div
          key={tb.id}
          className="absolute"
          onPointerDown={(e) => handleOverlayPointerDown(e, tb.id, 'text', tb.x, tb.y)}
          onPointerMove={handleOverlayPointerMove}
          onPointerUp={handleOverlayPointerUp}
          onPointerCancel={handleOverlayPointerUp}
          style={{
            left: tb.x,
            top: tb.y,
            minWidth: 100,
            minHeight: 30,
            transform: \`scale(\${zoomRef.current})\`,
            transformOrigin: 'top left',
            zIndex: 20,
          }}
        >
          {editingTextBox === tb.id ? (
            <div className="relative">
              <textarea
                autoFocus
                value={tb.text}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={e => handleTextBoxChange(tb.id, e.target.value)}
                onBlur={handleTextBoxBlur}
                className="w-full min-h-[40px] bg-transparent border rounded-lg p-2 text-sm resize-both outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{
                  fontSize: tb.fontSize,
                  fontFamily: tb.fontFamily,
                  fontWeight: tb.bold ? 'bold' : 'normal',
                  fontStyle: tb.italic ? 'italic' : 'normal',
                  textDecoration: tb.underline ? 'underline' : 'none',
                  color: theme === 'dark' ? '#e8e8ed' : '#1a1a2e',
                  borderColor: 'var(--accent)',
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') handleTextBoxBlur();
                  if (e.key === 'Delete' && e.metaKey) handleDeleteTextBox(tb.id);
                }}
              />
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleDeleteTextBox(tb.id)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center pointer-events-auto z-20"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              className="cursor-move bg-transparent rounded p-1 min-h-[24px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors pointer-events-none"
              style={{
                fontSize: tb.fontSize,
                fontFamily: tb.fontFamily,
                fontWeight: tb.bold ? 'bold' : 'normal',
                fontStyle: tb.italic ? 'italic' : 'normal',
                textDecoration: tb.underline ? 'underline' : 'none',
                color: theme === 'dark' ? '#e8e8ed' : '#1a1a2e',
              }}
            >
              {tb.text || <span className="opacity-40">Type here...</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

CanvasEditor.displayName =`;

  code = parts[0] + newOverlays + endParts[1];
}

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
