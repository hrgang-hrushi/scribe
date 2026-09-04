'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileUp,
  ArrowRightCircle,
  X,
  Loader2,
  BookOpen,
} from 'lucide-react';

export interface SplitPdfViewerProps {
  onClose: () => void;
  onInsertToNote?: (file: File) => void;
}

export default function SplitPdfViewer({ onClose, onInsertToNote }: SplitPdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [inserting, setInserting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF from File
  const loadPdfFromFile = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();

      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load reference PDF:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadPdfFromFile(file);
    }
  };

  // Render current PDF page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: zoom });

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom]);

  // Handle "Insert Page into Notebook"
  const handleInsertToNote = async () => {
    if (!canvasRef.current || !onInsertToNote) return;
    try {
      setInserting(true);
      const canvas = canvasRef.current;

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `pdf-ref-page-${currentPage}.png`, { type: 'image/png' });
          onInsertToNote(file);
        }
        setInserting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Insert to note error:', err);
      setInserting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[var(--bg-primary)] text-[var(--text-primary)] border-r border-[var(--border)] overflow-hidden select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header Controls Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] gap-2 flex-wrap"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={16} className="text-blue-500 shrink-0" />
          <span className="text-xs font-semibold truncate max-w-[130px] sm:max-w-[180px]">
            {fileName || 'PDF Reference'}
          </span>
        </div>

        {/* Page & Zoom Navigation */}
        {pdfDoc && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono px-1">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <button
              onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100))}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-[11px] font-mono px-0.5">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
              title="Reset 100%"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {pdfDoc && onInsertToNote && (
            <button
              onClick={handleInsertToNote}
              disabled={inserting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm"
              title="Clip & insert this PDF page into your active notebook"
            >
              {inserting ? <Loader2 size={12} className="animate-spin" /> : <ArrowRightCircle size={13} />}
              <span className="hidden sm:inline">Clip to Note</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Open another PDF document"
          >
            <FileUp size={13} />
            <span className="hidden sm:inline">{pdfDoc ? 'Change' : 'Open PDF'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-neutral-400 hover:text-white transition-colors"
            title="Close Split View"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[var(--bg-secondary)] relative">
        {loading && (
          <div className="flex flex-col items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span>Rendering PDF document...</span>
          </div>
        )}

        {!loading && !pdfDoc && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
              <BookOpen size={24} />
            </div>
            <h4 className="text-sm font-bold mb-1">Sidecar PDF Reference</h4>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Open course lecture slides, research papers, or textbooks side-by-side with your Scribe notebook.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <FileUp size={15} />
              <span>Select PDF File</span>
            </button>
          </div>
        )}

        <div className={`shadow-2xl rounded-lg overflow-hidden border border-[var(--border)] ${!pdfDoc || loading ? 'hidden' : 'block'}`}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
