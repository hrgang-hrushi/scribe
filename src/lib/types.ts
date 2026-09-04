export interface Point {
  x: number;
  y: number;
  pressure: number;
  t: number;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser' | 'tape';
  color: string;
  width: number;
  opacity: number;
  points: Point[];
  isRevealed?: boolean;
}

export interface TextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface ImageBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  originalSrc?: string;
  locked?: boolean;
}

export interface PdfBackground {
  pdfId: string;
  pageNumber: number;
}

export interface Page {
  id: string;
  noteId: string;
  order: number;
  backgroundPdfPage?: PdfBackground;
  strokes: Stroke[];
  textBoxes: TextBox[];
  images: ImageBlock[];
}

export type PaperColor = 'white' | 'cream' | 'navy' | 'dark';

export interface PaperColorTheme {
  id: PaperColor;
  label: string;
  bg: string;
  lineColor: string;
  defaultInk: string;
  dotColor: string;
}

export const PAPER_THEMES: Record<PaperColor, PaperColorTheme> = {
  white: {
    id: 'white',
    label: 'Pure White',
    bg: '#ffffff',
    lineColor: 'rgba(0, 0, 0, 0.12)',
    defaultInk: '#1a1a2e',
    dotColor: 'rgba(0, 0, 0, 0.18)',
  },
  cream: {
    id: 'cream',
    label: 'Warm Cream (Eye Care)',
    bg: '#fcf8ec',
    lineColor: 'rgba(120, 95, 60, 0.14)',
    defaultInk: '#2c251e',
    dotColor: 'rgba(120, 95, 60, 0.22)',
  },
  navy: {
    id: 'navy',
    label: 'Midnight Navy (GoodNotes)',
    bg: '#0f1f38',
    lineColor: 'rgba(255, 255, 255, 0.14)',
    defaultInk: '#ffffff',
    dotColor: 'rgba(140, 180, 240, 0.28)',
  },
  dark: {
    id: 'dark',
    label: 'Deep Charcoal',
    bg: '#161618',
    lineColor: 'rgba(255, 255, 255, 0.12)',
    defaultInk: '#ffffff',
    dotColor: 'rgba(255, 255, 255, 0.2)',
  },
};

export type NoteTemplate =
  | 'blank'
  | 'ruled'
  | 'grid'
  | 'dotted'
  | 'cornell'
  // Medicine
  | 'med_soap'
  | 'med_organ'
  // Engineering
  | 'engineering_quad'
  | 'circuit_logic'
  // Computer Science
  | 'cs_code'
  | 'cs_system'
  // Founders & Product
  | 'founder_pitch'
  | 'founder_wireframe';

export interface Note {
  id: string;
  classId: string;
  date: string;
  title: string;
  tags: string[];
  template: NoteTemplate;
  pageType: 'infinite' | 'paginated';
  paperColor?: PaperColor;
  audio?: AudioTrack[];
  createdAt: number;
  updatedAt: number;
  reminders?: { id: string; text: string; createdAt: number; date: string }[];
}

export interface AudioTrack {
  id: string;
  blob: Blob;
  duration: number;
  syncPoints: { time: number; strokeId: string }[];
}

export interface ClassItem {
  id: string;
  name: string;
  gradient: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  reminders?: { id: string; text: string; createdAt: number; date: string }[];
}

export type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'tape' | 'shapes' | 'arrow' | 'lasso' | 'text' | 'image' | 'ruler' | 'link' | 'calculator';

export interface ToolSettings {
  penWidth: number;
  penColor: string;
  penOpacity: number;
  highlighterWidth: number;
  highlighterColor: string;
  eraserWidth: number;
  eraserMode: 'stroke' | 'pixel';
  tapeColor?: string;
  tapeWidth?: number;
  studyMode?: boolean;
  smoothing: number;
  shapeType?: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow';
  holdToShape?: boolean;
  scribbleToErase?: boolean;
  palmRejection?: boolean;
  quickColors?: string[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultTemplate: NoteTemplate;
  defaultPageType?: 'infinite' | 'paginated';
  defaultPaperColor?: PaperColor;
  palmRejection: boolean;
  holdToShape?: boolean;
  scribbleToErase?: boolean;
  autosaveInterval: number;
  showSaveStatus: boolean;
  showCalculator?: boolean;
  toolbarPosition?: 'top' | 'bottom';
}

export const GRADIENT_PRESETS = [
  '#1A1A1A', // Deep Black
  '#333333', // Dark Gray
  '#EBEBEB', // Light Gray
  '#DCDCDC', // Gray
  '#FF453A', // Vibrant Red Accent
  '#FF9F0A', // Orange Accent
  '#32ADE6', // Blue Accent
];

export const INK_COLORS = [
  '#000000', '#ffffff', '#1a1a2e', '#16213e',
  '#e94560', '#ff6b6b', '#ee5a24', '#f39c12',
  '#2ecc71', '#27ae60', '#00b894', '#00cec9',
  '#0984e3', '#6c5ce7', '#a29bfe', '#fd79a8',
  '#f1c40f', '#dfe6e9', '#b2bec3', '#636e72',
];

export const TAPE_COLORS = [
  '#f59e0b', // Amber / Classic Study Tape
  '#ef4444', // Coral Red
  '#10b981', // Emerald Mint
  '#8b5cf6', // Lavender Purple
  '#3b82f6', // Sky Blue
  '#ec4899', // Pastel Pink
];
