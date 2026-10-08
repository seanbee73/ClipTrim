import React from 'react';
import {
  Scissors,
  Crop,
  RotateCw,
  FlipHorizontal,
  Volume2,
  VolumeX,
  Gauge,
  Type,
  EyeOff,
  Sparkles,
  RotateCcw,
  X,
  Cloud,
  Maximize2,
} from 'lucide-react';
import { ActiveTool, AspectRatioType } from '../types';

interface EditorToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  rotation: number;
  onRotate: () => void;
  flipH: boolean;
  onToggleFlipH: () => void;
  aspectRatio: AspectRatioType;
  onSelectAspectRatio: (ratio: AspectRatioType) => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (spd: number) => void;
  hasText: boolean;
  hasDelogo: boolean;
  detectedSceneCount: number;
  onResetEdits: () => void;
  onCloseVideo: () => void;
  filename: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  setActiveTool,
  rotation,
  onRotate,
  flipH,
  onToggleFlipH,
  aspectRatio,
  onSelectAspectRatio,
  volume,
  onChangeVolume,
  playbackSpeed,
  onChangeSpeed,
  hasText,
  hasDelogo,
  detectedSceneCount,
  onResetEdits,
  onCloseVideo,
  filename,
}) => {
  return (
    <div className="w-full border-b border-slate-800 bg-slate-950">
      {/* Primary Toolbar Row */}
      <div className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto px-2 py-2 sm:px-4">
        {/* Left Side: Video Title */}
        <div className="mr-3 hidden max-w-[200px] items-center text-xs text-slate-400 lg:flex">
          <span className="truncate" title={filename}>
            {filename}
          </span>
        </div>

        {/* Center: Action Icons Group */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Trim Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'trim' ? 'trim' : 'trim')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'trim'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Trim video duration"
          >
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Trim</span>
          </button>

          {/* Crop Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'crop' ? 'trim' : 'crop')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'crop'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Crop & Aspect Ratio"
          >
            <Crop className="h-4 w-4" />
            <span className="hidden sm:inline">Crop</span>
          </button>

          {/* Rotate Tool */}
          <button
            onClick={onRotate}
            className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title={`Rotate 90° clockwise (current: ${rotation}°)`}
          >
            <RotateCw className="h-4 w-4" />
            <span className="hidden md:inline">{rotation > 0 ? `${rotation}°` : 'Rotate'}</span>
          </button>

          {/* Flip Tool */}
          <button
            onClick={onToggleFlipH}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              flipH ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Mirror Flip horizontally"
          >
            <FlipHorizontal className="h-4 w-4" />
            <span className="hidden md:inline">Flip</span>
          </button>

          {/* Aspect Ratio Picker */}
          <button
            onClick={() => setActiveTool(activeTool === 'aspect' ? 'trim' : 'aspect')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'aspect'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Choose aspect ratio framing"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Ratio</span>
          </button>

          {/* Audio Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'audio' ? 'trim' : 'audio')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'audio'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Audio & Volume"
          >
            {volume === 0 ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden md:inline">{Math.round(volume * 100)}%</span>
          </button>

          {/* Speed Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'speed' ? 'trim' : 'speed')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'speed'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Playback Speed"
          >
            <Gauge className="h-4 w-4" />
            <span className="hidden md:inline">{playbackSpeed}x</span>
          </button>

          {/* Text Overlay */}
          <button
            onClick={() => setActiveTool(activeTool === 'text' ? 'trim' : 'text')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white'
                : hasText
                ? 'bg-slate-800 text-blue-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Add text overlay"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Text</span>
          </button>

          {/* Remove Logo / Delogo */}
          <button
            onClick={() => setActiveTool(activeTool === 'delogo' ? 'trim' : 'delogo')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'delogo'
                ? 'bg-blue-600 text-white'
                : hasDelogo
                ? 'bg-slate-800 text-purple-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Remove or blur logo / watermark"
          >
            <EyeOff className="h-4 w-4" />
            <span className="hidden sm:inline">Remove Logo</span>
          </button>

          {/* Automatic Scene Detection */}
          <button
            onClick={() => setActiveTool(activeTool === 'scenes' ? 'trim' : 'scenes')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'scenes'
                ? 'bg-amber-600 text-white'
                : detectedSceneCount > 1
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Automatic Scene Detection"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Scene AI</span>
            {detectedSceneCount > 1 && (
              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[10px] text-amber-300 font-mono">
                {detectedSceneCount}
              </span>
            )}
          </button>

          {/* Cloud Backup Button */}
          <button
            onClick={() => setActiveTool(activeTool === 'cloud' ? 'trim' : 'cloud')}
            className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTool === 'cloud'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Cloud Backup"
          >
            <Cloud className="h-4 w-4" />
            <span className="hidden lg:inline">Cloud</span>
          </button>
        </div>

        {/* Right Side: Reset & Close */}
        <div className="flex items-center gap-1">
          <button
            onClick={onResetEdits}
            className="flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Reset edits to original"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onCloseVideo}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-950/40 hover:text-red-400"
            title="Close video and back to home"
            aria-label="Close video"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Secondary Contextual Sub-bar for Active Tool */}
      {activeTool === 'crop' && (
        <div className="border-t border-slate-800/80 bg-slate-900/90 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-300">Crop Presets:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'original', label: 'Original' },
                  { id: '16:9', label: '16:9 (YouTube)' },
                  { id: '9:16', label: '9:16 (TikTok/Reels)' },
                  { id: '1:1', label: '1:1 (Square)' },
                  { id: '4:5', label: '4:5 (Insta Portrait)' },
                  { id: '21:9', label: '21:9 (Cinematic)' },
                  { id: 'custom', label: 'Freeform' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectAspectRatio(preset.id)}
                  className={`min-h-[36px] rounded-md px-2.5 py-1 font-medium transition-colors ${
                    aspectRatio === preset.id
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400">Drag handles on preview to fine-tune</span>
          </div>
        </div>
      )}

      {activeTool === 'aspect' && (
        <div className="border-t border-slate-800/80 bg-slate-900/90 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-slate-300">Target Social Aspect:</span>
            {(
              [
                { id: 'original', label: 'Native Aspect' },
                { id: '9:16', label: '9:16 Vertical (Shorts/Reels)' },
                { id: '1:1', label: '1:1 Square (Instagram Feed)' },
                { id: '4:5', label: '4:5 Portrait' },
                { id: '16:9', label: '16:9 Landscape (YouTube/X)' },
                { id: '21:9', label: '21:9 Ultra-Wide' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectAspectRatio(opt.id)}
                className={`min-h-[36px] rounded-md px-3 py-1 font-medium transition-colors ${
                  aspectRatio === opt.id
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'audio' && (
        <div className="border-t border-slate-800/80 bg-slate-900/90 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl items-center gap-4 text-xs">
            <span className="font-medium text-slate-300">Volume Level:</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="h-2 w-44 cursor-pointer accent-blue-500"
            />
            <span className="font-mono text-slate-200 tabular-nums">
              {Math.round(volume * 100)}%
            </span>
            <button
              onClick={() => onChangeVolume(volume === 0 ? 1 : 0)}
              className="min-h-[36px] rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white"
            >
              {volume === 0 ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
      )}

      {activeTool === 'speed' && (
        <div className="border-t border-slate-800/80 bg-slate-900/90 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs">
            <span className="font-medium text-slate-300">Playback Speed:</span>
            {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`min-h-[36px] rounded-md px-2.5 py-1 font-medium transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
