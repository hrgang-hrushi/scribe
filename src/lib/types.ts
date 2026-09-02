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
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultTemplate: 'blank' | 'ruled' | 'grid' | 'dotted' | 'cornell';
  palmRejection: boolean;
  autosaveInterval: number;
  showSaveStatus: boolean;
}

export const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6a88 50%, #ffd194 100%)',
  'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'radial-gradient(circle at 20% 80%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #764ba2 0%, transparent 50%)',
  'radial-gradient(circle at 30% 70%, #4facfe 0%, transparent 50%), radial-gradient(circle at 70% 30%, #00f2fe 0%, transparent 50%)',
];

export const INK_COLORS = [
  '#000000', '#1a1a2e', '#16213e', '#0f3460',
  '#e94560', '#ff6b6b', '#ee5a24', '#f39c12',
  '#2ecc71', '#27ae60', '#00b894', '#00cec9',
  '#0984e3', '#6c5ce7', '#a29bfe', '#fd79a8',
  '#ffffff', '#dfe6e9', '#b2bec3', '#636e72',
];
