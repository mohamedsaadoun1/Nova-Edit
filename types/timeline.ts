/**
 * أنواع الجدول الزمني المتقدم - Nova Edit Mobile
 * تعريفات شاملة للجدول الزمني والإطارات المفتاحية
 */

import { FilterType } from './video';

// الإطارات المفتاحية المتقدمة
export interface AdvancedKeyframe {
  id: string;
  clipId: string;
  trackId: string;
  time: number;
  property: KeyframeProperty;
  value: any;
  easing: EasingType;
  selected: boolean;
  locked: boolean;
  interpolation: InterpolationType;
  customBezier?: BezierControlPoints;
  metadata?: KeyframeMetadata;
}

export enum KeyframeProperty {
  // Transform properties
  SCALE_X = 'scaleX',
  SCALE_Y = 'scaleY',
  SCALE_UNIFORM = 'scaleUniform',
  ROTATION = 'rotation',
  POSITION_X = 'positionX',
  POSITION_Y = 'positionY',
  ANCHOR_X = 'anchorX',
  ANCHOR_Y = 'anchorY',
  
  // Visual properties
  OPACITY = 'opacity',
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
  HUE = 'hue',
  GAMMA = 'gamma',
  EXPOSURE = 'exposure',
  
  // Audio properties
  VOLUME = 'volume',
  BASS = 'bass',
  TREBLE = 'treble',
  PITCH = 'pitch',
  
  // Effect properties
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  NOISE_REDUCTION = 'noiseReduction',
  STABILIZATION = 'stabilization',
  
  // Custom properties
  CUSTOM = 'custom'
}

export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  EASE_IN_SINE = 'easeInSine',
  EASE_OUT_SINE = 'easeOutSine',
  EASE_IN_OUT_SINE = 'easeInOutSine',
  EASE_IN_QUAD = 'easeInQuad',
  EASE_OUT_QUAD = 'easeOutQuad',
  EASE_IN_OUT_QUAD = 'easeInOutQuad',
  EASE_IN_CUBIC = 'easeInCubic',
  EASE_OUT_CUBIC = 'easeOutCubic',
  EASE_IN_OUT_CUBIC = 'easeInOutCubic',
  EASE_IN_QUART = 'easeInQuart',
  EASE_OUT_QUART = 'easeOutQuart',
  EASE_IN_OUT_QUART = 'easeInOutQuart',
  EASE_IN_QUINT = 'easeInQuint',
  EASE_OUT_QUINT = 'easeOutQuint',
  EASE_IN_OUT_QUINT = 'easeInOutQuint',
  EASE_IN_EXPO = 'easeInExpo',
  EASE_OUT_EXPO = 'easeOutExpo',
  EASE_IN_OUT_EXPO = 'easeInOutExpo',
  EASE_IN_CIRC = 'easeInCirc',
  EASE_OUT_CIRC = 'easeOutCirc',
  EASE_IN_OUT_CIRC = 'easeInOutCirc',
  EASE_IN_BACK = 'easeInBack',
  EASE_OUT_BACK = 'easeOutBack',
  EASE_IN_OUT_BACK = 'easeInOutBack',
  EASE_IN_ELASTIC = 'easeInElastic',
  EASE_OUT_ELASTIC = 'easeOutElastic',
  EASE_IN_OUT_ELASTIC = 'easeInOutElastic',
  EASE_IN_BOUNCE = 'easeInBounce',
  EASE_OUT_BOUNCE = 'easeOutBounce',
  EASE_IN_OUT_BOUNCE = 'easeInOutBounce',
  CUSTOM_BEZIER = 'customBezier'
}

export enum InterpolationType {
  LINEAR = 'linear',
  STEPPED = 'stepped',
  BEZIER = 'bezier',
  SPLINE = 'spline'
}

export interface BezierControlPoints {
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
}

export interface KeyframeMetadata {
  createdAt: Date;
  modifiedAt: Date;
  author?: string;
  notes?: string;
  tags?: string[];
}

// التحديد المتقدم
export interface AdvancedTimelineSelection {
  clips: string[];
  keyframes: string[];
  tracks: string[];
  markers: string[];
  startTime?: number;
  endTime?: number;
  selectionType: SelectionType;
  boundingBox?: SelectionBoundingBox;
}

export enum SelectionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  RANGE = 'range',
  AREA = 'area'
}

export interface SelectionBoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

// العلامات والمؤشرات
export interface TimelineMarker {
  id: string;
  time: number;
  type: MarkerType;
  label: string;
  color: string;
  locked: boolean;
  visible: boolean;
  metadata?: MarkerMetadata;
}

export enum MarkerType {
  CHAPTER = 'chapter',
  BOOKMARK = 'bookmark',
  CUE_POINT = 'cuePoint',
  SYNC_POINT = 'syncPoint',
  CUSTOM = 'custom'
}

export interface MarkerMetadata {
  description?: string;
  thumbnailUrl?: string;
  linkedClipId?: string;
  customData?: { [key: string]: any };
}

// مجموعات المسارات
export interface TrackGroup {
  id: string;
  name: string;
  color: string;
  tracks: string[];
  collapsed: boolean;
  locked: boolean;
  visible: boolean;
  muted: boolean;
  solo: boolean;
  blendMode: BlendMode;
  opacity: number;
  parent?: string; // للمجموعات المتداخلة
  children: string[]; // للمجموعات الفرعية
}

export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  SOFT_LIGHT = 'softLight',
  HARD_LIGHT = 'hardLight',
  COLOR_DODGE = 'colorDodge',
  COLOR_BURN = 'colorBurn',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion'
}

// المسار المحسن
export interface AdvancedTrack {
  id: string;
  name: string;
  type: TrackType;
  clips: string[]; // مراجع للمقاطع
  height: number;
  color: string;
  locked: boolean;
  visible: boolean;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number; // للصوت
  blendMode: BlendMode;
  opacity: number;
  parentGroup?: string;
  order: number;
  collapsed: boolean;
  metadata?: TrackMetadata;
}

export enum TrackType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  IMAGE = 'image',
  SHAPE = 'shape',
  ADJUSTMENT = 'adjustment',
  NULL_OBJECT = 'nullObject'
}

export interface TrackMetadata {
  createdAt: Date;
  modifiedAt: Date;
  description?: string;
  tags?: string[];
  customProperties?: { [key: string]: any };
}

// المقطع المحسن
export interface AdvancedVideoClip {
  id: string;
  name: string;
  trackId: string;
  sourceFileId: string;
  
  // التوقيت
  position: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  speed: number;
  reverse: boolean;
  
  // التحويلات
  transform: ClipTransform;
  
  // التأثيرات
  effects: ClipEffect[];
  filters: ClipFilter[];
  
  // الصوت
  audio: ClipAudio;
  
  // الحالة
  enabled: boolean;
  locked: boolean;
  selected: boolean;
  
  // البيانات الوصفية
  metadata?: ClipMetadata;
}

export interface ClipTransform {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  anchor: { x: number; y: number };
  opacity: number;
  blendMode: BlendMode;
}

export interface ClipEffect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: { [key: string]: any };
  keyframes: string[]; // مراجع للإطارات المفتاحية
}

export enum EffectType {
  // Visual effects
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  GLOW = 'glow',
  DROP_SHADOW = 'dropShadow',
  BEVEL_EMBOSS = 'bevelEmboss',
  
  // Color effects
  COLOR_CORRECTION = 'colorCorrection',
  HUE_SATURATION = 'hueSaturation',
  CURVES = 'curves',
  LEVELS = 'levels',
  WHITE_BALANCE = 'whiteBalance',
  
  // Distortion effects
  WARP = 'warp',
  RIPPLE = 'ripple',
  TWIST = 'twist',
  FISHEYE = 'fisheye',
  
  // Time effects
  TIME_REMAP = 'timeRemap',
  FRAME_HOLD = 'frameHold',
  REVERSE = 'reverse',
  
  // Audio effects
  ECHO = 'echo',
  REVERB = 'reverb',
  EQUALIZER = 'equalizer',
  COMPRESSOR = 'compressor',
  
  // AI effects
  BACKGROUND_REMOVAL = 'backgroundRemoval',
  OBJECT_TRACKING = 'objectTracking',
  FACE_DETECTION = 'faceDetection',
  MOTION_BLUR = 'motionBlur',
  
  // Custom
  CUSTOM = 'custom'
}

export interface ClipFilter {
  id: string;
  type: FilterType;
  enabled: boolean;
  intensity: number;
  parameters: { [key: string]: any };
}

export interface ClipAudio {
  volume: number;
  muted: boolean;
  pan: number;
  effects: AudioEffect[];
  waveformData?: WaveformData;
}

export interface AudioEffect {
  id: string;
  type: AudioEffectType;
  enabled: boolean;
  parameters: { [key: string]: any };
}

export enum AudioEffectType {
  ECHO = 'echo',
  REVERB = 'reverb',
  CHORUS = 'chorus',
  FLANGER = 'flanger',
  PHASER = 'phaser',
  DISTORTION = 'distortion',
  EQUALIZER = 'equalizer',
  COMPRESSOR = 'compressor',
  LIMITER = 'limiter',
  NOISE_GATE = 'noiseGate',
  DELAY = 'delay',
  PITCH_SHIFT = 'pitchShift'
}

export interface WaveformData {
  peaks: number[];
  sampleRate: number;
  duration: number;
  channels: number;
}

export interface ClipMetadata {
  originalFileName: string;
  fileSize: number;
  duration: number;
  resolution?: { width: number; height: number };
  frameRate?: number;
  codec?: string;
  bitrate?: number;
  createdAt: Date;
  modifiedAt: Date;
  tags?: string[];
  notes?: string;
}

// الجدول الزمني المتقدم
export interface AdvancedTimeline {
  id: string;
  name: string;
  duration: number;
  currentTime: number;
  frameRate: number;
  resolution: { width: number; height: number };
  
  // المحتوى
  tracks: AdvancedTrack[];
  clips: AdvancedVideoClip[];
  keyframes: AdvancedKeyframe[];
  markers: TimelineMarker[];
  trackGroups: TrackGroup[];
  
  // العرض
  zoom: number;
  viewportStart: number;
  viewportEnd: number;
  pixelsPerSecond: number;
  trackHeight: number;
  
  // التحديد
  selection: AdvancedTimelineSelection;
  
  // الإعدادات
  settings: TimelineSettings;
  
  // البيانات الوصفية
  metadata?: TimelineMetadata;
}

export interface TimelineSettings {
  snapToGrid: boolean;
  snapToClips: boolean;
  snapToKeyframes: boolean;
  snapToMarkers: boolean;
  magneticSnap: boolean;
  snapThreshold: number;
  
  showWaveforms: boolean;
  showThumbnails: boolean;
  showKeyframes: boolean;
  showMarkers: boolean;
  showGrid: boolean;
  
  autoSave: boolean;
  autoSaveInterval: number;
  
  renderQuality: RenderQuality;
  playbackQuality: PlaybackQuality;
}

export enum RenderQuality {
  DRAFT = 'draft',
  PREVIEW = 'preview',
  FULL = 'full'
}

export enum PlaybackQuality {
  QUARTER = 'quarter',
  HALF = 'half',
  FULL = 'full',
  AUTO = 'auto'
}

export interface TimelineMetadata {
  projectId: string;
  createdAt: Date;
  modifiedAt: Date;
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
  customData?: { [key: string]: any };
}

// أحداث الجدول الزمني
export interface TimelineEvent {
  type: TimelineEventType;
  timestamp: Date;
  data: any;
  undoable: boolean;
}

export enum TimelineEventType {
  CLIP_ADDED = 'clipAdded',
  CLIP_REMOVED = 'clipRemoved',
  CLIP_MOVED = 'clipMoved',
  CLIP_TRIMMED = 'clipTrimmed',
  CLIP_SPLIT = 'clipSplit',
  CLIP_MERGED = 'clipMerged',
  
  KEYFRAME_ADDED = 'keyframeAdded',
  KEYFRAME_REMOVED = 'keyframeRemoved',
  KEYFRAME_MOVED = 'keyframeMoved',
  KEYFRAME_VALUE_CHANGED = 'keyframeValueChanged',
  
  TRACK_ADDED = 'trackAdded',
  TRACK_REMOVED = 'trackRemoved',
  TRACK_REORDERED = 'trackReordered',
  
  SELECTION_CHANGED = 'selectionChanged',
  TIME_CHANGED = 'timeChanged',
  ZOOM_CHANGED = 'zoomChanged',
  
  EFFECT_ADDED = 'effectAdded',
  EFFECT_REMOVED = 'effectRemoved',
  EFFECT_CHANGED = 'effectChanged',
  
  MARKER_ADDED = 'markerAdded',
  MARKER_REMOVED = 'markerRemoved',
  MARKER_MOVED = 'markerMoved'
}

// عمليات السحب والإفلات
export interface DragOperation {
  type: DragType;
  items: DragItem[];
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  snapPoints: SnapPoint[];
  previewData?: any;
}

export enum DragType {
  CLIP_MOVE = 'clipMove',
  CLIP_TRIM_START = 'clipTrimStart',
  CLIP_TRIM_END = 'clipTrimEnd',
  CLIP_DUPLICATE = 'clipDuplicate',
  KEYFRAME_MOVE = 'keyframeMove',
  MARKER_MOVE = 'markerMove',
  PLAYHEAD_MOVE = 'playheadMove',
  SELECTION_AREA = 'selectionArea',
  TRACK_REORDER = 'trackReorder'
}

export interface DragItem {
  id: string;
  type: 'clip' | 'keyframe' | 'marker' | 'track';
  originalPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  constraints?: DragConstraints;
}

export interface DragConstraints {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  snapToGrid?: boolean;
  snapToObjects?: boolean;
}

export interface SnapPoint {
  time: number;
  type: SnapPointType;
  id?: string;
  priority: number;
}

export enum SnapPointType {
  GRID = 'grid',
  CLIP_START = 'clipStart',
  CLIP_END = 'clipEnd',
  KEYFRAME = 'keyframe',
  MARKER = 'marker',
  PLAYHEAD = 'playhead'
}

// تصدير جميع الأنواع
export type {
  AdvancedKeyframe as Keyframe,
  AdvancedTimelineSelection as TimelineSelection,
  AdvancedTrack as Track,
  AdvancedVideoClip as VideoClip,
  AdvancedTimeline as Timeline
};

export default {
  KeyframeProperty,
  EasingType,
  InterpolationType,
  SelectionType,
  MarkerType,
  BlendMode,
  TrackType,
  EffectType,
  AudioEffectType,
  RenderQuality,
  PlaybackQuality,
  TimelineEventType,
  DragType,
  SnapPointType
};