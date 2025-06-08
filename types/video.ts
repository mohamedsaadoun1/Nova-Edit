// Video types for Nova Edit Mobile
export interface VideoFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  format: string;
  thumbnail?: string;
  metadata?: {
    fps: number;
    bitrate: number;
    codec: string;
    hasAudio: boolean;
  };
}

export interface VideoClip {
  id: string;
  videoFileId: string;
  startTime: number;
  endTime: number;
  trackIndex: number;
  position: number;
  duration: number;
  volume: number;
  speed: number;
  filters: Filter[];
  transformations: Transformation;
  visible: boolean;
}

export interface Filter {
  id: string;
  type: FilterType;
  parameters: { [key: string]: any };
  intensity: number;
}

export enum FilterType {
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
  BLUR = 'blur',
  SEPIA = 'sepia',
  VINTAGE = 'vintage',
  NOIR = 'noir',
  VIBRANT = 'vibrant',
  WARM = 'warm',
  COOL = 'cool',
  FADE = 'fade'
}

export interface Transformation {
  scale: number;
  rotation: number;
  x: number;
  y: number;
  opacity: number;
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  clips: VideoClip[];
  volume: number;
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export interface Timeline {
  duration: number;
  currentTime: number;
  tracks: Track[];
  zoom: number;
  selectedClipIds: string[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  loop: boolean;
}

export interface ExportSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4K';
  format: 'mp4' | 'mov' | 'webm';
  fps: 24 | 30 | 60;
  bitrate?: number;
}

export interface ProcessingTask {
  id: string;
  type: 'trim' | 'filter' | 'export' | 'merge' | 'compress';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: any;
}

export interface Project {
  id: string;
  name: string;
  timeline: Timeline;
  videoFiles: VideoFile[];
  exportSettings: ExportSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum Tool {
  SELECT = 'select',
  TRIM = 'trim',
  SPLIT = 'split',
  TEXT = 'text',
  FILTER = 'filter',
  TRANSITION = 'transition',
  AUDIO = 'audio'
}

export interface UIState {
  selectedTool: Tool;
  timelineHeight: number;
  previewMode: 'fit' | 'fill' | 'stretch';
  showGrid: boolean;
  snapToGrid: boolean;
  darkMode: boolean;
  sidebarOpen: boolean;
}

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  videoFiles: VideoFile[];
  timeline: Timeline;
  playbackState: PlaybackState;
  processingTasks: ProcessingTask[];
  ui: UIState;
}