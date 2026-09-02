const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace solid variables with glassmorphism variables
const oldRoot = `:root {
  --bg-primary: #F4F4F4;
  --bg-secondary: #EBEBEB;
  --bg-tertiary: #DCDCDC;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #999999;
  --accent: #1A1A1A;
  --accent-hover: #333333;
  --border: #DCDCDC;
  --shadow: 0 4px 12px rgba(0,0,0,0.05);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.08);
  --canvas-bg: #F4F4F4;
  --toolbar-bg: rgba(255, 255, 255, 0.15);
  --card-bg: #FFFFFF;
}`;

const newRoot = `:root {
  --bg-primary: rgba(244, 244, 244, 0.6);
  --bg-secondary: rgba(235, 235, 235, 0.6);
  --bg-tertiary: rgba(220, 220, 220, 0.6);
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #999999;
  --accent: #1A1A1A;
  --accent-hover: #333333;
  --border: rgba(0, 0, 0, 0.1);
  --shadow: 0 4px 12px rgba(0,0,0,0.05);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.08);
  --canvas-bg: rgba(244, 244, 244, 0.5);
  --toolbar-bg: rgba(255, 255, 255, 0.4);
  --card-bg: rgba(255, 255, 255, 0.6);
}`;

const oldDark = `[data-theme="dark"] {
  --bg-primary: #141414;
  --bg-secondary: #1F1F1F;
  --bg-tertiary: #2D2D2D;
  --text-primary: #F4F4F4;
  --text-secondary: #AAAAAA;
  --text-muted: #777777;
  --accent: #F4F4F4;
  --accent-hover: #CCCCCC;
  --border: #2D2D2D;
  --shadow: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
  --canvas-bg: #141414;
  --toolbar-bg: rgba(0, 0, 0, 0.25);
  --card-bg: #1F1F1F;
}`;

const newDark = `[data-theme="dark"] {
  --bg-primary: rgba(20, 20, 20, 0.6);
  --bg-secondary: rgba(31, 31, 31, 0.6);
  --bg-tertiary: rgba(45, 45, 45, 0.6);
  --text-primary: #F4F4F4;
  --text-secondary: #AAAAAA;
  --text-muted: #777777;
  --accent: #F4F4F4;
  --accent-hover: #CCCCCC;
  --border: rgba(255, 255, 255, 0.1);
  --shadow: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
  --canvas-bg: rgba(20, 20, 20, 0.5);
  --toolbar-bg: rgba(0, 0, 0, 0.4);
  --card-bg: rgba(31, 31, 31, 0.6);
}`;

css = css.replace(oldRoot, newRoot);
css = css.replace(oldDark, newDark);

// Add global glass class and background mesh
const globalStyles = `
html, body {
  overscroll-behavior: none;
  overflow: hidden;
  height: 100%;
  height: 100dvh;
  background-color: var(--bg-primary);
  background-image: 
    radial-gradient(at 0% 0%, rgba(200, 200, 200, 0.2) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(150, 150, 150, 0.15) 0px, transparent 50%);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: var(--font-aileron), 'Manrope', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

[data-theme="dark"] body {
  background-image: 
    radial-gradient(at 0% 0%, rgba(50, 50, 50, 0.3) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(30, 30, 30, 0.4) 0px, transparent 50%);
}

.glass-panel {
  background: var(--bg-secondary) !important;
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid var(--border);
}
`;

css = css.replace(/html, body \{[\s\S]*?-moz-osx-font-smoothing: grayscale;\n\}/, globalStyles);

fs.writeFileSync('src/app/globals.css', css);
