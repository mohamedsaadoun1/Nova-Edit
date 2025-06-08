/**
 * Library Content Types
 * تعريف أنواع البيانات لمكتبة المحتوى الإبداعي
 */

// Basic interfaces for all content types
export interface BaseContent {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  category: string;
  subcategory?: string;
  author?: string;
  authorUrl?: string;
  source: ContentSource;
  license: LicenseType;
  thumbnailUrl?: string;
  downloadUrl: string;
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
  downloads: number;
  rating: number;
  isFavorite: boolean;
  metadata: Record<string, any>;
}

// Content sources
export enum ContentSource {
  PIXABAY = 'pixabay',
  FREESOUND = 'freesound',
  UNSPLASH = 'unsplash',
  PEXELS = 'pexels',
  FLATICON = 'flaticon',
  GOOGLE_FONTS = 'google_fonts',
  FILMMUSIC = 'filmmusic',
  VIDEVO = 'videvo',
  LOCAL = 'local',
  USER_UPLOAD = 'user_upload'
}

// License types
export enum LicenseType {
  CC0 = 'cc0', // Public Domain
  CC_BY = 'cc_by', // Attribution Required
  CC_BY_SA = 'cc_by_sa', // Attribution + Share Alike
  PIXABAY = 'pixabay_license',
  PEXELS = 'pexels_license',
  CUSTOM_FREE = 'custom_free',
  MIT = 'mit',
  APACHE = 'apache'
}

// Video Templates
export interface VideoTemplate extends BaseContent {
  type: 'video_template';
  videoFormat: VideoFormat;
  duration: number; // seconds
  resolution: Resolution;
  fps: number;
  hasAudio: boolean;
  templateType: VideoTemplateType;
  placeholders?: TemplatePlaceholder[];
  previewUrl?: string;
}

export enum VideoTemplateType {
  INTRO = 'intro',
  OUTRO = 'outro',
  SOCIAL_MEDIA = 'social_media',
  ADVERTISEMENT = 'advertisement',
  TRANSITION = 'transition',
  LOWER_THIRD = 'lower_third',
  BACKGROUND = 'background',
  LOGO_REVEAL = 'logo_reveal'
}

export interface TemplatePlaceholder {
  id: string;
  type: 'text' | 'image' | 'video' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  duration?: number;
  defaultContent?: string;
}

export enum VideoFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  WEBM = 'webm',
  MKV = 'mkv'
}

export interface Resolution {
  width: number;
  height: number;
  label: string; // '1080p', '4K', etc.
}

// Music and Audio
export interface MusicTrack extends BaseContent {
  type: 'music';
  audioFormat: AudioFormat;
  duration: number; // seconds
  genre: MusicGenre;
  mood: MusicMood;
  tempo: number; // BPM
  key?: string;
  isLoopable: boolean;
  instruments: string[];
  waveformUrl?: string;
}

export interface SoundEffect extends BaseContent {
  type: 'sound_effect';
  audioFormat: AudioFormat;
  duration: number;
  soundCategory: SoundCategory;
  waveformUrl?: string;
}

export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  AAC = 'aac',
  FLAC = 'flac'
}

export enum MusicGenre {
  ELECTRONIC = 'electronic',
  ACOUSTIC = 'acoustic',
  ROCK = 'rock',
  POP = 'pop',
  HIP_HOP = 'hip_hop',
  JAZZ = 'jazz',
  CLASSICAL = 'classical',
  AMBIENT = 'ambient',
  CORPORATE = 'corporate',
  CINEMATIC = 'cinematic'
}

export enum MusicMood {
  HAPPY = 'happy',
  SAD = 'sad',
  ENERGETIC = 'energetic',
  CALM = 'calm',
  DRAMATIC = 'dramatic',
  ROMANTIC = 'romantic',
  MYSTERIOUS = 'mysterious',
  UPLIFTING = 'uplifting',
  DARK = 'dark',
  INSPIRING = 'inspiring'
}

export enum SoundCategory {
  NATURE = 'nature',
  TECHNOLOGY = 'technology',
  HUMAN = 'human',
  TRANSPORT = 'transport',
  HOUSEHOLD = 'household',
  ANIMALS = 'animals',
  WEATHER = 'weather',
  MUSICAL = 'musical',
  INDUSTRIAL = 'industrial',
  NOTIFICATION = 'notification'
}

// Icons and Stickers
export interface Icon extends BaseContent {
  type: 'icon';
  iconFormat: IconFormat;
  style: IconStyle;
  color?: string;
  isColorizable: boolean;
  sizes: IconSize[];
  vectorUrl?: string; // SVG version
}

export interface Sticker extends BaseContent {
  type: 'sticker';
  stickerFormat: ImageFormat;
  hasTransparency: boolean;
  style: StickerStyle;
  color?: string;
  animatedUrl?: string; // GIF version
}

export enum IconFormat {
  SVG = 'svg',
  PNG = 'png',
  ICO = 'ico',
  EPS = 'eps'
}

export enum ImageFormat {
  PNG = 'png',
  JPG = 'jpg',
  GIF = 'gif',
  WEBP = 'webp',
  SVG = 'svg'
}

export enum IconStyle {
  OUTLINE = 'outline',
  FILLED = 'filled',
  DUOTONE = 'duotone',
  FLAT = 'flat',
  MATERIAL = 'material',
  FEATHER = 'feather'
}

export enum StickerStyle {
  CARTOON = 'cartoon',
  REALISTIC = 'realistic',
  MINIMAL = 'minimal',
  HAND_DRAWN = 'hand_drawn',
  PIXEL_ART = 'pixel_art'
}

export interface IconSize {
  size: number; // pixels
  url: string;
}

// Fonts
export interface Font extends BaseContent {
  type: 'font';
  fontFamily: string;
  variants: FontVariant[];
  language: FontLanguage[];
  category: FontCategory;
  googleFontName?: string;
  previewText: string;
  fontFiles: FontFile[];
}

export interface FontVariant {
  weight: number; // 100, 200, 300, 400, 500, 600, 700, 800, 900
  style: 'normal' | 'italic';
  url: string;
}

export interface FontFile {
  format: FontFormat;
  url: string;
  weight: number;
  style: 'normal' | 'italic';
}

export enum FontFormat {
  TTF = 'ttf',
  OTF = 'otf',
  WOFF = 'woff',
  WOFF2 = 'woff2',
  EOT = 'eot'
}

export enum FontLanguage {
  LATIN = 'latin',
  ARABIC = 'arabic',
  CYRILLIC = 'cyrillic',
  CHINESE = 'chinese',
  JAPANESE = 'japanese',
  KOREAN = 'korean',
  HINDI = 'hindi',
  THAI = 'thai'
}

export enum FontCategory {
  SERIF = 'serif',
  SANS_SERIF = 'sans_serif',
  DISPLAY = 'display',
  HANDWRITING = 'handwriting',
  MONOSPACE = 'monospace'
}

// Union type for all content
export type LibraryContent = VideoTemplate | MusicTrack | SoundEffect | Icon | Sticker | Font;

// Search and Filter interfaces
export interface SearchFilters {
  query?: string;
  type?: LibraryContent['type'][];
  category?: string[];
  license?: LicenseType[];
  source?: ContentSource[];
  duration?: {
    min?: number;
    max?: number;
  };
  resolution?: Resolution[];
  mood?: MusicMood[];
  genre?: MusicGenre[];
  tags?: string[];
  isFree?: boolean;
  hasTransparency?: boolean;
  language?: FontLanguage[];
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum SortOption {
  RELEVANCE = 'relevance',
  NEWEST = 'newest',
  OLDEST = 'oldest',
  DOWNLOADS = 'downloads',
  RATING = 'rating',
  TITLE = 'title',
  DURATION = 'duration',
  FILE_SIZE = 'file_size'
}

export interface SearchResult<T = LibraryContent> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Collection and Playlist interfaces
export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  items: string[]; // Content IDs
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  thumbnailUrl?: string;
  tags: string[];
}

export interface Playlist extends Collection {
  type: 'music' | 'sound_effects';
  totalDuration: number;
  autoPlay: boolean;
  shuffleEnabled: boolean;
}

// Download and caching
export interface DownloadProgress {
  contentId: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  filePath?: string;
}

export interface CacheEntry {
  contentId: string;
  filePath: string;
  lastAccessed: Date;
  fileSize: number;
  isTemporary: boolean;
}

// API Response interfaces
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  hasMore?: boolean;
}

// Category structure for UI
export interface CategoryTree {
  id: string;
  name: string;
  icon?: string;
  children?: CategoryTree[];
  count: number;
}

// Popular and trending content
export interface TrendingContent {
  daily: LibraryContent[];
  weekly: LibraryContent[];
  monthly: LibraryContent[];
  allTime: LibraryContent[];
}

// User preferences and history
export interface UserPreferences {
  favoriteCategories: string[];
  preferredLicenses: LicenseType[];
  defaultQuality: 'low' | 'medium' | 'high';
  autoDownload: boolean;
  cacheLimit: number; // MB
  language: string;
}

export interface UsageHistory {
  contentId: string;
  usedAt: Date;
  usageType: 'download' | 'preview' | 'favorite' | 'collection_add';
}

// Stats and analytics
export interface ContentStats {
  totalItems: number;
  byType: Record<LibraryContent['type'], number>;
  bySource: Record<ContentSource, number>;
  byLicense: Record<LicenseType, number>;
  totalSize: number; // bytes
  lastUpdated: Date;
}

export interface UserStats {
  totalDownloads: number;
  favoriteCount: number;
  collectionsCount: number;
  usageByCategory: Record<string, number>;
  topSources: ContentSource[];
  storageUsed: number; // bytes
}