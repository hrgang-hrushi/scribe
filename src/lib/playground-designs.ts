import type { PlaygroundDesign, ColorPalette } from './playground-types';

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'silicone-pop',
    name: 'Silicone Pop',
    psychologicalEffect: 'Playful stimulation, sensory focus, and tactile joy (Exact Reference Match)',
    colors: ['#F97316', '#06B6D4', '#FDE047', '#FFFFFF', '#14B8A6', '#A855F7', '#EC4899', '#3B82F6'],
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    psychologicalEffect: 'High-energy visual contrast, stimulates creative flow and alertness',
    colors: ['#FF007F', '#00F0FF', '#39FF14', '#FF6600', '#BD00FF', '#FFFFFF', '#FFE600', '#00FFFF'],
  },
  {
    id: 'matcha-zen',
    name: 'Matcha & Moss',
    psychologicalEffect: 'Vagus nerve calming, lowers blood pressure, grounding biophilic tones',
    colors: ['#84A98C', '#52796F', '#354F52', '#CAD2C5', '#E9D8A6', '#D4A373', '#A3B18A', '#588157'],
  },
  {
    id: 'sunset-glow',
    name: 'Warm Sunset',
    psychologicalEffect: 'Serotonin boost, cozy comfort, relieves academic fatigue',
    colors: ['#FB7185', '#FB923C', '#FBBF24', '#F472B6', '#C084FC', '#FDA4AF', '#F43F5E', '#FFE4E6'],
  },
  {
    id: 'ocean-abyss',
    name: 'Deep Ocean',
    psychologicalEffect: 'Heart rate deceleration, mental clarity, cooling tension release',
    colors: ['#38BDF8', '#0284C7', '#0EA5E9', '#67E8F9', '#99F6E4', '#F0FDFA', '#0369A1', '#E0F2FE'],
  },
  {
    id: 'pastel-candy',
    name: 'Pastel Dream',
    psychologicalEffect: 'Gentle low-contrast aesthetic, soft eyes, non-overwhelming rest',
    colors: ['#FECDD3', '#FED7AA', '#FEF08A', '#BBF7D0', '#BAE6FD', '#E9D5FF', '#FBCFE8', '#F5D0FE'],
  },
];

export const PLAYGROUND_DESIGNS: PlaygroundDesign[] = [
  // =========================================================================
  // 1. Curli Sensory Fidget Mat (1:1 Reference Masterpiece from User Image)
  // Deep matte petrol teal silicone base, dense maze groove trenches,
  // and vibrant 3D curly noodles (Cyan helix, Orange corkscrew, White spiral, Yellow zig)
  // =========================================================================
  {
    id: 'curli-original',
    title: 'Curli Sensory Mat',
    subtitle: 'Tactile silicone maze pad with weaving 3D rubber noodles',
    category: 'sensory-mat',
    description: 'Inspired by sensory tactile fidget pads used to relieve anxiety and restore executive focus through curvilinear path exploration.',
    baseColor: '#09333D',
    grooveColor: '#041A20',
    viewBox: '0 0 1000 625',
    width: 1000,
    height: 625,
    aspectRatio: '16/10',
    recommendedPaletteId: 'silicone-pop',
    segments: [
      // -----------------------------------------------------------------------
      // GROOVES IN BETWEEN: Discrete segmented recessed paths
      // -----------------------------------------------------------------------
      // Top-Left Concentric Arches
      { id: 'groove-tl-1', type: 'groove', d: 'M 35 110 A 75 75 0 0 1 110 35', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tl-2', type: 'groove', d: 'M 35 150 A 115 115 0 0 1 150 35', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tl-3', type: 'groove', d: 'M 35 190 A 155 155 0 0 1 190 35', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tl-4', type: 'groove', d: 'M 35 230 C 130 230 210 170 230 35', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tl-5', type: 'groove', d: 'M 35 270 C 160 270 240 180 270 35', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tl-hairpin', type: 'groove', d: 'M 35 70 L 75 70 A 35 35 0 0 1 35 105', defaultColor: '#041A20', strokeWidth: 14 },

      // Top-Center Ripple Waves
      { id: 'groove-tc-1', type: 'groove', d: 'M 310 35 C 330 150 420 150 490 60 C 530 15 610 15 670 45', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tc-2', type: 'groove', d: 'M 350 35 C 370 180 440 180 520 90 C 560 45 640 45 710 65', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tc-3', type: 'groove', d: 'M 400 35 C 420 220 480 210 560 120 C 600 75 690 75 760 95', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tc-concentric-1', type: 'groove', d: 'M 520 65 A 80 80 0 0 1 680 65', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tc-concentric-2', type: 'groove', d: 'M 560 65 A 40 40 0 0 1 640 65', defaultColor: '#041A20', strokeWidth: 14 },

      // Middle Diagonal Flow Valleys
      { id: 'groove-mid-1', type: 'groove', d: 'M 35 330 C 140 330 190 270 280 270 C 370 270 420 340 500 340 C 610 340 690 260 780 260 C 850 260 920 300 965 300', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-mid-2', type: 'groove', d: 'M 35 370 C 130 370 170 310 260 310 C 350 310 400 380 480 380 C 590 380 670 300 760 300 C 840 300 900 340 965 340', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-mid-3', type: 'groove', d: 'M 170 410 C 240 350 320 350 370 410 L 370 595', defaultColor: '#041A20', strokeWidth: 14 },

      // Bottom-Center Tall Fingerprint Arch (Nested U-loops)
      { id: 'groove-arch-outer', type: 'groove', d: 'M 490 595 L 490 430 C 490 350 630 350 630 430 L 630 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-arch-mid', type: 'groove', d: 'M 525 595 L 525 440 C 525 380 595 380 595 440 L 595 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-arch-inner', type: 'groove', d: 'M 560 595 L 560 455 C 560 435 580 435 580 455 L 580 595', defaultColor: '#041A20', strokeWidth: 14 },

      // Bottom Vertical Comb Teeth (Satisfying tactile grooves)
      { id: 'groove-tooth-1', type: 'groove', d: 'M 210 520 L 210 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-2', type: 'groove', d: 'M 240 480 L 240 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-3', type: 'groove', d: 'M 270 460 L 270 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-4', type: 'groove', d: 'M 300 440 L 300 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-5', type: 'groove', d: 'M 330 430 L 330 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-6', type: 'groove', d: 'M 450 470 L 450 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-7', type: 'groove', d: 'M 655 460 L 655 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-tooth-8', type: 'groove', d: 'M 685 480 L 685 595', defaultColor: '#041A20', strokeWidth: 14 },

      // Bottom-Left Concentric Fan Arches
      { id: 'groove-bl-1', type: 'groove', d: 'M 35 460 A 130 130 0 0 1 160 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-bl-2', type: 'groove', d: 'M 35 500 A 90 90 0 0 1 120 595', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-bl-3', type: 'groove', d: 'M 35 540 A 50 50 0 0 1 80 595', defaultColor: '#041A20', strokeWidth: 14 },

      // Right-Side Wave Channels & Teardrops
      { id: 'groove-rt-1', type: 'groove', d: 'M 740 35 C 800 65 880 75 965 75', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-rt-2', type: 'groove', d: 'M 780 75 C 830 115 890 125 965 125', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-rt-3', type: 'groove', d: 'M 730 165 C 810 165 870 185 965 185', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-rt-4', type: 'groove', d: 'M 680 215 C 760 215 830 235 965 235', defaultColor: '#041A20', strokeWidth: 14 },

      // Bottom-Right Corner Waves & Loops
      { id: 'groove-br-loop-1', type: 'groove', d: 'M 870 430 C 910 430 955 450 965 480', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-br-loop-2', type: 'groove', d: 'M 860 480 C 910 480 955 510 965 540', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-br-arch-1', type: 'groove', d: 'M 890 595 A 80 80 0 0 0 965 510', defaultColor: '#041A20', strokeWidth: 14 },
      { id: 'groove-br-arch-2', type: 'groove', d: 'M 925 595 A 45 45 0 0 0 965 550', defaultColor: '#041A20', strokeWidth: 14 },

      // -----------------------------------------------------------------------
      // 3D CURLY SILICONE NOODLES: Clean path cut-offs at loops & crossings
      // -----------------------------------------------------------------------
      
      // --- CORD 1: ELECTRIC CYAN 3D HELIX (Top Left) ---
      {
        id: 'cord-cyan-helix-entry',
        type: 'cord',
        d: 'M 20 240 C 65 240 120 230 160 190',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 6,
        label: 'Cyan Noodle Entry',
      },
      {
        id: 'cord-cyan-helix-rise',
        type: 'cord',
        d: 'M 160 190 C 180 170 190 135 180 100',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Cyan Helix Rising Arm',
      },
      {
        id: 'cord-cyan-helix-knot',
        type: 'cord',
        d: 'M 180 100 C 170 55 215 45 235 80 C 250 115 220 160 195 185',
        defaultColor: '#06B6D4',
        strokeWidth: 24,
        zIndex: 14, // Overhead standing 3D loop
        label: 'Cyan 3D Spiral Loop',
      },
      {
        id: 'cord-cyan-helix-descent',
        type: 'cord',
        d: 'M 195 185 C 225 215 260 210 290 190',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 7,
        label: 'Cyan Noodle Descent',
      },

      // --- CORD 2: ELECTRIC CYAN SWOOPING WAVE (Top-Center to Mid-Right) ---
      {
        id: 'cord-cyan-swoop-start',
        type: 'cord',
        d: 'M 385 10 C 390 70 405 130 435 165',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 7,
        label: 'Cyan Wave Plunge',
      },
      {
        id: 'cord-cyan-swoop-mid',
        type: 'cord',
        d: 'M 435 165 C 475 215 540 230 600 230',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 7,
        label: 'Cyan Wave Belly',
      },
      {
        id: 'cord-cyan-swoop-tail',
        type: 'cord',
        d: 'M 600 230 C 640 230 675 225 700 220',
        defaultColor: '#06B6D4',
        strokeWidth: 22,
        zIndex: 7,
        label: 'Cyan Wave Tail',
      },

      // --- CORD 3: TANGERINE ORANGE CORKSCREW (Top to Center) ---
      {
        id: 'cord-orange-corkscrew-stem',
        type: 'cord',
        d: 'M 295 10 C 300 70 315 125 330 165',
        defaultColor: '#F97316',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Orange Corkscrew Plunge',
      },
      {
        id: 'cord-orange-corkscrew-3d-loop',
        type: 'cord',
        d: 'M 330 165 C 345 110 380 120 370 180 C 365 205 385 225 415 225',
        defaultColor: '#F97316',
        strokeWidth: 24,
        zIndex: 15, // Standing 3D knot
        label: 'Orange 3D Corkscrew Knot',
      },
      {
        id: 'cord-orange-corkscrew-tail',
        type: 'cord',
        d: 'M 415 225 C 430 225 445 235 455 240',
        defaultColor: '#F97316',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Orange Corkscrew Tail',
      },

      // --- CORD 4: MILK WHITE SPIRAL RIBBON (Center-Bottom to Mid-Left) ---
      {
        id: 'cord-white-spiral-stem',
        type: 'cord',
        d: 'M 420 610 L 420 530 C 420 495 405 480 395 470',
        defaultColor: '#FFFFFF',
        strokeWidth: 22,
        zIndex: 8,
        label: 'White Spiral Stem',
      },
      {
        id: 'cord-white-spiral-3d-knot',
        type: 'cord',
        d: 'M 395 470 C 375 445 405 425 435 450 C 455 470 435 505 410 500',
        defaultColor: '#FFFFFF',
        strokeWidth: 24,
        zIndex: 15, // Standing twist knot
        label: 'White 3D Twist Knot',
      },
      {
        id: 'cord-white-spiral-reach',
        type: 'cord',
        d: 'M 410 500 C 390 485 365 410 345 350',
        defaultColor: '#FFFFFF',
        strokeWidth: 22,
        zIndex: 9,
        label: 'White Ribbon Crest',
      },

      // --- CORD 5: LEMON CHIFFON YELLOW ZIGZAG (Top-Right) ---
      {
        id: 'cord-yellow-zig-base',
        type: 'cord',
        d: 'M 605 170 C 640 170 690 155 730 135',
        defaultColor: '#FDE047',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Yellow Zig Base',
      },
      {
        id: 'cord-yellow-zig-apex',
        type: 'cord',
        d: 'M 730 135 C 765 115 825 105 795 155 C 780 180 815 170 855 145',
        defaultColor: '#FDE047',
        strokeWidth: 24,
        zIndex: 14, // Standing zigzag fold
        label: 'Yellow 3D Zigzag Fold',
      },
      {
        id: 'cord-yellow-zig-tail',
        type: 'cord',
        d: 'M 855 145 C 885 130 920 115 940 110',
        defaultColor: '#FDE047',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Yellow Zig Tail',
      },

      // --- CORD 6: MILK WHITE HAIRPIN U-TURN (Right-Center) ---
      {
        id: 'cord-white-hairpin-top',
        type: 'cord',
        d: 'M 840 340 C 790 375 750 395 725 415',
        defaultColor: '#FFFFFF',
        strokeWidth: 22,
        zIndex: 9,
        label: 'White Hairpin Upper Arm',
      },
      {
        id: 'cord-white-hairpin-loop',
        type: 'cord',
        d: 'M 725 415 C 695 435 700 465 730 460',
        defaultColor: '#FFFFFF',
        strokeWidth: 22,
        zIndex: 9,
        label: 'White Hairpin U-Turn Loop',
      },
      {
        id: 'cord-white-hairpin-bottom',
        type: 'cord',
        d: 'M 730 460 C 760 455 800 420 840 380',
        defaultColor: '#FFFFFF',
        strokeWidth: 22,
        zIndex: 9,
        label: 'White Hairpin Return Arm',
      },

      // --- CORD 7: TANGERINE ORANGE SWEEP (Bottom-Right) ---
      {
        id: 'cord-orange-bottom-stem',
        type: 'cord',
        d: 'M 725 610 C 735 540 765 485 810 440',
        defaultColor: '#F97316',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Orange Bottom Arc Base',
      },
      {
        id: 'cord-orange-bottom-sweep',
        type: 'cord',
        d: 'M 810 440 C 860 395 925 360 990 345',
        defaultColor: '#F97316',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Orange Sweeping Exit Arc',
      },

      // --- CORD 8: LEMON CHIFFON YELLOW SWEEP (Bottom-Left) ---
      {
        id: 'cord-yellow-bottom-stem',
        type: 'cord',
        d: 'M 180 610 C 175 550 150 490 110 450',
        defaultColor: '#FDE047',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Yellow Bottom Sweep Base',
      },
      {
        id: 'cord-yellow-bottom-sweep',
        type: 'cord',
        d: 'M 110 450 C 70 415 35 415 10 415',
        defaultColor: '#FDE047',
        strokeWidth: 22,
        zIndex: 8,
        label: 'Yellow Sweeping Exit Arc',
      },
    ],
  },

  // =========================================================================
  // 2. Neon Cyber Fidget Pad (Matte Onyx with High-Voltage Neon Curli Helixes)
  // =========================================================================
  {
    id: 'curli-neon',
    title: 'Neon Cyber Pad',
    subtitle: 'Dark obsidian silicone base with glowing neon noodle loops',
    category: 'sensory-mat',
    description: 'High-contrast luminescent silicone pad. Tracing electric neon paths against deep obsidian activates visual dopamine receptors and sharpens reaction alertness.',
    baseColor: '#0F111A',
    grooveColor: '#05070A',
    viewBox: '0 0 1000 625',
    width: 1000,
    height: 625,
    aspectRatio: '16/10',
    recommendedPaletteId: 'neon-cyber',
    segments: [
      // Concentric Grooves
      { id: 'neon-g-1', type: 'groove', d: 'M 35 120 A 90 90 0 0 1 125 35', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-2', type: 'groove', d: 'M 35 170 A 140 140 0 0 1 175 35', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-3', type: 'groove', d: 'M 35 220 A 190 190 0 0 1 225 35', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-waves', type: 'groove', d: 'M 35 340 C 240 340 360 260 520 260 C 680 260 800 340 965 340', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-arch', type: 'groove', d: 'M 480 595 L 480 430 C 480 340 620 340 620 430 L 620 595', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-arch-in', type: 'groove', d: 'M 520 595 L 520 440 C 520 380 580 380 580 440 L 580 595', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-bl', type: 'groove', d: 'M 35 480 A 120 120 0 0 1 155 595', defaultColor: '#05070A', strokeWidth: 14 },
      { id: 'neon-g-br', type: 'groove', d: 'M 880 595 A 90 90 0 0 0 965 510', defaultColor: '#05070A', strokeWidth: 14 },

      // Neon Cords with Cut-offs
      { id: 'cord-neon-pink-1', type: 'cord', d: 'M 20 220 C 70 220 130 200 170 160', defaultColor: '#FF007F', strokeWidth: 22, zIndex: 6 },
      { id: 'cord-neon-pink-loop', type: 'cord', d: 'M 170 160 C 185 110 230 100 240 140 C 250 180 210 210 180 210', defaultColor: '#FF007F', strokeWidth: 24, zIndex: 12 },
      { id: 'cord-neon-pink-tail', type: 'cord', d: 'M 180 210 C 220 240 310 230 380 170', defaultColor: '#FF007F', strokeWidth: 22, zIndex: 7 },
      { id: 'cord-neon-cyan-plunge', type: 'cord', d: 'M 310 10 C 320 90 350 140 370 180', defaultColor: '#00F0FF', strokeWidth: 22, zIndex: 8 },
      { id: 'cord-neon-cyan-twist', type: 'cord', d: 'M 370 180 C 385 120 420 125 410 185 C 400 220 440 240 480 230', defaultColor: '#00F0FF', strokeWidth: 24, zIndex: 14 },
      { id: 'cord-neon-lime-zig-1', type: 'cord', d: 'M 590 160 C 640 160 700 140 740 110', defaultColor: '#39FF14', strokeWidth: 22, zIndex: 8 },
      { id: 'cord-neon-lime-zig-apex', type: 'cord', d: 'M 740 110 C 765 80 820 80 790 135 C 770 170 820 150 880 120', defaultColor: '#39FF14', strokeWidth: 24, zIndex: 12 },
      { id: 'cord-neon-orange-sweep', type: 'cord', d: 'M 710 610 C 730 520 780 440 860 380 C 910 340 960 340 990 340', defaultColor: '#FF6600', strokeWidth: 22, zIndex: 8 },
      { id: 'cord-neon-white-spiral', type: 'cord', d: 'M 420 610 C 420 530 400 480 380 460 C 355 435 390 410 420 435 C 440 455 425 490 395 490', defaultColor: '#FFFFFF', strokeWidth: 22, zIndex: 10 },
    ],
  },

  // =========================================================================
  // 3. Matcha Zen Pebble Mat (Earthy Sage Base with Bamboo & River Stone Curli)
  // =========================================================================
  {
    id: 'curli-zen',
    title: 'Matcha Bamboo Waves',
    subtitle: 'Sage green silicone pad with flowing stream cords & pebbles',
    category: 'zen-waves',
    description: 'Based on the mindfulness principle of Japanese pebble gardens. Tracing gentle organic noodle curves induces alpha brainwave relaxation and eases tension.',
    baseColor: '#2D3B36',
    grooveColor: '#192420',
    viewBox: '0 0 1000 625',
    width: 1000,
    height: 625,
    aspectRatio: '16/10',
    recommendedPaletteId: 'matcha-zen',
    segments: [
      // Concentric Zen Pebble Grooves Left
      { id: 'zen-g-l1', type: 'groove', d: 'M 250 190 A 90 90 0 1 0 250 370 A 90 90 0 1 0 250 190', defaultColor: '#192420', strokeWidth: 15 },
      { id: 'zen-g-l2', type: 'groove', d: 'M 250 140 A 140 140 0 1 0 250 420 A 140 140 0 1 0 250 140', defaultColor: '#192420', strokeWidth: 15 },
      { id: 'zen-g-l3', type: 'groove', d: 'M 250 90 A 190 190 0 1 0 250 470 A 190 190 0 1 0 250 90', defaultColor: '#192420', strokeWidth: 15 },

      // Concentric Zen Pebble Grooves Right
      { id: 'zen-g-r1', type: 'groove', d: 'M 720 220 A 80 80 0 1 0 720 380 A 80 80 0 1 0 720 220', defaultColor: '#192420', strokeWidth: 15 },
      { id: 'zen-g-r2', type: 'groove', d: 'M 720 170 A 130 130 0 1 0 720 430 A 130 130 0 1 0 720 170', defaultColor: '#192420', strokeWidth: 15 },

      // Flowing Stream Cords
      { id: 'cord-zen-bamboo-1', type: 'cord', d: 'M 35 80 C 240 30 410 150 490 290', defaultColor: '#E9D8A6', strokeWidth: 22, zIndex: 6 },
      { id: 'cord-zen-bamboo-2', type: 'cord', d: 'M 490 290 C 550 420 640 560 965 550', defaultColor: '#E9D8A6', strokeWidth: 22, zIndex: 6 },
      { id: 'cord-zen-moss-stream', type: 'cord', d: 'M 35 130 C 220 80 390 210 470 330 C 530 460 630 590 965 590', defaultColor: '#52796F', strokeWidth: 22, zIndex: 7 },
      { id: 'cord-zen-sage-crest', type: 'cord', d: 'M 35 550 C 240 580 420 460 490 360 C 550 260 660 90 965 70', defaultColor: '#84A98C', strokeWidth: 22, zIndex: 8 },
      { id: 'cord-zen-pebble-left', type: 'ridge', d: 'M 250 240 A 40 40 0 1 0 250 320 A 40 40 0 1 0 250 240', defaultColor: '#354F52', strokeWidth: 26, zIndex: 12 },
      { id: 'cord-zen-pebble-right', type: 'ridge', d: 'M 720 270 A 30 30 0 1 0 720 330 A 30 30 0 1 0 720 270', defaultColor: '#354F52', strokeWidth: 26, zIndex: 12 },
    ],
  },

  // =========================================================================
  // 4. Terracotta Sunset Waves (Warm Clay Pad with Peach, Honey & Lilac Curls)
  // =========================================================================
  {
    id: 'curli-sunset',
    title: 'Terracotta Sunset',
    subtitle: 'Warm clay silicone mat with soothing dusk ribbon waves',
    category: 'topographic',
    description: 'Warm earth tones elevate mood and foster emotional security. Tracing rhythmic canyon ripples settles nervous energy before an exam or study block.',
    baseColor: '#381F1A',
    grooveColor: '#1F0F0C',
    viewBox: '0 0 1000 625',
    width: 1000,
    height: 625,
    aspectRatio: '16/10',
    recommendedPaletteId: 'sunset-glow',
    segments: [
      // Canyon Elevation Grooves
      { id: 'sunset-g-1', type: 'groove', d: 'M 0 50 C 240 160 430 10 680 110 C 830 170 900 50 1000 60', defaultColor: '#1F0F0C', strokeWidth: 16 },
      { id: 'sunset-g-2', type: 'groove', d: 'M 0 120 C 260 230 460 80 690 180 C 840 240 910 120 1000 130', defaultColor: '#1F0F0C', strokeWidth: 16 },
      { id: 'sunset-g-3', type: 'groove', d: 'M 0 190 C 280 300 490 150 700 250 C 850 310 920 190 1000 200', defaultColor: '#1F0F0C', strokeWidth: 16 },
      { id: 'sunset-g-4', type: 'groove', d: 'M 0 260 C 300 370 520 220 710 320 C 860 380 930 260 1000 270', defaultColor: '#1F0F0C', strokeWidth: 16 },

      // Sunset Cords with Cut-offs
      { id: 'cord-sunset-rose-1', type: 'cord', d: 'M 0 70 C 250 190 450 30 700 130', defaultColor: '#FB7185', strokeWidth: 22, zIndex: 6 },
      { id: 'cord-sunset-rose-2', type: 'cord', d: 'M 700 130 C 850 190 920 70 1000 80', defaultColor: '#FB7185', strokeWidth: 22, zIndex: 6 },
      { id: 'cord-sunset-peach-1', type: 'cord', d: 'M 0 210 C 290 330 510 170 720 270', defaultColor: '#FB923C', strokeWidth: 22, zIndex: 7 },
      { id: 'cord-sunset-peach-2', type: 'cord', d: 'M 720 270 C 870 330 940 210 1000 220', defaultColor: '#FB923C', strokeWidth: 22, zIndex: 7 },
      { id: 'cord-sunset-honey-knot', type: 'cord', d: 'M 350 320 C 380 260 440 260 430 340 C 420 400 480 430 540 400', defaultColor: '#FBBF24', strokeWidth: 24, zIndex: 12 },
      { id: 'cord-sunset-lilac-wave', type: 'cord', d: 'M 0 420 C 350 540 600 380 750 480 C 900 540 970 420 1000 430', defaultColor: '#C084FC', strokeWidth: 22, zIndex: 8 },
    ],
  },

  // =========================================================================
  // 5. Pastel Dream Swirl Mat (Lavender Base with Candy Swirl Noodle Loops)
  // =========================================================================
  {
    id: 'curli-candy',
    title: 'Pastel Candy Swirl',
    subtitle: 'Soft lilac silicone pad with sweet marshmallow noodle loops',
    category: 'sensory-mat',
    description: 'Gentle low-contrast pastel silicone mat. Designed to prevent eye strain and sensory overwhelm while providing pleasant repetitive tactile feedback.',
    baseColor: '#252030',
    grooveColor: '#14111C',
    viewBox: '0 0 1000 625',
    width: 1000,
    height: 625,
    aspectRatio: '16/10',
    recommendedPaletteId: 'pastel-candy',
    segments: [
      // Concentric Grooves
      { id: 'candy-g-1', type: 'groove', d: 'M 35 110 A 75 75 0 0 1 110 35', defaultColor: '#14111C', strokeWidth: 14 },
      { id: 'candy-g-2', type: 'groove', d: 'M 35 160 A 125 125 0 0 1 160 35', defaultColor: '#14111C', strokeWidth: 14 },
      { id: 'candy-g-waves', type: 'groove', d: 'M 35 340 C 240 340 360 260 520 260 C 680 260 800 340 965 340', defaultColor: '#14111C', strokeWidth: 14 },
      { id: 'candy-g-arch', type: 'groove', d: 'M 490 595 L 490 430 C 490 350 630 350 630 430 L 630 595', defaultColor: '#14111C', strokeWidth: 14 },

      // Pastel Cords with Cut-offs
      { id: 'cord-candy-pink-1', type: 'cord', d: 'M 20 230 C 65 230 120 220 160 180', defaultColor: '#FECDD3', strokeWidth: 22, zIndex: 6 },
      { id: 'cord-candy-pink-loop', type: 'cord', d: 'M 160 180 C 175 130 220 120 230 160 C 240 200 200 230 170 230', defaultColor: '#FECDD3', strokeWidth: 24, zIndex: 12 },
      { id: 'cord-candy-blue-plunge', type: 'cord', d: 'M 300 10 C 310 80 335 130 355 170', defaultColor: '#BAE6FD', strokeWidth: 22, zIndex: 8 },
      { id: 'cord-candy-blue-loop', type: 'cord', d: 'M 355 170 C 370 115 410 125 395 185 C 385 220 425 240 465 230', defaultColor: '#BAE6FD', strokeWidth: 24, zIndex: 14 },
      { id: 'cord-candy-mint-sweep', type: 'cord', d: 'M 420 610 C 420 530 400 480 380 460 C 355 435 390 410 420 435 L 400 490', defaultColor: '#BBF7D0', strokeWidth: 22, zIndex: 9 },
      { id: 'cord-candy-butter-zig', type: 'cord', d: 'M 605 160 C 650 160 710 145 750 125 C 775 95 830 95 800 150 C 780 185 830 165 890 135', defaultColor: '#FEF08A', strokeWidth: 22, zIndex: 10 },
      { id: 'cord-candy-lavender-arc', type: 'cord', d: 'M 720 610 C 730 530 780 450 860 390 C 910 350 960 350 990 350', defaultColor: '#E9D5FF', strokeWidth: 22, zIndex: 8 },
    ],
  },
];
