import React, { useRef, useState } from 'react';
import {
  Upload,
  ChevronDown,
  Sparkles,
  Smartphone,
  Video,
  Crop,
  RotateCw,
  Type,
  EyeOff,
  Cloud,
  Film,
  Zap,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface LandingHeroProps {
  onFileSelected: (file: File) => void;
  onLoadSample: (type: 'showcase' | 'mobile_story') => void;
  onRecordCamera: () => void;
  isLoadingSample: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onFileSelected,
  onLoadSample,
  onRecordCamera,
  isLoadingSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onFileSelected(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-16 md:px-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Title Header */}
      <div className="mb-8 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Trim Video
        </h1>
        <p className="mt-3 text-base text-slate-400 sm:text-lg">
          Trim or cut video of any format with frame precision, smart scene cuts, and mobile exports
        </p>
      </div>

      {/* Drag & Drop Upload Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
          isDragging
            ? 'border-blue-400 bg-blue-950/30'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/80'
        }`}
      >
        {/* Primary Action Button with Split Dropdown */}
        <div className="relative inline-flex shadow-lg shadow-blue-600/20">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingSample}
            className="flex min-h-[48px] items-center gap-2 rounded-l-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            <span>Choose File</span>
          </button>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={isLoadingSample}
            className="flex min-h-[48px] min-w-[44px] items-center justify-center rounded-r-xl border-l border-blue-500/50 bg-blue-600 px-2.5 text-white transition-colors hover:bg-blue-500 focus:outline-none"
            aria-label="More upload options"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                <Upload className="h-4 w-4 text-blue-400" />
                <span>Upload From Device</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLoadSample('showcase');
                }}
                className="flex w-full min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Try Demo Video (16:9 Showcase)</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLoadSample('mobile_story');
                }}
                className="flex w-full min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span>Try Vertical Clip (9:16 Story)</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onRecordCamera();
                }}
                className="flex w-full min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                <Video className="h-4 w-4 text-red-400" />
                <span>Record From Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Dropzone subtext */}
        <p className="mt-4 text-xs font-medium text-slate-400">
          {isLoadingSample ? 'Generating sample video clip...' : 'or drop a video file here'}
        </p>

        {/* Quick sample chips for 1-tap testing */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onLoadSample('showcase')}
            disabled={isLoadingSample}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Open Demo Video</span>
          </button>
          <button
            onClick={() => onLoadSample('mobile_story')}
            disabled={isLoadingSample}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
          >
            <Smartphone className="h-3 w-3 text-emerald-400" />
            <span>Open Mobile 9:16</span>
          </button>
        </div>
      </div>

      {/* Feature Grid (matching 123apps layout from page 1) */}
      <div className="mt-16 grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Film className="h-4 w-4 text-blue-400" />
            Online Video Cutter
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Cut and slice video clips directly in your browser without requiring external software installations.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Crop className="h-4 w-4 text-blue-400" />
            Crop Video & Aspect Ratios
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Reframe videos seamlessly for TikTok, Reels, Shorts, and YouTube with standard presets (9:16, 1:1, 16:9).
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <RotateCw className="h-4 w-4 text-blue-400" />
            Rotate & Mirror Flip
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Rotate clips 90, 180, or 270 degrees. Useful when footage was recorded in portrait instead of landscape.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Zap className="h-4 w-4 text-amber-400" />
            Automatic Scene Detection
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Smart algorithmic computer-vision detects scene cut transitions across your video for 1-click chapter trimming.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <EyeOff className="h-4 w-4 text-purple-400" />
            Remove Logo & Watermarks
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Conceal unwanted branding or timestamps with customizable frosted blur, pixelation, or mask patches.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Cloud className="h-4 w-4 text-emerald-400" />
            Cloud Backup & Restore
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Save projects to cloud vault, archive edit states, and restore work anytime across mobile and desktop.
          </p>
        </div>
      </div>

      {/* Format-specific tools tags section (from Screenshot 1) */}
      <div className="mt-14 w-full max-w-5xl border-t border-slate-800 pt-8 text-center sm:text-left">
        <h4 className="text-xs font-semibold text-slate-300">Format & Platform Tools</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'MP4 Trimmer',
            'TikTok Video Cutter',
            'Instagram Reels Cutter',
            'YouTube Shorts Trimmer',
            'WebM Cutter',
            'MOV Cutter',
            'GIF Maker',
            'WhatsApp Compressor',
            'Frame Precision Stepper',
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Rating & Guarantee */}
      <div className="mt-10 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-400 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Client-Side Privacy Guaranteed · No Server Uploads Required</span>
        </div>
        <span className="hidden sm:inline" aria-hidden="true">·</span>
        <div className="flex items-center gap-1">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <span className="font-semibold text-slate-200">4.9 / 5</span>
          <span className="text-slate-500">(24,800+ exports)</span>
        </div>
      </div>
    </div>
  );
};
