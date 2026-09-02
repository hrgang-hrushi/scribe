const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Increase text contrast and border contrast
const rootOld = `:root {
  --bg-primary: #F4F4F4;
  --bg-secondary: rgba(255, 255, 255, 0.2);
  --bg-tertiary: rgba(255, 255, 255, 0.3);
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #999999;
  --accent: #1A1A1A;
  --accent-hover: #333333;
  --border: rgba(0, 0, 0, 0.08);`;

const rootNew = `:root {
  --bg-primary: #EEEEEE;
  --bg-secondary: rgba(255, 255, 255, 0.5);
  --bg-tertiary: rgba(255, 255, 255, 0.7);
  --text-primary: #000000;
  --text-secondary: #555555;
  --text-muted: #888888;
  --accent: #000000;
  --accent-hover: #222222;
  --border: rgba(0, 0, 0, 0.15);`;

const darkOld = `[data-theme="dark"] {
  --bg-primary: #141414;
  --bg-secondary: rgba(20, 20, 20, 0.3);
  --bg-tertiary: rgba(30, 30, 30, 0.4);
  --text-primary: #F4F4F4;
  --text-secondary: #AAAAAA;
  --text-muted: #777777;
  --accent: #F4F4F4;
  --accent-hover: #CCCCCC;
  --border: rgba(255, 255, 255, 0.08);`;

const darkNew = `[data-theme="dark"] {
  --bg-primary: #101010;
  --bg-secondary: rgba(35, 35, 35, 0.5);
  --bg-tertiary: rgba(50, 50, 50, 0.6);
  --text-primary: #FFFFFF;
  --text-secondary: #BBBBBB;
  --text-muted: #888888;
  --accent: #FFFFFF;
  --accent-hover: #DDDDDD;
  --border: rgba(255, 255, 255, 0.15);`;

css = css.replace(rootOld, rootNew);
css = css.replace(darkOld, darkNew);

// Increase blur and add structural contrast to glass-panel
const glassOld = `.glass-panel {
  background: var(--bg-secondary) !important;
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid var(--border);
}`;

const glassNew = `.glass-panel {
  background: var(--bg-secondary) !important;
  backdrop-filter: blur(48px) saturate(120%);
  -webkit-backdrop-filter: blur(48px) saturate(120%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
}`;

css = css.replace(glassOld, glassNew);

fs.writeFileSync('src/app/globals.css', css);
