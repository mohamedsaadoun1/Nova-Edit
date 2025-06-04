/**
 * مدير مكتبة الأصول الشامل - Nova Edit Mobile
 * إدارة شاملة للموسيقى، المؤثرات الصوتية، القوالب، والموارد الرقمية
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category: AssetCategory;
  subcategory: string;
  thumbnail: string;
  previewUrl?: string;
  downloadUrl: string;
  localPath?: string;
  size: number;
  duration?: number; // للصوت والفيديو بالثواني
  format: string;
  quality: AssetQuality;
  tags: string[];
  description: string;
  author: string;
  license: LicenseType;
  rating: number;
  downloads: number;
  isDownloaded: boolean;
  isFavorite: boolean;
  isPremium: boolean;
  lastUsed?: Date;
  metadata: AssetMetadata;
}

export enum AssetType {
  MUSIC = 'music',
  SOUND_EFFECT = 'soundEffect',
  VOICE_OVER = 'voiceOver',
  AMBIENT = 'ambient',
  TEMPLATE = 'template',
  STICKER = 'sticker',
  FONT = 'font',
  COLOR_PALETTE = 'colorPalette',
  GRAPHIC_ELEMENT = 'graphicElement',
  ANIMATION_PRESET = 'animationPreset',
  TRANSITION_TEMPLATE = 'transitionTemplate'
}

export enum AssetCategory {
  // موسيقى
  ELECTRONIC = 'electronic',
  ACOUSTIC = 'acoustic',
  CLASSICAL = 'classical',
  JAZZ = 'jazz',
  ROCK = 'rock',
  POP = 'pop',
  CINEMATIC = 'cinematic',
  AMBIENT_MUSIC = 'ambientMusic',
  WORLD = 'world',
  
  // مؤثرات صوتية
  NATURE_SOUNDS = 'natureSounds',
  URBAN_SOUNDS = 'urbanSounds',
  TECHNOLOGY = 'technology',
  HUMAN_SOUNDS = 'humanSounds',
  MECHANICAL = 'mechanical',
  MAGICAL = 'magical',
  HORROR = 'horror',
  COMEDY = 'comedy',
  
  // قوالب
  SOCIAL_MEDIA = 'socialMedia',
  BUSINESS = 'business',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  TRAVEL = 'travel',
  FOOD = 'food',
  FASHION = 'fashion',
  SPORTS = 'sports',
  GAMING = 'gaming',
  VLOG = 'vlog',
  
  // عناصر بصرية
  MINIMAL = 'minimal',
  VINTAGE = 'vintage',
  MODERN = 'modern',
  FUTURISTIC = 'futuristic',
  ORGANIC = 'organic',
  GEOMETRIC = 'geometric'
}

export enum AssetQuality {
  LOW = 'low',          // 128kbps للصوت، 480p للفيديو
  MEDIUM = 'medium',    // 256kbps للصوت، 720p للفيديو
  HIGH = 'high',        // 320kbps للصوت، 1080p للفيديو
  ULTRA = 'ultra'       // lossless للصوت، 4K للفيديو
}

export enum LicenseType {
  PUBLIC_DOMAIN = 'publicDomain',
  CC0 = 'cc0',
  CC_BY = 'ccBy',
  CC_BY_SA = 'ccBySa',
  ROYALTY_FREE = 'royaltyFree',
  PREMIUM = 'premium',
  EXCLUSIVE = 'exclusive'
}

export interface AssetMetadata {
  format: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  tempo?: number; // BPM للموسيقى
  key?: string; // مفتاح الموسيقى
  mood?: string[];
  instruments?: string[];
  genre?: string[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  compatibleWith: string[];
  colorPalette?: string[]; // للعناصر البصرية
  dimensions?: { width: number; height: number };
}

export interface AssetLibrarySource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  type: SourceType;
  assetTypes: AssetType[];
  totalAssets: number;
  lastSync: Date;
  isActive: boolean;
  subscription?: SubscriptionType;
}

export enum SourceType {
  FREESOUND = 'freesound',
  ZAPSPLAT = 'zapsplat',
  PIXABAY_AUDIO = 'pixabayAudio',
  YOUTUBE_AUDIO_LIBRARY = 'youtubeAudioLibrary',
  GITHUB_ASSETS = 'githubAssets',
  CREATIVE_COMMONS = 'creativeCommons',
  OPENVERSE = 'openverse',
  UNSPLASH = 'unsplash',
  PEXELS = 'pexels',
  MIXKIT = 'mixkit',
  VIDEVO = 'videvo'
}

export enum SubscriptionType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface AssetSearchFilter {
  type?: AssetType;
  category?: AssetCategory;
  subcategory?: string;
  tags?: string[];
  license?: LicenseType;
  quality?: AssetQuality;
  minDuration?: number;
  maxDuration?: number;
  minRating?: number;
  maxSize?: number;
  tempo?: { min: number; max: number };
  key?: string;
  mood?: string[];
  freeOnly?: boolean;
  downloadedOnly?: boolean;
  favoritesOnly?: boolean;
  recentlyUsed?: boolean;
  query?: string;
}

export interface MusicTemplate {
  id: string;
  name: string;
  category: string;
  tracks: MusicTrack[];
  totalDuration: number;
  preview: string;
  tags: string[];
  mood: string;
  tempo: number;
  key: string;
}

export interface MusicTrack {
  id: string;
  name: string;
  type: TrackType;
  assetId: string;
  startTime: number;
  duration: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  effects?: AudioEffect[];
}

export enum TrackType {
  MAIN_MELODY = 'mainMelody',
  BASS = 'bass',
  DRUMS = 'drums',
  AMBIENT = 'ambient',
  VOICE_OVER = 'voiceOver',
  SOUND_EFFECT = 'soundEffect'
}

export interface AudioEffect {
  type: string;
  parameters: { [key: string]: any };
}

export class AssetsLibraryManager {
  private static instance: AssetsLibraryManager;
  private assets: Map<string, Asset> = new Map();
  private sources: AssetLibrarySource[] = [];
  private downloadQueue: string[] = [];
  private isDownloading = false;
  private cacheDir: string;
  private audioContext?: Audio.Sound;

  private constructor() {
    this.cacheDir = `${FileSystem.documentDirectory}assets_cache/`;
    this.initializeSources();
  }

  public static getInstance(): AssetsLibraryManager {
    if (!AssetsLibraryManager.instance) {
      AssetsLibraryManager.instance = new AssetsLibraryManager();
    }
    return AssetsLibraryManager.instance;
  }

  /**
   * تهيئة مصادر المكتبات المجانية الضخمة
   */
  private async initializeSources(): Promise<void> {
    this.sources = [
      {
        id: 'freesound',
        name: 'Freesound.org',
        baseUrl: 'https://freesound.org/apiv2',
        type: SourceType.FREESOUND,
        assetTypes: [AssetType.SOUND_EFFECT, AssetType.AMBIENT, AssetType.MUSIC],
        totalAssets: 500000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'zapsplat',
        name: 'Zapsplat',
        baseUrl: 'https://api.zapsplat.com/v1',
        type: SourceType.ZAPSPLAT,
        assetTypes: [AssetType.SOUND_EFFECT, AssetType.MUSIC],
        totalAssets: 100000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'pixabay-audio',
        name: 'Pixabay Music',
        baseUrl: 'https://pixabay.com/api/music',
        type: SourceType.PIXABAY_AUDIO,
        assetTypes: [AssetType.MUSIC, AssetType.SOUND_EFFECT],
        totalAssets: 50000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'youtube-audio-library',
        name: 'YouTube Audio Library',
        baseUrl: 'https://www.youtube.com/audiolibrary',
        type: SourceType.YOUTUBE_AUDIO_LIBRARY,
        assetTypes: [AssetType.MUSIC, AssetType.SOUND_EFFECT],
        totalAssets: 10000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'mixkit',
        name: 'Mixkit Free Assets',
        baseUrl: 'https://mixkit.co/api',
        type: SourceType.MIXKIT,
        assetTypes: [AssetType.MUSIC, AssetType.SOUND_EFFECT, AssetType.TEMPLATE],
        totalAssets: 5000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'openverse',
        name: 'Openverse by WordPress',
        baseUrl: 'https://api.openverse.engineering/v1',
        type: SourceType.OPENVERSE,
        assetTypes: [AssetType.MUSIC, AssetType.SOUND_EFFECT],
        totalAssets: 200000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'awesome-music-production',
        name: 'Awesome Music Production (GitHub)',
        baseUrl: 'https://api.github.com/repos/ad-si/awesome-music-production',
        type: SourceType.GITHUB_ASSETS,
        assetTypes: [AssetType.MUSIC, AssetType.TEMPLATE, AssetType.ANIMATION_PRESET],
        totalAssets: 1000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      },
      {
        id: 'creative-commons-music',
        name: 'Creative Commons Music',
        baseUrl: 'https://search.creativecommons.org/api',
        type: SourceType.CREATIVE_COMMONS,
        assetTypes: [AssetType.MUSIC],
        totalAssets: 100000,
        lastSync: new Date(),
        isActive: true,
        subscription: SubscriptionType.FREE
      }
    ];

    await this.loadLocalAssets();
    await this.populateInitialAssets();
  }

  /**
   * ملء الأصول الأولية من المصادر
   */
  private async populateInitialAssets(): Promise<void> {
    // إضافة أصول أولية للعرض السريع
    const initialAssets: Asset[] = [
      // موسيقى
      {
        id: 'upbeat-electronic-1',
        name: 'Upbeat Electronic Track',
        type: AssetType.MUSIC,
        category: AssetCategory.ELECTRONIC,
        subcategory: 'upbeat',
        thumbnail: 'https://via.placeholder.com/150x150/FF6B6B/FFF?text=♪',
        downloadUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        size: 2500000, // 2.5MB
        duration: 120, // دقيقتان
        format: 'mp3',
        quality: AssetQuality.HIGH,
        tags: ['electronic', 'upbeat', 'energetic', 'modern'],
        description: 'مقطع موسيقي إلكتروني حيوي ومفعم بالطاقة',
        author: 'Community Composer',
        license: LicenseType.CC0,
        rating: 4.5,
        downloads: 1250,
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'mp3',
          bitrate: 320,
          sampleRate: 44100,
          channels: 2,
          tempo: 128,
          key: 'C major',
          mood: ['energetic', 'happy', 'motivational'],
          instruments: ['synthesizer', 'drums', 'bass'],
          genre: ['electronic', 'dance'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      },
      {
        id: 'acoustic-guitar-calm',
        name: 'Calm Acoustic Guitar',
        type: AssetType.MUSIC,
        category: AssetCategory.ACOUSTIC,
        subcategory: 'calm',
        thumbnail: 'https://via.placeholder.com/150x150/4ECDC4/FFF?text=♫',
        downloadUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        size: 1800000,
        duration: 90,
        format: 'mp3',
        quality: AssetQuality.HIGH,
        tags: ['acoustic', 'calm', 'peaceful', 'guitar'],
        description: 'مقطع جيتار أكوستيك هادئ ومريح',
        author: 'Indie Artist',
        license: LicenseType.CC_BY,
        rating: 4.7,
        downloads: 890,
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'mp3',
          bitrate: 256,
          sampleRate: 44100,
          channels: 2,
          tempo: 70,
          key: 'G major',
          mood: ['calm', 'peaceful', 'relaxing'],
          instruments: ['acoustic guitar', 'soft percussion'],
          genre: ['folk', 'acoustic'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      },
      // مؤثرات صوتية
      {
        id: 'nature-forest-ambience',
        name: 'Forest Ambience',
        type: AssetType.AMBIENT,
        category: AssetCategory.NATURE_SOUNDS,
        subcategory: 'forest',
        thumbnail: 'https://via.placeholder.com/150x150/27AE60/FFF?text=🌲',
        downloadUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        size: 3200000,
        duration: 180,
        format: 'mp3',
        quality: AssetQuality.HIGH,
        tags: ['nature', 'forest', 'birds', 'peaceful'],
        description: 'أصوات الغابة الطبيعية مع تغريد الطيور',
        author: 'Nature Sounds Pro',
        license: LicenseType.CC0,
        rating: 4.8,
        downloads: 2100,
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'mp3',
          bitrate: 192,
          sampleRate: 44100,
          channels: 2,
          mood: ['peaceful', 'natural', 'relaxing'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      },
      {
        id: 'urban-traffic-sound',
        name: 'City Traffic',
        type: AssetType.SOUND_EFFECT,
        category: AssetCategory.URBAN_SOUNDS,
        subcategory: 'traffic',
        thumbnail: 'https://via.placeholder.com/150x150/95A5A6/FFF?text=🚗',
        downloadUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        size: 1500000,
        duration: 60,
        format: 'wav',
        quality: AssetQuality.MEDIUM,
        tags: ['urban', 'traffic', 'city', 'cars'],
        description: 'أصوات المرور في المدينة',
        author: 'Urban Audio',
        license: LicenseType.ROYALTY_FREE,
        rating: 4.2,
        downloads: 450,
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'wav',
          bitrate: 256,
          sampleRate: 48000,
          channels: 2,
          mood: ['urban', 'busy', 'realistic'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      },
      // قوالب
      {
        id: 'social-media-intro-template',
        name: 'Social Media Intro',
        type: AssetType.TEMPLATE,
        category: AssetCategory.SOCIAL_MEDIA,
        subcategory: 'intro',
        thumbnail: 'https://via.placeholder.com/150x150/E74C3C/FFF?text=📱',
        downloadUrl: 'template-social-intro.json',
        size: 500000,
        duration: 10,
        format: 'json',
        quality: AssetQuality.HIGH,
        tags: ['template', 'intro', 'social', 'modern'],
        description: 'قالب مقدمة عصري لوسائل التواصل الاجتماعي',
        author: 'Template Studio',
        license: LicenseType.CC_BY,
        rating: 4.6,
        downloads: 3200,
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'json',
          dimensions: { width: 1080, height: 1920 },
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web'],
          colorPalette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
        }
      }
    ];

    initialAssets.forEach(asset => {
      this.assets.set(asset.id, asset);
    });

    await this.saveLocalAssets();
  }

  /**
   * البحث في الأصول
   */
  public async searchAssets(
    filter: AssetSearchFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ assets: Asset[]; total: number }> {
    let filteredAssets = Array.from(this.assets.values());

    // تطبيق المرشحات
    if (filter.type) {
      filteredAssets = filteredAssets.filter(a => a.type === filter.type);
    }

    if (filter.category) {
      filteredAssets = filteredAssets.filter(a => a.category === filter.category);
    }

    if (filter.subcategory) {
      filteredAssets = filteredAssets.filter(a => a.subcategory === filter.subcategory);
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredAssets = filteredAssets.filter(a =>
        filter.tags!.some(tag => a.tags.includes(tag))
      );
    }

    if (filter.license) {
      filteredAssets = filteredAssets.filter(a => a.license === filter.license);
    }

    if (filter.quality) {
      filteredAssets = filteredAssets.filter(a => a.quality === filter.quality);
    }

    if (filter.minDuration) {
      filteredAssets = filteredAssets.filter(a => (a.duration || 0) >= filter.minDuration!);
    }

    if (filter.maxDuration) {
      filteredAssets = filteredAssets.filter(a => (a.duration || 0) <= filter.maxDuration!);
    }

    if (filter.minRating) {
      filteredAssets = filteredAssets.filter(a => a.rating >= filter.minRating!);
    }

    if (filter.maxSize) {
      filteredAssets = filteredAssets.filter(a => a.size <= filter.maxSize!);
    }

    if (filter.tempo) {
      filteredAssets = filteredAssets.filter(a => {
        const tempo = a.metadata.tempo;
        return tempo && tempo >= filter.tempo!.min && tempo <= filter.tempo!.max;
      });
    }

    if (filter.key) {
      filteredAssets = filteredAssets.filter(a => a.metadata.key === filter.key);
    }

    if (filter.mood && filter.mood.length > 0) {
      filteredAssets = filteredAssets.filter(a =>
        a.metadata.mood && filter.mood!.some(mood => a.metadata.mood!.includes(mood))
      );
    }

    if (filter.freeOnly) {
      filteredAssets = filteredAssets.filter(a =>
        [LicenseType.CC0, LicenseType.CC_BY, LicenseType.CC_BY_SA].includes(a.license)
      );
    }

    if (filter.downloadedOnly) {
      filteredAssets = filteredAssets.filter(a => a.isDownloaded);
    }

    if (filter.favoritesOnly) {
      filteredAssets = filteredAssets.filter(a => a.isFavorite);
    }

    if (filter.recentlyUsed) {
      filteredAssets = filteredAssets.filter(a => a.lastUsed);
      filteredAssets.sort((a, b) => 
        (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0)
      );
    }

    if (filter.query) {
      const query = filter.query.toLowerCase();
      filteredAssets = filteredAssets.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query)) ||
        a.author.toLowerCase().includes(query)
      );
    }

    // ترتيب النتائج (إذا لم يكن مرتب بالاستخدام الأخير)
    if (!filter.recentlyUsed) {
      filteredAssets.sort((a, b) => {
        // الأولوية للمفضلة
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        
        // ثم المحملة محلياً
        if (a.isDownloaded && !b.isDownloaded) return -1;
        if (!a.isDownloaded && b.isDownloaded) return 1;
        
        // ثم حسب التقييم
        return b.rating - a.rating;
      });
    }

    const total = filteredAssets.length;
    const assets = filteredAssets.slice(offset, offset + limit);

    return { assets, total };
  }

  /**
   * تحميل أصل من مصدر خارجي
   */
  public async fetchAssetsFromSource(
    sourceId: string,
    assetType: AssetType,
    limit: number = 20,
    offset: number = 0
  ): Promise<Asset[]> {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    try {
      switch (source.type) {
        case SourceType.FREESOUND:
          return await this.fetchFromFreesound(source, assetType, limit, offset);
          
        case SourceType.PIXABAY_AUDIO:
          return await this.fetchFromPixabayAudio(source, assetType, limit, offset);
          
        case SourceType.MIXKIT:
          return await this.fetchFromMixkit(source, assetType, limit, offset);
          
        default:
          throw new Error(`Source type ${source.type} not implemented yet`);
      }
    } catch (error) {
      console.error(`Failed to fetch from ${sourceId}:`, error);
      return [];
    }
  }

  /**
   * تحميل من Freesound
   */
  private async fetchFromFreesound(
    source: AssetLibrarySource,
    assetType: AssetType,
    limit: number,
    offset: number
  ): Promise<Asset[]> {
    // مثال تحميل من Freesound API
    const assets: Asset[] = [];
    
    // في التطبيق الحقيقي، سيكون هناك استدعاء API فعلي
    for (let i = 0; i < Math.min(limit, 10); i++) {
      assets.push({
        id: `freesound_${Date.now()}_${i}`,
        name: `Freesound Asset ${i + 1}`,
        type: assetType,
        category: this.getRandomCategory(assetType),
        subcategory: 'general',
        thumbnail: 'https://via.placeholder.com/150x150/3498DB/FFF?text=🔊',
        downloadUrl: `https://freesound.org/data/previews/sample_${i}.mp3`,
        size: Math.floor(Math.random() * 5000000) + 1000000,
        duration: Math.floor(Math.random() * 180) + 30,
        format: 'mp3',
        quality: AssetQuality.MEDIUM,
        tags: ['freesound', 'community', 'free'],
        description: `High-quality ${assetType} from Freesound community`,
        author: `Freesound User ${i + 1}`,
        license: LicenseType.CC_BY,
        rating: 4 + Math.random(),
        downloads: Math.floor(Math.random() * 1000),
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'mp3',
          bitrate: 192,
          sampleRate: 44100,
          channels: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      });
    }

    return assets;
  }

  /**
   * تحميل من Pixabay Audio
   */
  private async fetchFromPixabayAudio(
    source: AssetLibrarySource,
    assetType: AssetType,
    limit: number,
    offset: number
  ): Promise<Asset[]> {
    const assets: Asset[] = [];
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      assets.push({
        id: `pixabay_audio_${Date.now()}_${i}`,
        name: `Pixabay ${assetType} ${i + 1}`,
        type: assetType,
        category: this.getRandomCategory(assetType),
        subcategory: 'general',
        thumbnail: 'https://via.placeholder.com/150x150/E67E22/FFF?text=🎵',
        downloadUrl: `https://pixabay.com/audio/sample_${i}.mp3`,
        size: Math.floor(Math.random() * 4000000) + 500000,
        duration: Math.floor(Math.random() * 120) + 60,
        format: 'mp3',
        quality: AssetQuality.HIGH,
        tags: ['pixabay', 'royalty-free', 'professional'],
        description: `Professional ${assetType} from Pixabay`,
        author: `Pixabay Artist ${i + 1}`,
        license: LicenseType.ROYALTY_FREE,
        rating: 4.2 + Math.random() * 0.8,
        downloads: Math.floor(Math.random() * 2000),
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'mp3',
          bitrate: 320,
          sampleRate: 44100,
          channels: 2,
          tempo: 60 + Math.floor(Math.random() * 120),
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      });
    }

    return assets;
  }

  /**
   * تحميل من Mixkit
   */
  private async fetchFromMixkit(
    source: AssetLibrarySource,
    assetType: AssetType,
    limit: number,
    offset: number
  ): Promise<Asset[]> {
    const assets: Asset[] = [];
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      assets.push({
        id: `mixkit_${Date.now()}_${i}`,
        name: `Mixkit ${assetType} ${i + 1}`,
        type: assetType,
        category: this.getRandomCategory(assetType),
        subcategory: 'professional',
        thumbnail: 'https://via.placeholder.com/150x150/9B59B6/FFF?text=🎬',
        downloadUrl: `https://mixkit.co/assets/sample_${i}.mp3`,
        size: Math.floor(Math.random() * 3000000) + 1000000,
        duration: Math.floor(Math.random() * 90) + 30,
        format: 'mp3',
        quality: AssetQuality.HIGH,
        tags: ['mixkit', 'professional', 'cinematic'],
        description: `Premium ${assetType} from Mixkit`,
        author: 'Mixkit',
        license: LicenseType.ROYALTY_FREE,
        rating: 4.5 + Math.random() * 0.5,
        downloads: Math.floor(Math.random() * 5000),
        isDownloaded: false,
        isFavorite: false,
        isPremium: false,
        metadata: {
          format: 'mp3',
          bitrate: 320,
          sampleRate: 48000,
          channels: 2,
          mood: ['professional', 'cinematic'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0',
          compatibleWith: ['mobile', 'web']
        }
      });
    }

    return assets;
  }

  /**
   * تحميل أصل محدد
   */
  public async downloadAsset(assetId: string): Promise<string> {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error(`Asset ${assetId} not found`);

    if (asset.isDownloaded && asset.localPath) {
      return asset.localPath;
    }

    // إضافة للطابور
    if (!this.downloadQueue.includes(assetId)) {
      this.downloadQueue.push(assetId);
    }

    // بدء التحميل
    if (!this.isDownloading) {
      this.processDownloadQueue();
    }

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const updatedAsset = this.assets.get(assetId);
        if (updatedAsset?.isDownloaded && updatedAsset.localPath) {
          clearInterval(checkInterval);
          resolve(updatedAsset.localPath);
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Download timeout'));
      }, 120000); // دقيقتان
    });
  }

  /**
   * معالجة طابور التحميل
   */
  private async processDownloadQueue(): Promise<void> {
    if (this.isDownloading || this.downloadQueue.length === 0) return;

    this.isDownloading = true;

    while (this.downloadQueue.length > 0) {
      const assetId = this.downloadQueue.shift()!;
      const asset = this.assets.get(assetId);
      
      if (!asset) continue;

      try {
        const localPath = await this.downloadSingleAsset(asset);
        
        asset.isDownloaded = true;
        asset.localPath = localPath;
        this.assets.set(assetId, asset);
        
        await this.saveLocalAssets();
        
      } catch (error) {
        console.error(`Failed to download asset ${assetId}:`, error);
      }
    }

    this.isDownloading = false;
  }

  /**
   * تحميل أصل واحد
   */
  private async downloadSingleAsset(asset: Asset): Promise<string> {
    await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });

    const fileName = `${asset.id}.${asset.format}`;
    const localPath = `${this.cacheDir}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(
      asset.downloadUrl,
      localPath
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    return localPath;
  }

  /**
   * تشغيل معاينة الأصل
   */
  public async playPreview(assetId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) return;

    try {
      // إيقاف التشغيل الحالي
      if (this.audioContext) {
        await this.audioContext.unloadAsync();
      }

      // تشغيل المعاينة
      const { sound } = await Audio.Sound.createAsync(
        { uri: asset.previewUrl || asset.downloadUrl },
        { shouldPlay: true, volume: 0.5 }
      );

      this.audioContext = sound;

      // تحديث آخر استخدام
      asset.lastUsed = new Date();
      this.assets.set(assetId, asset);
      await this.saveLocalAssets();

    } catch (error) {
      console.error('Failed to play preview:', error);
    }
  }

  /**
   * إيقاف التشغيل
   */
  public async stopPreview(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.stopAsync();
      await this.audioContext.unloadAsync();
      this.audioContext = undefined;
    }
  }

  /**
   * إضافة/إزالة من المفضلة
   */
  public async toggleFavorite(assetId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) return;

    asset.isFavorite = !asset.isFavorite;
    this.assets.set(assetId, asset);
    
    await this.saveLocalAssets();
  }

  /**
   * الحصول على قوالب الموسيقى
   */
  public getMusicTemplates(): MusicTemplate[] {
    return [
      {
        id: 'upbeat-intro-template',
        name: 'مقدمة حيوية',
        category: 'intro',
        tracks: [
          {
            id: 'track-1',
            name: 'Main Beat',
            type: TrackType.MAIN_MELODY,
            assetId: 'upbeat-electronic-1',
            startTime: 0,
            duration: 10,
            volume: 0.8,
            fadeIn: 1,
            fadeOut: 1
          },
          {
            id: 'track-2',
            name: 'Bass Layer',
            type: TrackType.BASS,
            assetId: 'upbeat-electronic-1',
            startTime: 2,
            duration: 8,
            volume: 0.6
          }
        ],
        totalDuration: 10,
        preview: 'template-preview.mp3',
        tags: ['intro', 'upbeat', 'energetic'],
        mood: 'energetic',
        tempo: 128,
        key: 'C major'
      },
      {
        id: 'calm-background-template',
        name: 'خلفية هادئة',
        category: 'background',
        tracks: [
          {
            id: 'track-1',
            name: 'Acoustic Guitar',
            type: TrackType.MAIN_MELODY,
            assetId: 'acoustic-guitar-calm',
            startTime: 0,
            duration: 60,
            volume: 0.7
          },
          {
            id: 'track-2',
            name: 'Forest Ambience',
            type: TrackType.AMBIENT,
            assetId: 'nature-forest-ambience',
            startTime: 0,
            duration: 60,
            volume: 0.3
          }
        ],
        totalDuration: 60,
        preview: 'calm-template-preview.mp3',
        tags: ['calm', 'background', 'peaceful'],
        mood: 'calm',
        tempo: 70,
        key: 'G major'
      }
    ];
  }

  /**
   * إحصائيات المكتبة
   */
  public getLibraryStats(): {
    totalAssets: number;
    downloadedAssets: number;
    favoriteAssets: number;
    cacheSize: number;
    assetsByType: { [key: string]: number };
    assetsByCategory: { [key: string]: number };
  } {
    const assets = Array.from(this.assets.values());
    
    const assetsByType: { [key: string]: number } = {};
    Object.values(AssetType).forEach(type => {
      assetsByType[type] = assets.filter(a => a.type === type).length;
    });

    const assetsByCategory: { [key: string]: number } = {};
    Object.values(AssetCategory).forEach(category => {
      assetsByCategory[category] = assets.filter(a => a.category === category).length;
    });

    return {
      totalAssets: assets.length,
      downloadedAssets: assets.filter(a => a.isDownloaded).length,
      favoriteAssets: assets.filter(a => a.isFavorite).length,
      cacheSize: assets
        .filter(a => a.isDownloaded)
        .reduce((sum, a) => sum + a.size, 0),
      assetsByType,
      assetsByCategory
    };
  }

  /**
   * تنظيف التخزين المؤقت
   */
  public async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      
      this.assets.forEach(asset => {
        asset.isDownloaded = false;
        asset.localPath = undefined;
      });
      
      await this.saveLocalAssets();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // وظائف مساعدة خاصة

  private async loadLocalAssets(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('assets_library');
      if (data) {
        const assets: Asset[] = JSON.parse(data);
        assets.forEach(asset => {
          this.assets.set(asset.id, asset);
        });
      }
    } catch (error) {
      console.error('Failed to load local assets:', error);
    }
  }

  private async saveLocalAssets(): Promise<void> {
    try {
      const assets = Array.from(this.assets.values());
      await AsyncStorage.setItem('assets_library', JSON.stringify(assets));
    } catch (error) {
      console.error('Failed to save local assets:', error);
    }
  }

  private getRandomCategory(assetType: AssetType): AssetCategory {
    const musicCategories = [
      AssetCategory.ELECTRONIC, AssetCategory.ACOUSTIC, AssetCategory.CLASSICAL,
      AssetCategory.JAZZ, AssetCategory.ROCK, AssetCategory.POP
    ];
    
    const soundCategories = [
      AssetCategory.NATURE_SOUNDS, AssetCategory.URBAN_SOUNDS, AssetCategory.TECHNOLOGY,
      AssetCategory.HUMAN_SOUNDS, AssetCategory.MECHANICAL
    ];

    const templateCategories = [
      AssetCategory.SOCIAL_MEDIA, AssetCategory.BUSINESS, AssetCategory.EDUCATION,
      AssetCategory.ENTERTAINMENT
    ];

    switch (assetType) {
      case AssetType.MUSIC:
        return musicCategories[Math.floor(Math.random() * musicCategories.length)];
      case AssetType.SOUND_EFFECT:
      case AssetType.AMBIENT:
        return soundCategories[Math.floor(Math.random() * soundCategories.length)];
      case AssetType.TEMPLATE:
        return templateCategories[Math.floor(Math.random() * templateCategories.length)];
      default:
        return AssetCategory.MINIMAL;
    }
  }
}

export default AssetsLibraryManager;