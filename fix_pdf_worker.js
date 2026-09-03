const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// Replace cdnjs URL with unpkg URL
const searchUrl = /`\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/\$\{pdfjs\.version\}\/pdf\.worker\.min\.js`/g;
const replaceUrl = "`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`";

code = code.replace(searchUrl, replaceUrl);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
