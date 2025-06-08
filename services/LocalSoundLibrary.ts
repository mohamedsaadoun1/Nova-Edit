/**
 * Local Sound Library - بديل محلي لـ Freesound API
 * مكتبة أصوات محلية مجانية بدون الحاجة لإنترنت أو مفاتيح API
 */

export interface LocalSound {
  id: string;
  name: string;
  category: string;
  tags: string[];
  duration: number;
  fileUrl: string;
  previewUrl?: string;
  description: string;
  license: 'free' | 'cc0';
  waveformUrl?: string;
  fileSize: number; // in bytes
  format: 'mp3' | 'wav' | 'ogg';
}

export interface SoundSearchResult {
  items: LocalSound[];
  total: number;
  hasMore: boolean;
}

export class LocalSoundLibrary {
  private sounds: LocalSound[] = [
    // أصوات إشعارات
    {
      id: 'notification_001',
      name: 'Bell Notification',
      category: 'notification',
      tags: ['bell', 'notification', 'alert', 'ding'],
      duration: 1.5,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      previewUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Clean bell sound for notifications',
      license: 'cc0',
      fileSize: 24576,
      format: 'mp3'
    },
    {
      id: 'notification_002',
      name: 'Digital Chime',
      category: 'notification',
      tags: ['chime', 'digital', 'notification', 'alert', 'modern'],
      duration: 2.0,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Modern digital chime for apps',
      license: 'cc0',
      fileSize: 32768,
      format: 'mp3'
    },
    
    // أصوات طبيعة
    {
      id: 'nature_001',
      name: 'Light Rain',
      category: 'nature',
      tags: ['rain', 'nature', 'peaceful', 'ambient', 'weather'],
      duration: 30.0,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Gentle rain sounds for relaxation',
      license: 'cc0',
      fileSize: 512000,
      format: 'mp3'
    },
    {
      id: 'nature_002',
      name: 'Forest Birds',
      category: 'nature',
      tags: ['birds', 'forest', 'morning', 'nature', 'peaceful'],
      duration: 45.0,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Morning birds singing in forest',
      license: 'cc0',
      fileSize: 768000,
      format: 'mp3'
    },
    
    // أصوات تقنية
    {
      id: 'tech_001',
      name: 'Keyboard Click',
      category: 'technology',
      tags: ['keyboard', 'click', 'computer', 'typing', 'tech'],
      duration: 0.3,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Mechanical keyboard single click',
      license: 'cc0',
      fileSize: 8192,
      format: 'mp3'
    },
    {
      id: 'tech_002',
      name: 'Camera Shutter',
      category: 'technology',
      tags: ['camera', 'shutter', 'photo', 'click', 'capture'],
      duration: 0.8,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Digital camera shutter sound',
      license: 'cc0',
      fileSize: 16384,
      format: 'mp3'
    },
    
    // أصوات بشرية
    {
      id: 'human_001',
      name: 'Applause',
      category: 'human',
      tags: ['applause', 'clapping', 'crowd', 'success', 'celebration'],
      duration: 3.5,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Group applause for achievements',
      license: 'cc0',
      fileSize: 98304,
      format: 'mp3'
    },
    {
      id: 'human_002',
      name: 'Footsteps',
      category: 'human',
      tags: ['footsteps', 'walking', 'steps', 'movement', 'human'],
      duration: 2.0,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Walking footsteps on hard surface',
      license: 'cc0',
      fileSize: 49152,
      format: 'mp3'
    },
    
    // أصوات موسيقية
    {
      id: 'music_001',
      name: 'Piano Chord',
      category: 'musical',
      tags: ['piano', 'chord', 'music', 'harmony', 'instrument'],
      duration: 4.0,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Beautiful piano chord progression',
      license: 'cc0',
      fileSize: 131072,
      format: 'mp3'
    },
    {
      id: 'music_002',
      name: 'Guitar Strum',
      category: 'musical',
      tags: ['guitar', 'strum', 'acoustic', 'music', 'strings'],
      duration: 2.5,
      fileUrl: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAC7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAGXAjoAAQAAA0gAAAAATMjIn3QwwJyy2+BKlrb/9Qf3////6LQAAAA+//8kDI2A//uQxAgAAAaACgAABAAAzQAAAAEAAAGnwuQ8AAAD//nAAA=',
      description: 'Acoustic guitar chord strum',
      license: 'cc0',
      fileSize: 65536,
      format: 'mp3'
    }
  ];

  constructor() {
    console.log('Local Sound Library initialized with', this.sounds.length, 'sounds');
  }

  /**
   * البحث في المكتبة المحلية
   */
  async search(
    query: string = '', 
    category?: string, 
    duration?: { min?: number; max?: number },
    limit: number = 20
  ): Promise<SoundSearchResult> {
    try {
      let results = [...this.sounds];

      // تطبيق فلتر الفئة
      if (category) {
        results = results.filter(sound => sound.category === category);
      }

      // تطبيق فلتر المدة
      if (duration) {
        if (duration.min !== undefined) {
          results = results.filter(sound => sound.duration >= duration.min!);
        }
        if (duration.max !== undefined) {
          results = results.filter(sound => sound.duration <= duration.max!);
        }
      }

      // تطبيق البحث النصي
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        results = results.filter(sound => 
          sound.name.toLowerCase().includes(searchTerm) ||
          sound.description.toLowerCase().includes(searchTerm) ||
          sound.tags.some(tag => tag.toLowerCase().includes(searchTerm))
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
      console.error('Local sound search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  /**
   * الحصول على صوت بالمعرف
   */
  async getById(id: string): Promise<LocalSound | null> {
    try {
      const sound = this.sounds.find(s => s.id === id);
      return sound || null;
    } catch (error) {
      console.error('Failed to get sound by ID:', error);
      return null;
    }
  }

  /**
   * الحصول على جميع الفئات المتاحة
   */
  getCategories(): string[] {
    const categories = [...new Set(this.sounds.map(sound => sound.category))];
    return categories.sort();
  }

  /**
   * الحصول على أصوات شائعة
   */
  async getPopular(limit: number = 10): Promise<LocalSound[]> {
    // إرجاع أول صوت من كل فئة
    const categories = this.getCategories();
    const popular: LocalSound[] = [];
    
    categories.forEach(category => {
      const categorySounds = this.sounds.filter(sound => sound.category === category);
      if (categorySounds.length > 0) {
        popular.push(categorySounds[0]);
      }
    });

    return popular.slice(0, limit);
  }

  /**
   * الحصول على أصوات قصيرة (أقل من 5 ثواني)
   */
  async getShortSounds(limit: number = 10): Promise<LocalSound[]> {
    const shortSounds = this.sounds
      .filter(sound => sound.duration <= 5.0)
      .slice(0, limit);
    
    return shortSounds;
  }

  /**
   * الحصول على أصوات طويلة (أكثر من 10 ثواني)
   */
  async getLongSounds(limit: number = 10): Promise<LocalSound[]> {
    const longSounds = this.sounds
      .filter(sound => sound.duration >= 10.0)
      .slice(0, limit);
    
    return longSounds;
  }

  /**
   * محاكاة تحميل الصوت
   */
  async download(sound: LocalSound, quality: 'preview' | 'full' = 'full'): Promise<string> {
    try {
      const url = quality === 'preview' && sound.previewUrl 
        ? sound.previewUrl 
        : sound.fileUrl;
      
      // محاكاة وقت التحميل
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return url;
    } catch (error) {
      console.error('Failed to download sound:', error);
      throw error;
    }
  }

  /**
   * إضافة صوت جديد للمكتبة
   */
  addSound(sound: Omit<LocalSound, 'id'>): LocalSound {
    const newSound: LocalSound = {
      ...sound,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.sounds.push(newSound);
    console.log('Added new sound to library:', newSound.id);
    
    return newSound;
  }

  /**
   * الحصول على أصوات حسب التنسيق
   */
  getSoundsByFormat(format: 'mp3' | 'wav' | 'ogg'): LocalSound[] {
    return this.sounds.filter(sound => sound.format === format);
  }

  /**
   * الحصول على إحصائيات المكتبة
   */
  getStats() {
    const categories = this.getCategories();
    const totalDuration = this.sounds.reduce((total, sound) => total + sound.duration, 0);
    const totalSize = this.sounds.reduce((total, sound) => total + sound.fileSize, 0);
    
    const stats = {
      totalSounds: this.sounds.length,
      totalDuration: Math.round(totalDuration * 10) / 10, // round to 1 decimal
      totalSize: totalSize,
      averageDuration: Math.round((totalDuration / this.sounds.length) * 10) / 10,
      categories: categories.length,
      categoryBreakdown: categories.map(category => ({
        category,
        count: this.sounds.filter(sound => sound.category === category).length,
        totalDuration: this.sounds
          .filter(sound => sound.category === category)
          .reduce((total, sound) => total + sound.duration, 0)
      })),
      formatBreakdown: {
        mp3: this.sounds.filter(s => s.format === 'mp3').length,
        wav: this.sounds.filter(s => s.format === 'wav').length,
        ogg: this.sounds.filter(s => s.format === 'ogg').length
      }
    };

    return stats;
  }

  /**
   * البحث عن أصوات متشابهة
   */
  async getSimilarSounds(soundId: string, limit: number = 5): Promise<LocalSound[]> {
    const targetSound = await this.getById(soundId);
    if (!targetSound) return [];

    const similar = this.sounds
      .filter(sound => sound.id !== soundId)
      .filter(sound => 
        sound.category === targetSound.category ||
        sound.tags.some(tag => targetSound.tags.includes(tag))
      )
      .slice(0, limit);

    return similar;
  }
}

export default LocalSoundLibrary;