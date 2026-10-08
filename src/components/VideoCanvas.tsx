import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Move, EyeOff, Type } from 'lucide-react';
import { ActiveTool, CropRect, DelogoPatch, TextOverlay } from '../types';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeTool: ActiveTool;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  crop: CropRect;
  onChangeCrop: (newCrop: CropRect) => void;
  textOverlay: TextOverlay;
  onChangeTextOverlay: (overlay: TextOverlay) => void;
  delogoPatch: DelogoPatch;
  onChangeDelogoPatch: (patch: DelogoPatch) => void;
  videoWidth: number;
  videoHeight: number;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  videoRef,
  videoSrc,
  isPlaying,
  onTogglePlay,
  activeTool,
  rotation,
  flipH,
  flipV,
  crop,
  onChangeCrop,
  textOverlay,
  onChangeTextOverlay,
  delogoPatch,
  onChangeDelogoPatch,
  videoWidth,
  videoHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flashFeedback, setFlashFeedback] = useState<'play' | 'pause' | null>(null);
  const [dragState, setDragState] = useState<{
    type: 'crop-move' | 'crop-resize' | 'delogo-move' | 'delogo-resize' | 'text-move' | null;
    handle?: string;
    startX: number;
    startY: number;
    initialRect?: { x: number; y: number; w: number; h: number };
  }>({ type: null, startX: 0, startY: 0 });

  // Handle pointer/touch dragging
  useEffect(() => {
    if (!dragState.type) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragState.initialRect) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const containerBounds = containerRef.current.getBoundingClientRect();
      if (containerBounds.width === 0 || containerBounds.height === 0) return;

      const dxPct = ((clientX - dragState.startX) / containerBounds.width) * 100;
      const dyPct = ((clientY - dragState.startY) / containerBounds.height) * 100;

      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

      if (dragState.type === 'crop-move') {
        const newX = clamp(dragState.initialRect.x + dxPct, 0, 100 - dragState.initialRect.w);
        const newY = clamp(dragState.initialRect.y + dyPct, 0, 100 - dragState.initialRect.h);
        onChangeCrop({
          ...crop,
          x: newX,
          y: newY,
        });
      } else if (dragState.type === 'crop-resize') {
        let newX = dragState.initialRect.x;
        let newY = dragState.initialRect.y;
        let newW = dragState.initialRect.w;
        let newH = dragState.initialRect.h;

        const handle = dragState.handle;
        if (handle?.includes('e')) {
          newW = clamp(dragState.initialRect.w + dxPct, 10, 100 - newX);
        }
        if (handle?.includes('s')) {
          newH = clamp(dragState.initialRect.h + dyPct, 10, 100 - newY);
        }
        if (handle?.includes('w')) {
          const proposedW = dragState.initialRect.w - dxPct;
          if (proposedW >= 10 && dragState.initialRect.x + dxPct >= 0) {
            newX = dragState.initialRect.x + dxPct;
            newW = proposedW;
          }
        }
        if (handle?.includes('n')) {
          const proposedH = dragState.initialRect.h - dyPct;
          if (proposedH >= 10 && dragState.initialRect.y + dyPct >= 0) {
            newY = dragState.initialRect.y + dyPct;
            newH = proposedH;
          }
        }

        onChangeCrop({ x: newX, y: newY, width: newW, height: newH });
      } else if (dragState.type === 'delogo-move') {
        const newX = clamp(dragState.initialRect.x + dxPct, 0, 100 - dragState.initialRect.w);
        const newY = clamp(dragState.initialRect.y + dyPct, 0, 100 - dragState.initialRect.h);
        onChangeDelogoPatch({
          ...delogoPatch,
          x: newX,
          y: newY,
        });
      } else if (dragState.type === 'delogo-resize') {
        let newW = clamp(dragState.initialRect.w + dxPct, 5, 100 - dragState.initialRect.x);
        let newH = clamp(dragState.initialRect.h + dyPct, 5, 100 - dragState.initialRect.y);
        onChangeDelogoPatch({
          ...delogoPatch,
          width: newW,
          height: newH,
        });
      } else if (dragState.type === 'text-move') {
        const newX = clamp(dragState.initialRect.x + dxPct, 5, 95);
        const newY = clamp(dragState.initialRect.y + dyPct, 5, 95);
        onChangeTextOverlay({
          ...textOverlay,
          x: newX,
          y: newY,
        });
      }
    };

    const handlePointerUp = () => {
      setDragState({ type: null, startX: 0, startY: 0 });
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState, crop, delogoPatch, textOverlay, onChangeCrop, onChangeDelogoPatch, onChangeTextOverlay]);

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'crop-move' | 'crop-resize' | 'delogo-move' | 'delogo-resize' | 'text-move',
    initialRect: { x: number; y: number; w: number; h: number },
    handle?: string
  ) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragState({
      type,
      startX: clientX,
      startY: clientY,
      initialRect,
      handle,
    });
  };

  const isRotatedSideways = rotation === 90 || rotation === 270;
  const containerAspect = isRotatedSideways
    ? `${videoHeight || 9} / ${videoWidth || 16}`
    : `${videoWidth || 16} / ${videoHeight || 9}`;

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950 p-3 sm:p-6 select-none">
      {/* Aspect Ratio Bounding Container */}
      <div
        ref={containerRef}
        style={{ aspectRatio: containerAspect }}
        className="relative flex max-h-[62vh] max-w-full items-center justify-center overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-slate-800"
      >
        {/* Underlying Video Player */}
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          crossOrigin={videoSrc.startsWith('http://') || videoSrc.startsWith('https://') ? 'anonymous' : undefined}
          style={{
            transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            transition: 'transform 0.2s ease',
          }}
          className="h-full w-full object-contain pointer-events-none"
        />

        {/* Click to play/pause hit layer (inactive when editing crop/text/delogo overlays) */}
        {activeTool !== 'crop' && (
          <div
            onClick={() => {
              onTogglePlay();
              setFlashFeedback(isPlaying ? 'pause' : 'play');
              setTimeout(() => setFlashFeedback(null), 450);
            }}
            className="absolute inset-0 cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onTogglePlay();
              }
            }}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          />
        )}

        {/* Subtle, non-blocking 450ms feedback flash on tap/click */}
        {flashFeedback && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-md animate-ping">
              {flashFeedback === 'play' ? (
                <Play className="ml-0.5 h-6 w-6 fill-white" />
              ) : (
                <Pause className="h-6 w-6" />
              )}
            </div>
          </div>
        )}

        {/* Quiet, unobtrusive corner playback indicator (never blocks central video area) */}
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-md bg-slate-950/75 px-2 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-sm ring-1 ring-white/10 opacity-70">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{isPlaying ? 'Playing' : 'Paused'}</span>
        </div>

        {/* 1. Crop Overlay Box (Visible when Crop tool is active) */}
        {activeTool === 'crop' && (
          <div
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`,
            }}
            className="absolute pointer-events-auto border-2 border-dashed border-blue-400 bg-blue-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move"
            onMouseDown={(e) =>
              startDrag(e, 'crop-move', { x: crop.x, y: crop.y, w: crop.width, h: crop.height })
            }
            onTouchStart={(e) =>
              startDrag(e, 'crop-move', { x: crop.x, y: crop.y, w: crop.width, h: crop.height })
            }
          >
            {/* Grid 3x3 rule-of-thirds lines */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
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

            {/* Resize Handles (Hitbox >= 44px for touch) */}
            {['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'].map((h) => {
              let posClass = '';
              if (h === 'nw') posClass = '-top-3 -left-3 cursor-nwse-resize';
              if (h === 'ne') posClass = '-top-3 -right-3 cursor-nesw-resize';
              if (h === 'se') posClass = '-bottom-3 -right-3 cursor-nwse-resize';
              if (h === 'sw') posClass = '-bottom-3 -left-3 cursor-nesw-resize';
              if (h === 'n') posClass = '-top-3 left-1/2 -translate-x-1/2 cursor-ns-resize';
              if (h === 's') posClass = '-bottom-3 left-1/2 -translate-x-1/2 cursor-ns-resize';
              if (h === 'w') posClass = 'top-1/2 -left-3 -translate-y-1/2 cursor-ew-resize';
              if (h === 'e') posClass = 'top-1/2 -right-3 -translate-y-1/2 cursor-ew-resize';

              return (
                <div
                  key={h}
                  onMouseDown={(e) =>
                    startDrag(e, 'crop-resize', { x: crop.x, y: crop.y, w: crop.width, h: crop.height }, h)
                  }
                  onTouchStart={(e) =>
                    startDrag(e, 'crop-resize', { x: crop.x, y: crop.y, w: crop.width, h: crop.height }, h)
                  }
                  className={`absolute flex h-7 w-7 items-center justify-center ${posClass}`}
                >
                  <div className="h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow-md" />
                </div>
              );
            })}

            {/* Crop Size Label */}
            <div className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white">
              {Math.round(crop.width)}% × {Math.round(crop.height)}%
            </div>
          </div>
        )}

        {/* 2. Remove Logo / Watermark Blur Patch Box */}
        {delogoPatch.enabled && (
          <div
            style={{
              left: `${delogoPatch.x}%`,
              top: `${delogoPatch.y}%`,
              width: `${delogoPatch.width}%`,
              height: `${delogoPatch.height}%`,
            }}
            className={`absolute pointer-events-auto cursor-move border-2 border-purple-400 backdrop-blur-md transition-all ${
              delogoPatch.style === 'pixelate'
                ? 'bg-purple-900/40 backdrop-invert-0'
                : delogoPatch.style === 'patch'
                ? 'bg-black/90'
                : 'bg-white/10 backdrop-blur-lg'
            }`}
            onMouseDown={(e) =>
              startDrag(e, 'delogo-move', {
                x: delogoPatch.x,
                y: delogoPatch.y,
                w: delogoPatch.width,
                h: delogoPatch.height,
              })
            }
            onTouchStart={(e) =>
              startDrag(e, 'delogo-move', {
                x: delogoPatch.x,
                y: delogoPatch.y,
                w: delogoPatch.width,
                h: delogoPatch.height,
              })
            }
          >
            {/* Delogo resize corner handle */}
            <div
              onMouseDown={(e) =>
                startDrag(
                  e,
                  'delogo-resize',
                  {
                    x: delogoPatch.x,
                    y: delogoPatch.y,
                    w: delogoPatch.width,
                    h: delogoPatch.height,
                  },
                  'se'
                )
              }
              onTouchStart={(e) =>
                startDrag(
                  e,
                  'delogo-resize',
                  {
                    x: delogoPatch.x,
                    y: delogoPatch.y,
                    w: delogoPatch.width,
                    h: delogoPatch.height,
                  },
                  'se'
                )
              }
              className="absolute -right-2 -bottom-2 flex h-6 w-6 cursor-nwse-resize items-center justify-center"
            >
              <div className="h-3 w-3 rounded-sm border border-purple-300 bg-purple-600 shadow" />
            </div>

            {/* Delogo mini label */}
            <div className="flex items-center gap-1 bg-purple-950/80 px-1 py-0.5 text-[9px] font-semibold text-purple-200">
              <EyeOff className="h-2.5 w-2.5" />
              <span>Logo Mask</span>
            </div>
          </div>
        )}

        {/* 3. Text Overlay Box */}
        {textOverlay.enabled && textOverlay.text.trim() && (
          <div
            style={{
              left: `${textOverlay.x}%`,
              top: `${textOverlay.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute pointer-events-auto cursor-move select-none p-1.5 ring-1 ring-transparent hover:ring-blue-400"
            onMouseDown={(e) =>
              startDrag(e, 'text-move', {
                x: textOverlay.x,
                y: textOverlay.y,
                w: 0,
                h: 0,
              })
            }
            onTouchStart={(e) =>
              startDrag(e, 'text-move', {
                x: textOverlay.x,
                y: textOverlay.y,
                w: 0,
                h: 0,
              })
            }
          >
            <div
              style={{
                fontSize: `${textOverlay.fontSize}px`,
                color: textOverlay.color,
                backgroundColor: textOverlay.hasBackground ? textOverlay.backgroundColor : 'transparent',
                fontFamily: textOverlay.fontFamily,
              }}
              className="rounded-lg px-3 py-1 font-bold shadow-lg transition-transform"
            >
              {textOverlay.text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
