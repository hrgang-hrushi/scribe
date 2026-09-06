import type { PlaygroundDesign, ColorPalette } from './playground-types';

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'picnic-warmth',
    name: 'Picnic Warmth',
    psychologicalEffect: 'Earthy comfort, nostalgic warmth, and dopamine stimulation (Reference Match)',
    colors: [
      '#4A3B32', // Chocolate Fur
      '#9C5238', // Amber Wood
      '#C27D38', // Warm Cinnamon
      '#E5A93C', // Butter / Golden Bread
      '#556B2F', // Olive Basket Green
      '#B22222', // Rich Crimson Red
      '#FDF5E6', // Cream Blanket White
      '#708238', // Sage Scarf Green
      '#DDA15E', // Warm Sand
      '#BC6C25', // Caramel Crust
      '#FFB703', // Sunshine Yellow
      '#283618', // Deep Forest Pine
    ],
  },
  {
    id: 'silicone-pop',
    name: 'Silicone Pop',
    psychologicalEffect: 'Playful stimulation, sensory focus, and tactile joy',
    colors: ['#F97316', '#06B6D4', '#FDE047', '#FFFFFF', '#14B8A6', '#A855F7', '#EC4899', '#3B82F6'],
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
  // 1. Picnic Friends (Exact recreation from user reference video)
  {
    id: 'picnic-friends',
    title: 'Picnic Friends',
    subtitle: 'A cozy afternoon with acoustic guitar, picnic basket & sweet treats',
    category: 'coloring-book',
    description: 'A comforting, heart-warming picnic scene. Coloring organic characters and picnic treats reduces cognitive cortisol and elevates dopamine through gentle, low-demand creativity.',
    baseColor: '#FFFFFF',
    grooveColor: '#E4E4E7',
    viewBox: '0 0 800 1000',
    width: 800,
    height: 1000,
    aspectRatio: '4/5',
    recommendedPaletteId: 'picnic-warmth',
    segments: [
      // Bear Character (Left)
      { id: 'picnic-bear-head', type: 'region', d: 'M 190 200 C 130 200 120 280 120 330 C 120 400 180 430 260 430 C 330 430 380 390 380 320 C 380 250 340 200 280 200 Z', defaultColor: '#FDFBF7', label: 'Bear Head' },
      { id: 'picnic-bear-ear-l-out', type: 'region', d: 'M 140 220 C 100 180 110 120 160 120 C 190 120 190 170 170 210 Z', defaultColor: '#FDFBF7', label: 'Bear Left Ear Outer' },
      { id: 'picnic-bear-ear-l-in', type: 'region', d: 'M 145 195 C 125 170 130 140 160 140 C 175 140 175 170 165 195 Z', defaultColor: '#FDFBF7', label: 'Bear Left Ear Inner' },
      { id: 'picnic-bear-ear-r-out', type: 'region', d: 'M 290 210 C 320 170 360 140 390 160 C 420 180 390 230 350 240 Z', defaultColor: '#FDFBF7', label: 'Bear Right Ear Outer' },
      { id: 'picnic-bear-ear-r-in', type: 'region', d: 'M 310 215 C 330 185 360 165 380 180 C 395 195 375 225 345 235 Z', defaultColor: '#FDFBF7', label: 'Bear Right Ear Inner' },
      { id: 'picnic-bear-snout', type: 'region', d: 'M 210 320 C 200 280 300 280 300 320 C 300 360 210 360 210 320 Z', defaultColor: '#FDFBF7', label: 'Bear Snout' },
      { id: 'picnic-bear-arm-l', type: 'region', d: 'M 170 380 C 120 410 130 500 190 530 C 230 540 240 480 220 430 Z', defaultColor: '#FDFBF7', label: 'Bear Left Arm' },
      { id: 'picnic-bear-arm-r', type: 'region', d: 'M 280 380 C 350 380 440 370 510 350 C 530 330 490 310 440 320 L 340 340 Z', defaultColor: '#FDFBF7', label: 'Bear Right Arm' },
      { id: 'picnic-bear-shirt', type: 'region', d: 'M 180 380 C 210 370 280 370 320 380 L 330 450 C 270 460 220 450 180 440 Z', defaultColor: '#FDFBF7', label: 'Bear Shirt' },

      // Acoustic Guitar
      { id: 'picnic-guitar-body', type: 'region', d: 'M 190 470 C 170 410 230 370 290 370 C 360 370 410 420 400 480 C 390 530 340 570 260 570 C 190 570 160 520 190 470 Z', defaultColor: '#FDFBF7', label: 'Guitar Body' },
      { id: 'picnic-guitar-pickguard', type: 'region', d: 'M 280 430 C 300 395 350 400 370 435 C 380 475 350 515 305 515 C 275 515 270 465 280 430 Z', defaultColor: '#FDFBF7', label: 'Guitar Pickguard' },
      { id: 'picnic-guitar-soundhole', type: 'region', d: 'M 280 445 C 300 445 315 460 315 480 C 315 500 300 515 280 515 C 260 515 245 500 245 480 C 245 460 260 445 280 445 Z', defaultColor: '#FDFBF7', label: 'Guitar Soundhole' },
      { id: 'picnic-guitar-neck', type: 'region', d: 'M 380 420 L 540 310 L 555 330 L 395 440 Z', defaultColor: '#FDFBF7', label: 'Guitar Fretboard' },
      { id: 'picnic-guitar-head', type: 'region', d: 'M 540 310 L 610 260 L 635 295 L 555 330 Z', defaultColor: '#FDFBF7', label: 'Guitar Headstock' },

      // Bunny Character (Right)
      { id: 'picnic-bunny-head', type: 'region', d: 'M 490 280 C 430 280 410 340 410 390 C 410 440 450 480 530 480 C 600 480 640 430 640 370 C 640 310 570 280 490 280 Z', defaultColor: '#FDFBF7', label: 'Bunny Head' },
      { id: 'picnic-bunny-ear-l', type: 'region', d: 'M 470 280 C 450 180 480 120 520 120 C 550 120 540 200 500 280 Z', defaultColor: '#FDFBF7', label: 'Bunny Left Ear' },
      { id: 'picnic-bunny-ear-r', type: 'region', d: 'M 530 280 C 550 190 600 130 640 140 C 670 150 630 230 580 280 Z', defaultColor: '#FDFBF7', label: 'Bunny Right Ear' },
      { id: 'picnic-bunny-bow', type: 'region', d: 'M 500 270 C 480 250 510 230 525 250 C 545 230 570 250 550 270 Z', defaultColor: '#FDFBF7', label: 'Bunny Bow' },
      { id: 'picnic-bunny-scarf', type: 'region', d: 'M 440 420 C 420 460 490 500 550 490 C 600 480 620 440 590 410 C 550 435 490 435 440 420 Z', defaultColor: '#FDFBF7', label: 'Bunny Cozy Scarf' },
      { id: 'picnic-bunny-sweater', type: 'region', d: 'M 445 465 L 430 545 C 500 570 580 565 620 530 L 595 460 Z', defaultColor: '#FDFBF7', label: 'Bunny Sweater' },
      { id: 'picnic-bunny-sandwich', type: 'region', d: 'M 480 390 C 480 370 535 370 535 390 L 525 425 L 490 425 Z', defaultColor: '#FDFBF7', label: 'Bunny Treat' },

      // Picnic Spread
      { id: 'picnic-basket-body', type: 'region', d: 'M 220 660 L 250 830 C 340 850 510 850 600 820 L 615 660 C 490 650 350 650 220 660 Z', defaultColor: '#FDFBF7', label: 'Picnic Basket' },
      { id: 'picnic-basket-handle', type: 'region', d: 'M 250 670 C 250 490 580 490 580 670 C 550 670 550 530 415 530 C 280 530 280 670 250 670 Z', defaultColor: '#FDFBF7', label: 'Basket Curved Handle' },
      { id: 'picnic-bread', type: 'region', d: 'M 480 650 L 610 560 C 630 545 655 570 640 595 L 535 685 Z', defaultColor: '#FDFBF7', label: 'Baguette Loaf' },
      { id: 'picnic-bottle', type: 'region', d: 'M 410 680 L 485 570 C 495 555 520 570 515 590 L 450 700 Z', defaultColor: '#FDFBF7', label: 'Cider Bottle' },
      { id: 'picnic-pitcher', type: 'region', d: 'M 95 560 C 75 560 65 605 75 670 C 85 725 140 745 175 735 C 210 725 220 670 210 615 C 195 560 140 560 95 560 Z', defaultColor: '#FDFBF7', label: 'Heart Pitcher' },
      { id: 'picnic-cup', type: 'region', d: 'M 160 665 C 140 665 140 710 175 720 C 210 720 220 690 200 665 Z', defaultColor: '#FDFBF7', label: 'Teacup' },
      { id: 'picnic-cake', type: 'region', d: 'M 565 625 L 650 600 L 685 655 L 590 670 Z', defaultColor: '#FDFBF7', label: 'Cake Slice' },
      { id: 'picnic-box', type: 'region', d: 'M 625 680 L 730 665 L 720 760 L 615 760 Z', defaultColor: '#FDFBF7', label: 'Treat Box' },
      { id: 'picnic-blanket', type: 'region', d: 'M 40 540 L 760 540 L 790 890 L 15 890 Z', defaultColor: '#FDFBF7', label: 'Picnic Blanket' },
      { id: 'picnic-grass-base', type: 'region', d: 'M 0 520 C 240 480 560 480 800 520 L 800 1000 L 0 1000 Z', defaultColor: '#FDFBF7', label: 'Grassy Meadow' },
      { id: 'picnic-cloud-l', type: 'region', d: 'M 70 190 C 60 145 110 125 145 145 C 175 115 230 135 230 170 C 265 170 265 215 230 225 L 80 225 Z', defaultColor: '#FDFBF7', label: 'Left Cloud' },
      { id: 'picnic-cloud-r', type: 'region', d: 'M 620 130 C 605 90 660 75 680 100 C 710 75 755 100 745 130 C 775 145 765 185 735 185 L 630 185 Z', defaultColor: '#FDFBF7', label: 'Right Cloud' },
      { id: 'picnic-heart', type: 'region', d: 'M 580 90 C 560 60 520 80 540 110 L 580 150 L 620 110 C 640 80 600 60 580 90 Z', defaultColor: '#FDFBF7', label: 'Sky Floating Heart' },
    ],
    lineArtPaths: [
      // Detailed crisp black contours
      { d: 'M 190 200 C 130 200 120 280 120 330 C 120 400 180 430 260 430 C 330 430 380 390 380 320 C 380 250 340 200 280 200 Z', strokeWidth: 3.5 },
      { d: 'M 140 220 C 100 180 110 120 160 120 C 190 120 190 170 170 210', strokeWidth: 3.5 },
      { d: 'M 145 195 C 125 170 130 140 160 140 C 175 140 175 170 165 195', strokeWidth: 2.5 },
      { d: 'M 290 210 C 320 170 360 140 390 160 C 420 180 390 230 350 240', strokeWidth: 3.5 },
      { d: 'M 310 215 C 330 185 360 165 380 180 C 395 195 375 225 345 235', strokeWidth: 2.5 },
      { d: 'M 210 320 C 200 280 300 280 300 320 C 300 360 210 360 210 320 Z', strokeWidth: 3 },
      { d: 'M 245 295 A 6 6 0 1 1 245 307 A 6 6 0 1 1 245 295', strokeWidth: 3, fill: '#18181B' },
      { d: 'M 265 295 A 6 6 0 1 1 265 307 A 6 6 0 1 1 265 295', strokeWidth: 3, fill: '#18181B' },
      { d: 'M 255 315 L 255 330', strokeWidth: 2.5 },
      { d: 'M 190 470 C 170 410 230 370 290 370 C 360 370 410 420 400 480 C 390 530 340 570 260 570 C 190 570 160 520 190 470 Z', strokeWidth: 3.5 },
      { d: 'M 280 430 C 300 395 350 400 370 435 C 380 475 350 515 305 515 C 275 515 270 465 280 430 Z', strokeWidth: 3 },
      { d: 'M 280 445 C 300 445 315 460 315 480 C 315 500 300 515 280 515 C 260 515 245 500 245 480 C 245 460 260 445 280 445 Z', strokeWidth: 3 },
      { d: 'M 380 420 L 540 310 L 555 330 L 395 440 Z', strokeWidth: 3 },
      { d: 'M 540 310 L 610 260 L 635 295 L 555 330 Z', strokeWidth: 3 },
      { d: 'M 490 280 C 430 280 410 340 410 390 C 410 440 450 480 530 480 C 600 480 640 430 640 370 C 640 310 570 280 490 280 Z', strokeWidth: 3.5 },
      { d: 'M 470 280 C 450 180 480 120 520 120 C 550 120 540 200 500 280', strokeWidth: 3.5 },
      { d: 'M 530 280 C 550 190 600 130 640 140 C 670 150 630 230 580 280', strokeWidth: 3.5 },
      { d: 'M 440 420 C 420 460 490 500 550 490 C 600 480 620 440 590 410 C 550 435 490 435 440 420 Z', strokeWidth: 3 },
      { d: 'M 250 670 C 250 490 580 490 580 670 C 550 670 550 530 415 530 C 280 530 280 670 250 670 Z', strokeWidth: 3.5 },
      { d: 'M 220 660 L 250 830 C 340 850 510 850 600 820 L 615 660 C 490 650 350 650 220 660 Z', strokeWidth: 3.5 },
      { d: 'M 480 650 L 610 560 C 630 545 655 570 640 595 L 535 685 Z', strokeWidth: 3 },
      { d: 'M 410 680 L 485 570 C 495 555 520 570 515 590 L 450 700 Z', strokeWidth: 3 },
      { d: 'M 95 560 C 75 560 65 605 75 670 C 85 725 140 745 175 735 C 210 725 220 670 210 615 C 195 560 140 560 95 560 Z', strokeWidth: 3 },
      { d: 'M 160 665 C 140 665 140 710 175 720 C 210 720 220 690 200 665 Z', strokeWidth: 3 },
      { d: 'M 565 625 L 650 600 L 685 655 L 590 670 Z', strokeWidth: 3 },
      { d: 'M 625 680 L 730 665 L 720 760 L 615 760 Z', strokeWidth: 3 },
      { d: 'M 40 540 L 760 540 L 790 890 L 15 890 Z', strokeWidth: 3 },
      { d: 'M 70 190 C 60 145 110 125 145 145 C 175 115 230 135 230 170 C 265 170 265 215 230 225 L 80 225 Z', strokeWidth: 2.5 },
      { d: 'M 620 130 C 605 90 660 75 680 100 C 710 75 755 100 745 130 C 775 145 765 185 735 185 L 630 185 Z', strokeWidth: 2.5 },
      { d: 'M 580 90 C 560 60 520 80 540 110 L 580 150 L 620 110 C 640 80 600 60 580 90 Z', strokeWidth: 2.5 },
      // Grass blades & daisies
      { d: 'M 130 900 L 135 870 L 142 900', strokeWidth: 2.5 },
      { d: 'M 210 930 L 215 895 L 225 930', strokeWidth: 2.5 },
      { d: 'M 680 890 L 685 860 L 695 890', strokeWidth: 2.5 },
      { d: 'M 740 920 L 745 885 L 755 920', strokeWidth: 2.5 },
    ],
  },

  // 2. Curli Sensory Fidget Mat (Homage to prompt 3 with bounded curly loops)
  {
    id: 'curli-mat',
    title: 'Curli Sensory Mat',
    subtitle: 'Tactile silicone maze pad with weaving 3D rubber noodles',
    category: 'sensory-mat',
    description: 'Inspired by sensory tactile fidget pads used to relieve anxiety and restore executive focus through curvilinear path exploration.',
    baseColor: '#0A343D',
    grooveColor: '#052229',
    viewBox: '0 0 1000 620',
    width: 1000,
    height: 620,
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
    width: 1000,
    height: 620,
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
    width: 1000,
    height: 620,
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
    width: 1000,
    height: 620,
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
