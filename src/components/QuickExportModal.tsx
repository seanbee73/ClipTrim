import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
} from 'lucide-react';
import { ExportPreset, VideoProject } from '../types';
import { renderAndExportVideo, ExportResult } from '../utils/videoExporter';
import { formatTimecode } from '../utils/timeFormat';

interface QuickExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  videoSrc: string;
}

const PRESETS: ExportPreset[] = [
  {
    id: 'tiktok',
    name: 'TikTok Video',
    platform: 'tiktok',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrateMb: 4.5,
    format: 'mp4',
    description: '1080×1920 vertical format optimized for TikTok feed algorithm',
    badge: 'Popular',
  },
  {
    id: 'reels',
    name: 'Instagram Reels',
    platform: 'reels',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrateMb: 4.5,
    format: 'mp4',
    description: '9:16 vertical 1080p for Instagram Reels & Stories',
    badge: 'Trending',
  },
  {
    id: 'shorts',
    name: 'YouTube Shorts',
    platform: 'shorts',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrateMb: 5.0,
    format: 'mp4',
    description: 'High-bitrate vertical video for YouTube Shorts',
  },
  {
    id: 'instagram-sq',
    name: 'Instagram Square',
    platform: 'instagram',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    fps: 30,
    bitrateMb: 3.5,
    format: 'mp4',
    description: '1:1 classic square grid feed post',
  },
  {
    id: 'youtube-hd',
    name: 'YouTube Landscape 1080p',
    platform: 'youtube',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    bitrateMb: 6.0,
    format: 'mp4',
    description: '16:9 widescreen HD for YouTube and X video posts',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Quick Share',
    platform: 'whatsapp',
    aspectRatio: 'original',
    width: 720,
    height: 1280,
    fps: 24,
    bitrateMb: 1.8,
    format: 'mp4',
    description: 'Lightweight compressed file under 16MB for instant mobile messaging',
    badge: 'Fast',
  },
];

export const QuickExportModal: React.FC<QuickExportModalProps> = ({
  isOpen,
  onClose,
  project,
  videoSrc,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset>(PRESETS[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setErrorMsg(null);
    setExportResult(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const result = await renderAndExportVideo({
        videoSrc,
        originalWidth: project.videoWidth || 1280,
        originalHeight: project.videoHeight || 720,
        trimStart: project.trimStart,
        trimEnd: project.trimEnd,
        crop: project.crop,
        rotation: project.rotation,
        flipH: project.flipH,
        flipV: project.flipV,
        playbackSpeed: project.playbackSpeed,
        volume: project.volume,
        textOverlay: project.textOverlay,
        delogoPatch: project.delogoPatch,
        preset: selectedPreset,
        onProgress: (pct) => setProgress(pct),
        signal: controller.signal,
      });

      setExportResult(result);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError' && !(err as Error).message?.includes('cancelled')) {
        setErrorMsg((err as Error).message || 'Export failed. Please try again.');
      }
    } finally {
      setIsExporting(false);
      setAbortController(null);
    }
  };

  const handleCancelExport = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsExporting(false);
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const a = document.createElement('a');
    a.href = exportResult.url;
    a.download = exportResult.filename;
    a.click();
  };

  const handleShare = async () => {
    if (!exportResult) return;
    try {
      const file = new File([exportResult.blob], exportResult.filename, {
        type: exportResult.blob.type,
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Trimmed Video',
          text: 'Exported from ClipTrim Studio',
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Share not supported, falling back to download', err);
      handleDownload();
    }
  };

  const trimmedDuration = Math.max(0.1, project.trimEnd - project.trimStart);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Quick Export</h3>
              <p className="text-xs text-slate-400">
                Trim duration: {formatTimecode(trimmedDuration)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isExporting) handleCancelExport();
              onClose();
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!isExporting && !exportResult && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Select Social Media or Quick Preset:
                </label>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {PRESETS.map((preset) => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPreset(preset)}
                        className={`flex min-h-[64px] flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">{preset.name}</span>
                          {preset.badge && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                          {preset.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span>{preset.width}×{preset.height}</span>
                          <span>·</span>
                          <span>{preset.bitrateMb} Mbps</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Details */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Export Format:</span>
                  <span className="font-semibold text-emerald-400">Universal MP4 (H.264 / AAC)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Player Compatibility:</span>
                  <span className="text-slate-300 font-medium">
                    Windows Media Player, Movies & TV, QuickTime, VLC, KMPlayer, Yandex, Mobile
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Aspect Ratio Target:</span>
                  <span className="font-semibold text-slate-200">{selectedPreset.aspectRatio}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Trimming Segment:</span>
                  <span className="font-mono text-slate-200">
                    {formatTimecode(project.trimStart)} → {formatTimecode(project.trimEnd)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Active Adjustments:</span>
                  <span className="text-slate-200">
                    {project.rotation > 0 ? `${project.rotation}° rotate · ` : ''}
                    {project.delogoPatch.enabled ? 'Logo blur · ' : ''}
                    {project.textOverlay.enabled ? 'Text layer · ' : ''}
                    {project.playbackSpeed !== 1 ? `${project.playbackSpeed}x speed` : 'Normal speed'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Exporting Progress State */}
          {isExporting && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <div>
                <h4 className="text-base font-semibold text-white">Rendering Video...</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Applying crop, transforms, audio levels, and generating {selectedPreset.name}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md">
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-blue-500 transition-all duration-150"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs font-mono text-slate-400">
                  <span>{progress}% complete</span>
                  <span>{formatTimecode((trimmedDuration * progress) / 100)}</span>
                </div>
              </div>

              <button
                onClick={handleCancelExport}
                className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel Export
              </button>
            </div>
          )}

          {/* Export Complete Success State */}
          {exportResult && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Universal MP4 Video Ready!</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Size: {(exportResult.sizeBytes / (1024 * 1024)).toFixed(2)} MB · Duration:{' '}
                  {formatTimecode(exportResult.duration)} · Format: <span className="font-semibold text-emerald-400">H.264 / AAC (ISO MP4)</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  FastStart indexed for smooth timeline seeking in Windows Media Player, QuickTime, Movies & TV, VLC, and all players.
                </p>
              </div>

              {/* Video Preview */}
              <div className="max-h-48 overflow-hidden rounded-lg border border-slate-800 bg-black">
                <video
                  src={exportResult.url}
                  controls
                  playsInline
                  className="max-h-48 object-contain"
                />
              </div>

              {/* Download / Share Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
                <button
                  onClick={handleDownload}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  <span>Download MP4 Video</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
                  title="Share or send to mobile app"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isExporting && !exportResult && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-5 py-4">
            <button
              onClick={onClose}
              className="min-h-[44px] rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95"
            >
              <Smartphone className="h-4 w-4" />
              <span>Export {selectedPreset.name}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
