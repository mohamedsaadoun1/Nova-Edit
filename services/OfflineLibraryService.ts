/**
 * Offline Library Service - خدمة المكتبة المحلية الموحدة
 * تستبدل جميع APIs الخارجية بمكتبات محلية مجانية
 */

import LocalImageLibrary, { LocalImage, ImageSearchResult } from './LocalImageLibrary';
import LocalSoundLibrary, { LocalSound, SoundSearchResult } from './LocalSoundLibrary';
import LocalFontLibrary, { LocalFont, FontSearchResult } from './LocalFontLibrary';

export interface UnifiedSearchFilters {
  query?: string;
  type?: ('image' | 'sound' | 'font')[];
  category?: string;
  language?: string;
  duration?: { min?: number; max?: number };
  limit?: number;
  offset?: number;
}

export interface UnifiedSearchResult {
  images: ImageSearchResult;
  sounds: SoundSearchResult;
  fonts: FontSearchResult;
  total: number;
}

export interface LibraryStats {
  images: {
    total: number;
    categories: number;
    categoryBreakdown: { category: string; count: number }[];
  };
  sounds: {
    total: number;
    totalDuration: number;
    categories: number;
    categoryBreakdown: { category: string; count: number; totalDuration: number }[];
  };
  fonts: {
    total: number;
    totalVariants: number;
    categories: number;
    arabicFonts: number;
    categoryBreakdown: { category: string; count: number }[];
  };
}

export class OfflineLibraryService {
  private imageLibrary: LocalImageLibrary;
  private soundLibrary: LocalSoundLibrary;
  private fontLibrary: LocalFontLibrary;

  constructor() {
    this.imageLibrary = new LocalImageLibrary();
    this.soundLibrary = new LocalSoundLibrary();
    this.fontLibrary = new LocalFontLibrary();
    
    console.log('Offline Library Service initialized successfully');
    this.logLibraryStats();
  }

  /**
   * البحث الموحد في جميع المكتبات
   */
  async searchAll(filters: UnifiedSearchFilters): Promise<UnifiedSearchResult> {
    const { query = '', type, category, language, duration, limit = 20 } = filters;

    const shouldSearchImages = !type || type.includes('image');
    const shouldSearchSounds = !type || type.includes('sound');
    const shouldSearchFonts = !type || type.includes('font');

    const [imageResults, soundResults, fontResults] = await Promise.all([
      shouldSearchImages ? this.imageLibrary.search(query, category, limit) : { items: [], total: 0, hasMore: false },
      shouldSearchSounds ? this.soundLibrary.search(query, category, duration, limit) : { items: [], total: 0, hasMore: false },
      shouldSearchFonts ? this.fontLibrary.search(query, category as any, language, limit) : { items: [], total: 0, hasMore: false }
    ]);

    return {
      images: imageResults,
      sounds: soundResults,
      fonts: fontResults,
      total: imageResults.total + soundResults.total + fontResults.total
    };
  }

  /**
   * البحث في الصور فقط
   */
  async searchImages(query: string = '', category?: string, limit: number = 20): Promise<ImageSearchResult> {
    return await this.imageLibrary.search(query, category, limit);
  }

  /**
   * البحث في الأصوات فقط
   */
  async searchSounds(
    query: string = '', 
    category?: string, 
    duration?: { min?: number; max?: number },
    limit: number = 20
  ): Promise<SoundSearchResult> {
    return await this.soundLibrary.search(query, category, duration, limit);
  }

  /**
   * البحث في الخطوط فقط
   */
  async searchFonts(
    query: string = '', 
    category?: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting',
    language?: string,
    limit: number = 20
  ): Promise<FontSearchResult> {
    return await this.fontLibrary.search(query, category, language, limit);
  }

  /**
   * الحصول على محتوى بالمعرف
   */
  async getById(id: string, type: 'image' | 'sound' | 'font'): Promise<LocalImage | LocalSound | LocalFont | null> {
    switch (type) {
      case 'image':
        return await this.imageLibrary.getById(id);
      case 'sound':
        return await this.soundLibrary.getById(id);
      case 'font':
        return await this.fontLibrary.getById(id);
      default:
        return null;
    }
  }

  /**
   * الحصول على المحتوى الشائع
   */
  async getPopularContent(limit: number = 10) {
    const [popularImages, popularSounds, popularFonts] = await Promise.all([
      this.imageLibrary.getPopular(limit),
      this.soundLibrary.getPopular(limit),
      this.fontLibrary.getPopular(limit)
    ]);

    return {
      images: popularImages,
      sounds: popularSounds,
      fonts: popularFonts
    };
  }

  /**
   * الحصول على الفئات المتاحة
   */
  getAllCategories() {
    return {
      images: this.imageLibrary.getCategories(),
      sounds: this.soundLibrary.getCategories(),
      fonts: this.fontLibrary.getCategories()
    };
  }

  /**
   * تحميل محتوى (محاكاة)
   */
  async downloadContent(
    id: string, 
    type: 'image' | 'sound' | 'font',
    quality: 'low' | 'high' | 'preview' | 'full' = 'high',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      onProgress?.(0);

      let result: string;

      switch (type) {
        case 'image':
          const image = await this.imageLibrary.getById(id);
          if (!image) throw new Error('Image not found');
          result = await this.imageLibrary.download(image, quality as 'low' | 'high');
          break;

        case 'sound':
          const sound = await this.soundLibrary.getById(id);
          if (!sound) throw new Error('Sound not found');
          result = await this.soundLibrary.download(sound, quality as 'preview' | 'full');
          break;

        case 'font':
          const font = await this.fontLibrary.getById(id);
          if (!font) throw new Error('Font not found');
          // للخطوط، نرجع مسار الملف مباشرة
          result = font.variants[0].file;
          break;

        default:
          throw new Error('Invalid content type');
      }

      onProgress?.(100);
      return result;

    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  /**
   * إضافة محتوى مخصص
   */
  async addCustomContent(content: any, type: 'image' | 'sound' | 'font') {
    switch (type) {
      case 'image':
        return this.imageLibrary.addImage(content);
      case 'sound':
        return this.soundLibrary.addSound(content);
      case 'font':
        return this.fontLibrary.addFont(content);
      default:
        throw new Error('Invalid content type');
    }
  }

  /**
   * الحصول على إحصائيات شاملة
   */
  getComprehensiveStats(): LibraryStats {
    const imageStats = this.imageLibrary.getStats();
    const soundStats = this.soundLibrary.getStats();
    const fontStats = this.fontLibrary.getStats();

    return {
      images: {
        total: imageStats.totalImages,
        categories: imageStats.categories,
        categoryBreakdown: imageStats.categoryBreakdown
      },
      sounds: {
        total: soundStats.totalSounds,
        totalDuration: soundStats.totalDuration,
        categories: soundStats.categories,
        categoryBreakdown: soundStats.categoryBreakdown
      },
      fonts: {
        total: fontStats.totalFonts,
        totalVariants: fontStats.totalVariants,
        categories: fontStats.categories,
        arabicFonts: fontStats.arabicFonts,
        categoryBreakdown: fontStats.categoryBreakdown
      }
    };
  }

  /**
   * البحث عن محتوى متشابه
   */
  async getSimilarContent(id: string, type: 'image' | 'sound' | 'font', limit: number = 5) {
    switch (type) {
      case 'image':
        // الصور المتشابهة غير مطبقة بعد في LocalImageLibrary
        return [];
      case 'sound':
        return await this.soundLibrary.getSimilarSounds(id, limit);
      case 'font':
        return await this.fontLibrary.getSimilarFonts(id, limit);
      default:
        return [];
    }
  }

  /**
   * إنشاء مجموعة مخصصة
   */
  async createCollection(name: string, items: { id: string; type: 'image' | 'sound' | 'font' }[]) {
    const collection = {
      id: `collection_${Date.now()}`,
      name,
      items,
      createdAt: new Date().toISOString()
    };

    // في تطبيق حقيقي، ستحفظ في AsyncStorage
    console.log('Created collection:', collection);
    return collection;
  }

  /**
   * تصدير محتوى للاستخدام في تطبيقات أخرى
   */
  async exportContent(ids: string[], types: ('image' | 'sound' | 'font')[]) {
    const exported = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const type = types[i];
      
      try {
        const content = await this.getById(id, type);
        if (content) {
          exported.push({ id, type, content });
        }
      } catch (error) {
        console.error(`Failed to export ${type} ${id}:`, error);
      }
    }

    return exported;
  }

  /**
   * تنظيف الكاش (محاكاة)
   */
  async clearCache() {
    console.log('Cache cleared - in a real app, this would clear downloaded files');
    return true;
  }

  /**
   * فحص التحديثات المتاحة (محاكاة)
   */
  async checkForUpdates() {
    // في تطبيق حقيقي، يمكن فحص تحديثات المحتوى
    console.log('Checking for library updates...');
    return {
      hasUpdates: false,
      version: '1.0.0',
      newContent: {
        images: 0,
        sounds: 0,
        fonts: 0
      }
    };
  }

  /**
   * تحضير الخطوط للاستخدام في React Native
   */
  prepareFontsForRN() {
    return this.fontLibrary.generateFontFaceCSS();
  }

  /**
   * الحصول على خط مع معاملات محددة
   */
  getFontFamily(familyName: string, weight: number = 400, style: 'normal' | 'italic' = 'normal'): string {
    return this.fontLibrary.getFontFamily(familyName, weight, style);
  }

  /**
   * التحقق من توفر المحتوى offline
   */
  async verifyOfflineCapability(): Promise<boolean> {
    try {
      const stats = this.getComprehensiveStats();
      const hasImages = stats.images.total > 0;
      const hasSounds = stats.sounds.total > 0;
      const hasFonts = stats.fonts.total > 0;

      console.log('Offline capability verification:', {
        images: hasImages,
        sounds: hasSounds,
        fonts: hasFonts,
        fullyOffline: hasImages && hasSounds && hasFonts
      });

      return hasImages && hasSounds && hasFonts;
    } catch (error) {
      console.error('Offline verification failed:', error);
      return false;
    }
  }

  /**
   * طباعة إحصائيات المكتبة
   */
  private logLibraryStats() {
    const stats = this.getComprehensiveStats();
    console.log('📚 Offline Library Statistics:');
    console.log(`  🖼️  Images: ${stats.images.total} (${stats.images.categories} categories)`);
    console.log(`  🔊 Sounds: ${stats.sounds.total} (${Math.round(stats.sounds.totalDuration)}s total)`);
    console.log(`  📝 Fonts: ${stats.fonts.total} (${stats.fonts.totalVariants} variants)`);
    console.log(`  🌍 Arabic Fonts: ${stats.fonts.arabicFonts}`);
    console.log('✅ All content available offline!');
  }
}

export default OfflineLibraryService;