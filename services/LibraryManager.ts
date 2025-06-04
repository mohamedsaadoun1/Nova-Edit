/**
 * Library Manager Service
 * إدارة مكتبة المحتوى الإبداعي الموحدة
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LibraryContent,
  SearchFilters,
  SearchResult,
  Collection,
  DownloadProgress,
  CacheEntry,
  ContentStats,
  CategoryTree,
  TrendingContent,
  ContentSource,
  LicenseType,
  SortOption,
  APIResponse
} from '../types/library';

// External API services
import { PixabayService } from './external/PixabayService';
import { FreesoundService } from './external/FreesoundService';
import { GoogleFontsService } from './external/GoogleFontsService';
import { FlaticonService } from './external/FlaticonService';
import { PexelsService } from './external/PexelsService';

export class LibraryManager {
  private static instance: LibraryManager;
  private cache: Map<string, LibraryContent> = new Map();
  private downloadQueue: Map<string, DownloadProgress> = new Map();
  private apiServices: Map<ContentSource, any> = new Map();
  private isInitialized = false;

  // Storage keys
  private readonly CACHE_KEY = '@NovaEdit:LibraryCache';
  private readonly FAVORITES_KEY = '@NovaEdit:Favorites';
  private readonly COLLECTIONS_KEY = '@NovaEdit:Collections';
  private readonly DOWNLOADS_KEY = '@NovaEdit:Downloads';
  private readonly STATS_KEY = '@NovaEdit:ContentStats';

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): LibraryManager {
    if (!LibraryManager.instance) {
      LibraryManager.instance = new LibraryManager();
    }
    return LibraryManager.instance;
  }

  /**
   * Initialize external API services
   */
  private initializeServices(): void {
    this.apiServices.set(ContentSource.PIXABAY, new PixabayService());
    this.apiServices.set(ContentSource.FREESOUND, new FreesoundService());
    this.apiServices.set(ContentSource.GOOGLE_FONTS, new GoogleFontsService());
    this.apiServices.set(ContentSource.FLATICON, new FlaticonService());
    this.apiServices.set(ContentSource.PEXELS, new PexelsService());
  }

  /**
   * Initialize library manager
   */
  async initialize(): Promise<void> {
    try {
      // Initialize external services
      for (const [source, service] of this.apiServices) {
        if (service.initialize) {
          await service.initialize();
        }
      }

      // Load cached data
      await this.loadCacheFromStorage();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize LibraryManager:', error);
      throw error;
    }
  }

  /**
   * Search content across all sources
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results: LibraryContent[] = [];
    let total = 0;

    try {
      // Search in local cache first if no specific source is requested
      if (!filters.source || filters.source.length === 0) {
        const localResults = this.searchInCache(filters);
        results.push(...localResults.items);
        total += localResults.total;
      }

      // Search in specified external sources
      const sourcesToSearch = filters.source || Object.values(ContentSource);
      
      for (const source of sourcesToSearch) {
        if (source === ContentSource.LOCAL) continue;
        
        const service = this.apiServices.get(source);
        if (service && service.search) {
          try {
            const sourceResults = await service.search(filters);
            if (sourceResults.items) {
              // Add source metadata and cache results
              const processedItems = sourceResults.items.map(item => ({
                ...item,
                source,
                id: `${source}_${item.id}`
              }));
              
              results.push(...processedItems);
              total += sourceResults.total || sourceResults.items.length;
              
              // Cache frequently searched items
              this.cacheItems(processedItems);
            }
          } catch (error) {
            console.warn(`Search failed for source ${source}:`, error);
          }
        }
      }

      // Sort and paginate results
      const sortedResults = this.sortResults(results, filters.sortBy, filters.sortOrder);
      const paginatedResults = this.paginateResults(sortedResults, filters.limit, filters.offset);

      return {
        items: paginatedResults,
        total,
        hasMore: (filters.offset || 0) + paginatedResults.length < total,
        nextOffset: (filters.offset || 0) + paginatedResults.length
      };

    } catch (error) {
      console.error('Search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  /**
   * Search in local cache
   */
  private searchInCache(filters: SearchFilters): SearchResult {
    const items = Array.from(this.cache.values());
    
    let filtered = items.filter(item => {
      // Filter by type
      if (filters.type && !filters.type.includes(item.type)) return false;
      
      // Filter by category
      if (filters.category && !filters.category.includes(item.category)) return false;
      
      // Filter by license
      if (filters.license && !filters.license.includes(item.license)) return false;
      
      // Filter by tags
      if (filters.tags && !filters.tags.some(tag => item.tags.includes(tag))) return false;
      
      // Text search in title and description
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = `${item.title} ${item.description}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }
      
      return true;
    });

    // Sort results
    filtered = this.sortResults(filtered, filters.sortBy, filters.sortOrder);
    
    // Paginate
    const paginated = this.paginateResults(filtered, filters.limit, filters.offset);

    return {
      items: paginated,
      total: filtered.length,
      hasMore: (filters.offset || 0) + paginated.length < filtered.length
    };
  }

  /**
   * Get content by ID
   */
  async getContent(id: string): Promise<LibraryContent | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Extract source from ID
    const [source] = id.split('_');
    const service = this.apiServices.get(source as ContentSource);
    
    if (service && service.getById) {
      try {
        const content = await service.getById(id);
        if (content) {
          this.cache.set(id, content);
          return content;
        }
      } catch (error) {
        console.error(`Failed to get content ${id}:`, error);
      }
    }

    return null;
  }

  /**
   * Download content
   */
  async downloadContent(id: string, quality?: string): Promise<string> {
    const content = await this.getContent(id);
    if (!content) {
      throw new Error(`Content not found: ${id}`);
    }

    // Check if already downloaded
    const cached = await this.getCachedFile(id);
    if (cached) {
      return cached.filePath;
    }

    // Start download
    const downloadProgress: DownloadProgress = {
      contentId: id,
      progress: 0,
      status: 'pending'
    };
    
    this.downloadQueue.set(id, downloadProgress);

    try {
      downloadProgress.status = 'downloading';
      
      // Get download service
      const service = this.apiServices.get(content.source);
      if (!service || !service.download) {
        throw new Error(`Download not supported for source: ${content.source}`);
      }

      // Download with progress callback
      const filePath = await service.download(content, quality, (progress: number) => {
        downloadProgress.progress = progress;
        this.downloadQueue.set(id, downloadProgress);
      });

      downloadProgress.status = 'completed';
      downloadProgress.filePath = filePath;
      downloadProgress.progress = 100;

      // Cache the file
      await this.cacheFile(id, filePath, content);
      
      // Update download stats
      await this.updateDownloadStats(content);

      return filePath;

    } catch (error) {
      downloadProgress.status = 'error';
      downloadProgress.error = error.message;
      throw error;
    } finally {
      this.downloadQueue.set(id, downloadProgress);
    }
  }

  /**
   * Get download progress
   */
  getDownloadProgress(id: string): DownloadProgress | null {
    return this.downloadQueue.get(id) || null;
  }

  /**
   * Get trending content
   */
  async getTrending(): Promise<TrendingContent> {
    // This would typically come from analytics/usage data
    // For now, we'll return popular items from each category
    
    const daily = await this.search({ 
      sortBy: SortOption.DOWNLOADS, 
      limit: 20 
    });
    
    const weekly = await this.search({ 
      sortBy: SortOption.RATING, 
      limit: 20 
    });
    
    const monthly = await this.search({ 
      sortBy: SortOption.NEWEST, 
      limit: 20 
    });

    return {
      daily: daily.items,
      weekly: weekly.items,
      monthly: monthly.items,
      allTime: daily.items // Placeholder
    };
  }

  /**
   * Get categories tree
   */
  async getCategories(): Promise<CategoryTree[]> {
    const stats = await this.getStats();
    
    // Build category tree based on available content
    const categories: CategoryTree[] = [
      {
        id: 'video_templates',
        name: 'Video Templates',
        icon: 'videocam',
        count: stats.byType.video_template || 0,
        children: [
          { id: 'intro', name: 'Intros', count: 0 },
          { id: 'outro', name: 'Outros', count: 0 },
          { id: 'social_media', name: 'Social Media', count: 0 },
          { id: 'advertisement', name: 'Advertisements', count: 0 }
        ]
      },
      {
        id: 'music',
        name: 'Music',
        icon: 'musical-notes',
        count: stats.byType.music || 0,
        children: [
          { id: 'electronic', name: 'Electronic', count: 0 },
          { id: 'acoustic', name: 'Acoustic', count: 0 },
          { id: 'cinematic', name: 'Cinematic', count: 0 },
          { id: 'corporate', name: 'Corporate', count: 0 }
        ]
      },
      {
        id: 'sound_effects',
        name: 'Sound Effects',
        icon: 'volume-high',
        count: stats.byType.sound_effect || 0,
        children: [
          { id: 'nature', name: 'Nature', count: 0 },
          { id: 'technology', name: 'Technology', count: 0 },
          { id: 'human', name: 'Human', count: 0 },
          { id: 'transport', name: 'Transport', count: 0 }
        ]
      },
      {
        id: 'icons',
        name: 'Icons & Stickers',
        icon: 'shapes',
        count: (stats.byType.icon || 0) + (stats.byType.sticker || 0),
        children: [
          { id: 'interface', name: 'Interface', count: 0 },
          { id: 'social', name: 'Social', count: 0 },
          { id: 'business', name: 'Business', count: 0 },
          { id: 'emoji', name: 'Emoji', count: 0 }
        ]
      },
      {
        id: 'fonts',
        name: 'Fonts',
        icon: 'text',
        count: stats.byType.font || 0,
        children: [
          { id: 'serif', name: 'Serif', count: 0 },
          { id: 'sans_serif', name: 'Sans Serif', count: 0 },
          { id: 'display', name: 'Display', count: 0 },
          { id: 'handwriting', name: 'Handwriting', count: 0 }
        ]
      }
    ];

    return categories;
  }

  /**
   * Manage favorites
   */
  async addToFavorites(contentId: string): Promise<void> {
    const favorites = await this.getFavorites();
    if (!favorites.includes(contentId)) {
      favorites.push(contentId);
      await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    }
  }

  async removeFromFavorites(contentId: string): Promise<void> {
    const favorites = await this.getFavorites();
    const updated = favorites.filter(id => id !== contentId);
    await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updated));
  }

  async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(this.FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async isFavorite(contentId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(contentId);
  }

  /**
   * Manage collections
   */
  async createCollection(name: string, description?: string): Promise<Collection> {
    const collection: Collection = {
      id: `collection_${Date.now()}`,
      name,
      description,
      isPublic: false,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };

    const collections = await this.getCollections();
    collections.push(collection);
    await AsyncStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));

    return collection;
  }

  async addToCollection(collectionId: string, contentId: string): Promise<void> {
    const collections = await this.getCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection && !collection.items.includes(contentId)) {
      collection.items.push(contentId);
      collection.updatedAt = new Date();
      await AsyncStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));
    }
  }

  async getCollections(): Promise<Collection[]> {
    try {
      const data = await AsyncStorage.getItem(this.COLLECTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get content statistics
   */
  async getStats(): Promise<ContentStats> {
    try {
      const data = await AsyncStorage.getItem(this.STATS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }

    // Return default stats
    return {
      totalItems: 0,
      byType: {},
      bySource: {},
      byLicense: {},
      totalSize: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Helper methods
   */
  private sortResults(items: LibraryContent[], sortBy?: SortOption, order: 'asc' | 'desc' = 'desc'): LibraryContent[] {
    if (!sortBy) return items;

    return items.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case SortOption.TITLE:
          compareValue = a.title.localeCompare(b.title);
          break;
        case SortOption.NEWEST:
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case SortOption.DOWNLOADS:
          compareValue = a.downloads - b.downloads;
          break;
        case SortOption.RATING:
          compareValue = a.rating - b.rating;
          break;
        case SortOption.FILE_SIZE:
          compareValue = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        default:
          return 0;
      }

      return order === 'asc' ? compareValue : -compareValue;
    });
  }

  private paginateResults(items: LibraryContent[], limit = 20, offset = 0): LibraryContent[] {
    return items.slice(offset, offset + limit);
  }

  private cacheItems(items: LibraryContent[]): void {
    items.forEach(item => {
      this.cache.set(item.id, item);
    });
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.CACHE_KEY);
      if (data) {
        const cached: LibraryContent[] = JSON.parse(data);
        cached.forEach(item => this.cache.set(item.id, item));
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  private async saveCacheToStorage(): Promise<void> {
    try {
      const items = Array.from(this.cache.values());
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  private async getCachedFile(contentId: string): Promise<CacheEntry | null> {
    // Implementation would check local file system
    return null;
  }

  private async cacheFile(contentId: string, filePath: string, content: LibraryContent): Promise<void> {
    // Implementation would save file metadata to cache
  }

  private async updateDownloadStats(content: LibraryContent): Promise<void> {
    // Update content download count and stats
    content.downloads += 1;
    this.cache.set(content.id, content);
  }

  /**
   * Cleanup methods
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  async cleanup(): Promise<void> {
    await this.saveCacheToStorage();
  }
}

export default LibraryManager;