import React from 'react';
import { Scissors, Cloud, Moon, Sun, Film, Sparkles } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCloudBackup: () => void;
  onLoadSample: () => void;
  hasActiveVideo: boolean;
  cloudBackupCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenCloudBackup,
  onLoadSample,
  hasActiveVideo,
  cloudBackupCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <Scissors className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            ClipTrim <span className="text-xs font-normal text-blue-400">Studio</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
          <span className="cursor-pointer transition-colors hover:text-white">
            Precision Trimmer
          </span>
          <span className="cursor-pointer transition-colors hover:text-white">
            Frame Stepper
          </span>
          <span className="cursor-pointer transition-colors hover:text-white">
            Scene AI
          </span>
          <span className="cursor-pointer transition-colors hover:text-white">
            Mobile Presets
          </span>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          {!hasActiveVideo && (
            <button
              onClick={onLoadSample}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800/80 hover:text-white"
              title="Load demo video clip"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Try Sample</span>
            </button>
          )}

          <button
            onClick={onOpenCloudBackup}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title="Cloud Backup & Restores"
            aria-label="Cloud Backup"
          >
            <Cloud className="h-4 w-4" />
            {cloudBackupCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={onToggleDarkMode}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
