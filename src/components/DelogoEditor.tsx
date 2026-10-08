import React from 'react';
import { X, EyeOff } from 'lucide-react';
import { DelogoPatch } from '../types';

interface DelogoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  delogoPatch: DelogoPatch;
  onChangeDelogoPatch: (patch: DelogoPatch) => void;
}

export const DelogoEditor: React.FC<DelogoEditorProps> = ({
  isOpen,
  onClose,
  delogoPatch,
  onChangeDelogoPatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
              <EyeOff className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Remove Logo / Watermark</h3>
              <p className="text-xs text-slate-400">Conceal logos, channel marks, or timestamps</p>
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
        <div className="p-5 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <span className="text-xs font-semibold text-white block">Enable Logo Removal</span>
              <span className="text-[11px] text-slate-400">
                Displays the draggable mask patch on preview
              </span>
            </div>
            <input
              type="checkbox"
              checked={delogoPatch.enabled}
              onChange={(e) =>
                onChangeDelogoPatch({ ...delogoPatch, enabled: e.target.checked })
              }
              className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-purple-600 accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Mask Style */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Concealment Style:</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: 'blur', label: 'Frosted Blur' },
                { id: 'pixelate', label: 'Pixelate' },
                { id: 'patch', label: 'Dark Patch' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    onChangeDelogoPatch({
                      ...delogoPatch,
                      style: st.id as 'blur' | 'pixelate' | 'patch',
                    })
                  }
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                    delogoPatch.style === st.id
                      ? 'border-purple-500 bg-purple-950/40 text-purple-200 ring-1 ring-purple-500'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blur Intensity */}
          {delogoPatch.style === 'blur' && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Blur Strength:</span>
                <span className="font-mono text-slate-400">{delogoPatch.blurStrength}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                value={delogoPatch.blurStrength}
                onChange={(e) =>
                  onChangeDelogoPatch({
                    ...delogoPatch,
                    blurStrength: parseInt(e.target.value, 10),
                  })
                }
                className="mt-2 w-full accent-purple-500 cursor-pointer"
              />
            </div>
          )}

          {/* Quick Corner Positioning */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Snap to Common Logo Corner:</label>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  onChangeDelogoPatch({
                    ...delogoPatch,
                    x: 75,
                    y: 5,
                    width: 20,
                    height: 10,
                  })
                }
                className="rounded-lg border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:text-white"
              >
                Top-Right (Default)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeDelogoPatch({
                    ...delogoPatch,
                    x: 5,
                    y: 5,
                    width: 20,
                    height: 10,
                  })
                }
                className="rounded-lg border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:text-white"
              >
                Top-Left
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeDelogoPatch({
                    ...delogoPatch,
                    x: 75,
                    y: 85,
                    width: 20,
                    height: 10,
                  })
                }
                className="rounded-lg border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:text-white"
              >
                Bottom-Right
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeDelogoPatch({
                    ...delogoPatch,
                    x: 5,
                    y: 85,
                    width: 20,
                    height: 10,
                  })
                }
                className="rounded-lg border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:text-white"
              >
                Bottom-Left
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Drag the purple &quot;Logo Mask&quot; box on the video preview directly to place it over the watermark.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-5 py-4">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-500"
          >
            Apply Mask
          </button>
        </div>
      </div>
    </div>
  );
};
