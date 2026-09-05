export interface PlaygroundPathSegment {
  id: string;
  d: string;
  type: 'cord' | 'groove' | 'ridge' | 'accent';
  defaultColor: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'square' | 'butt';
  zIndex?: number;
  isFilledByDefault?: boolean;
}

export interface PlaygroundDesign {
  id: string;
  title: string;
  subtitle: string;
  category: 'sensory-mat' | 'zen-waves' | 'topographic' | 'flora-mandala';
  description: string;
  baseColor: string;
  grooveColor: string;
  viewBox: string;
  aspectRatio: string;
  recommendedPaletteId: string;
  segments: PlaygroundPathSegment[];
}

export interface ColorPalette {
  id: string;
  name: string;
  psychologicalEffect: string;
  colors: string[];
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
