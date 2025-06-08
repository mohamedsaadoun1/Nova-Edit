/**
 * Content Seeder Service
 * خدمة تجهيز المحتوى الأولي للمكتبة
 */

import { 
  LibraryContent,
  VideoTemplate,
  MusicTrack,
  SoundEffect,
  Icon,
  Font,
  ContentSource,
  LicenseType,
  VideoFormat,
  AudioFormat,
  IconFormat,
  FontFormat,
  VideoTemplateType,
  MusicGenre,
  MusicMood,
  SoundCategory,
  IconStyle,
  FontCategory,
  FontLanguage
} from '../types/library';

export class ContentSeeder {
  private static instance: ContentSeeder;

  static getInstance(): ContentSeeder {
    if (!ContentSeeder.instance) {
      ContentSeeder.instance = new ContentSeeder();
    }
    return ContentSeeder.instance;
  }

  /**
   * Get sample video templates
   */
  getSampleVideoTemplates(): VideoTemplate[] {
    return [
      {
        id: 'sample_video_intro_1',
        type: 'video_template',
        title: 'Modern Logo Intro',
        description: 'Clean and modern logo introduction template with particles effect',
        tags: ['intro', 'logo', 'modern', 'particles', 'business'],
        category: 'intro',
        author: 'Free Templates',
        source: ContentSource.LOCAL,
        license: LicenseType.CC0,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
        downloadUrl: '/assets/templates/modern_logo_intro.mp4',
        downloads: 1250,
        rating: 4.8,
        isFavorite: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        metadata: {
          difficulty: 'easy',
          software: 'any'
        },
        videoFormat: VideoFormat.MP4,
        duration: 5,
        resolution: { width: 1920, height: 1080, label: '1080p' },
        fps: 30,
        hasAudio: true,
        templateType: VideoTemplateType.INTRO,
        placeholders: [
          {
            id: 'logo_placeholder',
            type: 'logo',
            x: 960,
            y: 540,
            width: 300,
            height: 200,
            duration: 3,
            defaultContent: 'Your Logo Here'
          }
        ]
      },
      {
        id: 'sample_video_social_1',
        type: 'video_template',
        title: 'Instagram Story Template',
        description: 'Trendy Instagram story template with animated text and shapes',
        tags: ['instagram', 'story', 'social', 'animated', 'trendy'],
        category: 'social_media',
        author: 'Social Templates',
        source: ContentSource.LOCAL,
        license: LicenseType.CC_BY,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
        downloadUrl: '/assets/templates/instagram_story.mp4',
        downloads: 890,
        rating: 4.6,
        isFavorite: false,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        metadata: {
          aspectRatio: '9:16',
          platform: 'instagram'
        },
        videoFormat: VideoFormat.MP4,
        duration: 15,
        resolution: { width: 1080, height: 1920, label: '1080x1920' },
        fps: 30,
        hasAudio: true,
        templateType: VideoTemplateType.SOCIAL_MEDIA,
        placeholders: [
          {
            id: 'title_text',
            type: 'text',
            x: 540,
            y: 300,
            width: 800,
            height: 100,
            duration: 15,
            defaultContent: 'Your Title Here'
          },
          {
            id: 'main_image',
            type: 'image',
            x: 140,
            y: 600,
            width: 800,
            height: 800,
            duration: 15
          }
        ]
      },
      {
        id: 'sample_video_ad_1',
        type: 'video_template',
        title: 'Product Advertisement',
        description: 'Professional product advertisement template with call-to-action',
        tags: ['advertisement', 'product', 'commercial', 'professional', 'cta'],
        category: 'advertisement',
        author: 'Ad Templates Pro',
        source: ContentSource.LOCAL,
        license: LicenseType.CC_BY,
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
        downloadUrl: '/assets/templates/product_ad.mp4',
        downloads: 567,
        rating: 4.9,
        isFavorite: false,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        metadata: {
          industry: 'retail',
          style: 'professional'
        },
        videoFormat: VideoFormat.MP4,
        duration: 30,
        resolution: { width: 1920, height: 1080, label: '1080p' },
        fps: 30,
        hasAudio: true,
        templateType: VideoTemplateType.ADVERTISEMENT,
        placeholders: [
          {
            id: 'product_image',
            type: 'image',
            x: 200,
            y: 200,
            width: 600,
            height: 600,
            duration: 25
          },
          {
            id: 'product_title',
            type: 'text',
            x: 900,
            y: 300,
            width: 800,
            height: 150,
            duration: 25,
            defaultContent: 'Product Name'
          },
          {
            id: 'cta_button',
            type: 'text',
            x: 900,
            y: 600,
            width: 300,
            height: 80,
            duration: 5,
            defaultContent: 'Buy Now'
          }
        ]
      }
    ];
  }

  /**
   * Get sample music tracks
   */
  getSampleMusicTracks(): MusicTrack[] {
    return [
      {
        id: 'sample_music_upbeat_1',
        type: 'music',
        title: 'Upbeat Corporate Energy',
        description: 'Energetic corporate background music perfect for presentations and advertisements',
        tags: ['corporate', 'upbeat', 'energetic', 'business', 'presentation'],
        category: 'corporate',
        author: 'Free Music Archive',
        source: ContentSource.LOCAL,
        license: LicenseType.CC_BY,
        thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        downloadUrl: '/assets/music/upbeat_corporate.mp3',
        downloads: 2100,
        rating: 4.7,
        isFavorite: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        metadata: {
          composer: 'Audio Creator',
          bpm: 128
        },
        audioFormat: AudioFormat.MP3,
        duration: 180,
        genre: MusicGenre.CORPORATE,
        mood: MusicMood.ENERGETIC,
        tempo: 128,
        isLoopable: true,
        instruments: ['piano', 'guitar', 'drums', 'synth']
      },
      {
        id: 'sample_music_chill_1',
        type: 'music',
        title: 'Chill Acoustic Vibes',
        description: 'Relaxing acoustic guitar melody ideal for vlogs and lifestyle content',
        tags: ['acoustic', 'chill', 'relaxing', 'guitar', 'vlog'],
        category: 'acoustic',
        author: 'Indie Musicians',
        source: ContentSource.LOCAL,
        license: LicenseType.CC0,
        thumbnailUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
        downloadUrl: '/assets/music/chill_acoustic.mp3',
        downloads: 1850,
        rating: 4.9,
        isFavorite: false,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        metadata: {
          composer: 'Acoustic Artist',
          bpm: 85
        },
        audioFormat: AudioFormat.MP3,
        duration: 195,
        genre: MusicGenre.ACOUSTIC,
        mood: MusicMood.CALM,
        tempo: 85,
        isLoopable: true,
        instruments: ['acoustic guitar', 'strings', 'light percussion']
      },
      {
        id: 'sample_music_electronic_1',
        type: 'music',
        title: 'Future Bass Drop',
        description: 'Modern electronic track with powerful drops perfect for gaming and tech content',
        tags: ['electronic', 'future bass', 'gaming', 'tech', 'energetic'],
        category: 'electronic',
        author: 'Electronic Collective',
        source: ContentSource.LOCAL,
        license: LicenseType.CC_BY_SA,
        thumbnailUrl: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=300&fit=crop',
        downloadUrl: '/assets/music/future_bass.mp3',
        downloads: 3200,
        rating: 4.8,
        isFavorite: false,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
        metadata: {
          composer: 'Bass Producer',
          bpm: 140
        },
        audioFormat: AudioFormat.MP3,
        duration: 210,
        genre: MusicGenre.ELECTRONIC,
        mood: MusicMood.ENERGETIC,
        tempo: 140,
        isLoopable: true,
        instruments: ['synthesizer', '808 drums', 'bass', 'lead synth']
      }
    ];
  }

  /**
   * Get sample sound effects
   */
  getSampleSoundEffects(): SoundEffect[] {
    return [
      {
        id: 'sample_sound_notification_1',
        type: 'sound_effect',
        title: 'Success Notification',
        description: 'Pleasant notification sound for success messages and achievements',
        tags: ['notification', 'success', 'achievement', 'ui', 'positive'],
        category: 'notification',
        author: 'UI Sounds',
        source: ContentSource.LOCAL,
        license: LicenseType.CC0,
        thumbnailUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop',
        downloadUrl: '/assets/sounds/success_notification.wav',
        downloads: 5600,
        rating: 4.8,
        isFavorite: false,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
        metadata: {
          bitrate: 44100,
          channels: 2
        },
        audioFormat: AudioFormat.WAV,
        duration: 1.2,
        soundCategory: SoundCategory.NOTIFICATION,
        waveformUrl: '/assets/waveforms/success_notification.png'
      },
      {
        id: 'sample_sound_nature_1',
        type: 'sound_effect',
        title: 'Forest Ambience',
        description: 'Peaceful forest sounds with birds chirping and gentle wind',
        tags: ['nature', 'forest', 'birds', 'ambience', 'peaceful'],
        category: 'nature',
        author: 'Nature Recordings',
        source: ContentSource.LOCAL,
        license: LicenseType.CC_BY,
        thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        downloadUrl: '/assets/sounds/forest_ambience.mp3',
        downloads: 3400,
        rating: 4.9,
        isFavorite: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        metadata: {
          location: 'Mountain Forest',
          time: 'Morning'
        },
        audioFormat: AudioFormat.MP3,
        duration: 300,
        soundCategory: SoundCategory.NATURE,
        waveformUrl: '/assets/waveforms/forest_ambience.png'
      },
      {
        id: 'sample_sound_tech_1',
        type: 'sound_effect',
        title: 'Digital Glitch',
        description: 'Modern digital glitch effect perfect for tech transitions',
        tags: ['technology', 'glitch', 'digital', 'transition', 'modern'],
        category: 'technology',
        author: 'Tech Audio',
        source: ContentSource.LOCAL,
        license: LicenseType.CC0,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
        downloadUrl: '/assets/sounds/digital_glitch.wav',
        downloads: 2800,
        rating: 4.6,
        isFavorite: false,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        metadata: {
          type: 'synthetic',
          processing: 'digital'
        },
        audioFormat: AudioFormat.WAV,
        duration: 0.8,
        soundCategory: SoundCategory.TECHNOLOGY,
        waveformUrl: '/assets/waveforms/digital_glitch.png'
      }
    ];
  }

  /**
   * Get sample icons
   */
  getSampleIcons(): Icon[] {
    return [
      {
        id: 'sample_icon_social_1',
        type: 'icon',
        title: 'Social Media Icons Pack',
        description: 'Complete set of popular social media platform icons',
        tags: ['social', 'media', 'facebook', 'instagram', 'twitter', 'tiktok'],
        category: 'social',
        author: 'Icon Designer',
        source: ContentSource.LOCAL,
        license: LicenseType.CC0,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
        downloadUrl: '/assets/icons/social_media_pack.zip',
        downloads: 8900,
        rating: 4.9,
        isFavorite: false,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        metadata: {
          count: 15,
          style: 'outline'
        },
        iconFormat: IconFormat.SVG,
        style: IconStyle.OUTLINE,
        isColorizable: true,
        sizes: [
          { size: 24, url: '/assets/icons/social_24.svg' },
          { size: 48, url: '/assets/icons/social_48.svg' },
          { size: 96, url: '/assets/icons/social_96.svg' }
        ],
        vectorUrl: '/assets/icons/social_media.svg'
      },
      {
        id: 'sample_icon_ui_1',
        type: 'icon',
        title: 'UI Interface Icons',
        description: 'Essential user interface icons for apps and websites',
        tags: ['ui', 'interface', 'app', 'website', 'navigation'],
        category: 'interface',
        author: 'UI Icons Co',
        source: ContentSource.LOCAL,
        license: LicenseType.MIT,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop',
        downloadUrl: '/assets/icons/ui_interface_pack.zip',
        downloads: 12500,
        rating: 4.8,
        isFavorite: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        metadata: {
          count: 50,
          style: 'filled'
        },
        iconFormat: IconFormat.SVG,
        style: IconStyle.FILLED,
        isColorizable: true,
        sizes: [
          { size: 16, url: '/assets/icons/ui_16.svg' },
          { size: 24, url: '/assets/icons/ui_24.svg' },
          { size: 32, url: '/assets/icons/ui_32.svg' },
          { size: 48, url: '/assets/icons/ui_48.svg' }
        ],
        vectorUrl: '/assets/icons/ui_interface.svg'
      }
    ];
  }

  /**
   * Get sample fonts
   */
  getSampleFonts(): Font[] {
    return [
      {
        id: 'sample_font_arabic_1',
        type: 'font',
        title: 'Noto Sans Arabic',
        description: 'Beautiful Arabic font from Google Fonts, perfect for modern designs',
        tags: ['arabic', 'modern', 'clean', 'google-fonts', 'sans-serif'],
        category: 'sans-serif',
        author: 'Google Fonts',
        source: ContentSource.GOOGLE_FONTS,
        license: LicenseType.APACHE,
        thumbnailUrl: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgWg.woff2',
        downloadUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap',
        downloads: 15600,
        rating: 4.9,
        isFavorite: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metadata: {
          googleFamily: 'Noto Sans Arabic',
          subsets: ['arabic', 'latin']
        },
        fontFamily: 'Noto Sans Arabic',
        variants: [
          { weight: 400, style: 'normal', url: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgWg.woff2' },
          { weight: 700, style: 'normal', url: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgWg_bold.woff2' }
        ],
        language: [FontLanguage.ARABIC, FontLanguage.LATIN],
        category: FontCategory.SANS_SERIF,
        googleFontName: 'Noto Sans Arabic',
        previewText: 'نص تجريبي باللغة العربية',
        fontFiles: [
          {
            format: FontFormat.WOFF2,
            url: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgWg.woff2',
            weight: 400,
            style: 'normal'
          },
          {
            format: FontFormat.WOFF2,
            url: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgWg_bold.woff2',
            weight: 700,
            style: 'normal'
          }
        ]
      },
      {
        id: 'sample_font_display_1',
        type: 'font',
        title: 'Bebas Neue',
        description: 'Strong display font perfect for headers and titles in videos',
        tags: ['display', 'bold', 'headers', 'titles', 'impact'],
        category: 'display',
        author: 'Google Fonts',
        source: ContentSource.GOOGLE_FONTS,
        license: LicenseType.APACHE,
        thumbnailUrl: 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2',
        downloadUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
        downloads: 25300,
        rating: 4.8,
        isFavorite: false,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        metadata: {
          googleFamily: 'Bebas Neue',
          popularity: 'high'
        },
        fontFamily: 'Bebas Neue',
        variants: [
          { weight: 400, style: 'normal', url: 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2' }
        ],
        language: [FontLanguage.LATIN],
        category: FontCategory.DISPLAY,
        googleFontName: 'Bebas Neue',
        previewText: 'STRONG DISPLAY FONT',
        fontFiles: [
          {
            format: FontFormat.WOFF2,
            url: 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2',
            weight: 400,
            style: 'normal'
          }
        ]
      },
      {
        id: 'sample_font_handwriting_1',
        type: 'font',
        title: 'Dancing Script',
        description: 'Elegant handwriting font perfect for personal and creative projects',
        tags: ['handwriting', 'script', 'elegant', 'personal', 'creative'],
        category: 'handwriting',
        author: 'Google Fonts',
        source: ContentSource.GOOGLE_FONTS,
        license: LicenseType.APACHE,
        thumbnailUrl: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3ROp9.woff2',
        downloadUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap',
        downloads: 18900,
        rating: 4.7,
        isFavorite: false,
        createdAt: new Date('2024-01-07'),
        updatedAt: new Date('2024-01-07'),
        metadata: {
          googleFamily: 'Dancing Script',
          style: 'elegant'
        },
        fontFamily: 'Dancing Script',
        variants: [
          { weight: 400, style: 'normal', url: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3ROp9.woff2' },
          { weight: 700, style: 'normal', url: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3ROp9_bold.woff2' }
        ],
        language: [FontLanguage.LATIN],
        category: FontCategory.HANDWRITING,
        googleFontName: 'Dancing Script',
        previewText: 'Beautiful Handwriting Style',
        fontFiles: [
          {
            format: FontFormat.WOFF2,
            url: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3ROp9.woff2',
            weight: 400,
            style: 'normal'
          },
          {
            format: FontFormat.WOFF2,
            url: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3ROp9_bold.woff2',
            weight: 700,
            style: 'normal'
          }
        ]
      }
    ];
  }

  /**
   * Get all sample content
   */
  getAllSampleContent(): LibraryContent[] {
    return [
      ...this.getSampleVideoTemplates(),
      ...this.getSampleMusicTracks(),
      ...this.getSampleSoundEffects(),
      ...this.getSampleIcons(),
      ...this.getSampleFonts()
    ];
  }

  /**
   * Populate library with sample content
   */
  async seedLibrary(): Promise<void> {
    try {
      const allContent = this.getAllSampleContent();
      
      // In a real implementation, this would save to a database or cache
      console.log(`Seeded library with ${allContent.length} sample items:`);
      console.log(`- ${this.getSampleVideoTemplates().length} Video Templates`);
      console.log(`- ${this.getSampleMusicTracks().length} Music Tracks`);
      console.log(`- ${this.getSampleSoundEffects().length} Sound Effects`);
      console.log(`- ${this.getSampleIcons().length} Icon Packs`);
      console.log(`- ${this.getSampleFonts().length} Fonts`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to seed library:', error);
      throw error;
    }
  }

  /**
   * Get content by category
   */
  getContentByCategory(category: string): LibraryContent[] {
    return this.getAllSampleContent().filter(item => 
      item.category === category || item.tags.includes(category)
    );
  }

  /**
   * Get content by type
   */
  getContentByType(type: LibraryContent['type']): LibraryContent[] {
    return this.getAllSampleContent().filter(item => item.type === type);
  }

  /**
   * Get popular content (by downloads)
   */
  getPopularContent(limit = 10): LibraryContent[] {
    return this.getAllSampleContent()
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get newest content
   */
  getNewestContent(limit = 10): LibraryContent[] {
    return this.getAllSampleContent()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Search content
   */
  searchContent(query: string): LibraryContent[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSampleContent().filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export default ContentSeeder;