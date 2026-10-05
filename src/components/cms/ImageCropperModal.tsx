'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Crop as CropIcon,
  RotateCw,
  Check,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageUrl: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
}

type AspectRatioType = 'free' | '16:9' | '4:3' | '1:1' | '3:2' | '9:16';

interface CropBox {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

export function ImageCropperModal({
  isOpen,
  imageUrl,
  onCropComplete,
  onClose,
}: ImageCropperModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('free');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, width: 80, height: 80 });
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Mount effect for SSR portal safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);

  // Drag interaction state
  const dragRef = useRef<{
    isDragging: boolean;
    handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
    startX: number;
    startY: number;
    startBox: CropBox;
  }>({
    isDragging: false,
    handle: null,
    startX: 0,
    startY: 0,
    startBox: { x: 10, y: 10, width: 80, height: 80 },
  });

  // Calculate default crop box for given aspect ratio
  const calculateDefaultBoxForRatio = useCallback(
    (ratio: AspectRatioType, imgW: number, imgH: number): CropBox => {
      if (!imgW || !imgH || ratio === 'free') {
        return { x: 10, y: 10, width: 80, height: 80 };
      }

      let targetRatio = 1;
      if (ratio === '16:9') targetRatio = 16 / 9;
      else if (ratio === '4:3') targetRatio = 4 / 3;
      else if (ratio === '1:1') targetRatio = 1;
      else if (ratio === '3:2') targetRatio = 3 / 2;
      else if (ratio === '9:16') targetRatio = 9 / 16;

      const imgRatio = imgW / imgH;

      let boxW = 85;
      let boxH = 85;

      if (targetRatio > imgRatio) {
        // Target is wider than image: constrained by width
        boxW = 90;
        boxH = (boxW * imgRatio) / targetRatio;
      } else {
        // Target is taller than image: constrained by height
        boxH = 90;
        boxW = (boxH * targetRatio) / imgRatio;
      }

      // Bound to max 95%
      boxW = Math.min(95, Math.max(15, boxW));
      boxH = Math.min(95, Math.max(15, boxH));

      const x = Math.max(0, (100 - boxW) / 2);
      const y = Math.max(0, (100 - boxH) / 2);

      return { x, y, width: boxW, height: boxH };
    },
    []
  );

  // Load natural dimensions when image changes or modal opens
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setImageError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setCropBox(calculateDefaultBoxForRatio(aspectRatio, img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      // Fallback try without crossOrigin
      const fallback = new Image();
      fallback.onload = () => {
        setNaturalSize({ width: fallback.naturalWidth, height: fallback.naturalHeight });
        setCropBox(calculateDefaultBoxForRatio(aspectRatio, fallback.naturalWidth, fallback.naturalHeight));
      };
      fallback.onerror = () => {
        setImageError('Unable to load image for cropping. The image may have CORS restrictions.');
      };
      fallback.src = imageUrl;
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl, aspectRatio, calculateDefaultBoxForRatio]);

  // Bulletproof background scroll lock, deactivate background, and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Unfocus any active element in the background
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Save previous documentElement styles
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    // Save previous body styles
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const prevBodyPaddingRight = document.body.style.paddingRight;

    // Freeze documentElement & body completely in place
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Explicitly prevent any wheel or touchmove from propagating to background
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    // Escape key listener to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', handleKeyDown);

      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;

      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      document.body.style.paddingRight = prevBodyPaddingRight;

      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  // Handle aspect ratio change
  const handleSelectRatio = (ratio: AspectRatioType) => {
    setAspectRatio(ratio);
    if (naturalSize.width > 0 && naturalSize.height > 0) {
      setCropBox(calculateDefaultBoxForRatio(ratio, naturalSize.width, naturalSize.height));
    }
  };

  // Mouse & Touch move handler
  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragRef.current.isDragging || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    const deltaXPercent = ((clientX - dragRef.current.startX) / containerRect.width) * 100;
    const deltaYPercent = ((clientY - dragRef.current.startY) / containerRect.height) * 100;

    const { handle, startBox } = dragRef.current;

    let newX = startBox.x;
    let newY = startBox.y;
    let newW = startBox.width;
    let newH = startBox.height;

    if (handle === 'move') {
      newX = Math.max(0, Math.min(100 - startBox.width, startBox.x + deltaXPercent));
      newY = Math.max(0, Math.min(100 - startBox.height, startBox.y + deltaYPercent));
    } else {
      // Handle corner and edge resizing
      if (handle?.includes('e')) {
        newW = Math.max(10, Math.min(100 - startBox.x, startBox.width + deltaXPercent));
      }
      if (handle?.includes('s')) {
        newH = Math.max(10, Math.min(100 - startBox.y, startBox.height + deltaYPercent));
      }
      if (handle?.includes('w')) {
        const potentialW = startBox.width - deltaXPercent;
        if (potentialW >= 10 && startBox.x + deltaXPercent >= 0) {
          newX = startBox.x + deltaXPercent;
          newW = potentialW;
        }
      }
      if (handle?.includes('n')) {
        const potentialH = startBox.height - deltaYPercent;
        if (potentialH >= 10 && startBox.y + deltaYPercent >= 0) {
          newY = startBox.y + deltaYPercent;
          newH = potentialH;
        }
      }
    }

    setCropBox({
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: Math.round(newW * 10) / 10,
      height: Math.round(newH * 10) / 10,
    });
  }, []);

  // Mouse & Touch up handler
  const handleStopDrag = useCallback(() => {
    dragRef.current.isDragging = false;
    dragRef.current.handle = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleDragging);
      window.removeEventListener('mouseup', handleStopDrag);
      window.removeEventListener('touchmove', handleDragging);
      window.removeEventListener('touchend', handleStopDrag);
    }
  }, [handleDragging]);

  // Safety cleanup if unmounted while dragging
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleDragging);
        window.removeEventListener('mouseup', handleStopDrag);
        window.removeEventListener('touchmove', handleDragging);
        window.removeEventListener('touchend', handleStopDrag);
      }
    };
  }, [handleDragging, handleStopDrag]);

  // Mouse & Touch down handler
  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      isDragging: true,
      handle,
      startX: clientX,
      startY: clientY,
      startBox: { ...cropBox },
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleDragging);
      window.addEventListener('mouseup', handleStopDrag);
      window.addEventListener('touchmove', handleDragging);
      window.addEventListener('touchend', handleStopDrag);
    }
  };

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleDragging);
        window.removeEventListener('mouseup', handleStopDrag);
        window.removeEventListener('touchmove', handleDragging);
        window.removeEventListener('touchend', handleStopDrag);
      }
    };
  }, [handleDragging, handleStopDrag]);

  // Apply Crop and generate high-fidelity output
  const handleApplyCrop = async () => {
    if (!naturalSize.width || !naturalSize.height) return;

    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          // Fallback without crossOrigin
          const fallback = new Image();
          fallback.onload = () => resolve();
          fallback.onerror = (e) => reject(e);
          fallback.src = imageUrl;
        };
        img.src = imageUrl;
      });

      // Calculate pixel coordinates from percentage crop box
      const pixelX = Math.round((cropBox.x / 100) * naturalSize.width);
      const pixelY = Math.round((cropBox.y / 100) * naturalSize.height);
      const pixelW = Math.round((cropBox.width / 100) * naturalSize.width);
      const pixelH = Math.round((cropBox.height / 100) * naturalSize.height);

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, pixelW);
      canvas.height = Math.max(1, pixelH);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get 2D canvas context');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the cropped section
      ctx.drawImage(
        img,
        pixelX,
        pixelY,
        pixelW,
        pixelH,
        0,
        0,
        pixelW,
        pixelH
      );

      // Handle optional rotation if applied
      if (rotation !== 0) {
        const rotCanvas = document.createElement('canvas');
        const isOrthogonal = rotation === 90 || rotation === 270;
        rotCanvas.width = isOrthogonal ? canvas.height : canvas.width;
        rotCanvas.height = isOrthogonal ? canvas.width : canvas.height;
        const rotCtx = rotCanvas.getContext('2d');
        if (rotCtx) {
          rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rotCtx.rotate((rotation * Math.PI) / 180);
          rotCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
          const croppedDataUrl = rotCanvas.toDataURL('image/jpeg', 0.92);
          onCropComplete(croppedDataUrl);
          setIsProcessing(false);
          return;
        }
      }

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
    } catch (err: any) {
      alert(`Could not crop image: ${err?.message || 'Canvas security restriction'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  // Approximate pixel output size
  const outputW = Math.round((cropBox.width / 100) * (naturalSize.width || 800));
  const outputH = Math.round((cropBox.height / 100) * (naturalSize.height || 600));

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop and Frame Photo"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden overscroll-none touch-none"
      onClick={(e) => {
        e.stopPropagation();
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Full-screen Backdrop Interceptor: deactivates background and closes on backdrop click */}
      <div
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-hidden="true"
        title="Click background to close"
      />

      {/* Light Theme Modal Window with Clear High-Contrast Styling */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-4xl bg-white text-neutral-900 rounded-xl shadow-2xl border border-[#dadce0] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* ========================================================
            HEADER: LIGHT & CRISP WITH LARGE READABLE TEXT
            ======================================================== */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-b border-[#dadce0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E27A2B]/15 border border-[#E27A2B]/40 flex items-center justify-center text-[#E27A2B] shrink-0 shadow-xs">
              <CropIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#0C2340] tracking-tight">
                  Crop &amp; Frame Image
                </h3>
              </div>
              {naturalSize.width > 0 && (
                <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-0.5">
                  Original: <span className="font-bold text-neutral-800">{naturalSize.width} × {naturalSize.height} px</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            TOOLBAR: PROPORTION BUTTONS & TOOLS (LARGE & VISIBLE)
            ======================================================== */}
        <div className="px-6 py-3.5 bg-white border-b border-[#dadce0] flex items-center justify-between gap-4 flex-wrap text-sm">
          {/* Aspect Ratio Buttons with Large Clear Text */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold uppercase text-xs sm:text-sm text-neutral-700 tracking-wider mr-1">
              Proportion:
            </span>
            {(
              [
                { id: 'free', label: 'Freeform' },
                { id: '16:9', label: '16:9 Wide' },
                { id: '4:3', label: '4:3 Standard' },
                { id: '1:1', label: '1:1 Square' },
                { id: '3:2', label: '3:2 Classic' },
                { id: '9:16', label: '9:16 Story' },
              ] as const
            ).map((r) => {
              const isSelected = aspectRatio === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRatio(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E27A2B] text-white shadow-sm ring-1 ring-[#d46a1d]'
                      : 'bg-[#f8f9fa] hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Tools: Rotate & Reset with Clear Labels */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer bg-[#f8f9fa] hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-xs sm:text-sm font-bold shadow-xs transition-colors"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-4 h-4 text-[#E27A2B]" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRotation(0);
                setAspectRatio('free');
                setCropBox({ x: 10, y: 10, width: 80, height: 80 });
              }}
              className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer bg-[#f8f9fa] hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-xs sm:text-sm font-bold shadow-xs transition-colors"
              title="Reset crop to full image"
            >
              <RefreshCw className="w-4 h-4 text-neutral-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CANVAS: LIGHT STAGE WITH CLEAR FRAMING
            ======================================================== */}
        <div
          className="flex-1 p-6 sm:p-8 flex items-center justify-center overflow-hidden min-h-[350px] bg-[#f1f3f4] relative select-none"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
            backgroundSize: '16px 16px',
          }}
        >
          {imageError ? (
            <div className="text-center p-6 bg-red-50 border border-red-300 text-red-700 rounded-lg max-w-md text-sm shadow-sm">
              <p className="font-bold text-base mb-1">Image Loading Error</p>
              <p>{imageError}</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative max-w-full max-h-[56vh] flex items-center justify-center select-none shadow-xl rounded"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Target Image */}
              <img
                ref={imageElementRef}
                src={imageUrl}
                alt="Crop preview"
                className="max-w-full max-h-[54vh] object-contain rounded pointer-events-none block shadow-md border border-neutral-300"
              />

              {/* Darkened Mask Outside Crop Box */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%,
                    0% 0%,
                    ${cropBox.x}% ${cropBox.y}%,
                    ${cropBox.x}% ${cropBox.y + cropBox.height}%,
                    ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%,
                    ${cropBox.x + cropBox.width}% ${cropBox.y}%,
                    ${cropBox.x}% ${cropBox.y}%
                  )`,
                }}
              />

              {/* Interactive Crop Box Overlay */}
              <div
                onMouseDown={(e) => handleStartDrag(e, 'move')}
                onTouchStart={(e) => handleStartDrag(e, 'move')}
                className="absolute border-2 border-white shadow-2xl cursor-move group ring-2 ring-[#E27A2B]"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
              >
                {/* Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Horizontal grid lines */}
                  <div className="absolute left-0 right-0 top-1/3 h-[1px] bg-white/60 border-t border-dashed border-amber-300" />
                  <div className="absolute left-0 right-0 top-2/3 h-[1px] bg-white/60 border-t border-dashed border-amber-300" />
                  {/* Vertical grid lines */}
                  <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-white/60 border-l border-dashed border-amber-300" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-[1px] bg-white/60 border-l border-dashed border-amber-300" />
                </div>

                {/* Dimension Badge (Large, Bold & Readable) */}
                <div className="absolute bottom-3 right-3 bg-[#0C2340] text-amber-300 border border-amber-400/60 font-mono text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full pointer-events-none shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E27A2B] animate-pulse" />
                  <span>{outputW} × {outputH} px</span>
                  {aspectRatio !== 'free' && <span className="text-white/90 font-sans">({aspectRatio})</span>}
                </div>

                {/* Corner Resize Handles (Blogger Orange with White Outlines) */}
                {/* Top-Left NW */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'nw')}
                  onTouchStart={(e) => handleStartDrag(e, 'nw')}
                  className="absolute -top-2 -left-2 w-4 h-4 bg-[#E27A2B] border-2 border-white rounded-xs cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                />
                {/* Top-Right NE */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'ne')}
                  onTouchStart={(e) => handleStartDrag(e, 'ne')}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-[#E27A2B] border-2 border-white rounded-xs cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                />
                {/* Bottom-Left SW */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'sw')}
                  onTouchStart={(e) => handleStartDrag(e, 'sw')}
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#E27A2B] border-2 border-white rounded-xs cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                />
                {/* Bottom-Right SE */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'se')}
                  onTouchStart={(e) => handleStartDrag(e, 'se')}
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#E27A2B] border-2 border-white rounded-xs cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                />

                {/* Edge Handles */}
                {/* Top N */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'n')}
                  onTouchStart={(e) => handleStartDrag(e, 'n')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-7 h-2.5 bg-white border border-[#0C2340] rounded-full cursor-ns-resize shadow"
                />
                {/* Bottom S */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 's')}
                  onTouchStart={(e) => handleStartDrag(e, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-2.5 bg-white border border-[#0C2340] rounded-full cursor-ns-resize shadow"
                />
                {/* Left W */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'w')}
                  onTouchStart={(e) => handleStartDrag(e, 'w')}
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-7 bg-white border border-[#0C2340] rounded-full cursor-ew-resize shadow"
                />
                {/* Right E */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'e')}
                  onTouchStart={(e) => handleStartDrag(e, 'e')}
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-7 bg-white border border-[#0C2340] rounded-full cursor-ew-resize shadow"
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            FOOTER: HIGH CONTRAST & READABLE ACTION BUTTONS
            ======================================================== */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#dadce0] flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-neutral-600 font-medium hidden sm:flex">
            <span className="text-base">💡</span>
            <span>Drag box to position • Drag corner handles to scale • Proportion buttons lock aspect ratio</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold rounded-lg cursor-pointer bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-colors text-xs sm:text-sm shadow-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-[#E27A2B] hover:bg-[#d46a1d] active:scale-95 text-white font-bold rounded-lg flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50 text-xs sm:text-sm tracking-wide uppercase"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cropping Photo...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
