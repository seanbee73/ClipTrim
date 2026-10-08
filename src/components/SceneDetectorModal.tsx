import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Play,
  Scissors,
  CheckCircle,
  Loader2,
  Clock,
  Sliders,
} from 'lucide-react';
import { SceneCut } from '../types';
import { detectVideoScenes } from '../utils/sceneDetector';
import { formatTimecode } from '../utils/timeFormat';

interface SceneDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  duration: number;
  detectedScenes: SceneCut[];
  onScenesUpdated: (scenes: SceneCut[]) => void;
  onSeek: (timestamp: number) => void;
  onApplySceneTrim: (start: number, end: number) => void;
}

export const SceneDetectorModal: React.FC<SceneDetectorModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  duration,
  detectedScenes,
  onScenesUpdated,
  onSeek,
  onApplySceneTrim,
}) => {
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    setIsScanning(true);
    setProgress(0);

    const controller = new AbortController();
    setAbortController(controller);

    // Thresholds: lower value = more sensitive (more cuts detected)
    const thresholdMap = {
      high: 0.16,
      medium: 0.22,
      low: 0.32,
    };

    try {
      const cuts = await detectVideoScenes(videoSrc, duration, {
        threshold: thresholdMap[sensitivity],
        sampleInterval: 0.4,
        onProgress: (p) => setProgress(p),
        signal: controller.signal,
      });

      onScenesUpdated(cuts);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Scene detection failed', err);
      }
    } finally {
      setIsScanning(false);
      setAbortController(null);
    }
  };

  const handleCancelScan = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Automatic Scene Detection</h3>
              <p className="text-xs text-slate-400">
                AI visual difference algorithm detects camera cuts & transitions
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isScanning) handleCancelScan();
              onClose();
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Controls & Sensitivity */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-blue-400" />
                Cut Detection Sensitivity:
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSensitivity(lvl)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      sensitivity === lvl
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                Total Video Length: {formatTimecode(duration)}
              </span>
              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Frames ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{detectedScenes.length > 1 ? 'Re-scan Scenes' : 'Detect Scenes Now'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Scanning Progress Bar */}
            {isScanning && (
              <div className="pt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-amber-500 transition-all duration-150"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Detected Scenes List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Detected Scenes ({detectedScenes.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Tap scene to jump or trim
              </span>
            </div>

            <div className="space-y-2">
              {detectedScenes.map((scene, index) => {
                const nextScene = detectedScenes[index + 1];
                const sceneEndTime = nextScene ? nextScene.timestamp : duration;
                const sceneDuration = sceneEndTime - scene.timestamp;

                return (
                  <div
                    key={scene.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-slate-700 hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black border border-slate-800">
                        {scene.thumbnailUrl ? (
                          <img
                            src={scene.thumbnailUrl}
                            alt={scene.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">
                            Scene {index + 1}
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] font-mono text-white">
                          {formatTimecode(scene.timestamp)}
                        </span>
                      </div>

                      {/* Scene Info */}
                      <div>
                        <div className="text-xs font-semibold text-white">
                          Scene {index + 1}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTimecode(scene.timestamp)} → {formatTimecode(sceneEndTime)} (
                            {formatTimecode(sceneDuration)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSeek(scene.timestamp);
                          onClose();
                        }}
                        className="flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                        title="Jump to scene start"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Jump</span>
                      </button>

                      <button
                        onClick={() => {
                          onApplySceneTrim(scene.timestamp, sceneEndTime);
                          onClose();
                        }}
                        className="flex min-h-[36px] items-center gap-1 rounded-lg bg-blue-600/90 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 shadow"
                        title="Set trim boundaries to this scene"
                      >
                        <Scissors className="h-3 w-3" />
                        <span>Trim Scene</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 text-xs">
          <span className="text-slate-400">
            Markers are displayed as amber diamonds on the timeline
          </span>
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
