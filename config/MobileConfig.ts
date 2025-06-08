/**
 * Mobile Configuration for Nova Edit
 * إعدادات محسنة للأجهزة المحمولة والشاشات الصغيرة
 */

export interface MobileConfig {
  ui: MobileUIConfig;
  performance: MobilePerformanceConfig;
  gestures: GestureConfig;
  orientation: OrientationConfig;
  accessibility: AccessibilityConfig;
}

export interface MobileUIConfig {
  // إعدادات الشاشة
  breakpoints: {
    small: number;    // <= 480px
    medium: number;   // <= 768px
    large: number;    // <= 1024px
  };
  
  // أحجام العناصر
  touchTargets: {
    minimum: number;  // 44px minimum touch target
    recommended: number; // 48px recommended
    spacing: number;  // 8px minimum spacing
  };
  
  // Typography محسن للموبايل
  typography: {
    baseFontSize: number;
    scaleRatio: number;
    lineHeight: number;
    letterSpacing: number;
  };
  
  // تخطيط الواجهة
  layout: {
    headerHeight: number;
    tabBarHeight: number;
    timelineHeight: number;
    toolPanelHeight: number;
    marginHorizontal: number;
    marginVertical: number;
  };
  
  // الألوان المحسنة للموبايل
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    overlay: string;
    success: string;
    warning: string;
    error: string;
  };
  
  // الظلال والتأثيرات
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  
  // الرسوم المتحركة
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

export interface MobilePerformanceConfig {
  // تحسين الأداء
  rendering: {
    enableHardwareAcceleration: boolean;
    maxFPS: number;
    enableVSync: boolean;
    reducedMotion: boolean;
  };
  
  // إدارة الذاكرة للموبايل
  memory: {
    maxVideoResolution: { width: number; height: number };
    maxVideoLength: number; // seconds
    maxConcurrentVideos: number;
    cacheSize: number; // MB
  };
  
  // تحسين البطارية
  battery: {
    enablePowerSaving: boolean;
    reduceCPUUsage: boolean;
    limitBackgroundProcessing: boolean;
    enableLowPowerMode: boolean;
  };
  
  // تحسين الشبكة
  network: {
    enableOfflineMode: boolean;
    preloadAssets: boolean;
    compressionLevel: number;
    timeoutDuration: number;
  };
}

export interface GestureConfig {
  // إعدادات اللمس
  touch: {
    tapThreshold: number;       // ms
    longPressThreshold: number; // ms
    doubleTapThreshold: number; // ms
    swipeThreshold: number;     // px
    pinchSensitivity: number;
  };
  
  // إيماءات مخصصة
  customGestures: {
    enableSwipeToDelete: boolean;
    enablePinchToZoom: boolean;
    enableDoubleTapToEdit: boolean;
    enableLongPressMenu: boolean;
    enableSwipeNavigation: boolean;
  };
  
  // ردود فعل اللمس
  feedback: {
    enableHapticFeedback: boolean;
    enableVisualFeedback: boolean;
    enableAudioFeedback: boolean;
    feedbackIntensity: 'light' | 'medium' | 'heavy';
  };
}

export interface OrientationConfig {
  // إعدادات الاتجاه
  supportedOrientations: Array<'portrait' | 'landscape' | 'portraitUpsideDown' | 'landscapeLeft' | 'landscapeRight'>;
  lockOrientation: boolean;
  autoRotate: boolean;
  
  // تخطيط حسب الاتجاه
  layouts: {
    portrait: {
      timelinePosition: 'bottom' | 'side';
      toolPanelPosition: 'bottom' | 'side';
      previewAspectRatio: number;
    };
    landscape: {
      timelinePosition: 'bottom' | 'side';
      toolPanelPosition: 'bottom' | 'side';
      previewAspectRatio: number;
    };
  };
}

export interface AccessibilityConfig {
  // إمكانية الوصول
  voiceOver: {
    enabled: boolean;
    announceChanges: boolean;
    customLabels: { [key: string]: string };
  };
  
  // تباين الألوان
  contrast: {
    highContrastMode: boolean;
    colorBlindSupport: boolean;
    customColorScheme: boolean;
  };
  
  // تكبير النص
  textScaling: {
    allowDynamicType: boolean;
    minScale: number;
    maxScale: number;
    respectSystemSettings: boolean;
  };
  
  // تسهيلات حركية
  motor: {
    enableLargerTouchTargets: boolean;
    enableStickyDrag: boolean;
    reduceAnimations: boolean;
    enableAssistiveTouch: boolean;
  };
}

// الإعدادات الافتراضية للموبايل
export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  ui: {
    breakpoints: {
      small: 480,
      medium: 768,
      large: 1024
    },
    
    touchTargets: {
      minimum: 44,
      recommended: 48,
      spacing: 8
    },
    
    typography: {
      baseFontSize: 16,
      scaleRatio: 1.2,
      lineHeight: 1.5,
      letterSpacing: 0.5
    },
    
    layout: {
      headerHeight: 60,
      tabBarHeight: 80,
      timelineHeight: 200,
      toolPanelHeight: 120,
      marginHorizontal: 16,
      marginVertical: 12
    },
    
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#1a1a1a',
      surface: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#333333',
      overlay: 'rgba(0, 0, 0, 0.7)',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30'
    },
    
    shadows: {
      small: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      medium: '0px 4px 8px rgba(0, 0, 0, 0.2)',
      large: '0px 8px 16px rgba(0, 0, 0, 0.3)'
    },
    
    animations: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500
      },
      easing: {
        ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
        easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)'
      }
    }
  },
  
  performance: {
    rendering: {
      enableHardwareAcceleration: true,
      maxFPS: 60,
      enableVSync: true,
      reducedMotion: false
    },
    
    memory: {
      maxVideoResolution: { width: 1920, height: 1080 },
      maxVideoLength: 600, // 10 minutes
      maxConcurrentVideos: 3,
      cacheSize: 256 // MB
    },
    
    battery: {
      enablePowerSaving: false,
      reduceCPUUsage: false,
      limitBackgroundProcessing: true,
      enableLowPowerMode: false
    },
    
    network: {
      enableOfflineMode: true,
      preloadAssets: true,
      compressionLevel: 8,
      timeoutDuration: 10000 // 10 seconds
    }
  },
  
  gestures: {
    touch: {
      tapThreshold: 200,
      longPressThreshold: 500,
      doubleTapThreshold: 300,
      swipeThreshold: 50,
      pinchSensitivity: 1.0
    },
    
    customGestures: {
      enableSwipeToDelete: true,
      enablePinchToZoom: true,
      enableDoubleTapToEdit: true,
      enableLongPressMenu: true,
      enableSwipeNavigation: true
    },
    
    feedback: {
      enableHapticFeedback: true,
      enableVisualFeedback: true,
      enableAudioFeedback: false,
      feedbackIntensity: 'medium'
    }
  },
  
  orientation: {
    supportedOrientations: ['portrait', 'landscape'],
    lockOrientation: false,
    autoRotate: true,
    
    layouts: {
      portrait: {
        timelinePosition: 'bottom',
        toolPanelPosition: 'bottom',
        previewAspectRatio: 16/9
      },
      landscape: {
        timelinePosition: 'side',
        toolPanelPosition: 'side',
        previewAspectRatio: 16/9
      }
    }
  },
  
  accessibility: {
    voiceOver: {
      enabled: true,
      announceChanges: true,
      customLabels: {
        'play-button': 'تشغيل الفيديو',
        'pause-button': 'إيقاف الفيديو',
        'timeline': 'خط زمني للفيديو',
        'tools': 'أدوات التحرير'
      }
    },
    
    contrast: {
      highContrastMode: false,
      colorBlindSupport: true,
      customColorScheme: false
    },
    
    textScaling: {
      allowDynamicType: true,
      minScale: 0.8,
      maxScale: 2.0,
      respectSystemSettings: true
    },
    
    motor: {
      enableLargerTouchTargets: false,
      enableStickyDrag: false,
      reduceAnimations: false,
      enableAssistiveTouch: false
    }
  }
};

// مدير إعدادات الموبايل
export class MobileConfigManager {
  private static instance: MobileConfigManager;
  private config: MobileConfig;

  private constructor() {
    this.config = { ...DEFAULT_MOBILE_CONFIG };
    this.loadConfig();
  }

  public static getInstance(): MobileConfigManager {
    if (!MobileConfigManager.instance) {
      MobileConfigManager.instance = new MobileConfigManager();
    }
    return MobileConfigManager.instance;
  }

  private loadConfig(): void {
    try {
      // في تطبيق حقيقي، يتم تحميل الإعدادات من AsyncStorage
      console.log('Mobile config loaded');
    } catch (error) {
      console.error('Failed to load mobile config:', error);
      this.config = { ...DEFAULT_MOBILE_CONFIG };
    }
  }

  public getConfig(): MobileConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * تحسين الإعدادات حسب حجم الشاشة
   */
  public optimizeForScreenSize(width: number, height: number): void {
    const isSmallScreen = width <= this.config.ui.breakpoints.small;
    const isMediumScreen = width <= this.config.ui.breakpoints.medium;
    
    if (isSmallScreen) {
      // تحسينات للشاشات الصغيرة
      this.config.ui.layout.headerHeight = 50;
      this.config.ui.layout.tabBarHeight = 70;
      this.config.ui.layout.timelineHeight = 150;
      this.config.ui.layout.marginHorizontal = 12;
      this.config.ui.typography.baseFontSize = 14;
    } else if (isMediumScreen) {
      // تحسينات للشاشات المتوسطة
      this.config.ui.layout.headerHeight = 55;
      this.config.ui.layout.tabBarHeight = 75;
      this.config.ui.layout.timelineHeight = 175;
      this.config.ui.layout.marginHorizontal = 14;
      this.config.ui.typography.baseFontSize = 15;
    }
  }

  /**
   * تفعيل وضع توفير البطارية
   */
  public enablePowerSavingMode(): void {
    this.config.performance.battery.enablePowerSaving = true;
    this.config.performance.battery.reduceCPUUsage = true;
    this.config.performance.rendering.maxFPS = 30;
    this.config.performance.rendering.reducedMotion = true;
    this.config.ui.animations.duration.fast = 100;
    this.config.ui.animations.duration.normal = 200;
    this.config.ui.animations.duration.slow = 300;
  }

  /**
   * تفعيل وضع إمكانية الوصول
   */
  public enableAccessibilityMode(): void {
    this.config.accessibility.motor.enableLargerTouchTargets = true;
    this.config.accessibility.motor.reduceAnimations = true;
    this.config.accessibility.contrast.highContrastMode = true;
    this.config.ui.touchTargets.minimum = 56;
    this.config.ui.touchTargets.recommended = 64;
  }

  /**
   * تحسين الأداء للأجهزة الضعيفة
   */
  public optimizeForLowEndDevice(): void {
    this.config.performance.memory.maxVideoResolution = { width: 1280, height: 720 };
    this.config.performance.memory.maxConcurrentVideos = 1;
    this.config.performance.memory.cacheSize = 128;
    this.config.performance.rendering.maxFPS = 30;
    this.config.performance.rendering.enableHardwareAcceleration = false;
  }
}

export default MobileConfigManager;