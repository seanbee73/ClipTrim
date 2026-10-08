import React from 'react';
import { X, Type, Check } from 'lucide-react';
import { TextOverlay } from '../types';

interface TextOverlayEditorProps {
  isOpen: boolean;
  onClose: () => void;
  textOverlay: TextOverlay;
  onChangeTextOverlay: (overlay: TextOverlay) => void;
}

export const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  isOpen,
  onClose,
  textOverlay,
  onChangeTextOverlay,
}) => {
  if (!isOpen) return null;

  const colors = ['#ffffff', '#facc15', '#ef4444', '#38bdf8', '#4ade80', '#c084fc', '#000000'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Type className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Text Overlay</h3>
              <p className="text-xs text-slate-400">Add titles, captions, or watermarks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-xs font-semibold text-white">Enable Text Layer</span>
            <input
              type="checkbox"
              checked={textOverlay.enabled}
              onChange={(e) =>
                onChangeTextOverlay({ ...textOverlay, enabled: e.target.checked })
              }
              className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-blue-600 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Text Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Text Content:</label>
            <input
              type="text"
              value={textOverlay.text}
              placeholder="e.g. Follow for more! or Scene Title"
              onChange={(e) => onChangeTextOverlay({ ...textOverlay, text: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Font Size */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Font Size:</span>
              <span className="font-mono text-slate-400">{textOverlay.fontSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="72"
              value={textOverlay.fontSize}
              onChange={(e) =>
                onChangeTextOverlay({ ...textOverlay, fontSize: parseInt(e.target.value, 10) })
              }
              className="mt-2 w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Text Color:</label>
            <div className="mt-2 flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChangeTextOverlay({ ...textOverlay, color: c })}
                  style={{ backgroundColor: c }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 shadow transition-transform ${
                    textOverlay.color === c ? 'scale-110 ring-2 ring-blue-500' : ''
                  }`}
                >
                  {textOverlay.color === c && (
                    <Check
                      className={`h-4 w-4 ${c === '#ffffff' || c === '#facc15' ? 'text-black' : 'text-white'}`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background Pill */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <span className="text-xs font-semibold text-white block">Background Scrim</span>
              <span className="text-[11px] text-slate-400">Add dark backdrop box behind text</span>
            </div>
            <input
              type="checkbox"
              checked={textOverlay.hasBackground}
              onChange={(e) =>
                onChangeTextOverlay({ ...textOverlay, hasBackground: e.target.checked })
              }
              className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-blue-600 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Position Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Quick Align:</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[
                { label: 'Top', x: 50, y: 15 },
                { label: 'Center', x: 50, y: 50 },
                { label: 'Lower 3rd', x: 50, y: 80 },
              ].map((pos) => (
                <button
                  key={pos.label}
                  type="button"
                  onClick={() =>
                    onChangeTextOverlay({ ...textOverlay, x: pos.x, y: pos.y })
                  }
                  className="rounded-lg border border-slate-800 bg-slate-800/80 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                >
                  {pos.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              You can also drag the text freely directly on the video preview!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-5 py-4">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
