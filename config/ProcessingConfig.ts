/**
 * إعدادات المعالجة - Nova Edit Mobile
 * يحتوي على جميع الإعدادات المتعلقة بمعالجة الفيديو والصوت
 */

export interface ProcessingConfig {
  video: VideoConfig;
  audio: AudioConfig;
  ai: AIConfig;
  performance: PerformanceConfig;
  export: ExportConfig;
}

export interface VideoConfig {
  // إعدادات FFmpeg
  ffmpeg: {
    logLevel: number;
    enableStatistics: boolean;
    sessionTimeout: number; // بالثواني
    maxSessions: number;
  };
  
  // إعدادات الجودة
  quality: {
    preview: {
      resolution: string;
      fps: number;
      bitrate: number; // kbps
    };
    processing: {
      resolution: string;
      fps: number;
      bitrate: number;
    };
    export: {
      low: { resolution: string; fps: number; bitrate: number; crf: number };
      medium: { resolution: string; fps: number; bitrate: number; crf: number };
      high: { resolution: string; fps: number; bitrate: number; crf: number };
      ultra: { resolution: string; fps: number; bitrate: number; crf: number };
    };
  };

  // إعدادات الترميز
  codecs: {
    video: {
      h264: { preset: string; profile: string; level: string };
      h265: { preset: string; profile: string; level: string };
      vp9: { preset: string; profile: string };
    };
    container: {
      mp4: { movflags: string[] };
      mov: { movflags: string[] };
      webm: { options: string[] };
    };
  };

  // حدود الملفات
  limits: {
    maxFileSize: number; // MB
    maxDuration: number; // seconds
    maxResolution: { width: number; height: number };
    supportedFormats: string[];
  };
}

export interface AudioConfig {
  // إعدادات الترميز
  codecs: {
    aac: { bitrate: number; profile: string };
    mp3: { bitrate: number; quality: number };
    wav: { sampleRate: number; bitDepth: number };
  };

  // إعدادات المعالجة
  processing: {
    sampleRate: number;
    channels: number;
    bufferSize: number;
    enableNoiseReduction: boolean;
    enableNormalization: boolean;
  };

  // حدود الصوت
  limits: {
    maxFileSize: number; // MB
    maxDuration: number; // seconds
    supportedFormats: string[];
  };
}

export interface AIConfig {
  // إعدادات TensorFlow
  tensorflow: {
    backend: 'webgl' | 'cpu';
    enableProfiling: boolean;
    memoryLimit: number; // MB
    maxTextures: number;
  };

  // إعدادات النماذج
  models: {
    bodySegmentation: {
      modelType: 'general' | 'landscape';
      runtime: 'tfjs' | 'mediapipe';
      enableCache: boolean;
    };
    faceLandmarks: {
      maxFaces: number;
      refineLandmarks: boolean;
      enableCache: boolean;
    };
  };

  // إعدادات المعالجة
  processing: {
    batchSize: number;
    maxConcurrentTasks: number;
    enableGPUAcceleration: boolean;
    confidenceThreshold: number;
  };

  // التأثيرات المفعلة
  enabledEffects: {
    backgroundRemoval: boolean;
    faceBeauty: boolean;
    autoEnhance: boolean;
    objectTracking: boolean;
    colorCorrection: boolean;
    noiseReduction: boolean;
  };
}

export interface PerformanceConfig {
  // إعدادات المعالجة المتوازية
  concurrency: {
    maxVideoProcessingJobs: number;
    maxAIProcessingJobs: number;
    maxFrameProcessingWorkers: number;
    enableMultiThreading: boolean;
  };

  // إدارة الذاكرة
  memory: {
    maxRAMUsage: number; // MB
    enableMemoryOptimization: boolean;
    frameBufferSize: number;
    tempFileCleanupInterval: number; // minutes
  };

  // إعدادات التخزين المؤقت
  cache: {
    enableVideoFrameCache: boolean;
    enableModelCache: boolean;
    maxCacheSize: number; // MB
    cacheExpirationTime: number; // hours
  };

  // مراقبة الأداء
  monitoring: {
    enablePerformanceLogging: boolean;
    logInterval: number; // seconds
    enableMemoryProfiling: boolean;
    enableFPSMonitoring: boolean;
  };
}

export interface ExportConfig {
  // إعدادات التصدير الافتراضية
  defaults: {
    format: 'mp4' | 'mov' | 'webm';
    quality: 'low' | 'medium' | 'high' | 'ultra';
    resolution: '720p' | '1080p' | '4K';
    fps: number;
    enableWatermark: boolean;
  };

  // إعدادات الضغط
  compression: {
    enableTwoPass: boolean;
    enableHardwareAcceleration: boolean;
    adaptiveBitrate: boolean;
    optimizeForStreaming: boolean;
  };

  // إعدادات الجودة المخصصة
  customPresets: Array<{
    name: string;
    description: string;
    video: { codec: string; bitrate: number; crf: number };
    audio: { codec: string; bitrate: number };
    container: string;
  }>;
}

// الإعدادات الافتراضية
export const DEFAULT_CONFIG: ProcessingConfig = {
  video: {
    ffmpeg: {
      logLevel: 20, // INFO
      enableStatistics: true,
      sessionTimeout: 300, // 5 minutes
      maxSessions: 5
    },
    quality: {
      preview: {
        resolution: '480x270',
        fps: 15,
        bitrate: 500
      },
      processing: {
        resolution: '1280x720',
        fps: 30,
        bitrate: 2000
      },
      export: {
        low: { resolution: '640x360', fps: 24, bitrate: 800, crf: 28 },
        medium: { resolution: '1280x720', fps: 30, bitrate: 2000, crf: 23 },
        high: { resolution: '1920x1080', fps: 30, bitrate: 5000, crf: 18 },
        ultra: { resolution: '3840x2160', fps: 30, bitrate: 15000, crf: 15 }
      }
    },
    codecs: {
      video: {
        h264: { preset: 'medium', profile: 'high', level: '4.1' },
        h265: { preset: 'medium', profile: 'main', level: '5.1' },
        vp9: { preset: 'medium', profile: '0' }
      },
      container: {
        mp4: { movflags: ['faststart', '+frag_keyframe+empty_moov'] },
        mov: { movflags: ['faststart'] },
        webm: { options: ['-f webm'] }
      }
    },
    limits: {
      maxFileSize: 2048, // 2GB
      maxDuration: 3600, // 1 hour
      maxResolution: { width: 3840, height: 2160 },
      supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp']
    }
  },

  audio: {
    codecs: {
      aac: { bitrate: 128, profile: 'aac_low' },
      mp3: { bitrate: 192, quality: 2 },
      wav: { sampleRate: 44100, bitDepth: 16 }
    },
    processing: {
      sampleRate: 44100,
      channels: 2,
      bufferSize: 1024,
      enableNoiseReduction: false,
      enableNormalization: true
    },
    limits: {
      maxFileSize: 100, // 100MB
      maxDuration: 3600, // 1 hour
      supportedFormats: ['mp3', 'aac', 'wav', 'm4a', 'ogg']
    }
  },

  ai: {
    tensorflow: {
      backend: 'webgl',
      enableProfiling: false,
      memoryLimit: 512,
      maxTextures: 16
    },
    models: {
      bodySegmentation: {
        modelType: 'general',
        runtime: 'tfjs',
        enableCache: true
      },
      faceLandmarks: {
        maxFaces: 2,
        refineLandmarks: true,
        enableCache: true
      }
    },
    processing: {
      batchSize: 1,
      maxConcurrentTasks: 2,
      enableGPUAcceleration: true,
      confidenceThreshold: 0.5
    },
    enabledEffects: {
      backgroundRemoval: true,
      faceBeauty: true,
      autoEnhance: true,
      objectTracking: true,
      colorCorrection: true,
      noiseReduction: true
    }
  },

  performance: {
    concurrency: {
      maxVideoProcessingJobs: 2,
      maxAIProcessingJobs: 1,
      maxFrameProcessingWorkers: 2,
      enableMultiThreading: true
    },
    memory: {
      maxRAMUsage: 1024,
      enableMemoryOptimization: true,
      frameBufferSize: 10,
      tempFileCleanupInterval: 30
    },
    cache: {
      enableVideoFrameCache: true,
      enableModelCache: true,
      maxCacheSize: 256,
      cacheExpirationTime: 24
    },
    monitoring: {
      enablePerformanceLogging: true,
      logInterval: 5,
      enableMemoryProfiling: false,
      enableFPSMonitoring: true
    }
  },

  export: {
    defaults: {
      format: 'mp4',
      quality: 'high',
      resolution: '1080p',
      fps: 30,
      enableWatermark: false
    },
    compression: {
      enableTwoPass: false,
      enableHardwareAcceleration: true,
      adaptiveBitrate: false,
      optimizeForStreaming: true
    },
    customPresets: [
      {
        name: 'Instagram Story',
        description: 'Optimized for Instagram Stories (9:16)',
        video: { codec: 'h264', bitrate: 2000, crf: 23 },
        audio: { codec: 'aac', bitrate: 128 },
        container: 'mp4'
      },
      {
        name: 'YouTube 1080p',
        description: 'Optimized for YouTube 1080p upload',
        video: { codec: 'h264', bitrate: 5000, crf: 18 },
        audio: { codec: 'aac', bitrate: 192 },
        container: 'mp4'
      },
      {
        name: 'TikTok Vertical',
        description: 'Optimized for TikTok vertical videos',
        video: { codec: 'h264', bitrate: 3000, crf: 20 },
        audio: { codec: 'aac', bitrate: 128 },
        container: 'mp4'
      }
    ]
  }
};

// مدير إعدادات المعالجة
export class ProcessingConfigManager {
  private static instance: ProcessingConfigManager;
  private config: ProcessingConfig;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadConfig();
  }

  public static getInstance(): ProcessingConfigManager {
    if (!ProcessingConfigManager.instance) {
      ProcessingConfigManager.instance = new ProcessingConfigManager();
    }
    return ProcessingConfigManager.instance;
  }

  /**
   * تحميل الإعدادات من التخزين المحلي
   */
  private loadConfig(): void {
    try {
      // في تطبيق حقيقي، يتم تحميل الإعدادات من AsyncStorage
      // هنا نستخدم الإعدادات الافتراضية
      console.log('Processing config loaded');
    } catch (error) {
      console.error('Failed to load processing config:', error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * حفظ الإعدادات في التخزين المحلي
   */
  public async saveConfig(): Promise<void> {
    try {
      // في تطبيق حقيقي، يتم حفظ الإعدادات في AsyncStorage
      console.log('Processing config saved');
    } catch (error) {
      console.error('Failed to save processing config:', error);
    }
  }

  /**
   * الحصول على الإعدادات الحالية
   */
  public getConfig(): ProcessingConfig {
    return this.config;
  }

  /**
   * تحديث إعدادات محددة
   */
  public updateConfig(updates: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * إعادة تعيين الإعدادات للقيم الافتراضية
   */
  public resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * الحصول على إعدادات الجودة حسب المستوى
   */
  public getQualitySettings(quality: 'low' | 'medium' | 'high' | 'ultra') {
    return this.config.video.quality.export[quality];
  }

  /**
   * الحصول على إعدادات الترميز حسب النوع
   */
  public getCodecSettings(codec: 'h264' | 'h265' | 'vp9') {
    return this.config.video.codecs.video[codec];
  }

  /**
   * التحقق من دعم صيغة ملف
   */
  public isVideoFormatSupported(format: string): boolean {
    return this.config.video.limits.supportedFormats.includes(format.toLowerCase());
  }

  public isAudioFormatSupported(format: string): boolean {
    return this.config.audio.limits.supportedFormats.includes(format.toLowerCase());
  }

  /**
   * التحقق من حدود الملف
   */
  public isFileSizeValid(sizeInMB: number, type: 'video' | 'audio'): boolean {
    const limit = type === 'video' ? 
      this.config.video.limits.maxFileSize : 
      this.config.audio.limits.maxFileSize;
    return sizeInMB <= limit;
  }

  public isDurationValid(durationInSeconds: number, type: 'video' | 'audio'): boolean {
    const limit = type === 'video' ? 
      this.config.video.limits.maxDuration : 
      this.config.audio.limits.maxDuration;
    return durationInSeconds <= limit;
  }

  /**
   * الحصول على إعدادات مخصصة للجهاز
   */
  public getDeviceOptimizedConfig(): Partial<ProcessingConfig> {
    // تحسين الإعدادات حسب إمكانيات الجهاز
    // يمكن تحسين هذا بناءً على معلومات الجهاز الفعلية
    return {
      performance: {
        ...this.config.performance,
        concurrency: {
          ...this.config.performance.concurrency,
          maxVideoProcessingJobs: 1, // تقليل للأجهزة الضعيفة
          maxAIProcessingJobs: 1
        }
      }
    };
  }
}

export default ProcessingConfigManager;