const fs = require('fs');

const css = `@import "tailwindcss";

:root {
  --bg-primary: #F4F4F4;
  --bg-secondary: rgba(255, 255, 255, 0.2);
  --bg-tertiary: rgba(255, 255, 255, 0.3);
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #999999;
  --accent: #1A1A1A;
  --accent-hover: #333333;
  --border: rgba(0, 0, 0, 0.08);
  --shadow: 0 4px 12px rgba(0,0,0,0.05);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.08);
  --canvas-bg: #F4F4F4;
  --toolbar-bg: rgba(255, 255, 255, 0.2);
  --card-bg: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] {
  --bg-primary: #141414;
  --bg-secondary: rgba(20, 20, 20, 0.3);
  --bg-tertiary: rgba(30, 30, 30, 0.4);
  --text-primary: #F4F4F4;
  --text-secondary: #AAAAAA;
  --text-muted: #777777;
  --accent: #F4F4F4;
  --accent-hover: #CCCCCC;
  --border: rgba(255, 255, 255, 0.08);
  --shadow: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
  --canvas-bg: #141414;
  --toolbar-bg: rgba(20, 20, 20, 0.3);
  --card-bg: rgba(20, 20, 20, 0.3);
}

* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

html, body {
  overscroll-behavior: none;
  overflow: hidden;
  height: 100%;
  height: 100dvh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-aileron), 'Manrope', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.glass-panel {
  background: var(--bg-secondary) !important;
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid var(--border);
}

#__next, #root {
  height: 100%;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.gradient-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gradient-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.gradient-card:hover {
  transform: translateY(-2px) scale(1.02);
}

.gradient-card:active {
  transform: scale(0.98);
}

.toolbar-pill {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-pill.collapsed {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.toolbar-pill.expanded {
  width: auto;
  height: auto;
  border-radius: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.sticky-date-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@keyframes pulse-save {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.save-pulse {
  animation: pulse-save 1.5s ease-in-out infinite;
}

.safe-bottom {
  padding-bottom: max(env(safe-area-inset-bottom), 20px);
}

.safe-top {
  padding-top: max(env(safe-area-inset-top), 12px);
}
`;

fs.writeFileSync('src/app/globals.css', css);
