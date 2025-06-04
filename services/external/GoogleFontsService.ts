/**
 * Google Fonts API Service - DEPRECATED ❌
 * تم تعطيل هذه الخدمة واستبدالها بـ LocalFontLibrary للعمل بدون إنترنت
 * 
 * ❌ المشاكل السابقة:
 * - تحتاج مفتاح API
 * - تحتاج اتصال إنترنت
 * - محدودة بعدد الطلبات
 * 
 * ✅ البديل الجديد:
 * استخدم OfflineLibraryService أو LocalFontLibrary مباشرة
 */

import { 
  LibraryContent, 
  SearchFilters, 
  SearchResult, 
  Font,
  FontVariant,
  FontFile,
  ContentSource,
  LicenseType,
  FontFormat,
  FontLanguage,
  FontCategory,
  APIResponse
} from '../../types/library';

interface GoogleFontsConfig {
  apiKey: string;
  baseUrl: string;
  webFontsUrl: string;
}

interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: { [variant: string]: string };
  category: string;
  kind: string;
}

interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
}

export class GoogleFontsService {
  private config: GoogleFontsConfig;
  private fontsCache: Map<string, Font> = new Map();
  private isInitialized = false;

  // Popular Arabic and multilingual fonts
  private arabicFonts = [
    'Noto Sans Arabic',
    'Cairo',
    'Amiri',
    'Lalezar',
    'Markazi Text',
    'Scheherazade New',
    'Reem Kufi',
    'Almarai',
    'El Messiri',
    'Tajawal'
  ];

  // Popular font categories for video editing
  private videoEditingFonts = {
    'display': ['Oswald', 'Bebas Neue', 'Anton', 'Fredoka One', 'Pacifico'],
    'sans-serif': ['Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro'],
    'serif': ['Playfair Display', 'Merriweather', 'Libre Baskerville', 'Crimson Text'],
    'handwriting': ['Dancing Script', 'Kalam', 'Caveat', 'Amatic SC'],
    'monospace': ['Roboto Mono', 'Fira Code', 'Source Code Pro', 'JetBrains Mono']
  };

  constructor(apiKey?: string) {
    this.config = {
      apiKey: apiKey || 'YOUR_GOOGLE_FONTS_API_KEY', // مجاني من Google Cloud Console
      baseUrl: 'https://www.googleapis.com/webfonts/v1/',
      webFontsUrl: 'https://fonts.googleapis.com/css2'
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.loadPopularFonts();
      this.isInitialized = true;
      console.log('Google Fonts service initialized successfully');
    } catch (error) {
      console.warn('Google Fonts service initialization failed:', error);
      // Fallback to hardcoded popular fonts
      this.loadFallbackFonts();
      this.isInitialized = true;
    }
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Only search for fonts
      if (filters.type && !filters.type.includes('font')) {
        return { items: [], total: 0, hasMore: false };
      }

      let fonts = Array.from(this.fontsCache.values());

      // Apply filters
      fonts = this.applyFilters(fonts, filters);

      // Sort results
      fonts = this.sortFonts(fonts, filters.sortBy, filters.sortOrder);

      // Paginate
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      const paginatedFonts = fonts.slice(offset, offset + limit);

      return {
        items: paginatedFonts,
        total: fonts.length,
        hasMore: offset + paginatedFonts.length < fonts.length,
        nextOffset: offset + paginatedFonts.length
      };

    } catch (error) {
      console.error('Google Fonts search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  async getById(id: string): Promise<LibraryContent | null> {
    const fontFamily = id.replace('google_fonts_', '').replace(/_/g, ' ');
    return this.fontsCache.get(fontFamily) || null;
  }

  async download(content: LibraryContent, quality = 'high', onProgress?: (progress: number) => void): Promise<string> {
    try {
      if (content.type !== 'font') {
        throw new Error('Content is not a font');
      }

      onProgress?.(0);

      const font = content as Font;
      const downloadPromises = font.fontFiles.map(async (fontFile, index) => {
        const response = await fetch(fontFile.url);
        if (!response.ok) {
          throw new Error(`Failed to download font file: ${response.status}`);
        }

        const blob = await response.blob();
        
        // Progress calculation
        const progress = ((index + 1) / font.fontFiles.length) * 100;
        onProgress?.(progress);

        return {
          data: blob,
          format: fontFile.format,
          weight: fontFile.weight,
          style: fontFile.style
        };
      });

      const downloadedFiles = await Promise.all(downloadPromises);

      // In a real implementation, save to device storage
      // Return the local path where fonts are stored
      return `/local/fonts/${font.fontFamily.replace(/\s+/g, '_')}/`;

    } catch (error) {
      console.error('Font download failed:', error);
      throw error;
    }
  }

  private async loadPopularFonts(): Promise<void> {
    try {
      // Load all fonts from Google Fonts API
      const allFonts = await this.fetchAllFonts();
      
      // Filter for video-editing friendly fonts and Arabic fonts
      const popularFonts = allFonts.filter(font => 
        this.isPopularFont(font.family) || this.arabicFonts.includes(font.family)
      );

      // Convert to our Font interface
      for (const googleFont of popularFonts) {
        const font = this.convertGoogleFontToFont(googleFont);
        this.fontsCache.set(font.fontFamily, font);
      }

    } catch (error) {
      console.error('Failed to load fonts from API:', error);
      throw error;
    }
  }

  private loadFallbackFonts(): void {
    // Hardcoded popular fonts as fallback
    const fallbackFonts = [
      ...this.arabicFonts,
      ...Object.values(this.videoEditingFonts).flat()
    ];

    fallbackFonts.forEach(fontFamily => {
      const font = this.createFallbackFont(fontFamily);
      this.fontsCache.set(fontFamily, font);
    });
  }

  private async fetchAllFonts(): Promise<GoogleFont[]> {
    const url = `${this.config.baseUrl}webfonts?key=${this.config.apiKey}&sort=popularity`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Fonts API error: ${response.status}`);
    }

    const data: GoogleFontsResponse = await response.json();
    return data.items;
  }

  private isPopularFont(fontFamily: string): boolean {
    return Object.values(this.videoEditingFonts).flat().includes(fontFamily);
  }

  private convertGoogleFontToFont(googleFont: GoogleFont): Font {
    const variants = this.parseVariants(googleFont.variants);
    const fontFiles = this.generateFontFiles(googleFont.family, googleFont.variants, googleFont.files);
    const languages = this.mapSubsetsToLanguages(googleFont.subsets);

    return {
      id: `google_fonts_${googleFont.family.replace(/\s+/g, '_')}`,
      type: 'font',
      title: googleFont.family,
      description: `${googleFont.family} font from Google Fonts - Free for commercial use`,
      tags: [
        googleFont.category,
        ...languages.map(lang => lang.toLowerCase()),
        'google-fonts',
        'free',
        'web-font'
      ],
      category: googleFont.category,
      author: 'Google Fonts',
      authorUrl: 'https://fonts.google.com/',
      source: ContentSource.GOOGLE_FONTS,
      license: LicenseType.APACHE, // Most Google Fonts use Apache License
      thumbnailUrl: this.generateFontPreviewUrl(googleFont.family),
      downloadUrl: this.generateDownloadUrl(googleFont.family, googleFont.variants),
      downloads: 0, // Google doesn't provide download counts
      rating: 4.5, // Default rating for Google Fonts
      isFavorite: false,
      createdAt: new Date(googleFont.lastModified),
      updatedAt: new Date(googleFont.lastModified),
      metadata: {
        googleFontFamily: googleFont.family,
        version: googleFont.version,
        subsets: googleFont.subsets,
        kind: googleFont.kind
      },
      fontFamily: googleFont.family,
      variants,
      language: languages,
      category: this.mapGoogleCategory(googleFont.category),
      googleFontName: googleFont.family,
      previewText: this.getPreviewText(languages),
      fontFiles
    };
  }

  private createFallbackFont(fontFamily: string): Font {
    const category = this.getFontCategory(fontFamily);
    const isArabic = this.arabicFonts.includes(fontFamily);
    
    return {
      id: `google_fonts_${fontFamily.replace(/\s+/g, '_')}`,
      type: 'font',
      title: fontFamily,
      description: `${fontFamily} font from Google Fonts`,
      tags: [category, isArabic ? 'arabic' : 'latin', 'google-fonts'],
      category,
      author: 'Google Fonts',
      source: ContentSource.GOOGLE_FONTS,
      license: LicenseType.APACHE,
      downloadUrl: this.generateDownloadUrl(fontFamily, ['regular']),
      downloads: 0,
      rating: 4.5,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      fontFamily,
      variants: [{ weight: 400, style: 'normal', url: '' }],
      language: isArabic ? [FontLanguage.ARABIC, FontLanguage.LATIN] : [FontLanguage.LATIN],
      category: this.mapGoogleCategory(category),
      googleFontName: fontFamily,
      previewText: isArabic ? 'نص تجريبي عربي' : 'Sample Text',
      fontFiles: [{
        format: FontFormat.WOFF2,
        url: this.generateFontFileUrl(fontFamily, 400, 'normal'),
        weight: 400,
        style: 'normal'
      }]
    };
  }

  private parseVariants(variants: string[]): FontVariant[] {
    return variants.map(variant => {
      let weight = 400;
      let style: 'normal' | 'italic' = 'normal';

      if (variant === 'regular') {
        weight = 400;
      } else if (variant === 'italic') {
        weight = 400;
        style = 'italic';
      } else if (variant.endsWith('italic')) {
        weight = parseInt(variant.replace('italic', ''));
        style = 'italic';
      } else {
        weight = parseInt(variant);
      }

      return {
        weight,
        style,
        url: this.generateFontFileUrl(variant, weight, style)
      };
    });
  }

  private generateFontFiles(family: string, variants: string[], files: { [key: string]: string }): FontFile[] {
    return variants.map(variant => {
      const parsedVariant = this.parseVariant(variant);
      const url = files[variant] || this.generateFontFileUrl(family, parsedVariant.weight, parsedVariant.style);
      
      return {
        format: this.getFormatFromUrl(url),
        url,
        weight: parsedVariant.weight,
        style: parsedVariant.style
      };
    });
  }

  private parseVariant(variant: string): { weight: number; style: 'normal' | 'italic' } {
    if (variant === 'regular') return { weight: 400, style: 'normal' };
    if (variant === 'italic') return { weight: 400, style: 'italic' };
    if (variant.endsWith('italic')) {
      return { weight: parseInt(variant.replace('italic', '')), style: 'italic' };
    }
    return { weight: parseInt(variant) || 400, style: 'normal' };
  }

  private mapSubsetsToLanguages(subsets: string[]): FontLanguage[] {
    const mapping: { [key: string]: FontLanguage } = {
      'latin': FontLanguage.LATIN,
      'arabic': FontLanguage.ARABIC,
      'cyrillic': FontLanguage.CYRILLIC,
      'chinese-simplified': FontLanguage.CHINESE,
      'chinese-traditional': FontLanguage.CHINESE,
      'japanese': FontLanguage.JAPANESE,
      'korean': FontLanguage.KOREAN,
      'devanagari': FontLanguage.HINDI,
      'thai': FontLanguage.THAI
    };

    const languages = subsets
      .map(subset => mapping[subset])
      .filter(Boolean);

    return languages.length > 0 ? languages : [FontLanguage.LATIN];
  }

  private mapGoogleCategory(category: string): FontCategory {
    const mapping: { [key: string]: FontCategory } = {
      'serif': FontCategory.SERIF,
      'sans-serif': FontCategory.SANS_SERIF,
      'display': FontCategory.DISPLAY,
      'handwriting': FontCategory.HANDWRITING,
      'monospace': FontCategory.MONOSPACE
    };

    return mapping[category] || FontCategory.SANS_SERIF;
  }

  private getFontCategory(fontFamily: string): string {
    for (const [category, fonts] of Object.entries(this.videoEditingFonts)) {
      if (fonts.includes(fontFamily)) {
        return category;
      }
    }
    return this.arabicFonts.includes(fontFamily) ? 'sans-serif' : 'display';
  }

  private getPreviewText(languages: FontLanguage[]): string {
    if (languages.includes(FontLanguage.ARABIC)) {
      return 'نص تجريبي باللغة العربية';
    }
    return 'The quick brown fox jumps over the lazy dog';
  }

  private generateFontPreviewUrl(family: string): string {
    const encodedFamily = encodeURIComponent(family);
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400&display=swap`;
  }

  private generateDownloadUrl(family: string, variants: string[]): string {
    const encodedFamily = encodeURIComponent(family);
    const weightsString = variants
      .map(v => v === 'regular' ? '400' : v.replace('italic', 'i'))
      .join(';');
    
    return `${this.config.webFontsUrl}?family=${encodedFamily}:wght@${weightsString}&display=swap`;
  }

  private generateFontFileUrl(family: string, weight: number, style: 'normal' | 'italic'): string {
    const encodedFamily = encodeURIComponent(family);
    const stylePrefix = style === 'italic' ? 'i' : '';
    return `${this.config.webFontsUrl}?family=${encodedFamily}:${stylePrefix}wght@${weight}&display=swap`;
  }

  private getFormatFromUrl(url: string): FontFormat {
    if (url.includes('woff2')) return FontFormat.WOFF2;
    if (url.includes('woff')) return FontFormat.WOFF;
    if (url.includes('ttf')) return FontFormat.TTF;
    if (url.includes('otf')) return FontFormat.OTF;
    return FontFormat.WOFF2; // Default
  }

  private applyFilters(fonts: Font[], filters: SearchFilters): Font[] {
    return fonts.filter(font => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = `${font.title} ${font.description} ${font.tags.join(' ')}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      // Category filter
      if (filters.category && !filters.category.includes(font.category)) return false;

      // Language filter
      if (filters.language && !filters.language.some(lang => font.language.includes(lang))) return false;

      // Tags filter
      if (filters.tags && !filters.tags.some(tag => font.tags.includes(tag))) return false;

      return true;
    });
  }

  private sortFonts(fonts: Font[], sortBy?: string, order: 'asc' | 'desc' = 'asc'): Font[] {
    return fonts.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'newest':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'rating':
          compareValue = a.rating - b.rating;
          break;
        default:
          // Sort by popularity (Arabic fonts first, then by alphabetical order)
          const aIsArabic = this.arabicFonts.includes(a.fontFamily);
          const bIsArabic = this.arabicFonts.includes(b.fontFamily);
          
          if (aIsArabic && !bIsArabic) return -1;
          if (!aIsArabic && bIsArabic) return 1;
          
          compareValue = a.title.localeCompare(b.title);
      }

      return order === 'asc' ? compareValue : -compareValue;
    });
  }

  /**
   * Get font categories with counts
   */
  getFontCategories(): { category: FontCategory; name: string; count: number }[] {
    const categoryCounts = new Map<FontCategory, number>();
    
    Array.from(this.fontsCache.values()).forEach(font => {
      const count = categoryCounts.get(font.category) || 0;
      categoryCounts.set(font.category, count + 1);
    });

    return [
      { category: FontCategory.SANS_SERIF, name: 'Sans Serif', count: categoryCounts.get(FontCategory.SANS_SERIF) || 0 },
      { category: FontCategory.SERIF, name: 'Serif', count: categoryCounts.get(FontCategory.SERIF) || 0 },
      { category: FontCategory.DISPLAY, name: 'Display', count: categoryCounts.get(FontCategory.DISPLAY) || 0 },
      { category: FontCategory.HANDWRITING, name: 'Handwriting', count: categoryCounts.get(FontCategory.HANDWRITING) || 0 },
      { category: FontCategory.MONOSPACE, name: 'Monospace', count: categoryCounts.get(FontCategory.MONOSPACE) || 0 }
    ];
  }

  /**
   * Get popular Arabic fonts
   */
  getArabicFonts(): Font[] {
    return Array.from(this.fontsCache.values())
      .filter(font => font.language.includes(FontLanguage.ARABIC));
  }

  /**
   * Get fonts suitable for video editing
   */
  getVideoEditingFonts(): Font[] {
    const videoFontNames = Object.values(this.videoEditingFonts).flat();
    return Array.from(this.fontsCache.values())
      .filter(font => videoFontNames.includes(font.fontFamily));
  }
}

export default GoogleFontsService;