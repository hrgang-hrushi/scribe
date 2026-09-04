import { NoteTemplate, PaperColorTheme } from './types';

export interface TemplateMeta {
  id: NoteTemplate;
  name: string;
  category: 'general' | 'medicine' | 'engineering' | 'computer_science' | 'founder';
  categoryLabel: string;
  description: string;
  badge?: string;
}

export const TEMPLATE_METADATA: TemplateMeta[] = [
  // General
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'general',
    categoryLabel: 'General',
    description: 'Clean unlined paper for freeform drawing and mind mapping',
  },
  {
    id: 'ruled',
    name: 'College Ruled',
    category: 'general',
    categoryLabel: 'General',
    description: 'Standard horizontal ruled lines for lecture notes and essays',
  },
  {
    id: 'grid',
    name: 'Square Grid',
    category: 'general',
    categoryLabel: 'General',
    description: '5mm grid for math, diagrams, sketches, and charts',
  },
  {
    id: 'dotted',
    name: 'Bullet Dotted',
    category: 'general',
    categoryLabel: 'General',
    description: 'Subtle dot matrix for flexible bullet journaling and sketching',
  },
  {
    id: 'cornell',
    name: 'Cornell Notes',
    category: 'general',
    categoryLabel: 'General',
    description: 'Classic Cornell cue column, notes body, and summary footer',
  },

  // Medicine & Health Sciences
  {
    id: 'med_soap',
    name: 'Clinical SOAP Note',
    category: 'medicine',
    categoryLabel: 'Medicine',
    description: 'Subjective, Objective, Assessment, and Plan with patient vitals bar',
    badge: 'Clinical',
  },
  {
    id: 'med_organ',
    name: 'Anatomy & Systems',
    category: 'medicine',
    categoryLabel: 'Medicine',
    description: 'Anatomical sketch zone on the left with pathology notes on the right',
    badge: 'Anatomy',
  },

  // Engineering & Physical Sciences
  {
    id: 'engineering_quad',
    name: 'Engineering Quad Pad',
    category: 'engineering',
    categoryLabel: 'Engineering',
    description: '5x5 computation grid with professional title block and calculation margins',
    badge: 'STEM',
  },
  {
    id: 'circuit_logic',
    name: 'Circuit & Logic Sheet',
    category: 'engineering',
    categoryLabel: 'Engineering',
    description: 'Schematic breadboard grid with timing diagram lanes and pinout table',
    badge: 'Circuits',
  },

  // Computer Science & Software
  {
    id: 'cs_code',
    name: 'Algorithm & Big-O Trace',
    category: 'computer_science',
    categoryLabel: 'Computer Science',
    description: 'Syntax-guided code gutter, Memory Stack/Heap table, and Big-O analysis box',
    badge: 'LeetCode',
  },
  {
    id: 'cs_system',
    name: 'System Design Canvas',
    category: 'computer_science',
    categoryLabel: 'Computer Science',
    description: 'Edge/CDN, Microservices, DB/Cache tiers with SLA and latency trade-offs',
    badge: 'SysDesign',
  },

  // Founders & Product Leaders
  {
    id: 'founder_pitch',
    name: '9-Box Lean Canvas',
    category: 'founder',
    categoryLabel: 'Founders',
    description: 'Problem, Solution, UVP, Unfair Advantage, Channels, Metrics, Revenue/Cost',
    badge: 'Startup',
  },
  {
    id: 'founder_wireframe',
    name: 'Wireframe & User Flow Spec',
    category: 'founder',
    categoryLabel: 'Founders',
    description: 'Mobile device mockup frame, user story bullets, and acceptance checklist',
    badge: 'Product',
  },
];

function safeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Renders any discipline or general template onto a target 2D canvas context.
 */
export function drawTemplateBackground(
  ctx: CanvasRenderingContext2D,
  template: NoteTemplate,
  width: number,
  height: number,
  theme: PaperColorTheme
) {
  if (template === 'blank') return;

  ctx.save();
  ctx.strokeStyle = theme.lineColor;
  ctx.fillStyle = theme.dotColor;
  ctx.lineWidth = 1;

  const step = 34;

  // 1. Classic General Templates
  if (template === 'ruled') {
    ctx.beginPath();
    for (let y = 60; y < height - 40; y += step) {
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
    }
    ctx.stroke();
  } else if (template === 'cornell') {
    ctx.beginPath();
    for (let y = 60; y < height - 120; y += step) {
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
    }
    // Vertical Cue Column
    ctx.moveTo(220, 60);
    ctx.lineTo(220, height - 120);
    // Horizontal Summary Border
    ctx.moveTo(40, height - 120);
    ctx.lineTo(width - 40, height - 120);
    ctx.stroke();

    // Subtle Section Labels
    ctx.font = 'bold 9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.65)');
    ctx.fillText('CUES & KEY QUESTIONS', 46, 52);
    ctx.fillText('LECTURE NOTES & DERIVATIONS', 230, 52);
    ctx.fillText('SUMMARY & CORE TAKEAWAYS', 46, height - 105);
  } else if (template === 'grid') {
    ctx.beginPath();
    for (let y = 40; y < height - 40; y += step) {
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
    }
    for (let x = 40; x < width - 40; x += step) {
      ctx.moveTo(x, 40);
      ctx.lineTo(x, height - 40);
    }
    ctx.stroke();
  } else if (template === 'dotted') {
    ctx.beginPath();
    for (let y = 40; y < height - 40; y += step) {
      for (let x = 40; x < width - 40; x += step) {
        ctx.moveTo(x, y);
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  // 2. Medicine: Clinical SOAP Note
  else if (template === 'med_soap') {
    const margin = 40;
    const headerHeight = 70;
    const splitX = width / 2;
    const splitY = (height - headerHeight - margin * 2) / 2 + margin + headerHeight;

    // Outer Patient Vitals Bar
    ctx.beginPath();
    ctx.strokeRect(margin, margin, width - margin * 2, headerHeight);
    // Divider line between Vitals and Quadrants
    ctx.moveTo(margin, margin + headerHeight);
    ctx.lineTo(width - margin, margin + headerHeight);
    // Vertical Split between S/O and A/P
    ctx.moveTo(splitX, margin + headerHeight);
    ctx.lineTo(splitX, height - margin);
    // Horizontal Split between S/A and O/P
    ctx.moveTo(margin, splitY);
    ctx.lineTo(width - margin, splitY);
    // Outer border
    ctx.strokeRect(margin, margin + headerHeight, width - margin * 2, height - headerHeight - margin * 2);
    ctx.stroke();

    // Quadrant Light Ruled Lines
    ctx.save();
    ctx.strokeStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.08)');
    ctx.beginPath();
    for (let y = margin + headerHeight + 35; y < splitY - 10; y += 26) {
      ctx.moveTo(margin + 15, y); ctx.lineTo(splitX - 15, y);
      ctx.moveTo(splitX + 15, y); ctx.lineTo(width - margin - 15, y);
    }
    for (let y = splitY + 35; y < height - margin - 10; y += 26) {
      ctx.moveTo(margin + 15, y); ctx.lineTo(splitX - 15, y);
      ctx.moveTo(splitX + 15, y); ctx.lineTo(width - margin - 15, y);
    }
    ctx.stroke();
    ctx.restore();

    // Typography & Prompt Guides
    ctx.font = 'bold 10px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.75)');
    ctx.fillText('PATIENT VITALS:   BP: ___ / ___   |   HR: ___ bpm   |   RR: ___ /min   |   SpO2: ___ %   |   Temp: ___ °C', margin + 15, margin + 40);

    ctx.fillText('S — SUBJECTIVE (HPI, ROS, Chief Complaint)', margin + 15, margin + headerHeight + 22);
    ctx.fillText('O — OBJECTIVE (Physical Exam, Labs, Vitals)', splitX + 15, margin + headerHeight + 22);
    ctx.fillText('A — ASSESSMENT (Differential Diagnoses, Status)', margin + 15, splitY + 22);
    ctx.fillText('P — PLAN (Therapeutics, Rx, Follow-up, Consults)', splitX + 15, splitY + 22);
  }

  // 3. Medicine: Anatomy & Systems
  else if (template === 'med_organ') {
    const margin = 40;
    const splitX = 380;

    ctx.beginPath();
    // Vertical partition
    ctx.moveTo(splitX, margin);
    ctx.lineTo(splitX, height - margin);
    // Outer bounding frame for anatomical sketch
    ctx.strokeRect(margin, margin, splitX - margin, height - margin * 2);
    ctx.stroke();

    // Sketch Alignment Reticle in Left Pane
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.18)');
    ctx.beginPath();
    ctx.moveTo((margin + splitX) / 2, margin + 40);
    ctx.lineTo((margin + splitX) / 2, height - margin - 40);
    ctx.moveTo(margin + 40, height / 2);
    ctx.lineTo(splitX - 40, height / 2);
    ctx.stroke();
    ctx.restore();

    // Ruled lines on right pane for clinical pathology
    ctx.beginPath();
    for (let y = margin + 40; y < height - margin; y += 28) {
      ctx.moveTo(splitX + 20, y);
      ctx.lineTo(width - margin, y);
    }
    ctx.stroke();

    // Section Labels
    ctx.font = 'bold 10px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.75)');
    ctx.fillText('ANATOMICAL & SYSTEM SKETCH (Crosshairs Guide)', margin + 16, margin - 12);
    ctx.fillText('PATHOLOGY, CLINICAL CORRELATIONS & FINDINGS', splitX + 20, margin - 12);
  }

  // 4. Engineering: Engineering Quad Pad with Professional Title Block
  else if (template === 'engineering_quad') {
    const margin = 40;
    const titleBlockH = 65;
    const quadStep = 20;

    // Title Block at top
    ctx.beginPath();
    ctx.strokeRect(margin, margin, width - margin * 2, titleBlockH);
    ctx.moveTo(width * 0.45, margin); ctx.lineTo(width * 0.45, margin + titleBlockH);
    ctx.moveTo(width * 0.72, margin); ctx.lineTo(width * 0.72, margin + titleBlockH);
    ctx.moveTo(width * 0.45, margin + titleBlockH / 2); ctx.lineTo(width - margin, margin + titleBlockH / 2);
    ctx.stroke();

    // Title Block Labels
    ctx.font = 'bold 9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.65)');
    ctx.fillText('PROJECT / SYSTEM:', margin + 12, margin + 22);
    ctx.fillText('DATE:', width * 0.45 + 10, margin + 22);
    ctx.fillText('SHEET NO:', width * 0.72 + 10, margin + 22);
    ctx.fillText('CALC BY:', width * 0.45 + 10, margin + 52);
    ctx.fillText('CHECKED BY:', width * 0.72 + 10, margin + 52);

    // Fine 5x5 Sub-Grid
    ctx.save();
    const gridTop = margin + titleBlockH + 15;
    const gridBottom = height - margin;
    const gridLeft = margin;
    const gridRight = width - margin;

    ctx.strokeStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.08)');
    ctx.beginPath();
    let col = 0;
    for (let x = gridLeft; x <= gridRight; x += quadStep) {
      if (col % 5 !== 0) {
        ctx.moveTo(x, gridTop);
        ctx.lineTo(x, gridBottom);
      }
      col++;
    }
    let row = 0;
    for (let y = gridTop; y <= gridBottom; y += quadStep) {
      if (row % 5 !== 0) {
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridRight, y);
      }
      row++;
    }
    ctx.stroke();

    // Major 5x5 Grid Lines
    ctx.strokeStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.24)');
    ctx.beginPath();
    for (let x = gridLeft; x <= gridRight; x += quadStep * 5) {
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridBottom);
    }
    for (let y = gridTop; y <= gridBottom; y += quadStep * 5) {
      ctx.moveTo(gridLeft, y);
      ctx.lineTo(gridRight, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 5. Engineering: Circuit & Logic Sheet
  else if (template === 'circuit_logic') {
    const margin = 40;
    const timingTop = height - 240;

    // Breadboard / Schematic Dot Matrix (Top 70%)
    ctx.beginPath();
    const dotSpacing = 24;
    for (let y = margin + 30; y < timingTop - 20; y += dotSpacing) {
      for (let x = margin + 20; x < width - margin - 20; x += dotSpacing) {
        ctx.moveTo(x, y);
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // Partition between Schematic and Timing Lanes
    ctx.beginPath();
    ctx.moveTo(margin, timingTop);
    ctx.lineTo(width - margin, timingTop);
    ctx.stroke();

    // Timing Diagram Waveform Lanes
    const laneH = 45;
    for (let i = 0; i < 4; i++) {
      const laneY = timingTop + 30 + i * laneH;
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.15)');
      ctx.beginPath();
      ctx.moveTo(margin + 80, laneY);
      ctx.lineTo(width - margin, laneY);
      ctx.stroke();
      ctx.restore();

      ctx.font = 'bold 9px var(--font-aileron), Manrope, sans-serif';
      ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.7)');
      const label = i === 0 ? 'CLK (Clock)' : i === 1 ? 'SIG_A (In)' : i === 2 ? 'SIG_B (In)' : 'OUT / Q';
      ctx.fillText(label, margin + 10, laneY + 4);
    }

    ctx.font = 'bold 10px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.75)');
    ctx.fillText('SCHEMATIC & COMPONENT WIRING (Breadboard Dot Grid)', margin + 10, margin + 14);
    ctx.fillText('DIGITAL TIMING DIAGRAM LANES', margin + 10, timingTop - 10);
  }

  // 6. Computer Science: Algorithm & Big-O Trace
  else if (template === 'cs_code') {
    const margin = 40;
    const splitX = width * 0.58;
    const bigOTop = height - 200;

    // Vertical Partition between Code & Memory Trace
    ctx.beginPath();
    ctx.moveTo(splitX, margin);
    ctx.lineTo(splitX, height - margin);

    // Code Line-Number Gutter
    ctx.moveTo(margin + 36, margin);
    ctx.lineTo(margin + 36, height - margin);

    // Big-O Box Partition on bottom right
    ctx.moveTo(splitX, bigOTop);
    ctx.lineTo(width - margin, bigOTop);
    ctx.stroke();

    // Code indentation guides
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.12)');
    ctx.beginPath();
    for (let indent = margin + 36 + 40; indent < splitX - 20; indent += 40) {
      ctx.moveTo(indent, margin + 25);
      ctx.lineTo(indent, height - margin);
    }
    ctx.stroke();
    ctx.restore();

    // Code Line numbers in Gutter
    ctx.font = '9px var(--font-mono), monospace';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.4)');
    let lineNum = 1;
    for (let y = margin + 30; y < height - margin - 10; y += 26) {
      const numStr = lineNum < 10 ? `0${lineNum}` : `${lineNum}`;
      ctx.fillText(numStr, margin + 10, y);
      lineNum++;
    }

    // Memory Table Headers
    ctx.font = 'bold 9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.75)');
    ctx.fillText('MEMORY TRACE (STACK & HEAP)', splitX + 16, margin + 18);
    ctx.fillText('VARIABLE', splitX + 16, margin + 40);
    ctx.fillText('ADDRESS', splitX + 110, margin + 40);
    ctx.fillText('VALUE', splitX + 210, margin + 40);

    // Big-O Analysis Summary Box
    ctx.fillText('COMPLEXITY & EDGE CASES ANALYSIS', splitX + 16, bigOTop + 24);
    ctx.font = '10px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.65)');
    ctx.fillText('Time Complexity:   O(                          )', splitX + 16, bigOTop + 55);
    ctx.fillText('Space Complexity:  O(                          )', splitX + 16, bigOTop + 85);
    ctx.fillText('Base / Edge Cases: [  ] null/empty   [  ] single item   [  ] cycles', splitX + 16, bigOTop + 120);
  }

  // 7. Computer Science: System Design Canvas
  else if (template === 'cs_system') {
    const margin = 40;
    const tierH = (height - margin * 2 - 90) / 4;

    const tiers = [
      { name: '1. CLIENT & EDGE TIER (Mobile, Web, CDN, DNS, Reverse Proxy)', y: margin },
      { name: '2. GATEWAY & LOAD BALANCING (API Gateway, Rate Limiter, Auth)', y: margin + tierH },
      { name: '3. MICROSERVICES & ASYNC QUEUES (Business Logic, Workers, Kafka)', y: margin + tierH * 2 },
      { name: '4. DATA & STORAGE LAYER (Primary DB, Read Replicas, Redis Cache, S3)', y: margin + tierH * 3 },
    ];

    ctx.beginPath();
    tiers.forEach(tier => {
      ctx.strokeRect(margin, tier.y, width - margin * 2, tierH);
    });
    ctx.stroke();

    // Tier Labels
    ctx.font = 'bold 9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.75)');
    tiers.forEach(tier => {
      ctx.fillText(tier.name, margin + 14, tier.y + 20);
    });

    // Bottom SLA Bar
    const slaY = height - margin - 75;
    ctx.strokeRect(margin, slaY, width - margin * 2, 60);
    ctx.fillText('SYSTEM REQUIREMENTS & CONSTRAINTS', margin + 14, slaY + 20);
    ctx.font = '9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.65)');
    ctx.fillText('Peak QPS / Throughput: _________  |  Latency SLA: p99 < ____ms  |  CAP Theorem: [ ] CP  [ ] AP', margin + 14, slaY + 44);
  }

  // 8. Founders: 9-Box Lean Canvas
  else if (template === 'founder_pitch') {
    const margin = 40;
    const bodyH = height - margin * 2 - 140;
    const colW = (width - margin * 2) / 5;
    const rowH = bodyH / 2;

    ctx.beginPath();
    // 5 Main Columns
    for (let c = 0; c <= 5; c++) {
      ctx.moveTo(margin + c * colW, margin);
      ctx.lineTo(margin + c * colW, margin + bodyH);
    }
    // Horizontal Sub-Dividers
    ctx.moveTo(margin, margin); ctx.lineTo(width - margin, margin);
    ctx.moveTo(margin, margin + bodyH); ctx.lineTo(width - margin, margin + bodyH);

    // Half splits for Col 1 (Solution), Col 3 (Channels), Col 5 (Early Adopters)
    ctx.moveTo(margin + colW, margin + rowH); ctx.lineTo(margin + colW * 2, margin + rowH);
    ctx.moveTo(margin + colW * 3, margin + rowH); ctx.lineTo(margin + colW * 4, margin + rowH);

    // Bottom Two Boxes: Cost Structure & Revenue Streams
    const bottomY = margin + bodyH;
    const bottomH = 120;
    ctx.strokeRect(margin, bottomY, width - margin * 2, bottomH);
    ctx.moveTo(width / 2, bottomY); ctx.lineTo(width / 2, bottomY + bottomH);
    ctx.stroke();

    // Box Headings
    ctx.font = 'bold 9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.75)');

    ctx.fillText('1. PROBLEM', margin + 8, margin + 20);
    ctx.fillText('4. SOLUTION', margin + colW + 8, margin + 20);
    ctx.fillText('8. KEY METRICS', margin + colW + 8, margin + rowH + 20);
    ctx.fillText('3. UNIQUE VALUE PROP', margin + colW * 2 + 8, margin + 20);
    ctx.fillText('9. UNFAIR ADVANTAGE', margin + colW * 3 + 8, margin + 20);
    ctx.fillText('5. CHANNELS', margin + colW * 3 + 8, margin + rowH + 20);
    ctx.fillText('2. CUSTOMER SEGMENTS', margin + colW * 4 + 8, margin + 20);

    ctx.fillText('7. COST STRUCTURE (Hosting, CAC, Operations)', margin + 14, bottomY + 22);
    ctx.fillText('6. REVENUE STREAMS (Pricing Model, LTV, MRR)', width / 2 + 14, bottomY + 22);
  }

  // 9. Founders: Mobile/Web Wireframe Spec Sheet
  else if (template === 'founder_wireframe') {
    const margin = 40;
    const frameW = 260;
    const frameH = 540;
    const frameX = margin + 30;
    const frameY = margin + 50;

    // Mobile Phone Outline
    ctx.beginPath();
    safeRoundRect(ctx, frameX, frameY, frameW, frameH, 28);
    ctx.stroke();

    // Speaker notch & home indicator
    ctx.beginPath();
    safeRoundRect(ctx, frameX + frameW / 2 - 35, frameY + 12, 70, 8, 4);
    safeRoundRect(ctx, frameX + frameW / 2 - 45, frameY + frameH - 16, 90, 4, 2);
    ctx.stroke();

    // Internal Dot Grid inside Phone Screen
    ctx.save();
    ctx.beginPath();
    for (let y = frameY + 45; y < frameY + frameH - 35; y += 22) {
      for (let x = frameX + 20; x < frameX + frameW - 20; x += 22) {
        ctx.moveTo(x, y);
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.restore();

    // Right Side: User Story & Acceptance Criteria
    const rightX = frameX + frameW + 45;
    ctx.beginPath();
    ctx.moveTo(rightX, margin + 30);
    ctx.lineTo(rightX, height - margin);
    ctx.stroke();

    ctx.font = 'bold 10px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.8)');
    ctx.fillText('MOBILE VIEWPORT PROTOTYPE', frameX + 20, margin + 30);
    ctx.fillText('FEATURE SPEC & USER STORIES', rightX + 20, margin + 30);

    ctx.font = '9px var(--font-aileron), Manrope, sans-serif';
    ctx.fillStyle = theme.lineColor.replace(/[\d.]+\)$/, '0.65)');
    ctx.fillText('User Story: "As a ______________________________________,"', rightX + 20, margin + 70);
    ctx.fillText('           "I want to __________________________________,"', rightX + 20, margin + 95);
    ctx.fillText('           "So that ___________________________________."', rightX + 20, margin + 120);

    ctx.fillText('ACCEPTANCE CRITERIA:', rightX + 20, margin + 170);
    for (let i = 0; i < 5; i++) {
      const lineY = margin + 205 + i * 32;
      ctx.strokeRect(rightX + 20, lineY - 10, 12, 12);
      ctx.fillText('_________________________________________________', rightX + 42, lineY);
    }
  }

  ctx.restore();
}
