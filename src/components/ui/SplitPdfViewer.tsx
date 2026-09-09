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
  ArrowLeftRight,
} from 'lucide-react';

export interface SplitPdfViewerProps {
  onClose: () => void;
  onInsertToNote?: (file: File) => void;
  position?: 'left' | 'right';
  onTogglePosition?: () => void;
}

// Persistent in-memory session cache for loaded PDF reference so it survives side-swapping & view toggles
let cachedPdfDoc: any = null;
let cachedFileName: string = '';
let cachedCurrentPage: number = 1;
let cachedNumPages: number = 0;
let cachedZoom: number = 1.0;

export default function SplitPdfViewer({
  onClose,
  onInsertToNote,
  position = 'left',
  onTogglePosition,
}: SplitPdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(() => cachedPdfDoc);
  const [fileName, setFileName] = useState<string>(() => cachedFileName);
  const [currentPage, setCurrentPage] = useState<number>(() => cachedCurrentPage || 1);
  const [numPages, setNumPages] = useState<number>(() => cachedNumPages || 0);
  const [zoom, setZoom] = useState<number>(() => cachedZoom || 1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [inserting, setInserting] = useState<boolean>(false);
  const [canScrollUp, setCanScrollUp] = useState<boolean>(false);
  const [canScrollDown, setCanScrollDown] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Synchronize active state with cache
  useEffect(() => {
    if (pdfDoc) {
      cachedPdfDoc = pdfDoc;
      cachedFileName = fileName;
      cachedCurrentPage = currentPage;
      cachedNumPages = numPages;
      cachedZoom = zoom;
    }
  }, [pdfDoc, fileName, currentPage, numPages, zoom]);

  const handlePdfScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 8);
    setCanScrollDown(scrollHeight - scrollTop - clientHeight > 8);
  }, []);

  // Load PDF from File
  const loadPdfFromFile = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();

      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      cachedPdfDoc = doc;
      cachedFileName = file.name;
      cachedNumPages = doc.numPages;
      cachedCurrentPage = 1;
      cachedZoom = 1.0;

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
    <div
      className={`flex flex-col w-full h-full bg-[var(--bg-primary)] text-[var(--text-primary)] ${
        position === 'right' ? 'border-l' : 'border-r'
      } border-[var(--border)] overflow-hidden select-none`}
    >
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
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] gap-2 flex-wrap shadow-sm"
        style={{ background: 'var(--toolbar-bg)', color: 'var(--text-primary)' }}
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
              className="p-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] hover:opacity-80 text-[var(--text-primary)] disabled:opacity-30 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)]">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] hover:opacity-80 text-[var(--text-primary)] disabled:opacity-30 transition-colors"
              title="Next Page"
            >
              <ChevronRight size={15} />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <button
              onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100))}
              className="p-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] hover:opacity-80 text-[var(--text-primary)] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
              className="p-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] hover:opacity-80 text-[var(--text-primary)] transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] hover:opacity-80 text-[var(--text-primary)] transition-colors"
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:opacity-80 transition-colors shadow-sm"
            title="Open another PDF document"
          >
            <FileUp size={13} />
            <span className="hidden sm:inline">{pdfDoc ? 'Change' : 'Open PDF'}</span>
          </button>

          {onTogglePosition && (
            <button
              onClick={onTogglePosition}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-blue-500/60 hover:text-blue-500 transition-colors shadow-sm"
              title={position === 'left' ? 'Move reference panel to the right side' : 'Move reference panel to the left side'}
            >
              <ArrowLeftRight size={13} className="text-blue-500 shrink-0" />
              <span className="hidden sm:inline">
                {position === 'left' ? 'Move Right' : 'Move Left'}
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] hover:opacity-80 text-[var(--text-primary)] transition-colors shadow-sm"
            title="Close Split View"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-[var(--bg-secondary)]">
        <div
          ref={scrollContainerRef}
          onScroll={handlePdfScroll}
          className="w-full h-full overflow-auto p-4 flex items-center justify-center relative"
        >
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

        {/* Top Blur Blend (Fades in when scrolling) */}
        <div
          className={`pointer-events-none absolute top-0 left-0 right-0 h-10 z-20 transition-opacity duration-300 ${
            canScrollUp ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to bottom, var(--bg-secondary) 0%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
          }}
        />

        {/* Bottom Blur Blend (Fades in when scrolling) */}
        <div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-10 z-20 transition-opacity duration-300 ${
            canScrollDown ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to top, var(--bg-secondary) 0%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}
