const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/CanvasEditor.tsx', 'utf8');

// handlePointerMove
code = code.replace(
  `} else if (type === 'line') {\n        ctx.moveTo(start.x, start.y);\n        ctx.lineTo(pos.x, pos.y);\n        ctx.stroke();\n      }`,
  `} else if (type === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (type === 'arrow') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        const angle = Math.atan2(h, w);
        const headlen = 15;
        ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }`
);

// handlePointerUp
code = code.replace(
  `} else if (type === 'line') {\n          path = \`M \${start.x} \${start.y} L \${pos.x} \${pos.y}\`;\n        }`,
  `} else if (type === 'line') {
          path = \`M \${start.x} \${start.y} L \${pos.x} \${pos.y}\`;
        } else if (type === 'arrow') {
          const angle = Math.atan2(h, w);
          const headlen = 15;
          const x1 = pos.x - headlen * Math.cos(angle - Math.PI / 6);
          const y1 = pos.y - headlen * Math.sin(angle - Math.PI / 6);
          const x2 = pos.x - headlen * Math.cos(angle + Math.PI / 6);
          const y2 = pos.y - headlen * Math.sin(angle + Math.PI / 6);
          path = \`M \${start.x} \${start.y} L \${pos.x} \${pos.y} M \${x1} \${y1} L \${pos.x} \${pos.y} L \${x2} \${y2}\`;
        }`
);

fs.writeFileSync('src/components/canvas/CanvasEditor.tsx', code);
