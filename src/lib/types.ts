export interface Point {
  x: number;
  y: number;
  pressure: number;
  t: number;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  opacity: number;
  points: Point[];
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

export interface Note {
  id: string;
  classId: string;
  date: string;
  title: string;
  tags: string[];
  template: 'blank' | 'ruled' | 'grid' | 'dotted' | 'cornell';
  pageType: 'infinite' | 'paginated';
  audio?: AudioTrack[];
  createdAt: number;
  updatedAt: number;
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
}

export type Tool = 'pen' | 'highlighter' | 'eraser' | 'shapes' | 'arrow' | 'lasso' | 'text' | 'image' | 'ruler' | 'link' | 'calculator';

export interface ToolSettings {
  penWidth: number;
  penColor: string;
  penOpacity: number;
  highlighterWidth: number;
  highlighterColor: string;
  eraserWidth: number;
  eraserMode: 'stroke' | 'pixel';
  smoothing: number;
  shapeType?: 'rect' | 'circle' | 'triangle' | 'line';
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultTemplate: 'blank' | 'ruled' | 'grid' | 'dotted' | 'cornell';
  palmRejection: boolean;
  autosaveInterval: number;
  showSaveStatus: boolean;
  showCalculator?: boolean;
}

export const GRADIENT_PRESETS = [
  '#F4F4F5', // Zinc 100
  '#FEE2E2', // Red 100
  '#FEF3C7', // Amber 100
  '#DCFCE7', // Green 100
  '#DBEAFE', // Blue 100
  '#F3E8FF', // Purple 100
  '#FCE7F3', // Pink 100
  '#E0E7FF', // Indigo 100
  '#FFEDD5', // Orange 100
  '#ECFEFF', // Cyan 100
];

export const INK_COLORS = [
  '#000000', '#1a1a2e', '#16213e', '#0f3460',
  '#e94560', '#ff6b6b', '#ee5a24', '#f39c12',
  '#2ecc71', '#27ae60', '#00b894', '#00cec9',
  '#0984e3', '#6c5ce7', '#a29bfe', '#fd79a8',
  '#ffffff', '#dfe6e9', '#b2bec3', '#636e72',
];
