export type AspectRatioType = 'original' | '16:9' | '9:16' | '1:1' | '4:5' | '21:9' | '4:3' | 'custom';

export interface CropRect {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

export interface TextOverlay {
  enabled: boolean;
  text: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  fontSize: number; // px (14 - 64)
  color: string;
  backgroundColor: string; // e.g., 'rgba(0,0,0,0.6)'
  fontFamily: string;
  hasBackground: boolean;
}

export interface DelogoPatch {
  enabled: boolean;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 5 - 50
  height: number; // percentage 5 - 50
  blurStrength: number; // 2 - 20px
  style: 'blur' | 'pixelate' | 'patch';
}

export interface SceneCut {
  id: string;
  timestamp: number;
  label: string;
  confidence: number;
  thumbnailUrl?: string;
}

export interface VideoProject {
  id: string;
  name: string;
  dateCreated: string;
  duration: number;
  videoWidth: number;
  videoHeight: number;
  trimStart: number;
  trimEnd: number;
  playbackSpeed: number;
  volume: number;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  aspectRatio: AspectRatioType;
  crop: CropRect;
  textOverlay: TextOverlay;
  delogoPatch: DelogoPatch;
  detectedScenes: SceneCut[];
}

export type ActiveTool = 
  | 'trim' 
  | 'crop' 
  | 'rotate' 
  | 'aspect' 
  | 'audio' 
  | 'speed' 
  | 'text' 
  | 'delogo' 
  | 'scenes' 
  | 'export' 
  | 'cloud';

export interface ExportPreset {
  id: string;
  name: string;
  platform: 'tiktok' | 'reels' | 'shorts' | 'instagram' | 'youtube' | 'whatsapp' | 'custom';
  aspectRatio: AspectRatioType;
  width: number;
  height: number;
  fps: number;
  bitrateMb: number;
  format: 'mp4' | 'webm' | 'gif';
  description: string;
  badge?: string;
}
