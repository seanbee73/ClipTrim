import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Repeat,
  Settings,
  Sparkles,
  Scissors,
  Save,
} from 'lucide-react';
import { SceneCut } from '../types';
import { formatTimecode } from '../utils/timeFormat';

interface TimelineProps {
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  isPlaying: boolean;
  isLooping: boolean;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSeek: (time: number) => void;
  onChangeTrim: (start: number, end: number) => void;
  onStepFrame: (deltaSec: number) => void;
  detectedScenes: SceneCut[];
  onOpenSettings: () => void;
  onOpenQuickExport: () => void;
  videoSrc: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  trimStart,
  trimEnd,
  isPlaying,
  isLooping,
  onTogglePlay,
  onToggleLoop,
  onSeek,
  onChangeTrim,
  onStepFrame,
  detectedScenes,
  onOpenSettings,
  onOpenQuickExport,
  videoSrc,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | 'playhead' | null>(null);
  const activeDragRef = useRef<'start' | 'end' | 'playhead' | null>(null);

  // Synchronized refs to avoid stale closures during rapid dragging
  const trimStartRef = useRef(trimStart);
  trimStartRef.current = trimStart;

  const trimEndRef = useRef(trimEnd);
  trimEndRef.current = trimEnd;

  const durationRef = useRef(duration);
  durationRef.current = duration;

  // Convert clientX to timeline time
  const getTimeFromPointer = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || durationRef.current <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pct * durationRef.current;
    },
    []
  );

  const startDragging = (
    e: React.PointerEvent<HTMLDivElement>,
    type: 'start' | 'end' | 'playhead'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    activeDragRef.current = type;
    setActiveDrag(type);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore if unsupported
    }
  };

  const stopDragging = (e?: React.PointerEvent<HTMLDivElement>) => {
    activeDragRef.current = null;
    setActiveDrag(null);
    if (e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    type: 'start' | 'end' | 'playhead'
  ) => {
    if (activeDragRef.current !== type) return;
    e.preventDefault();
    const time = getTimeFromPointer(e.clientX);
    const minInterval = 0.15; // minimum cut length

    if (type === 'start') {
      const newStart = Math.max(0, Math.min(time, trimEndRef.current - minInterval));
      onChangeTrim(newStart, trimEndRef.current);
      onSeek(newStart);
    } else if (type === 'end') {
      const newEnd = Math.min(durationRef.current, Math.max(time, trimStartRef.current + minInterval));
      onChangeTrim(trimStartRef.current, newEnd);
      onSeek(newEnd);
    } else if (type === 'playhead') {
      onSeek(Math.max(0, Math.min(durationRef.current, time)));
    }
  };

  // Fallback window-level pointer listener for full screen tracking
  useEffect(() => {
    const onGlobalPointerMove = (e: PointerEvent) => {
      const currentDrag = activeDragRef.current;
      if (!currentDrag) return;

      const time = getTimeFromPointer(e.clientX);
      const minInterval = 0.15;

      if (currentDrag === 'start') {
        const newStart = Math.max(0, Math.min(time, trimEndRef.current - minInterval));
        onChangeTrim(newStart, trimEndRef.current);
        onSeek(newStart);
      } else if (currentDrag === 'end') {
        const newEnd = Math.min(durationRef.current, Math.max(time, trimStartRef.current + minInterval));
        onChangeTrim(trimStartRef.current, newEnd);
        onSeek(newEnd);
      } else if (currentDrag === 'playhead') {
        onSeek(Math.max(0, Math.min(durationRef.current, time)));
      }
    };

    const onGlobalPointerUp = () => {
      activeDragRef.current = null;
      setActiveDrag(null);
    };

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };
  }, [getTimeFromPointer, onChangeTrim, onSeek]);

  const startPercent = duration > 0 ? Math.max(0, Math.min(100, (trimStart / duration) * 100)) : 0;
  const endPercent = duration > 0 ? Math.max(0, Math.min(100, (trimEnd / duration) * 100)) : 100;
  const playheadPercent = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;

  const trimmedLength = Math.max(0, trimEnd - trimStart);
  useEffect(() => {
    if (!videoSrc || duration <= 0) return;

    let isCancelled = false;
    const count = 12;
    const thumbs: string[] = [];

    const video = document.createElement('video');
    if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 68;
    const ctx = canvas.getContext('2d');

    const seekTo = (targetTime: number): Promise<void> => {
      return new Promise((resolve) => {
        if (isCancelled) return resolve();

        // If targetTime is essentially the same as current time, seeked may not fire
        if (Math.abs(video.currentTime - targetTime) < 0.05) {
          return resolve();
        }

        let isDone = false;
        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            video.removeEventListener('seeked', onSeeked);
            resolve();
          }
        }, 350); // 350ms max timeout per frame seek

        const onSeeked = () => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timer);
            video.removeEventListener('seeked', onSeeked);
            resolve();
          }
        };

        video.addEventListener('seeked', onSeeked, { once: true });
        try {
          video.currentTime = targetTime;
        } catch {
          resolve();
        }
      });
    };

    const extractFrames = async () => {
      if (isCancelled || !ctx) return;

      try {
        for (let i = 0; i < count; i++) {
          if (isCancelled) return;
          const targetTime = count > 1 ? (i / (count - 1)) * duration : 0;
          // Clamp time slightly off absolute 0 to avoid zero-seek browser bugs
          const safeTime = Math.min(Math.max(0.05, targetTime), Math.max(0.05, duration - 0.05));

          await seekTo(safeTime);
          if (isCancelled) return;

          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameUrl = canvas.toDataURL('image/jpeg', 0.65);
            thumbs.push(frameUrl);
            // Progressively update so the user immediately sees the filmstrip populate!
            if (!isCancelled) {
              setThumbnails([...thumbs]);
            }
          } catch (drawErr) {
            console.warn('Canvas frame extraction issue:', drawErr);
          }
        }
      } catch (err) {
        console.warn('Error during thumbnail sequence:', err);
      }
    };

    let startTimeout: NodeJS.Timeout | null = null;

    const onMetadataLoaded = () => {
      if (startTimeout) clearTimeout(startTimeout);
      extractFrames();
    };

    video.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
    video.src = videoSrc;

    // If metadata was already cached or readyState is sufficient
    if (video.readyState >= 1) {
      onMetadataLoaded();
    } else {
      // Safety fallback: if metadata event is delayed, attempt extraction after 600ms
      startTimeout = setTimeout(() => {
        if (!isCancelled && thumbs.length === 0) {
          extractFrames();
        }
      }, 600);
    }

    return () => {
      isCancelled = true;
      if (startTimeout) clearTimeout(startTimeout);
      video.removeEventListener('loadedmetadata', onMetadataLoaded);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoSrc, duration]);

  return (
    <div className="w-full border-t border-slate-800 bg-slate-950 p-2 sm:p-4 select-none">
      {/* 1. Timeline Filmstrip Track */}
      <div className="mx-auto max-w-7xl">
        <div className="relative pt-6 pb-2">
          {/* Timeline Track Box */}
          <div
            ref={trackRef}
            onPointerDown={(e) => {
              if (activeDrag) return;
              const time = getTimeFromPointer(e.clientX);
              onSeek(time);
            }}
            className="relative h-14 w-full cursor-pointer overflow-hidden rounded-lg bg-slate-900 ring-1 ring-slate-800 shadow-inner sm:h-16 touch-none select-none"
          >
            {/* Filmstrip thumbnails */}
            <div className="absolute inset-0 flex h-full w-full pointer-events-none select-none">
              {thumbnails.length > 0 ? (
                Array.from({ length: 12 }).map((_, idx) => {
                  const thumb = thumbnails[idx] || thumbnails[thumbnails.length - 1];
                  return (
                    <div key={idx} className="h-full flex-1 border-r border-slate-800/60 overflow-hidden bg-slate-900">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Thumbnail frame ${idx + 1}`}
                          draggable={false}
                          className="h-full w-full object-cover opacity-80 pointer-events-none select-none"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-800/50 animate-pulse" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full w-full">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full flex-1 border-r border-slate-800/80 bg-slate-800/30 animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Left Dimmed Area (before trimStart) */}
            <div
              style={{ width: `${startPercent}%` }}
              className="absolute top-0 bottom-0 left-0 bg-black/75 backdrop-blur-[1px] pointer-events-none"
            />

            {/* Right Dimmed Area (after trimEnd) */}
            <div
              style={{ left: `${endPercent}%`, right: 0 }}
              className="absolute top-0 bottom-0 bg-black/75 backdrop-blur-[1px] pointer-events-none"
            />

            {/* Active Trim Window Border / Frame Highlight */}
            <div
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(0, endPercent - startPercent)}%`,
              }}
              className="pointer-events-none absolute top-0 bottom-0 border-y-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            />

            {/* Scene Markers (Clickable golden ticks on timeline) */}
            {detectedScenes.map((scene) => {
              const scenePct = duration > 0 ? (scene.timestamp / duration) * 100 : 0;
              return (
                <button
                  key={scene.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(scene.timestamp);
                  }}
                  style={{ left: `${scenePct}%` }}
                  title={`${scene.label} (${formatTimecode(scene.timestamp)}) - Click to jump`}
                  className="group absolute top-0 bottom-0 -ml-1.5 z-10 flex w-3 cursor-pointer items-start justify-center"
                >
                  <div className="h-2.5 w-2.5 rotate-45 rounded-xs bg-amber-400 shadow-sm transition-transform group-hover:scale-125" />
                  <div className="h-full w-0.5 bg-amber-400/50" />
                </button>
              );
            })}
          </div>

          {/* Left Handle (Trim Start) - 40px Touch Target with Pointer Capture */}
          <div
            style={{ left: `${startPercent}%` }}
            onPointerDown={(e) => startDragging(e, 'start')}
            onPointerMove={(e) => handlePointerMove(e, 'start')}
            onPointerUp={(e) => stopDragging(e)}
            onPointerCancel={(e) => stopDragging(e)}
            className={`absolute top-6 bottom-2 -ml-5 z-20 flex w-10 cursor-ew-resize items-center justify-center touch-none select-none ${
              activeDrag === 'start' ? 'scale-105' : ''
            }`}
          >
            {/* Timestamp Badge */}
            <div className="pointer-events-none absolute -top-5.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow whitespace-nowrap">
              {formatTimecode(trimStart)}
            </div>
            {/* Visual Handle Bar */}
            <div
              className={`pointer-events-none flex h-full w-4 items-center justify-center rounded-l-lg shadow-xl ring-1 transition-all ${
                activeDrag === 'start'
                  ? 'bg-blue-400 ring-white shadow-blue-500/50'
                  : 'bg-blue-500 ring-blue-300'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="h-3 w-0.5 bg-white/90 rounded-full" />
                <div className="h-3 w-0.5 bg-white/90 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right Handle (Trim End) - 40px Touch Target with Pointer Capture */}
          <div
            style={{ left: `${endPercent}%` }}
            onPointerDown={(e) => startDragging(e, 'end')}
            onPointerMove={(e) => handlePointerMove(e, 'end')}
            onPointerUp={(e) => stopDragging(e)}
            onPointerCancel={(e) => stopDragging(e)}
            className={`absolute top-6 bottom-2 -ml-5 z-20 flex w-10 cursor-ew-resize items-center justify-center touch-none select-none ${
              activeDrag === 'end' ? 'scale-105' : ''
            }`}
          >
            {/* Timestamp Badge */}
            <div className="pointer-events-none absolute -top-5.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow whitespace-nowrap">
              {formatTimecode(trimEnd)}
            </div>
            {/* Visual Handle Bar */}
            <div
              className={`pointer-events-none flex h-full w-4 items-center justify-center rounded-r-lg shadow-xl ring-1 transition-all ${
                activeDrag === 'end'
                  ? 'bg-blue-400 ring-white shadow-blue-500/50'
                  : 'bg-blue-500 ring-blue-300'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="h-3 w-0.5 bg-white/90 rounded-full" />
                <div className="h-3 w-0.5 bg-white/90 rounded-full" />
              </div>
            </div>
          </div>

          {/* Current Playhead Scrubber */}
          <div
            style={{ left: `${playheadPercent}%` }}
            onPointerDown={(e) => startDragging(e, 'playhead')}
            onPointerMove={(e) => handlePointerMove(e, 'playhead')}
            onPointerUp={(e) => stopDragging(e)}
            onPointerCancel={(e) => stopDragging(e)}
            className={`absolute top-4 bottom-2 -ml-3 z-30 flex w-6 cursor-ew-resize flex-col items-center justify-start touch-none select-none ${
              activeDrag === 'playhead' ? 'scale-110' : ''
            }`}
          >
            <div className="pointer-events-none h-3.5 w-3.5 rotate-45 rounded-xs bg-white shadow-md ring-1 ring-slate-900" />
            <div className="pointer-events-none h-full w-0.5 bg-white shadow-sm" />
          </div>
        </div>

        {/* 2. Control Bar Below Timeline (Matching Screenshot 2) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left Group: Play button & Timestamps */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Play / Pause Primary Action */}
            <button
              onClick={onTogglePlay}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-white" />}
            </button>

            {/* Current & Trim Time Displays */}
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white">
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Current</span>
                <span className="font-bold text-sm text-blue-400">{formatTimecode(currentTime)}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white">
                <span className="text-[10px] uppercase text-slate-400 block font-sans">Duration</span>
                <span className="font-bold text-sm text-slate-200">{formatTimecode(trimmedLength)}</span>
              </div>
            </div>

            {/* Loop Toggle */}
            <button
              onClick={onToggleLoop}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors ${
                isLooping ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
              title={isLooping ? 'Looping enabled' : 'Loop disabled'}
              aria-label="Toggle loop"
            >
              <Repeat className="h-4 w-4" />
            </button>
          </div>

          {/* Center Group: Frame-by-Frame Precision Stepping */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <button
              onClick={() => onStepFrame(-1)}
              className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Step backward 1 second"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">-1s</span>
            </button>

            <button
              onClick={() => onStepFrame(-0.04)}
              className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Step backward 1 frame (0.04s)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>-1f</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Snap Trim Markers to Current Playhead */}
            <button
              onClick={() => onChangeTrim(currentTime, Math.max(currentTime + 0.2, trimEnd))}
              className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-blue-400 transition-colors hover:bg-blue-950/60"
              title="Set Trim Start here"
            >
              <span>[ Start</span>
            </button>
            <button
              onClick={() => onChangeTrim(Math.min(trimStart, currentTime - 0.2), currentTime)}
              className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-blue-400 transition-colors hover:bg-blue-950/60"
              title="Set Trim End here"
            >
              <span>End ]</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <button
              onClick={() => onStepFrame(0.04)}
              className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Step forward 1 frame (0.04s)"
            >
              <span>+1f</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onStepFrame(1)}
              className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Step forward 1 second"
            >
              <span className="hidden sm:inline">+1s</span>
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right Group: Settings & Primary Save/Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Export Settings & Formats"
              aria-label="Export settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Big Save Button matching Screenshot 2 */}
            <button
              onClick={onOpenQuickExport}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
