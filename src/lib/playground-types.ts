export interface PlaygroundPathSegment {
  id: string;
  d: string;
  type: 'cord' | 'groove' | 'ridge' | 'accent' | 'region';
  defaultColor: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'square' | 'butt';
  zIndex?: number;
  isFilledByDefault?: boolean;
  label?: string;
}

export interface PlaygroundDesign {
  id: string;
  title: string;
  subtitle: string;
  category: 'coloring-book' | 'sensory-mat' | 'zen-waves' | 'topographic' | 'flora-mandala';
  description: string;
  baseColor: string;
  grooveColor: string;
  viewBox: string;
  width: number;
  height: number;
  aspectRatio: string;
  recommendedPaletteId: string;
  segments: PlaygroundPathSegment[];
  /** Optional overlay line-art paths drawn above color layer */
  lineArtPaths?: Array<{ d: string; strokeWidth?: number; color?: string; fill?: string }>;
}

export interface ColorPalette {
  id: string;
  name: string;
  psychologicalEffect: string;
  colors: string[];
}

export type ColoringTool = 'brush' | 'marker' | 'eraser' | 'fill';

export interface ColoringStrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface ColoringStroke {
  id: string;
  tool: ColoringTool;
  color: string;
  size: number;
  opacity: number;
  segmentId?: string | null;
  points: ColoringStrokePoint[];
}

export interface EyedropperState {
  active: boolean;
  sampling: boolean;
  x: number;
  y: number;
  color: string;
}

export interface PlaygroundStats {
  minutesRested: number;
  segmentsColored: number;
  sessionsCompleted: number;
  lastSessionDate?: string;
}

export interface PlaygroundSettings {
  defaultBreakDurationMinutes: number; // 3, 5, 10
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  earnYourBreakMode: boolean; // Must write for 25m to unlock
  ambientSound: 'none' | 'chimes' | 'rain';
}
