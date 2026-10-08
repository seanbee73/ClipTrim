import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { EditorToolbar } from './components/EditorToolbar';
import { VideoCanvas } from './components/VideoCanvas';
import { Timeline } from './components/Timeline';
import { QuickExportModal } from './components/QuickExportModal';
import { SceneDetectorModal } from './components/SceneDetectorModal';
import { CloudBackupModal } from './components/CloudBackupModal';
import { TextOverlayEditor } from './components/TextOverlayEditor';
import { DelogoEditor } from './components/DelogoEditor';
import { SettingsModal } from './components/SettingsModal';
import { CameraRecordModal } from './components/CameraRecordModal';
import {
  ActiveTool,
  AspectRatioType,
  CropRect,
  DelogoPatch,
  ExportPreset,
  SceneCut,
  TextOverlay,
  VideoProject,
} from './types';
import { generateDemoVideo } from './utils/sampleVideo';
import { getStoredBackups, saveProjectToCloud } from './utils/cloudStorage';

const DEFAULT_CROP: CropRect = { x: 0, y: 0, width: 100, height: 100 };

const DEFAULT_TEXT_OVERLAY: TextOverlay = {
  enabled: false,
  text: 'ClipTrim Studio',
  x: 50,
  y: 80,
  fontSize: 28,
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.7)',
  fontFamily: 'sans-serif',
  hasBackground: true,
};

const DEFAULT_DELOGO_PATCH: DelogoPatch = {
  enabled: false,
  x: 75,
  y: 5,
  width: 20,
  height: 10,
  blurStrength: 10,
  style: 'blur',
};

const DEFAULT_PRESET: ExportPreset = {
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
};

export default function App() {
  // Theme state: dark mode default to minimize eye strain
  const [darkMode, setDarkMode] = useState(true);

  // Video playback & element reference
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(1280);
  const [videoHeight, setVideoHeight] = useState(720);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Video edit parameters
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('original');
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const [volume, setVolume] = useState(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [textOverlay, setTextOverlay] = useState<TextOverlay>(DEFAULT_TEXT_OVERLAY);
  const [delogoPatch, setDelogoPatch] = useState<DelogoPatch>(DEFAULT_DELOGO_PATCH);
  const [detectedScenes, setDetectedScenes] = useState<SceneCut[]>([]);

  // Navigation & active tool
  const [activeTool, setActiveTool] = useState<ActiveTool>('trim');

  // Modals visibility
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isDelogoModalOpen, setIsDelogoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Export settings preset
  const [exportPreset, setExportPreset] = useState<ExportPreset>(DEFAULT_PRESET);

  // Cloud backup items count
  const [cloudBackupCount, setCloudBackupCount] = useState<number>(() => getStoredBackups().length);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Video loaded handler
  const handleLoadVideoFile = (file: File) => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoSrc(url);
    setIsPlaying(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(DEFAULT_CROP);
    setAspectRatio('original');
    setTextOverlay(DEFAULT_TEXT_OVERLAY);
    setDelogoPatch(DEFAULT_DELOGO_PATCH);
    setDetectedScenes([]);
  };

  // Procedural demo video loader
  const handleLoadSample = async (type: 'showcase' | 'mobile_story' = 'showcase') => {
    setIsLoadingSample(true);
    try {
      const demo = await generateDemoVideo(type);
      handleLoadVideoFile(demo.file);
    } catch (err) {
      console.error('Failed to generate sample clip', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Synchronize refs for playback boundaries
  const trimStartRef = useRef(trimStart);
  trimStartRef.current = trimStart;

  const trimEndRef = useRef(trimEnd);
  trimEndRef.current = trimEnd;

  const isLoopingRef = useRef(isLooping);
  isLoopingRef.current = isLooping;

  // Process video metadata only when videoSrc changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    let hasHandled = false;

    const handleLoadedMetadata = () => {
      if (hasHandled) return;
      hasHandled = true;
      const dur = video.duration || 10;
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
      setCurrentTime(0);
      setVideoWidth(video.videoWidth || 1280);
      setVideoHeight(video.videoHeight || 720);

      // Add default intro scene
      setDetectedScenes([
        {
          id: 'scene-0',
          timestamp: 0,
          label: 'Scene 1: Intro',
          confidence: 1,
        },
      ]);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (video.readyState >= 1 && video.duration) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoSrc]);

  // Handle playback timeupdate and looping using refs to avoid resetting state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Loop or stop within trim bounds
      if (time >= trimEndRef.current) {
        if (isLoopingRef.current) {
          video.currentTime = trimStartRef.current;
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    const handleEnded = () => {
      if (isLoopingRef.current) {
        video.currentTime = trimStartRef.current;
        video.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Sync volume & playback speed to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, playbackSpeed]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (video.currentTime >= trimEnd || video.currentTime < trimStart) {
        video.currentTime = trimStart;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [trimStart, trimEnd]);

  // Seek handler
  const handleSeek = useCallback(
    (time: number) => {
      if (videoRef.current) {
        const clamped = Math.max(0, Math.min(duration, time));
        videoRef.current.currentTime = clamped;
        setCurrentTime(clamped);
      }
    },
    [duration]
  );

  // Step frame precision handler
  const handleStepFrame = useCallback(
    (deltaSec: number) => {
      if (videoRef.current) {
        const nextTime = Math.max(0, Math.min(duration, currentTime + deltaSec));
        videoRef.current.currentTime = nextTime;
        setCurrentTime(nextTime);
      }
    },
    [currentTime, duration]
  );

  // Trim range update
  const handleChangeTrim = useCallback((start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  }, []);

  // Aspect ratio switch and crop preset mapping
  const handleSelectAspectRatio = (ratio: AspectRatioType) => {
    setAspectRatio(ratio);
    if (ratio === 'original' || ratio === 'custom') {
      setCrop(DEFAULT_CROP);
      return;
    }

    // Set crop bounding box centered to match ratio
    let targetRatio = 16 / 9;
    if (ratio === '9:16') targetRatio = 9 / 16;
    if (ratio === '1:1') targetRatio = 1 / 1;
    if (ratio === '4:5') targetRatio = 4 / 5;
    if (ratio === '21:9') targetRatio = 21 / 9;
    if (ratio === '4:3') targetRatio = 4 / 3;

    const baseAspect = (videoWidth || 16) / (videoHeight || 9);

    if (targetRatio < baseAspect) {
      // Taller / narrower crop
      const newWidthPct = (targetRatio / baseAspect) * 100;
      setCrop({
        x: Math.round((100 - newWidthPct) / 2),
        y: 0,
        width: Math.round(newWidthPct),
        height: 100,
      });
    } else {
      // Wider / shorter crop
      const newHeightPct = (baseAspect / targetRatio) * 100;
      setCrop({
        x: 0,
        y: Math.round((100 - newHeightPct) / 2),
        width: 100,
        height: Math.round(newHeightPct),
      });
    }
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Flip horizontal
  const handleToggleFlipH = () => {
    setFlipH((prev) => !prev);
  };

  // Reset all edits
  const handleResetEdits = () => {
    setTrimStart(0);
    setTrimEnd(duration);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(DEFAULT_CROP);
    setAspectRatio('original');
    setVolume(1.0);
    setPlaybackSpeed(1.0);
    setTextOverlay(DEFAULT_TEXT_OVERLAY);
    setDelogoPatch(DEFAULT_DELOGO_PATCH);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Close video
  const handleCloseVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setVideoFile(null);
    setIsPlaying(false);
  };

  // Capture thumbnail snapshot for Cloud Backup
  const captureThumbnailSnapshot = (): string | undefined => {
    if (!videoRef.current) return undefined;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.65);
      }
    } catch (e) {
      console.warn('Could not take snapshot', e);
    }
    return undefined;
  };

  // Project state package
  const currentProject: VideoProject = {
    id: `project-${videoFile?.name || 'sample'}`,
    name: videoFile?.name || 'ClipTrim Project',
    dateCreated: new Date().toISOString(),
    duration,
    videoWidth,
    videoHeight,
    trimStart,
    trimEnd,
    playbackSpeed,
    volume,
    rotation,
    flipH,
    flipV,
    aspectRatio,
    crop,
    textOverlay,
    delogoPatch,
    detectedScenes,
  };

  // Restore project from backup
  const handleRestoreProject = (restored: VideoProject) => {
    setTrimStart(restored.trimStart);
    setTrimEnd(restored.trimEnd);
    setRotation(restored.rotation || 0);
    setFlipH(restored.flipH || false);
    setFlipV(restored.flipV || false);
    setAspectRatio(restored.aspectRatio || 'original');
    setCrop(restored.crop || DEFAULT_CROP);
    setVolume(restored.volume ?? 1);
    setPlaybackSpeed(restored.playbackSpeed || 1);
    setTextOverlay(restored.textOverlay || DEFAULT_TEXT_OVERLAY);
    setDelogoPatch(restored.delogoPatch || DEFAULT_DELOGO_PATCH);
    if (restored.detectedScenes) {
      setDetectedScenes(restored.detectedScenes);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = restored.trimStart;
      setCurrentTime(restored.trimStart);
    }
  };

  // Handle active tool clicks (opens corresponding modal or switches tool)
  const handleToolSelect = (tool: ActiveTool) => {
    setActiveTool(tool);
    if (tool === 'scenes') {
      setIsSceneModalOpen(true);
    } else if (tool === 'cloud') {
      setIsCloudModalOpen(true);
    } else if (tool === 'text') {
      setIsTextModalOpen(true);
    } else if (tool === 'delogo') {
      setIsDelogoModalOpen(true);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
      }`}
    >
      {/* 3-Zone Top Navigation Bar */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenCloudBackup={() => setIsCloudModalOpen(true)}
        onLoadSample={() => handleLoadSample('showcase')}
        hasActiveVideo={Boolean(videoSrc)}
        cloudBackupCount={cloudBackupCount}
      />

      {/* Main Workspace Body */}
      <main className="flex flex-1 flex-col">
        {!videoSrc ? (
          /* Landing Screen (Matching Screenshot 1 & Mobile quick-start) */
          <LandingHero
            onFileSelected={handleLoadVideoFile}
            onLoadSample={handleLoadSample}
            onRecordCamera={() => setIsCameraModalOpen(true)}
            isLoadingSample={isLoadingSample}
          />
        ) : (
          /* Active Video Trimming & Editing Studio (Matching Screenshot 2) */
          <div className="flex flex-1 flex-col">
            {/* Top Editor Toolbar */}
            <EditorToolbar
              activeTool={activeTool}
              setActiveTool={handleToolSelect}
              rotation={rotation}
              onRotate={handleRotate}
              flipH={flipH}
              onToggleFlipH={handleToggleFlipH}
              aspectRatio={aspectRatio}
              onSelectAspectRatio={handleSelectAspectRatio}
              volume={volume}
              onChangeVolume={setVolume}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              hasText={textOverlay.enabled}
              hasDelogo={delogoPatch.enabled}
              detectedSceneCount={detectedScenes.length}
              onResetEdits={handleResetEdits}
              onCloseVideo={handleCloseVideo}
              filename={videoFile?.name || 'Sample Video Clip'}
            />

            {/* Central Video Preview Canvas */}
            <VideoCanvas
              videoRef={videoRef}
              videoSrc={videoSrc}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              activeTool={activeTool}
              rotation={rotation}
              flipH={flipH}
              flipV={flipV}
              crop={crop}
              onChangeCrop={setCrop}
              textOverlay={textOverlay}
              onChangeTextOverlay={setTextOverlay}
              delogoPatch={delogoPatch}
              onChangeDelogoPatch={setDelogoPatch}
              videoWidth={videoWidth}
              videoHeight={videoHeight}
            />

            {/* Bottom Timeline with Filmstrip, Touch Handles, & Stepper (Matching Screenshot 2) */}
            <Timeline
              duration={duration}
              currentTime={currentTime}
              trimStart={trimStart}
              trimEnd={trimEnd}
              isPlaying={isPlaying}
              isLooping={isLooping}
              onTogglePlay={togglePlay}
              onToggleLoop={() => setIsLooping(!isLooping)}
              onSeek={handleSeek}
              onChangeTrim={handleChangeTrim}
              onStepFrame={handleStepFrame}
              detectedScenes={detectedScenes}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenQuickExport={() => setIsExportModalOpen(true)}
              videoSrc={videoSrc}
            />
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      {videoSrc && (
        <>
          {/* Quick Export Modal (TikTok, Reels, Shorts, WhatsApp, YouTube) */}
          <QuickExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            project={currentProject}
            videoSrc={videoSrc}
          />

          {/* Automatic Scene Detection Modal */}
          <SceneDetectorModal
            isOpen={isSceneModalOpen}
            onClose={() => setIsSceneModalOpen(false)}
            videoSrc={videoSrc}
            duration={duration}
            detectedScenes={detectedScenes}
            onScenesUpdated={(scenes) => setDetectedScenes(scenes)}
            onSeek={handleSeek}
            onApplySceneTrim={handleChangeTrim}
          />

          {/* Text Overlay Editor Modal */}
          <TextOverlayEditor
            isOpen={isTextModalOpen}
            onClose={() => setIsTextModalOpen(false)}
            textOverlay={textOverlay}
            onChangeTextOverlay={setTextOverlay}
          />

          {/* Delogo Mask Editor Modal */}
          <DelogoEditor
            isOpen={isDelogoModalOpen}
            onClose={() => setIsDelogoModalOpen(false)}
            delogoPatch={delogoPatch}
            onChangeDelogoPatch={setDelogoPatch}
          />

          {/* Export Settings Modal */}
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            preset={exportPreset}
            onChangePreset={setExportPreset}
          />
        </>
      )}

      {/* Cloud Backup Vault Modal */}
      <CloudBackupModal
        isOpen={isCloudModalOpen}
        onClose={() => {
          setIsCloudModalOpen(false);
          setCloudBackupCount(getStoredBackups().length);
        }}
        project={currentProject}
        onRestoreProject={handleRestoreProject}
        captureThumbnail={captureThumbnailSnapshot}
      />

      {/* Camera Recording Modal */}
      <CameraRecordModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onVideoRecorded={handleLoadVideoFile}
      />
    </div>
  );
}
