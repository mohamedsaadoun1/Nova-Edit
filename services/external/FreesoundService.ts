/**
 * Freesound API Service - DEPRECATED ❌
 * تم تعطيل هذه الخدمة واستبدالها بـ LocalSoundLibrary للعمل بدون إنترنت
 * 
 * ❌ المشاكل السابقة:
 * - تحتاج مفتاح API
 * - تحتاج اتصال إنترنت  
 * - محدودة بعدد الطلبات يومياً
 * 
 * ✅ البديل الجديد:
 * استخدم OfflineLibraryService أو LocalSoundLibrary مباشرة
 */

import { 
  LibraryContent, 
  SearchFilters, 
  SearchResult, 
  SoundEffect,
  ContentSource,
  LicenseType,
  AudioFormat,
  SoundCategory,
  APIResponse
} from '../../types/library';

interface FreesoundConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
}

interface FreesoundSound {
  id: number;
  name: string;
  description: string;
  tags: string[];
  duration: number;
  bitrate: number;
  samplerate: number;
  filesize: number;
  type: string;
  channels: number;
  download: string;
  preview_hq_mp3: string;
  preview_lq_mp3: string;
  preview_hq_ogg: string;
  preview_lq_ogg: string;
  images: {
    waveform_l: string;
    waveform_m: string;
    spectral_l: string;
    spectral_m: string;
  };
  user: {
    username: string;
    url: string;
  };
  license: string;
  created: string;
  num_downloads: number;
  avg_rating: number;
  num_ratings: number;
}

interface FreesoundSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FreesoundSound[];
}

export class FreesoundService {
  private config: FreesoundConfig;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(apiKey?: string) {
    this.config = {
      apiKey: apiKey || 'YOUR_FREESOUND_API_KEY', // يحتاج تسجيل مجاني
      baseUrl: 'https://freesound.org/apiv2/',
      rateLimit: 2000 // requests per day for free plan
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.testConnection();
      console.log('Freesound service initialized successfully');
    } catch (error) {
      console.warn('Freesound service initialization failed:', error);
    }
  }

  private async testConnection(): Promise<void> {
    const response = await this.makeRequest('search/text/', {
      query: 'test',
      page_size: 1
    });
    
    if (!response.results) {
      throw new Error('Invalid API response');
    }
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    try {
      // Only search for sound effects and music
      if (filters.type && !filters.type.includes('sound_effect') && !filters.type.includes('music')) {
        return { items: [], total: 0, hasMore: false };
      }

      const params = {
        query: this.buildSearchQuery(filters),
        page_size: Math.min(filters.limit || 20, 150),
        page: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
        fields: 'id,name,description,tags,duration,bitrate,samplerate,filesize,type,channels,download,preview_hq_mp3,preview_lq_mp3,images,user,license,created,num_downloads,avg_rating',
        sort: this.mapSortOption(filters.sortBy)
      };

      // Add duration filter if specified
      if (filters.duration) {
        if (filters.duration.min) {
          params.filter = `duration:[${filters.duration.min} TO *]`;
        }
        if (filters.duration.max) {
          params.filter = params.filter 
            ? `${params.filter} duration:[* TO ${filters.duration.max}]`
            : `duration:[* TO ${filters.duration.max}]`;
        }
      }

      const response: FreesoundSearchResponse = await this.makeRequest('search/text/', params);
      
      const soundEffects = response.results.map(sound => this.convertToSoundEffect(sound));

      return {
        items: soundEffects,
        total: response.count,
        hasMore: response.next !== null,
        nextOffset: (filters.offset || 0) + soundEffects.length
      };

    } catch (error) {
      console.error('Freesound search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  async getById(id: string): Promise<LibraryContent | null> {
    try {
      const freesoundId = id.replace('freesound_', '');
      const response = await this.makeRequest(`sounds/${freesoundId}/`, {
        fields: 'id,name,description,tags,duration,bitrate,samplerate,filesize,type,channels,download,preview_hq_mp3,preview_lq_mp3,images,user,license,created,num_downloads,avg_rating'
      });
      
      return this.convertToSoundEffect(response);
    } catch (error) {
      console.error('Failed to get sound by ID:', error);
      return null;
    }
  }

  async download(content: LibraryContent, quality = 'high', onProgress?: (progress: number) => void): Promise<string> {
    try {
      onProgress?.(0);
      
      // Freesound requires OAuth for high-quality downloads
      // For now, we'll use the preview URLs which are available without OAuth
      let downloadUrl = content.metadata?.preview_hq_mp3 || content.downloadUrl;
      
      if (quality === 'low') {
        downloadUrl = content.metadata?.preview_lq_mp3 || downloadUrl;
      }

      onProgress?.(25);

      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      onProgress?.(75);

      // In a real implementation, save to device storage
      const blob = await response.blob();
      
      onProgress?.(100);
      
      // Mock file path
      return `/local/downloads/freesound_${content.id}_${quality}.mp3`;
      
    } catch (error) {
      console.error('Freesound download failed:', error);
      throw error;
    }
  }

  private buildSearchQuery(filters: SearchFilters): string {
    let query = filters.query || '';
    
    // Add category-specific terms
    if (filters.category) {
      const categoryTerms = filters.category.map(cat => this.mapCategoryToFreesound(cat)).filter(Boolean);
      if (categoryTerms.length > 0) {
        query = query ? `${query} ${categoryTerms.join(' OR ')}` : categoryTerms.join(' OR ');
      }
    }

    // Add tags if specified
    if (filters.tags && filters.tags.length > 0) {
      const tagQuery = filters.tags.join(' OR ');
      query = query ? `${query} (${tagQuery})` : tagQuery;
    }

    return query || '*'; // Default to all sounds if no query
  }

  private mapCategoryToFreesound(category: string): string | null {
    const mapping: { [key: string]: string } = {
      'nature': 'nature forest rain wind water birds',
      'technology': 'computer electronic beep notification click',
      'human': 'voice speech talking breathing footsteps',
      'transport': 'car engine plane train bus motorcycle',
      'household': 'door kitchen bathroom phone clock',
      'animals': 'dog cat bird horse cow sheep',
      'weather': 'rain thunder wind storm snow',
      'musical': 'piano guitar drum violin music',
      'industrial': 'machine motor construction tools',
      'notification': 'alert beep notification ding chime'
    };

    return mapping[category] || null;
  }

  private mapSortOption(sortBy?: string): string {
    const mapping: { [key: string]: string } = {
      'newest': 'created_desc',
      'oldest': 'created_asc',
      'downloads': 'downloads_desc',
      'rating': 'rating_desc',
      'duration': 'duration_desc',
      'relevance': 'score'
    };

    return mapping[sortBy || 'relevance'] || 'score';
  }

  private convertToSoundEffect(sound: FreesoundSound): SoundEffect {
    return {
      id: `freesound_${sound.id}`,
      type: 'sound_effect',
      title: sound.name,
      description: sound.description || `Sound effect from Freesound: ${sound.name}`,
      tags: sound.tags || [],
      category: this.categorizeSound(sound.tags, sound.name, sound.description),
      author: sound.user.username,
      authorUrl: sound.user.url,
      source: ContentSource.FREESOUND,
      license: this.mapFreesoundLicense(sound.license),
      thumbnailUrl: sound.images?.waveform_m,
      downloadUrl: sound.preview_hq_mp3,
      fileSize: sound.filesize,
      downloads: sound.num_downloads,
      rating: sound.avg_rating || 0,
      isFavorite: false,
      createdAt: new Date(sound.created),
      updatedAt: new Date(sound.created),
      metadata: {
        freesoundId: sound.id,
        bitrate: sound.bitrate,
        samplerate: sound.samplerate,
        channels: sound.channels,
        preview_hq_mp3: sound.preview_hq_mp3,
        preview_lq_mp3: sound.preview_lq_mp3,
        preview_hq_ogg: sound.preview_hq_ogg,
        preview_lq_ogg: sound.preview_lq_ogg,
        waveform_l: sound.images?.waveform_l,
        waveform_m: sound.images?.waveform_m,
        spectral_l: sound.images?.spectral_l,
        spectral_m: sound.images?.spectral_m,
        num_ratings: sound.num_ratings
      },
      audioFormat: this.getAudioFormat(sound.type),
      duration: sound.duration,
      soundCategory: this.getSoundCategory(sound.tags, sound.name, sound.description),
      waveformUrl: sound.images?.waveform_m
    };
  }

  private categorizeSound(tags: string[], name: string, description: string): string {
    const content = `${tags.join(' ')} ${name} ${description}`.toLowerCase();
    
    if (content.match(/nature|forest|rain|wind|water|birds|ocean|storm/)) return 'nature';
    if (content.match(/computer|electronic|beep|notification|click|digital/)) return 'technology';
    if (content.match(/voice|speech|talking|human|breathing|footsteps/)) return 'human';
    if (content.match(/car|engine|plane|train|bus|motorcycle|vehicle/)) return 'transport';
    if (content.match(/door|kitchen|bathroom|phone|clock|house/)) return 'household';
    if (content.match(/dog|cat|bird|horse|cow|animal/)) return 'animals';
    if (content.match(/piano|guitar|drum|violin|music|instrument/)) return 'musical';
    if (content.match(/machine|motor|construction|tools|industrial/)) return 'industrial';
    if (content.match(/alert|notification|ding|chime|bell/)) return 'notification';
    
    return 'general';
  }

  private getSoundCategory(tags: string[], name: string, description: string): SoundCategory {
    const category = this.categorizeSound(tags, name, description);
    
    const mapping: { [key: string]: SoundCategory } = {
      'nature': SoundCategory.NATURE,
      'technology': SoundCategory.TECHNOLOGY,
      'human': SoundCategory.HUMAN,
      'transport': SoundCategory.TRANSPORT,
      'household': SoundCategory.HOUSEHOLD,
      'animals': SoundCategory.ANIMALS,
      'weather': SoundCategory.WEATHER,
      'musical': SoundCategory.MUSICAL,
      'industrial': SoundCategory.INDUSTRIAL,
      'notification': SoundCategory.NOTIFICATION
    };

    return mapping[category] || SoundCategory.HOUSEHOLD;
  }

  private getAudioFormat(type: string): AudioFormat {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('wav')) return AudioFormat.WAV;
    if (lowerType.includes('ogg')) return AudioFormat.OGG;
    if (lowerType.includes('flac')) return AudioFormat.FLAC;
    if (lowerType.includes('aac')) return AudioFormat.AAC;
    
    return AudioFormat.MP3; // Default
  }

  private mapFreesoundLicense(license: string): LicenseType {
    const lowerLicense = license.toLowerCase();
    
    if (lowerLicense.includes('cc0') || lowerLicense.includes('public domain')) {
      return LicenseType.CC0;
    }
    if (lowerLicense.includes('cc by')) {
      return LicenseType.CC_BY;
    }
    if (lowerLicense.includes('cc by-sa')) {
      return LicenseType.CC_BY_SA;
    }
    
    return LicenseType.CC_BY; // Default for Creative Commons
  }

  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    // Rate limiting check
    if (this.requestCount >= this.config.rateLimit) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < 86400000) { // 24 hours
        throw new Error('Daily rate limit exceeded. Please try again tomorrow.');
      }
      this.requestCount = 0;
    }

    const url = new URL(endpoint, this.config.baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const headers: { [key: string]: string } = {
      'Accept': 'application/json'
    };

    // Add API key if available
    if (this.config.apiKey && this.config.apiKey !== 'YOUR_FREESOUND_API_KEY') {
      headers['Authorization'] = `Token ${this.config.apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please get a free key from https://freesound.org/apiv2/apply/');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();

    return response.json();
  }

  /**
   * Get popular sound categories with counts
   */
  async getPopularCategories(): Promise<{ category: string; count: number }[]> {
    const categories = [
      { category: 'nature', query: 'nature forest rain' },
      { category: 'technology', query: 'computer electronic beep' },
      { category: 'human', query: 'voice speech talking' },
      { category: 'transport', query: 'car engine vehicle' },
      { category: 'household', query: 'door kitchen phone' },
      { category: 'animals', query: 'dog cat bird animal' },
      { category: 'musical', query: 'piano guitar music' },
      { category: 'notification', query: 'alert beep notification' }
    ];

    const results = await Promise.all(
      categories.map(async ({ category, query }) => {
        try {
          const response = await this.makeRequest('search/text/', {
            query,
            page_size: 1
          });
          return { category, count: response.count || 0 };
        } catch (error) {
          return { category, count: 0 };
        }
      })
    );

    return results.sort((a, b) => b.count - a.count);
  }

  /**
   * Get trending sounds
   */
  async getTrendingSounds(limit = 10): Promise<SoundEffect[]> {
    try {
      const response = await this.makeRequest('search/text/', {
        query: '*',
        sort: 'downloads_desc',
        page_size: limit,
        fields: 'id,name,description,tags,duration,preview_hq_mp3,images,user,license,created,num_downloads,avg_rating'
      });

      return response.results.map((sound: FreesoundSound) => this.convertToSoundEffect(sound));
    } catch (error) {
      console.error('Failed to get trending sounds:', error);
      return [];
    }
  }
}

export default FreesoundService;