'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ImageBlock, Tool } from '@/lib/types';
import { Lock, Unlock, Copy, Trash2, AlertCircle, GripVertical, Crop, Check, RotateCcw, X } from 'lucide-react';

interface ImageElementOverlayProps {
  image: ImageBlock;
  isSelected: boolean;
  onSelect: (isMulti?: boolean) => void;
  onUpdate: (updates: Partial<ImageBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  zoom?: number;
  tool?: Tool;
  isCropping?: boolean;
  onSetCropping?: (cropping: boolean) => void;
  onStartMove?: () => void;
  onMoveDelta?: (dx: number, dy: number) => void;
  onEndMove?: () => void;
  showSingleBar?: boolean;
}

export default function ImageElementOverlay({
  image,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  zoom = 1,
  tool = 'pen',
  isCropping: propIsCropping,
  onSetCropping,
  onStartMove,
  onMoveDelta,
  onEndMove,
  showSingleBar = true,
}: ImageElementOverlayProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [localIsCropping, setLocalIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState({ top: 0, right: 0, bottom: 0, left: 0 }); // Percentages 0-100

  const isCropping = propIsCropping !== undefined ? propIsCropping : localIsCropping;
  const setIsCropping = (val: boolean) => {
    setLocalIsCropping(val);
    onSetCropping?.(val);
  };

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0, initW: 0, initH: 0, handle: '' });

  const isCroppingDragRef = useRef(false);
  const cropDragStartRef = useRef({ startX: 0, startY: 0, initCrop: { top: 0, right: 0, bottom: 0, left: 0 }, handle: '' });

  // Handle Drag Move (repositioning element)
  function handleDragPointerDown(e: React.PointerEvent) {
    if (image.locked || isCropping) return;
    e.stopPropagation();
    onSelect(e.shiftKey);
    onStartMove?.();
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: image.x,
      initY: image.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleDragPointerMove(e: React.PointerEvent) {
    if (isDraggingRef.current && !image.locked && !isCropping) {
      e.stopPropagation();
      const dx = (e.clientX - dragStartRef.current.startX) / zoom;
      const dy = (e.clientY - dragStartRef.current.startY) / zoom;
      if (onMoveDelta) {
        onMoveDelta(dx, dy);
      } else {
        onUpdate({
          x: Math.round(dragStartRef.current.initX + dx),
          y: Math.round(dragStartRef.current.initY + dy),
        });
      }
      return;
    }

    // 4-Corner Stretch / Resize
    if (isResizingRef.current && !image.locked && !isCropping) {
      e.stopPropagation();
      const dx = (e.clientX - resizeStartRef.current.startX) / zoom;
      const dy = (e.clientY - resizeStartRef.current.startY) / zoom;
      const { initX, initY, initW, initH, handle } = resizeStartRef.current;

      let newW = initW;
      let newH = initH;
      let newX = initX;
      let newY = initY;

      if (handle === 'se') {
        newW = Math.max(80, initW + dx);
        newH = Math.max(60, initH + dy);
        onUpdate({ width: Math.round(newW), height: Math.round(newH) });
      } else if (handle === 'sw') {
        newW = Math.max(80, initW - dx);
        newH = Math.max(60, initH + dy);
        newX = initX + (initW - newW);
        onUpdate({ x: Math.round(newX), width: Math.round(newW), height: Math.round(newH) });
      } else if (handle === 'ne') {
        newW = Math.max(80, initW + dx);
        newH = Math.max(60, initH - dy);
        newY = initY + (initH - newH);
        onUpdate({ y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      } else if (handle === 'nw') {
        newW = Math.max(80, initW - dx);
        newH = Math.max(60, initH - dy);
        newX = initX + (initW - newW);
        newY = initY + (initH - newH);
        onUpdate({ x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      }
    }
  }

  function handleDragPointerUp(e: React.PointerEvent) {
    if (isDraggingRef.current) {
      e.stopPropagation();
      isDraggingRef.current = false;
      onEndMove?.();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (isResizingRef.current) {
      e.stopPropagation();
      isResizingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }

  // Handle Resize Corner Down
  function handleResizePointerDown(e: React.PointerEvent, handle: string) {
    if (image.locked || isCropping) return;
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: image.x,
      initY: image.y,
      initW: image.width,
      initH: image.height,
      handle,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  // Crop Handles Interaction
  function handleCropPointerDown(e: React.PointerEvent, handle: string) {
    e.stopPropagation();
    isCroppingDragRef.current = true;
    cropDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initCrop: { ...cropRect },
      handle,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleCropPointerMove(e: React.PointerEvent) {
    if (!isCroppingDragRef.current) return;
    e.stopPropagation();
    const dx = (e.clientX - cropDragStartRef.current.startX) / zoom;
    const dy = (e.clientY - cropDragStartRef.current.startY) / zoom;
    const dxPercent = (dx / image.width) * 100;
    const dyPercent = (dy / image.height) * 100;
    const { initCrop, handle } = cropDragStartRef.current;

    let newTop = initCrop.top;
    let newBottom = initCrop.bottom;
    let newLeft = initCrop.left;
    let newRight = initCrop.right;

    if (handle.includes('top') || handle.includes('n')) {
      newTop = Math.min(100 - newBottom - 5, Math.max(0, initCrop.top + dyPercent));
    }
    if (handle.includes('bottom') || handle.includes('s')) {
      newBottom = Math.min(100 - newTop - 5, Math.max(0, initCrop.bottom - dyPercent));
    }
    if (handle.includes('left') || handle.includes('w')) {
      newLeft = Math.min(100 - newRight - 5, Math.max(0, initCrop.left + dxPercent));
    }
    if (handle.includes('right') || handle.includes('e')) {
      newRight = Math.min(100 - newLeft - 5, Math.max(0, initCrop.right - dxPercent));
    }

    setCropRect({
      top: Math.round(newTop * 10) / 10,
      bottom: Math.round(newBottom * 10) / 10,
      left: Math.round(newLeft * 10) / 10,
      right: Math.round(newRight * 10) / 10,
    });
  }

  function handleCropPointerUp(e: React.PointerEvent) {
    if (isCroppingDragRef.current) {
      e.stopPropagation();
      isCroppingDragRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }

  // Apply Crop Action
  function handleApplyCrop() {
    if (cropRect.top === 0 && cropRect.bottom === 0 && cropRect.left === 0 && cropRect.right === 0) {
      setIsCropping(false);
      return;
    }

    const baseSrc = image.originalSrc || image.src;
    const img = new Image();

    if (baseSrc.startsWith('http://') || baseSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    const performCrop = () => {
      try {
        const naturalW = img.naturalWidth || image.width;
        const naturalH = img.naturalHeight || image.height;

        const sx = (cropRect.left / 100) * naturalW;
        const sy = (cropRect.top / 100) * naturalH;
        const sw = Math.max(1, ((100 - cropRect.left - cropRect.right) / 100) * naturalW);
        const sh = Math.max(1, ((100 - cropRect.top - cropRect.bottom) / 100) * naturalH);

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sw));
        canvas.height = Math.max(1, Math.round(sh));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          const croppedDataUrl = canvas.toDataURL('image/png');

          const newWidth = Math.round(image.width * ((100 - cropRect.left - cropRect.right) / 100));
          const newHeight = Math.round(image.height * ((100 - cropRect.top - cropRect.bottom) / 100));
          const newX = Math.round(image.x + (cropRect.left / 100) * image.width);
          const newY = Math.round(image.y + (cropRect.top / 100) * image.height);

          onUpdate({
            src: croppedDataUrl,
            originalSrc: baseSrc,
            width: Math.max(60, newWidth),
            height: Math.max(40, newHeight),
            x: newX,
            y: newY,
          });
        }
      } catch (err) {
        console.error('Error applying crop:', err);
      } finally {
        setIsCropping(false);
        setCropRect({ top: 0, right: 0, bottom: 0, left: 0 });
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      performCrop();
    } else {
      img.onload = performCrop;
      img.onerror = () => {
        console.error('Image failed to load for crop');
        setIsCropping(false);
        setCropRect({ top: 0, right: 0, bottom: 0, left: 0 });
      };
      img.src = baseSrc;
    }
  }

  // Reset Crop to Original Full Image
  function handleResetCrop() {
    if (image.originalSrc) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const restoredH = Math.round(image.width / aspectRatio);
        onUpdate({
          src: image.originalSrc,
          height: restoredH,
        });
      };
      img.src = image.originalSrc;
    }
    setCropRect({ top: 0, right: 0, bottom: 0, left: 0 });
  }

  const isSelectOrMoveTool = tool === 'select' || tool === 'image' || tool === 'lasso';
  const bodyPointerEvents = (isSelectOrMoveTool && !image.locked && !isCropping) ? 'auto' : 'none';

  return (
    <div
      className="absolute group select-none pointer-events-none"
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        height: image.height,
        zIndex: isSelected ? 35 : 10,
      }}
    >
      {/* 1. Underlying PDF / Image Content */}
      <div
        className="w-full h-full relative"
        onPointerDown={isSelectOrMoveTool ? handleDragPointerDown : undefined}
        onPointerMove={isSelectOrMoveTool ? handleDragPointerMove : undefined}
        onPointerUp={isSelectOrMoveTool ? handleDragPointerUp : undefined}
        style={{
          pointerEvents: bodyPointerEvents,
          cursor: image.locked ? 'default' : isSelectOrMoveTool ? 'grab' : 'default',
        }}
      >
        <img
          src={image.src}
          alt="Document element"
          draggable={false}
          className={`w-full h-full object-contain rounded-xl shadow-md transition-opacity ${
            image.locked ? 'opacity-95' : 'opacity-100'
          }`}
          style={{ pointerEvents: 'none' }}
        />
      </div>

      {/* 2. Top Header Grip / Selection Pill */}
      {!isCropping && (
        <div
          className={`absolute -top-9 left-2 flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel shadow-lg pointer-events-auto transition-all cursor-pointer ${
            isSelected
              ? 'border-2 border-[var(--accent)] bg-[var(--accent)] text-white shadow-xl'
              : image.locked
              ? 'bg-amber-500/90 text-white hover:bg-amber-600'
              : 'border border-black/10 dark:border-white/10 hover:border-[var(--accent)] text-[var(--text-primary)] hover:scale-105'
          }`}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(e.shiftKey);
            if (!image.locked && !isCropping) {
              handleDragPointerDown(e);
            }
          }}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(e.shiftKey);
          }}
          title={image.locked ? 'Document is locked. Tap to select & unlock.' : 'Drag header to move PDF. Shift+Click to multi-select.'}
        >
          {image.locked ? (
            <Lock size={12} className="shrink-0" />
          ) : (
            <GripVertical size={12} className="shrink-0 opacity-70" />
          )}
          <span className="text-[11px] font-bold tracking-tight">
            {image.locked ? 'Locked Document' : 'Document'}
          </span>
        </div>
      )}

      {/* 3. Selected Bounding Box Outline & 4 Corner Stretch Handles */}
      {isSelected && !isCropping && (
        <div className="absolute inset-0 rounded-xl border-2 border-[var(--accent)] ring-4 ring-[var(--accent)]/20 pointer-events-none">
          {!image.locked && (
            <>
              {/* Top-Left Corner Dot (Stretch NW) */}
              <div
                className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--accent)] shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
                onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                title="Drag to stretch / resize (Top-Left)"
              />
              {/* Top-Right Corner Dot (Stretch NE) */}
              <div
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--accent)] shadow-lg cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
                onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                title="Drag to stretch / resize (Top-Right)"
              />
              {/* Bottom-Left Corner Dot (Stretch SW) */}
              <div
                className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--accent)] shadow-lg cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
                onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                title="Drag to stretch / resize (Bottom-Left)"
              />
              {/* Bottom-Right Corner Dot (Stretch SE) */}
              <div
                className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--accent)] shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
                onPointerDown={(e) => handleResizePointerDown(e, 'se')}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                title="Drag to stretch / resize (Bottom-Right)"
              />
            </>
          )}
        </div>
      )}

      {/* 4. Interactive Crop Mode Frame & Grid */}
      {isCropping && (
        <div
          className="absolute inset-0 z-40 pointer-events-auto select-none rounded-xl overflow-hidden"
          onPointerMove={handleCropPointerMove}
          onPointerUp={handleCropPointerUp}
        >
          {/* Darkened backdrop masks */}
          <div
            className="absolute top-0 left-0 right-0 bg-black/55 pointer-events-none"
            style={{ height: `${cropRect.top}%` }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/55 pointer-events-none"
            style={{ height: `${cropRect.bottom}%` }}
          />
          <div
            className="absolute left-0 bg-black/55 pointer-events-none"
            style={{
              top: `${cropRect.top}%`,
              bottom: `${cropRect.bottom}%`,
              width: `${cropRect.left}%`,
            }}
          />
          <div
            className="absolute right-0 bg-black/55 pointer-events-none"
            style={{
              top: `${cropRect.top}%`,
              bottom: `${cropRect.bottom}%`,
              width: `${cropRect.right}%`,
            }}
          />

          {/* Active Crop Frame */}
          <div
            className="absolute border-2 border-white shadow-2xl pointer-events-auto"
            style={{
              top: `${cropRect.top}%`,
              left: `${cropRect.left}%`,
              right: `${cropRect.right}%`,
              bottom: `${cropRect.bottom}%`,
            }}
          >
            {/* Rule-of-Thirds Grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
            </div>

            {/* Corner Crop L-Handles */}
            <div
              className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-white cursor-nwse-resize hover:scale-125 drop-shadow-lg"
              onPointerDown={(e) => handleCropPointerDown(e, 'nw')}
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-white cursor-nesw-resize hover:scale-125 drop-shadow-lg"
              onPointerDown={(e) => handleCropPointerDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-white cursor-nesw-resize hover:scale-125 drop-shadow-lg"
              onPointerDown={(e) => handleCropPointerDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-white cursor-nwse-resize hover:scale-125 drop-shadow-lg"
              onPointerDown={(e) => handleCropPointerDown(e, 'se')}
            />

            {/* Edge Midpoint Crop Bars */}
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-white border border-black/30 shadow-md cursor-ns-resize hover:scale-125"
              onPointerDown={(e) => handleCropPointerDown(e, 'top')}
            />
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-white border border-black/30 shadow-md cursor-ns-resize hover:scale-125"
              onPointerDown={(e) => handleCropPointerDown(e, 'bottom')}
            />
            <div
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full bg-white border border-black/30 shadow-md cursor-ew-resize hover:scale-125"
              onPointerDown={(e) => handleCropPointerDown(e, 'left')}
            />
            <div
              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full bg-white border border-black/30 shadow-md cursor-ew-resize hover:scale-125"
              onPointerDown={(e) => handleCropPointerDown(e, 'right')}
            />

            {/* Dedicated On-Frame Action Pill (Green Tick & Red Close directly on the crop box!) */}
            <div
              className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-black/10 dark:border-white/10 pointer-events-auto z-50 animate-fade-in"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Green Tick Button */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyCrop();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                title="Apply crop (Green tick)"
              >
                <Check size={16} strokeWidth={3} />
                <span>Apply</span>
              </button>

              {/* Reset */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetCrop();
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)] transition-all shadow-sm"
                title="Reset crop"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              {/* Red Close Button */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setIsCropping(false);
                  setCropRect({ top: 0, right: 0, bottom: 0, left: 0 });
                }}
                className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                title="Cancel crop (Red close)"
              >
                <X size={16} strokeWidth={2.8} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating Action Bar (When selected and single bar mode active) */}
      {isSelected && showSingleBar && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel shadow-2xl z-50 pointer-events-auto border border-black/10 dark:border-white/10 animate-fade-in whitespace-nowrap"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Standard Mode: Lock | Duplicate | Crop | Delete */}
          {!isCropping && !isConfirmingDelete && (
            <>
              {/* 1. Lock / Unlock */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ locked: !image.locked });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  image.locked
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)]'
                }`}
                title={image.locked ? 'Unlock document (⌘L)' : 'Lock document (⌘L)'}
              >
                {image.locked ? <Lock size={13} /> : <Unlock size={13} />}
                <span>{image.locked ? 'Locked' : 'Lock'}</span>
              </button>

              {/* 2. Duplicate */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)] transition-all shadow-sm"
                title="Duplicate document (⌘D)"
              >
                <Copy size={13} />
                <span>Duplicate</span>
              </button>

              {/* 3. Crop (In between Duplicate and Delete!) */}
              <button
                type="button"
                disabled={image.locked}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCropping(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  image.locked
                    ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/10 text-[var(--text-muted)]'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)]'
                }`}
                title="Crop document (Shift+C)"
              >
                <Crop size={13} />
                <span>Crop</span>
              </button>

              {/* 4. Delete */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1.5 transition-all shadow-sm"
                title="Delete document (Delete / Backspace)"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}

          {/* Cropping Mode in Top Bar: Green Tick | Reset | Red Close */}
          {isCropping && (
            <div className="flex items-center gap-2 animate-fade-in" onPointerDown={(e) => e.stopPropagation()}>
              {/* Green Tick Button */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleApplyCrop}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md active:scale-95"
                title="Apply crop (Green tick)"
              >
                <Check size={15} strokeWidth={3} />
                <span>Done</span>
              </button>

              {/* Reset */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleResetCrop}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-primary)] transition-all shadow-sm"
                title="Reset to original full document"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              {/* Red Close Button */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setIsCropping(false);
                  setCropRect({ top: 0, right: 0, bottom: 0, left: 0 });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white transition-all shadow-md active:scale-95"
                title="Cancel crop (Red close)"
              >
                <X size={15} strokeWidth={2.8} />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* Delete Confirmation State */}
          {isConfirmingDelete && !isCropping && (
            <div
              className="flex items-center gap-2 px-2 py-0.5 animate-fade-in"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertCircle size={13} />
                Delete element?
              </span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Delete
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(false);
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
