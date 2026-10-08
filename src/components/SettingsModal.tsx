import React from 'react';
import { X, Settings, Check } from 'lucide-react';
import { ExportPreset } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: ExportPreset;
  onChangePreset: (p: ExportPreset) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preset,
  onChangePreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Export & Encoding Settings</h3>
              <p className="text-xs text-slate-400">Configure resolution, framerate, and quality</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Framerate */}
          <div>
            <label className="font-semibold text-slate-300">Framerate (FPS):</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[24, 30, 60].map((fps) => (
                <button
                  key={fps}
                  type="button"
                  onClick={() => onChangePreset({ ...preset, fps })}
                  className={`rounded-xl border p-2.5 font-medium transition-colors ${
                    preset.fps === fps
                      ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300">
              <span>Target Bitrate:</span>
              <span className="font-mono text-blue-400">{preset.bitrateMb} Mbps</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={preset.bitrateMb}
              onChange={(e) =>
                onChangePreset({ ...preset, bitrateMb: parseFloat(e.target.value) })
              }
              className="mt-2 w-full accent-blue-500 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>Low (Compact)</span>
              <span>Balanced</span>
              <span>Ultra HD</span>
            </div>
          </div>

          {/* Container Format */}
          <div>
            <label className="font-semibold text-slate-300">Container Format:</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { id: 'mp4', name: 'MP4 (Universal / H.264 / AAC)' },
                { id: 'webm', name: 'WebM (High efficiency / VP9)' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => onChangePreset({ ...preset, format: fmt.id as 'mp4' | 'webm' })}
                  className={`rounded-xl border p-2.5 text-left font-medium transition-colors ${
                    preset.format === fmt.id
                      ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase">{fmt.id}</span>
                    {preset.format === fmt.id && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{fmt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-5 py-4">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
