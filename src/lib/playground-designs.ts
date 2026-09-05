import type { PlaygroundDesign, ColorPalette } from './playground-types';

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'silicone-pop',
    name: 'Silicone Pop',
    psychologicalEffect: 'Playful stimulation, sensory focus, and tactile joy (Reference Match)',
    colors: ['#F97316', '#06B6D4', '#FDE047', '#FFFFFF', '#14B8A6', '#A855F7'],
  },
  {
    id: 'matcha-zen',
    name: 'Matcha & Moss',
    psychologicalEffect: 'Vagus nerve calming, lowers blood pressure, grounding biophilic tones',
    colors: ['#84A98C', '#52796F', '#354F52', '#CAD2C5', '#E9D8A6', '#D4A373'],
  },
  {
    id: 'sunset-glow',
    name: 'Warm Sunset',
    psychologicalEffect: 'Serotonin boost, cozy comfort, relieves academic fatigue',
    colors: ['#FB7185', '#FB923C', '#FBBF24', '#F472B6', '#C084FC', '#FDA4AF'],
  },
  {
    id: 'ocean-abyss',
    name: 'Deep Ocean',
    psychologicalEffect: 'Heart rate deceleration, mental clarity, cooling tension release',
    colors: ['#38BDF8', '#0284C7', '#0EA5E9', '#67E8F9', '#99F6E4', '#F0FDFA'],
  },
  {
    id: 'pastel-candy',
    name: 'Pastel Dream',
    psychologicalEffect: 'Gentle low-contrast aesthetic, soft eyes, non-overwhelming rest',
    colors: ['#FECDD3', '#FED7AA', '#FEF08A', '#BBF7D0', '#BAE6FD', '#E9D5FF'],
  },
];

export const PLAYGROUND_DESIGNS: PlaygroundDesign[] = [
  // 1. Curli Sensory Fidget Mat (Direct homage to the reference image)
  {
    id: 'curli-mat',
    title: 'Curli Sensory Mat',
    subtitle: 'Tactile silicone maze pad with weaving 3D rubber noodles',
    category: 'sensory-mat',
    description: 'Inspired by sensory tactile fidget pads used to relieve anxiety and restore executive focus through curvilinear path exploration.',
    baseColor: '#0A343D',
    grooveColor: '#052229',
    viewBox: '0 0 1000 620',
    aspectRatio: '16/10',
    recommendedPaletteId: 'silicone-pop',
    segments: [
      // Base Maze Channels & Fingerprint Grooves (recidivist paths cut into distinct segments)
      // Top-Left Arches
      { id: 'groove-tl-1', type: 'groove', d: 'M 30 110 A 80 80 0 0 1 110 30', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tl-2', type: 'groove', d: 'M 30 150 A 120 120 0 0 1 150 30', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tl-3', type: 'groove', d: 'M 30 190 A 160 160 0 0 1 190 30', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tl-4', type: 'groove', d: 'M 30 230 C 130 230 210 170 230 30', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tl-5', type: 'groove', d: 'M 30 270 C 160 270 240 180 270 30', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tl-loop-1', type: 'groove', d: 'M 30 70 L 70 70 A 40 40 0 0 1 30 110', defaultColor: '#052229', strokeWidth: 14 },

      // Top Center Wavy Channels
      { id: 'groove-tc-1', type: 'groove', d: 'M 310 30 C 330 150 420 150 490 60 C 530 10 610 10 670 40', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tc-2', type: 'groove', d: 'M 350 30 C 370 180 440 180 520 90 C 560 40 640 40 710 60', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tc-3', type: 'groove', d: 'M 400 30 C 420 220 480 210 560 120 C 600 70 690 70 760 90', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tc-rings', type: 'groove', d: 'M 520 60 A 80 80 0 0 1 680 60', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-tc-rings-inner', type: 'groove', d: 'M 560 60 A 40 40 0 0 1 640 60', defaultColor: '#052229', strokeWidth: 14 },

      // Center Undulating Ribbons
      { id: 'groove-mid-1', type: 'groove', d: 'M 30 330 C 140 330 190 270 280 270 C 370 270 420 340 500 340 C 610 340 690 260 780 260 C 850 260 920 300 970 300', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-mid-2', type: 'groove', d: 'M 30 370 C 130 370 170 310 260 310 C 350 310 400 380 480 380 C 590 380 670 300 760 300 C 840 300 900 340 970 340', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-mid-3', type: 'groove', d: 'M 170 410 C 240 350 320 350 370 410 L 370 590', defaultColor: '#052229', strokeWidth: 14 },

      // Bottom Center Huge Vertical Fingerprint Arch
      { id: 'groove-arch-outer', type: 'groove', d: 'M 490 590 L 490 440 C 490 350 630 350 630 440 L 630 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-arch-mid', type: 'groove', d: 'M 525 590 L 525 450 C 525 385 595 385 595 450 L 595 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-arch-inner', type: 'groove', d: 'M 560 590 L 560 460', defaultColor: '#052229', strokeWidth: 14 },

      // Bottom-Left Radiating Concentric Fans
      { id: 'groove-bl-1', type: 'groove', d: 'M 30 460 A 130 130 0 0 1 160 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-bl-2', type: 'groove', d: 'M 30 500 A 90 90 0 0 1 120 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-bl-3', type: 'groove', d: 'M 30 540 A 50 50 0 0 1 80 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-bl-loop', type: 'groove', d: 'M 180 470 C 220 510 240 550 240 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-bl-loop-2', type: 'groove', d: 'M 220 440 C 270 490 280 540 280 590', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-bl-loop-3', type: 'groove', d: 'M 260 410 C 310 460 320 520 320 590', defaultColor: '#052229', strokeWidth: 14 },

      // Right Side Teardrop & Horizontal Waves
      { id: 'groove-rt-1', type: 'groove', d: 'M 740 30 C 800 60 880 70 970 70', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-rt-2', type: 'groove', d: 'M 780 70 C 830 110 890 120 970 120', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-rt-3', type: 'groove', d: 'M 730 160 C 810 160 870 180 970 180', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-rt-4', type: 'groove', d: 'M 680 210 C 760 210 830 230 970 230', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-rt-tear-outer', type: 'groove', d: 'M 740 440 C 700 480 670 540 700 570 C 730 590 770 560 820 480', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-rt-tear-inner', type: 'groove', d: 'M 730 480 C 710 505 705 535 720 550 C 735 560 755 540 780 500', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-br-loop-1', type: 'groove', d: 'M 880 430 C 920 430 960 450 970 480', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-br-loop-2', type: 'groove', d: 'M 870 480 C 920 480 960 510 970 540', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-br-corner-arch', type: 'groove', d: 'M 890 590 A 80 80 0 0 0 970 510', defaultColor: '#052229', strokeWidth: 14 },
      { id: 'groove-br-corner-inner', type: 'groove', d: 'M 930 590 A 40 40 0 0 0 970 550', defaultColor: '#052229', strokeWidth: 14 },

      // =========================================================================
      // 3D TACTILE SILICONE NOODLES / CORDS (Precisely segmented at loops & crossings)
      // =========================================================================
      
      // --- CORD A: CYAN NOODLE (Top Left Spiral to Top Center Horizon) ---
      {
        id: 'cord-cyan-segment-1',
        type: 'cord',
        d: 'M 10 240 C 60 240 120 230 160 190 C 180 170 190 140 185 105',
        defaultColor: '#06B6D4',
        strokeWidth: 20,
        zIndex: 5,
      },
      {
        id: 'cord-cyan-twist-loop',
        type: 'cord',
        d: 'M 185 105 C 180 60 215 50 230 85 C 245 120 220 165 195 190',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 10, // Rises above the channel
      },
      {
        id: 'cord-cyan-segment-2',
        type: 'cord',
        d: 'M 195 190 C 230 230 310 220 380 150 C 440 90 510 10 570 30',
        defaultColor: '#06B6D4',
        strokeWidth: 20,
        zIndex: 6,
      },
      {
        id: 'cord-cyan-tail-horizontal',
        type: 'cord',
        d: 'M 390 190 C 470 230 570 240 690 220',
        defaultColor: '#06B6D4',
        strokeWidth: 20,
        zIndex: 7,
      },

      // --- CORD B: TANGERINE ORANGE NOODLE (Top to Center Loop to Bottom Right) ---
      {
        id: 'cord-orange-top-plunge',
        type: 'cord',
        d: 'M 290 10 C 295 70 315 130 330 180',
        defaultColor: '#F97316',
        strokeWidth: 22,
        zIndex: 8,
      },
      {
        id: 'cord-orange-3d-knot',
        type: 'cord',
        d: 'M 330 180 C 350 120 375 130 365 195 C 360 220 395 240 445 230',
        defaultColor: '#F97316',
        strokeWidth: 24,
        zIndex: 12, // Prominent standing 3D silicone loop
      },
      {
        id: 'cord-orange-bottom-arch',
        type: 'cord',
        d: 'M 720 590 C 730 500 780 430 860 370 C 910 330 960 335 990 335',
        defaultColor: '#F97316',
        strokeWidth: 22,
        zIndex: 8,
      },

      // --- CORD C: WHITE SILICONE NOODLE (Center-Left Twist & Right Loop) ---
      {
        id: 'cord-white-left-segment',
        type: 'cord',
        d: 'M 350 325 C 380 390 410 440 420 490',
        defaultColor: '#FFFFFF',
        strokeWidth: 20,
        zIndex: 8,
      },
      {
        id: 'cord-white-twist-curl',
        type: 'cord',
        d: 'M 420 490 C 430 520 390 515 375 480 C 360 450 395 440 425 470 L 420 590',
        defaultColor: '#FFFFFF',
        strokeWidth: 22,
        zIndex: 11,
      },
      {
        id: 'cord-white-right-u-turn',
        type: 'cord',
        d: 'M 990 230 C 870 270 780 340 700 400 C 685 410 690 435 715 425 C 750 410 800 350 835 315',
        defaultColor: '#FFFFFF',
        strokeWidth: 20,
        zIndex: 9,
      },

      // --- CORD D: LEMON CHIFFON YELLOW NOODLE (Top Right Lightning & Bottom Left Arc) ---
      {
        id: 'cord-yellow-lightning-start',
        type: 'cord',
        d: 'M 605 170 C 640 170 720 160 760 120',
        defaultColor: '#FDE047',
        strokeWidth: 20,
        zIndex: 8,
      },
      {
        id: 'cord-yellow-lightning-zig',
        type: 'cord',
        d: 'M 760 120 C 780 90 840 90 805 140 C 780 180 850 140 930 110',
        defaultColor: '#FDE047',
        strokeWidth: 22,
        zIndex: 11,
      },
      {
        id: 'cord-yellow-bottom-left-sweep',
        type: 'cord',
        d: 'M 10 420 C 60 420 130 460 165 520 C 185 550 180 580 185 590',
        defaultColor: '#FDE047',
        strokeWidth: 20,
        zIndex: 8,
      },
    ],
  },

  // 2. Zen Japanese Gravel Wave Garden
  {
    id: 'zen-garden',
    title: 'Zen Pebble Waves',
    subtitle: 'Raked gravel water ripples and smooth meditation stepping stones',
    category: 'zen-waves',
    description: 'Based on the mindfulness technique of Japanese dry rock gardens (Karesansui). Tracing concentric ripple lines activates slow theta-wave brain rhythms.',
    baseColor: '#1A232A',
    grooveColor: '#0E1419',
    viewBox: '0 0 1000 620',
    aspectRatio: '16/10',
    recommendedPaletteId: 'matcha-zen',
    segments: [
      // Concentric Zen Ripples Left
      { id: 'zen-ripple-l1', type: 'groove', d: 'M 250 190 A 90 90 0 1 0 250 370 A 90 90 0 1 0 250 190', defaultColor: '#0E1419', strokeWidth: 16 },
      { id: 'zen-ripple-l2', type: 'groove', d: 'M 250 140 A 140 140 0 1 0 250 420 A 140 140 0 1 0 250 140', defaultColor: '#0E1419', strokeWidth: 16 },
      { id: 'zen-ripple-l3', type: 'groove', d: 'M 250 90 A 190 190 0 1 0 250 470 A 190 190 0 1 0 250 90', defaultColor: '#0E1419', strokeWidth: 16 },
      { id: 'zen-ripple-l4', type: 'groove', d: 'M 250 40 A 240 240 0 1 0 250 520 A 240 240 0 1 0 250 40', defaultColor: '#0E1419', strokeWidth: 16 },

      // Concentric Zen Ripples Right
      { id: 'zen-ripple-r1', type: 'groove', d: 'M 720 220 A 80 80 0 1 0 720 380 A 80 80 0 1 0 720 220', defaultColor: '#0E1419', strokeWidth: 16 },
      { id: 'zen-ripple-r2', type: 'groove', d: 'M 720 170 A 130 130 0 1 0 720 430 A 130 130 0 1 0 720 170', defaultColor: '#0E1419', strokeWidth: 16 },
      { id: 'zen-ripple-r3', type: 'groove', d: 'M 720 120 A 180 180 0 1 0 720 480 A 180 180 0 1 0 720 120', defaultColor: '#0E1419', strokeWidth: 16 },

      // Flowing Meandering Water Stream Ribbons
      { id: 'zen-stream-1', type: 'cord', d: 'M 40 70 C 260 20 420 140 500 280 C 560 410 650 560 960 550', defaultColor: '#52796F', strokeWidth: 22, zIndex: 6 },
      { id: 'zen-stream-2', type: 'cord', d: 'M 40 120 C 240 70 410 200 480 320 C 540 450 640 590 960 590', defaultColor: '#84A98C', strokeWidth: 22, zIndex: 6 },
      { id: 'zen-stream-3', type: 'cord', d: 'M 40 550 C 250 580 430 460 500 360 C 560 260 670 90 960 70', defaultColor: '#CAD2C5', strokeWidth: 22, zIndex: 6 },

      // Smooth River Pebbles (Zen focal touchstones)
      { id: 'zen-stone-left', type: 'ridge', d: 'M 250 240 A 40 40 0 1 0 250 320 A 40 40 0 1 0 250 240', defaultColor: '#354F52', strokeWidth: 28, zIndex: 10 },
      { id: 'zen-stone-right', type: 'ridge', d: 'M 720 270 A 30 30 0 1 0 720 330 A 30 30 0 1 0 720 270', defaultColor: '#354F52', strokeWidth: 28, zIndex: 10 },
    ],
  },

  // 3. Topographic Canyon Waves
  {
    id: 'topographic-canyon',
    title: 'Topographic Canyon',
    subtitle: 'Smooth elevation contour ribbons flowing across organic landscape layers',
    category: 'topographic',
    description: 'Contour lines mimic the peaceful natural geometry of geological canyon strata, reducing visual stress through smooth, parallel gradient flow.',
    baseColor: '#181E29',
    grooveColor: '#0D1117',
    viewBox: '0 0 1000 620',
    aspectRatio: '16/10',
    recommendedPaletteId: 'sunset-glow',
    segments: [
      { id: 'topo-contour-1', type: 'cord', d: 'M 0 60 C 250 180 450 20 700 120 C 850 180 920 60 1000 70', defaultColor: '#FB7185', strokeWidth: 20 },
      { id: 'topo-contour-2', type: 'cord', d: 'M 0 130 C 270 250 480 90 710 190 C 860 250 930 130 1000 140', defaultColor: '#FB923C', strokeWidth: 20 },
      { id: 'topo-contour-3', type: 'cord', d: 'M 0 200 C 290 320 510 160 720 260 C 870 320 940 200 1000 210', defaultColor: '#FBBF24', strokeWidth: 20 },
      { id: 'topo-contour-4', type: 'cord', d: 'M 0 270 C 310 390 540 230 730 330 C 880 390 950 270 1000 280', defaultColor: '#F472B6', strokeWidth: 20 },
      { id: 'topo-contour-5', type: 'cord', d: 'M 0 340 C 330 460 570 300 740 400 C 890 460 960 340 1000 350', defaultColor: '#C084FC', strokeWidth: 20 },
      { id: 'topo-contour-6', type: 'cord', d: 'M 0 410 C 350 530 600 370 750 470 C 900 530 970 410 1000 420', defaultColor: '#FDA4AF', strokeWidth: 20 },
      { id: 'topo-contour-7', type: 'cord', d: 'M 0 480 C 370 600 630 440 760 540 C 910 600 980 480 1000 490', defaultColor: '#F43F5E', strokeWidth: 20 },
      { id: 'topo-contour-8', type: 'cord', d: 'M 0 550 C 390 670 660 510 770 610 L 1000 560', defaultColor: '#FB923C', strokeWidth: 20 },
    ],
  },

  // 4. Flora Labyrinth Mandala
  {
    id: 'flora-mandala',
    title: 'Flora Lotus Mandala',
    subtitle: 'Calming sacred geometry with interlocking petal spirals',
    category: 'flora-mandala',
    description: 'Mandala tracing has been proven in clinical psychological trials to reduce situational anxiety by focusing repetitive motor actions on harmonious center-balanced symmetry.',
    baseColor: '#1F1A24',
    grooveColor: '#120F16',
    viewBox: '0 0 1000 620',
    aspectRatio: '16/10',
    recommendedPaletteId: 'ocean-abyss',
    segments: [
      // Central Bloom
      { id: 'mandala-center', type: 'ridge', d: 'M 500 270 A 40 40 0 1 0 500 350 A 40 40 0 1 0 500 270', defaultColor: '#38BDF8', strokeWidth: 22, zIndex: 10 },

      // Cardinal Petals
      { id: 'petal-north', type: 'cord', d: 'M 470 270 C 420 180 500 90 500 90 C 500 90 580 180 530 270', defaultColor: '#0284C7', strokeWidth: 20, zIndex: 6 },
      { id: 'petal-south', type: 'cord', d: 'M 470 350 C 420 440 500 530 500 530 C 500 530 580 440 530 350', defaultColor: '#0284C7', strokeWidth: 20, zIndex: 6 },
      { id: 'petal-west', type: 'cord', d: 'M 460 280 C 370 230 280 310 280 310 C 280 310 370 390 460 340', defaultColor: '#0EA5E9', strokeWidth: 20, zIndex: 6 },
      { id: 'petal-east', type: 'cord', d: 'M 540 280 C 630 230 720 310 720 310 C 720 310 630 390 540 340', defaultColor: '#0EA5E9', strokeWidth: 20, zIndex: 6 },

      // Diagonal Interlocking Loops
      { id: 'petal-nw', type: 'cord', d: 'M 450 250 C 360 170 320 220 380 280', defaultColor: '#67E8F9', strokeWidth: 20, zIndex: 7 },
      { id: 'petal-ne', type: 'cord', d: 'M 550 250 C 640 170 680 220 620 280', defaultColor: '#67E8F9', strokeWidth: 20, zIndex: 7 },
      { id: 'petal-sw', type: 'cord', d: 'M 450 370 C 360 450 320 400 380 340', defaultColor: '#99F6E4', strokeWidth: 20, zIndex: 7 },
      { id: 'petal-se', type: 'cord', d: 'M 550 370 C 640 450 680 400 620 340', defaultColor: '#99F6E4', strokeWidth: 20, zIndex: 7 },

      // Outer Harmonic Ring
      { id: 'mandala-ring-inner', type: 'groove', d: 'M 500 130 A 180 180 0 1 0 500 490 A 180 180 0 1 0 500 130', defaultColor: '#120F16', strokeWidth: 16 },
      { id: 'mandala-ring-outer', type: 'groove', d: 'M 500 60 A 250 250 0 1 0 500 560 A 250 250 0 1 0 500 60', defaultColor: '#120F16', strokeWidth: 16 },
    ],
  },
];
