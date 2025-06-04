/**
 * Local Font Library - بديل محلي لـ Google Fonts API
 * مكتبة خطوط محلية مجانية بدون الحاجة لإنترنت أو مفاتيح API
 */

export interface LocalFont {
  id: string;
  family: string;
  name: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting';
  variants: FontVariant[];
  languages: string[];
  description: string;
  license: 'ofl' | 'apache' | 'ubuntu' | 'cc0';
  isArabic?: boolean;
  previewText?: string;
}

export interface FontVariant {
  style: 'normal' | 'italic';
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  file: string; // path to font file
}

export interface FontSearchResult {
  items: LocalFont[];
  total: number;
  hasMore: boolean;
}

export class LocalFontLibrary {
  private fonts: LocalFont[] = [
    // خطوط عربية
    {
      id: 'cairo',
      family: 'Cairo',
      name: 'Cairo',
      category: 'sans-serif',
      variants: [
        { style: 'normal', weight: 300, file: 'assets/fonts/Cairo-Light.ttf' },
        { style: 'normal', weight: 400, file: 'assets/fonts/Cairo-Regular.ttf' },
        { style: 'normal', weight: 600, file: 'assets/fonts/Cairo-SemiBold.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/Cairo-Bold.ttf' }
      ],
      languages: ['ar', 'en'],
      description: 'Modern Arabic sans-serif font',
      license: 'ofl',
      isArabic: true,
      previewText: 'خط القاهرة الحديث'
    },
    {
      id: 'almarai',
      family: 'Almarai',
      name: 'Almarai',
      category: 'sans-serif',
      variants: [
        { style: 'normal', weight: 300, file: 'assets/fonts/Almarai-Light.ttf' },
        { style: 'normal', weight: 400, file: 'assets/fonts/Almarai-Regular.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/Almarai-Bold.ttf' },
        { style: 'normal', weight: 800, file: 'assets/fonts/Almarai-ExtraBold.ttf' }
      ],
      languages: ['ar', 'en'],
      description: 'Clean and readable Arabic font',
      license: 'ofl',
      isArabic: true,
      previewText: 'خط المرايا الواضح'
    },
    {
      id: 'amiri',
      family: 'Amiri',
      name: 'Amiri',
      category: 'serif',
      variants: [
        { style: 'normal', weight: 400, file: 'assets/fonts/Amiri-Regular.ttf' },
        { style: 'italic', weight: 400, file: 'assets/fonts/Amiri-Italic.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/Amiri-Bold.ttf' },
        { style: 'italic', weight: 700, file: 'assets/fonts/Amiri-BoldItalic.ttf' }
      ],
      languages: ['ar', 'en'],
      description: 'Classical Arabic serif font',
      license: 'ofl',
      isArabic: true,
      previewText: 'خط أميري التراثي'
    },
    
    // خطوط إنجليزية
    {
      id: 'roboto',
      family: 'Roboto',
      name: 'Roboto',
      category: 'sans-serif',
      variants: [
        { style: 'normal', weight: 100, file: 'assets/fonts/Roboto-Thin.ttf' },
        { style: 'normal', weight: 300, file: 'assets/fonts/Roboto-Light.ttf' },
        { style: 'normal', weight: 400, file: 'assets/fonts/Roboto-Regular.ttf' },
        { style: 'normal', weight: 500, file: 'assets/fonts/Roboto-Medium.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/Roboto-Bold.ttf' },
        { style: 'italic', weight: 400, file: 'assets/fonts/Roboto-Italic.ttf' },
        { style: 'italic', weight: 700, file: 'assets/fonts/Roboto-BoldItalic.ttf' }
      ],
      languages: ['en', 'latin'],
      description: 'Modern sans-serif font with a friendly feel',
      license: 'apache',
      previewText: 'The quick brown fox jumps'
    },
    {
      id: 'inter',
      family: 'Inter',
      name: 'Inter',
      category: 'sans-serif',
      variants: [
        { style: 'normal', weight: 100, file: 'assets/fonts/Inter-Thin.ttf' },
        { style: 'normal', weight: 200, file: 'assets/fonts/Inter-ExtraLight.ttf' },
        { style: 'normal', weight: 300, file: 'assets/fonts/Inter-Light.ttf' },
        { style: 'normal', weight: 400, file: 'assets/fonts/Inter-Regular.ttf' },
        { style: 'normal', weight: 500, file: 'assets/fonts/Inter-Medium.ttf' },
        { style: 'normal', weight: 600, file: 'assets/fonts/Inter-SemiBold.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/Inter-Bold.ttf' },
        { style: 'normal', weight: 800, file: 'assets/fonts/Inter-ExtraBold.ttf' },
        { style: 'normal', weight: 900, file: 'assets/fonts/Inter-Black.ttf' }
      ],
      languages: ['en', 'latin'],
      description: 'Designed for user interfaces',
      license: 'ofl',
      previewText: 'Interface Typography'
    },
    {
      id: 'playfair',
      family: 'Playfair Display',
      name: 'Playfair Display',
      category: 'serif',
      variants: [
        { style: 'normal', weight: 400, file: 'assets/fonts/PlayfairDisplay-Regular.ttf' },
        { style: 'italic', weight: 400, file: 'assets/fonts/PlayfairDisplay-Italic.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/PlayfairDisplay-Bold.ttf' },
        { style: 'italic', weight: 700, file: 'assets/fonts/PlayfairDisplay-BoldItalic.ttf' },
        { style: 'normal', weight: 900, file: 'assets/fonts/PlayfairDisplay-Black.ttf' }
      ],
      languages: ['en', 'latin'],
      description: 'Elegant serif font for headlines',
      license: 'ofl',
      previewText: 'Elegant Headlines & Titles'
    },
    {
      id: 'source-code-pro',
      family: 'Source Code Pro',
      name: 'Source Code Pro',
      category: 'monospace',
      variants: [
        { style: 'normal', weight: 200, file: 'assets/fonts/SourceCodePro-ExtraLight.ttf' },
        { style: 'normal', weight: 300, file: 'assets/fonts/SourceCodePro-Light.ttf' },
        { style: 'normal', weight: 400, file: 'assets/fonts/SourceCodePro-Regular.ttf' },
        { style: 'normal', weight: 500, file: 'assets/fonts/SourceCodePro-Medium.ttf' },
        { style: 'normal', weight: 600, file: 'assets/fonts/SourceCodePro-SemiBold.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/SourceCodePro-Bold.ttf' },
        { style: 'normal', weight: 900, file: 'assets/fonts/SourceCodePro-Black.ttf' }
      ],
      languages: ['en', 'latin'],
      description: 'Monospace font for code and programming',
      license: 'ofl',
      previewText: 'function() { return true; }'
    },
    {
      id: 'dancing-script',
      family: 'Dancing Script',
      name: 'Dancing Script',
      category: 'handwriting',
      variants: [
        { style: 'normal', weight: 400, file: 'assets/fonts/DancingScript-Regular.ttf' },
        { style: 'normal', weight: 500, file: 'assets/fonts/DancingScript-Medium.ttf' },
        { style: 'normal', weight: 600, file: 'assets/fonts/DancingScript-SemiBold.ttf' },
        { style: 'normal', weight: 700, file: 'assets/fonts/DancingScript-Bold.ttf' }
      ],
      languages: ['en', 'latin'],
      description: 'Casual handwriting script font',
      license: 'ofl',
      previewText: 'Beautiful Script Writing'
    },
    {
      id: 'lobster',
      family: 'Lobster',
      name: 'Lobster',
      category: 'display',
      variants: [
        { style: 'normal', weight: 400, file: 'assets/fonts/Lobster-Regular.ttf' }
      ],
      languages: ['en', 'latin'],
      description: 'Fun display font for headings',
      license: 'ofl',
      previewText: 'Display Headings'
    }
  ];

  constructor() {
    console.log('Local Font Library initialized with', this.fonts.length, 'fonts');
  }

  /**
   * البحث في المكتبة المحلية
   */
  async search(
    query: string = '', 
    category?: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting',
    language?: string,
    limit: number = 20
  ): Promise<FontSearchResult> {
    try {
      let results = [...this.fonts];

      // تطبيق فلتر الفئة
      if (category) {
        results = results.filter(font => font.category === category);
      }

      // تطبيق فلتر اللغة
      if (language) {
        results = results.filter(font => font.languages.includes(language));
      }

      // تطبيق البحث النصي
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        results = results.filter(font => 
          font.name.toLowerCase().includes(searchTerm) ||
          font.family.toLowerCase().includes(searchTerm) ||
          font.description.toLowerCase().includes(searchTerm)
        );
      }

      // تحديد النتائج حسب الحد الأقصى
      const paginatedResults = results.slice(0, limit);

      return {
        items: paginatedResults,
        total: results.length,
        hasMore: results.length > limit
      };
    } catch (error) {
      console.error('Local font search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  /**
   * الحصول على خط بالمعرف
   */
  async getById(id: string): Promise<LocalFont | null> {
    try {
      const font = this.fonts.find(f => f.id === id);
      return font || null;
    } catch (error) {
      console.error('Failed to get font by ID:', error);
      return null;
    }
  }

  /**
   * الحصول على جميع الفئات المتاحة
   */
  getCategories(): string[] {
    const categories = [...new Set(this.fonts.map(font => font.category))];
    return categories.sort();
  }

  /**
   * الحصول على خطوط شائعة
   */
  async getPopular(limit: number = 10): Promise<LocalFont[]> {
    // الخطوط الأكثر استخداماً
    const popularIds = ['roboto', 'cairo', 'inter', 'playfair', 'almarai'];
    const popular = popularIds
      .map(id => this.fonts.find(font => font.id === id))
      .filter(font => font !== undefined) as LocalFont[];
    
    return popular.slice(0, limit);
  }

  /**
   * الحصول على الخطوط العربية
   */
  async getArabicFonts(): Promise<LocalFont[]> {
    return this.fonts.filter(font => font.isArabic === true);
  }

  /**
   * الحصول على عائلة خط مع جميع المتغيرات
   */
  getFontFamily(familyName: string, weight: number = 400, style: 'normal' | 'italic' = 'normal'): string {
    const font = this.fonts.find(f => f.family === familyName);
    if (!font) {
      console.warn(`Font family "${familyName}" not found`);
      return 'System'; // fallback
    }

    // البحث عن المتغير المطلوب
    const variant = font.variants.find(v => v.weight === weight && v.style === style);
    if (!variant) {
      // البحث عن أقرب وزن متاح
      const availableWeights = font.variants
        .filter(v => v.style === style)
        .map(v => v.weight)
        .sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
      
      if (availableWeights.length > 0) {
        const closestWeight = availableWeights[0];
        return `${familyName}-${closestWeight}${style === 'italic' ? '-Italic' : ''}`;
      }
      
      console.warn(`Font variant "${familyName} ${weight} ${style}" not found`);
      return `${familyName}-Regular`; // fallback to regular
    }

    return `${familyName}-${weight}${style === 'italic' ? '-Italic' : ''}`;
  }

  /**
   * الحصول على جميع أوزان خط معين
   */
  getFontWeights(familyName: string): number[] {
    const font = this.fonts.find(f => f.family === familyName);
    if (!font) return [];

    return [...new Set(font.variants.map(v => v.weight))].sort((a, b) => a - b);
  }

  /**
   * الحصول على جميع أنماط خط معين
   */
  getFontStyles(familyName: string): ('normal' | 'italic')[] {
    const font = this.fonts.find(f => f.family === familyName);
    if (!font) return [];

    return [...new Set(font.variants.map(v => v.style))];
  }

  /**
   * إضافة خط جديد للمكتبة
   */
  addFont(font: Omit<LocalFont, 'id'>): LocalFont {
    const newFont: LocalFont = {
      ...font,
      id: font.family.toLowerCase().replace(/\s+/g, '-')
    };
    
    this.fonts.push(newFont);
    console.log('Added new font to library:', newFont.id);
    
    return newFont;
  }

  /**
   * إنشاء CSS للخطوط المحلية
   */
  generateFontFaceCSS(): string {
    let css = '';
    
    this.fonts.forEach(font => {
      font.variants.forEach(variant => {
        const fontWeight = variant.weight;
        const fontStyle = variant.style;
        
        css += `
@font-face {
  font-family: '${font.family}';
  src: url('${variant.file}') format('truetype');
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}
`;
      });
    });
    
    return css;
  }

  /**
   * الحصول على إحصائيات المكتبة
   */
  getStats() {
    const categories = this.getCategories();
    const languages = [...new Set(this.fonts.flatMap(font => font.languages))];
    const totalVariants = this.fonts.reduce((total, font) => total + font.variants.length, 0);
    
    const stats = {
      totalFonts: this.fonts.length,
      totalVariants: totalVariants,
      categories: categories.length,
      languages: languages.length,
      arabicFonts: this.fonts.filter(font => font.isArabic).length,
      categoryBreakdown: categories.map(category => ({
        category,
        count: this.fonts.filter(font => font.category === category).length
      })),
      languageBreakdown: languages.map(language => ({
        language,
        count: this.fonts.filter(font => font.languages.includes(language)).length
      })),
      licenseBreakdown: {
        ofl: this.fonts.filter(f => f.license === 'ofl').length,
        apache: this.fonts.filter(f => f.license === 'apache').length,
        ubuntu: this.fonts.filter(f => f.license === 'ubuntu').length,
        cc0: this.fonts.filter(f => f.license === 'cc0').length
      }
    };

    return stats;
  }

  /**
   * الحصول على خطوط متشابهة
   */
  async getSimilarFonts(fontId: string, limit: number = 5): Promise<LocalFont[]> {
    const targetFont = await this.getById(fontId);
    if (!targetFont) return [];

    const similar = this.fonts
      .filter(font => font.id !== fontId)
      .filter(font => 
        font.category === targetFont.category ||
        font.languages.some(lang => targetFont.languages.includes(lang))
      )
      .slice(0, limit);

    return similar;
  }

  /**
   * اختبار توفر خط معين
   */
  isFontAvailable(familyName: string): boolean {
    return this.fonts.some(font => font.family === familyName);
  }

  /**
   * الحصول على خط احتياطي
   */
  getFallbackFont(category: string): LocalFont | null {
    const fallbacks = {
      'serif': 'playfair',
      'sans-serif': 'roboto',
      'monospace': 'source-code-pro',
      'display': 'lobster',
      'handwriting': 'dancing-script'
    };

    const fallbackId = fallbacks[category as keyof typeof fallbacks];
    if (fallbackId) {
      return this.fonts.find(font => font.id === fallbackId) || null;
    }

    return null;
  }
}

export default LocalFontLibrary;