/**
 * Pixabay API Service - DEPRECATED ❌
 * تم تعطيل هذه الخدمة واستبدالها بـ LocalImageLibrary للعمل بدون إنترنت
 * 
 * ❌ المشاكل السابقة:
 * - تحتاج مفتاح API
 * - تحتاج اتصال إنترنت
 * - محدودة بعدد الطلبات
 * 
 * ✅ البديل الجديد: 
 * استخدم OfflineLibraryService أو LocalImageLibrary مباشرة
 */

import { 
  LibraryContent, 
  SearchFilters, 
  SearchResult, 
  VideoTemplate,
  MusicTrack,
  Icon,
  ContentSource,
  LicenseType,
  VideoFormat,
  AudioFormat,
  IconFormat,
  VideoTemplateType,
  MusicGenre,
  MusicMood,
  APIResponse
} from '../../types/library';

interface PixabayConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
}

interface PixabayImage {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  views: number;
  downloads: number;
  likes: number;
  tags: string;
  user: string;
  userImageURL: string;
}

interface PixabayVideo {
  id: number;
  webM: { url: string; };
  mp4: { url: string; };
  tags: string;
  duration: number;
  user: string;
  userImageURL: string;
  views: number;
  downloads: number;
  likes: number;
}

interface PixabayMusic {
  id: number;
  name: string;
  tags: string;
  duration: number;
  download_url: string;
  preview_url: string;
}

export class PixabayService {
  private config: PixabayConfig;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(apiKey?: string) {
    // تم تعطيل Pixabay API واستبدالها بمكتبة محلية
    this.config = {
      apiKey: 'OFFLINE_MODE', // لا نحتاج مفتاح API بعد الآن
      baseUrl: 'local://offline',
      rateLimit: 999999 // لا حدود في الوضع المحلي
    };
    
    console.warn('⚠️ Pixabay API disabled - Using offline local library instead');
  }

  async initialize(): Promise<void> {
    // Test API connection
    try {
      await this.testConnection();
      console.log('Pixabay service initialized successfully');
    } catch (error) {
      console.warn('Pixabay service initialization failed:', error);
    }
  }

  private async testConnection(): Promise<void> {
    const response = await this.makeRequest('', {
      q: 'test',
      per_page: 3
    });
    
    if (!response.hits) {
      throw new Error('Invalid API response');
    }
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    try {
      let results: LibraryContent[] = [];
      
      // Search images/icons if requested
      if (!filters.type || filters.type.includes('icon')) {
        const imageResults = await this.searchImages(filters);
        results.push(...imageResults);
      }
      
      // Search videos if requested
      if (!filters.type || filters.type.includes('video_template')) {
        const videoResults = await this.searchVideos(filters);
        results.push(...videoResults);
      }
      
      // Search music if requested (limited in free plan)
      if (!filters.type || filters.type.includes('music')) {
        const musicResults = await this.searchMusic(filters);
        results.push(...musicResults);
      }

      return {
        items: results,
        total: results.length,
        hasMore: results.length >= (filters.limit || 20)
      };

    } catch (error) {
      console.error('Pixabay search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  private async searchImages(filters: SearchFilters): Promise<Icon[]> {
    const params = {
      q: filters.query || '',
      image_type: 'vector',
      category: this.mapCategoryToPixabay(filters.category?.[0]),
      per_page: Math.min(filters.limit || 20, 200),
      page: Math.floor((filters.offset || 0) / 20) + 1,
      safesearch: 'true'
    };

    const response = await this.makeRequest('', params);
    
    return response.hits.map((item: PixabayImage) => ({
      id: `pixabay_img_${item.id}`,
      type: 'icon' as const,
      title: this.extractTitle(item.tags),
      description: `Free icon from Pixabay - ${item.tags}`,
      tags: item.tags.split(', '),
      category: 'general',
      author: item.user,
      authorUrl: `https://pixabay.com/users/${item.user}/`,
      source: ContentSource.PIXABAY,
      license: LicenseType.PIXABAY,
      thumbnailUrl: item.webformatURL,
      downloadUrl: item.largeImageURL,
      downloads: item.downloads,
      rating: this.calculateRating(item.likes, item.views),
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        views: item.views,
        likes: item.likes,
        pixabayId: item.id
      },
      iconFormat: IconFormat.PNG,
      style: 'flat',
      isColorizable: false,
      sizes: [
        { size: 640, url: item.webformatURL },
        { size: 1920, url: item.largeImageURL }
      ]
    }));
  }

  private async searchVideos(filters: SearchFilters): Promise<VideoTemplate[]> {
    const params = {
      q: filters.query || '',
      video_type: 'film',
      category: this.mapCategoryToPixabay(filters.category?.[0]),
      per_page: Math.min(filters.limit || 20, 200),
      page: Math.floor((filters.offset || 0) / 20) + 1,
      safesearch: 'true'
    };

    const response = await this.makeRequest('videos/', params);
    
    return response.hits.map((item: PixabayVideo) => ({
      id: `pixabay_vid_${item.id}`,
      type: 'video_template' as const,
      title: this.extractTitle(item.tags),
      description: `Free video template from Pixabay - ${item.tags}`,
      tags: item.tags.split(', '),
      category: 'background',
      author: item.user,
      authorUrl: `https://pixabay.com/users/${item.user}/`,
      source: ContentSource.PIXABAY,
      license: LicenseType.PIXABAY,
      thumbnailUrl: item.webM.url, // First frame as thumbnail
      downloadUrl: item.mp4.url,
      downloads: item.downloads,
      rating: this.calculateRating(item.likes, item.views),
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        views: item.views,
        likes: item.likes,
        pixabayId: item.id
      },
      videoFormat: VideoFormat.MP4,
      duration: item.duration,
      resolution: { width: 1920, height: 1080, label: '1080p' },
      fps: 30,
      hasAudio: false,
      templateType: VideoTemplateType.BACKGROUND,
      placeholders: [],
      previewUrl: item.webM.url
    }));
  }

  private async searchMusic(filters: SearchFilters): Promise<MusicTrack[]> {
    // Note: Pixabay music API has limited access
    // This is a placeholder implementation
    try {
      const params = {
        q: filters.query || '',
        per_page: Math.min(filters.limit || 10, 20),
        page: Math.floor((filters.offset || 0) / 20) + 1
      };

      // Mock data for now since Pixabay music API is limited
      return this.getMockMusicData(filters.query || '');
      
    } catch (error) {
      console.warn('Pixabay music search limited:', error);
      return [];
    }
  }

  private getMockMusicData(query: string): MusicTrack[] {
    // Mock data representing typical Pixabay music
    const mockTracks = [
      {
        id: 'pixabay_music_upbeat_1',
        title: 'Upbeat Corporate Background',
        tags: ['corporate', 'upbeat', 'business'],
        duration: 120,
        genre: MusicGenre.CORPORATE,
        mood: MusicMood.UPLIFTING
      },
      {
        id: 'pixabay_music_chill_1',
        title: 'Chill Acoustic Guitar',
        tags: ['acoustic', 'chill', 'guitar'],
        duration: 180,
        genre: MusicGenre.ACOUSTIC,
        mood: MusicMood.CALM
      }
    ];

    return mockTracks
      .filter(track => !query || track.tags.some(tag => tag.includes(query.toLowerCase())))
      .map(track => ({
        ...track,
        type: 'music' as const,
        description: `Free music track from Pixabay`,
        category: 'background',
        author: 'Pixabay',
        source: ContentSource.PIXABAY,
        license: LicenseType.PIXABAY,
        downloadUrl: `https://cdn.pixabay.com/music/${track.id}.mp3`,
        downloads: Math.floor(Math.random() * 1000),
        rating: 4 + Math.random(),
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        audioFormat: AudioFormat.MP3,
        tempo: 120,
        isLoopable: true,
        instruments: ['guitar', 'piano', 'drums']
      }));
  }

  async getById(id: string): Promise<LibraryContent | null> {
    try {
      const [, type, pixabayId] = id.split('_');
      
      if (type === 'img') {
        // Get single image
        const response = await this.makeRequest('', { id: pixabayId });
        if (response.hits.length > 0) {
          return this.convertImageToIcon(response.hits[0]);
        }
      } else if (type === 'vid') {
        // Get single video
        const response = await this.makeRequest('videos/', { id: pixabayId });
        if (response.hits.length > 0) {
          return this.convertVideoToTemplate(response.hits[0]);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get content by ID:', error);
      return null;
    }
  }

  async download(content: LibraryContent, quality = 'high', onProgress?: (progress: number) => void): Promise<string> {
    try {
      onProgress?.(0);
      
      // For Pixabay, we typically download the high-res version
      let downloadUrl = content.downloadUrl;
      
      if (content.type === 'video_template' && quality === 'low') {
        // Use lower quality video if available
        downloadUrl = content.metadata?.webMUrl || downloadUrl;
      }

      // Download using React Native's fetch or a download library
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      onProgress?.(50);

      // In a real implementation, you'd save this to the device's file system
      // and return the local file path
      const blob = await response.blob();
      
      onProgress?.(100);
      
      // Mock file path - in real implementation use react-native-fs or similar
      return `/local/downloads/${content.id}_${quality}.${this.getFileExtension(content)}`;
      
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, params: any): Promise<any> {
    // Rate limiting
    if (this.requestCount >= this.config.rateLimit) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < 3600000) { // 1 hour
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      this.requestCount = 0;
    }

    const url = new URL(endpoint, this.config.baseUrl);
    url.searchParams.append('key', this.config.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();

    return response.json();
  }

  private mapCategoryToPixabay(category?: string): string | undefined {
    const mapping: { [key: string]: string } = {
      'nature': 'nature',
      'business': 'business',
      'technology': 'computer',
      'people': 'people',
      'travel': 'places',
      'food': 'food',
      'background': 'backgrounds',
      'animals': 'animals'
    };

    return category ? mapping[category] : undefined;
  }

  private extractTitle(tags: string): string {
    const tagArray = tags.split(', ');
    return tagArray[0] || 'Untitled';
  }

  private calculateRating(likes: number, views: number): number {
    if (views === 0) return 0;
    const ratio = likes / views;
    return Math.min(5, Math.max(0, ratio * 5 * 10)); // Scale to 0-5
  }

  private convertImageToIcon(item: PixabayImage): Icon {
    return {
      id: `pixabay_img_${item.id}`,
      type: 'icon',
      title: this.extractTitle(item.tags),
      description: `Free icon from Pixabay - ${item.tags}`,
      tags: item.tags.split(', '),
      category: 'general',
      author: item.user,
      authorUrl: `https://pixabay.com/users/${item.user}/`,
      source: ContentSource.PIXABAY,
      license: LicenseType.PIXABAY,
      thumbnailUrl: item.webformatURL,
      downloadUrl: item.largeImageURL,
      downloads: item.downloads,
      rating: this.calculateRating(item.likes, item.views),
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        views: item.views,
        likes: item.likes,
        pixabayId: item.id
      },
      iconFormat: IconFormat.PNG,
      style: 'flat',
      isColorizable: false,
      sizes: [
        { size: 640, url: item.webformatURL },
        { size: 1920, url: item.largeImageURL }
      ]
    };
  }

  private convertVideoToTemplate(item: PixabayVideo): VideoTemplate {
    return {
      id: `pixabay_vid_${item.id}`,
      type: 'video_template',
      title: this.extractTitle(item.tags),
      description: `Free video template from Pixabay - ${item.tags}`,
      tags: item.tags.split(', '),
      category: 'background',
      author: item.user,
      authorUrl: `https://pixabay.com/users/${item.user}/`,
      source: ContentSource.PIXABAY,
      license: LicenseType.PIXABAY,
      thumbnailUrl: item.webM.url,
      downloadUrl: item.mp4.url,
      downloads: item.downloads,
      rating: this.calculateRating(item.likes, item.views),
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        views: item.views,
        likes: item.likes,
        pixabayId: item.id,
        webMUrl: item.webM.url
      },
      videoFormat: VideoFormat.MP4,
      duration: item.duration,
      resolution: { width: 1920, height: 1080, label: '1080p' },
      fps: 30,
      hasAudio: false,
      templateType: VideoTemplateType.BACKGROUND,
      placeholders: [],
      previewUrl: item.webM.url
    };
  }

  private getFileExtension(content: LibraryContent): string {
    switch (content.type) {
      case 'video_template':
        return 'mp4';
      case 'music':
        return 'mp3';
      case 'sound_effect':
        return 'wav';
      case 'icon':
        return 'png';
      case 'sticker':
        return 'png';
      default:
        return 'file';
    }
  }
}

export default PixabayService;