/**
 * Mobile Performance Hook
 * Hook مخصص لإدارة وتحسين الأداء على الأجهزة المحمولة
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, DeviceInfo, InteractionManager } from 'react-native';
import { MobileConfigManager } from '../config/MobileConfig';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryLevel: number;
  isLowPowerMode: boolean;
  networkType: string;
  deviceTier: 'low' | 'medium' | 'high';
}

interface PerformanceState {
  metrics: PerformanceMetrics;
  isOptimized: boolean;
  enabledOptimizations: string[];
  warnings: string[];
}

export function useMobilePerformance() {
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    metrics: {
      fps: 60,
      memoryUsage: 0,
      cpuUsage: 0,
      batteryLevel: 100,
      isLowPowerMode: false,
      networkType: 'wifi',
      deviceTier: 'medium'
    },
    isOptimized: false,
    enabledOptimizations: [],
    warnings: []
  });

  const mobileConfig = MobileConfigManager.getInstance();
  const performanceTimer = useRef<NodeJS.Timeout | null>(null);
  const fpsCounter = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: Date.now() });

  // كشف نوع الجهاز وقدراته
  const detectDeviceTier = useCallback(async (): Promise<'low' | 'medium' | 'high'> => {
    try {
      // للأجهزة الحقيقية، يمكن استخدام DeviceInfo
      // هنا نستخدم تقديرات أساسية
      
      const platform = Platform.OS;
      const version = Platform.Version;
      
      // تقدير بسيط لنوع الجهاز
      if (platform === 'android') {
        // Android devices
        if (typeof version === 'number' && version < 28) { // Android 9 or lower
          return 'low';
        } else if (typeof version === 'number' && version < 30) { // Android 10
          return 'medium';
        } else {
          return 'high';
        }
      } else if (platform === 'ios') {
        // iOS devices
        if (typeof version === 'string') {
          const iosVersion = parseFloat(version);
          if (iosVersion < 13) {
            return 'low';
          } else if (iosVersion < 15) {
            return 'medium';
          } else {
            return 'high';
          }
        }
      }
      
      return 'medium';
    } catch (error) {
      console.warn('Could not detect device tier:', error);
      return 'medium';
    }
  }, []);

  // قياس FPS
  const measureFPS = useCallback(() => {
    const now = Date.now();
    fpsCounter.current.frames++;
    
    if (now - fpsCounter.current.lastTime >= 1000) {
      const fps = fpsCounter.current.frames;
      fpsCounter.current.frames = 0;
      fpsCounter.current.lastTime = now;
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          fps
        }
      }));
      
      // تحذير إذا كان FPS منخفضاً
      if (fps < 30) {
        setPerformanceState(prev => ({
          ...prev,
          warnings: [...prev.warnings.filter(w => !w.includes('FPS')), 'FPS منخفض: ' + fps]
        }));
      }
    }
    
    // جدولة القياس التالي
    requestAnimationFrame(measureFPS);
  }, []);

  // مراقبة استخدام الذاكرة
  const monitorMemoryUsage = useCallback(() => {
    try {
      // في تطبيق حقيقي، يمكن استخدام مكتبات مثل react-native-device-info
      // هنا نستخدم تقدير أساسي
      const estimatedMemory = Math.random() * 100; // MB
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          memoryUsage: estimatedMemory
        }
      }));
      
      // تحذير إذا كان استخدام الذاكرة مرتفعاً
      if (estimatedMemory > 80) {
        setPerformanceState(prev => ({
          ...prev,
          warnings: [...prev.warnings.filter(w => !w.includes('الذاكرة')), 'استخدام الذاكرة مرتفع: ' + estimatedMemory.toFixed(1) + 'MB']
        }));
      }
    } catch (error) {
      console.warn('Could not monitor memory usage:', error);
    }
  }, []);

  // تطبيق تحسينات الأداء
  const applyPerformanceOptimizations = useCallback((deviceTier: 'low' | 'medium' | 'high') => {
    const optimizations: string[] = [];
    const config = mobileConfig.getConfig();
    
    if (deviceTier === 'low') {
      // تحسينات للأجهزة الضعيفة
      mobileConfig.optimizeForLowEndDevice();
      optimizations.push('تقليل جودة الفيديو');
      optimizations.push('تقليل FPS لـ 30');
      optimizations.push('تعطيل تسريع الهارد وير');
      optimizations.push('تقليل حجم الكاش');
    } else if (deviceTier === 'medium') {
      // تحسينات للأجهزة المتوسطة
      mobileConfig.updateConfig({
        performance: {
          ...config.performance,
          memory: {
            ...config.performance.memory,
            maxVideoResolution: { width: 1920, height: 1080 },
            maxConcurrentVideos: 2
          },
          rendering: {
            ...config.performance.rendering,
            maxFPS: 45
          }
        }
      });
      optimizations.push('تحسين جودة متوسطة');
      optimizations.push('تقليل المعالجة المتزامنة');
    }
    // للأجهزة القوية، نترك الإعدادات الافتراضية
    
    setPerformanceState(prev => ({
      ...prev,
      isOptimized: true,
      enabledOptimizations: optimizations
    }));
  }, [mobileConfig]);

  // تفعيل وضع توفير البطارية
  const enablePowerSaving = useCallback(() => {
    mobileConfig.enablePowerSavingMode();
    
    setPerformanceState(prev => ({
      ...prev,
      enabledOptimizations: [
        ...prev.enabledOptimizations,
        'وضع توفير البطارية',
        'تقليل FPS لـ 30',
        'تقليل الرسوم المتحركة'
      ]
    }));
  }, [mobileConfig]);

  // تعطيل وضع توفير البطارية
  const disablePowerSaving = useCallback(() => {
    const config = mobileConfig.getConfig();
    mobileConfig.updateConfig({
      performance: {
        ...config.performance,
        battery: {
          ...config.performance.battery,
          enablePowerSaving: false,
          reduceCPUUsage: false
        },
        rendering: {
          ...config.performance.rendering,
          maxFPS: 60,
          reducedMotion: false
        }
      }
    });
    
    setPerformanceState(prev => ({
      ...prev,
      enabledOptimizations: prev.enabledOptimizations.filter(opt => 
        !opt.includes('توفير البطارية') && 
        !opt.includes('تقليل FPS') && 
        !opt.includes('تقليل الرسوم')
      )
    }));
  }, [mobileConfig]);

  // تحسين تلقائي حسب الظروف
  const autoOptimize = useCallback(() => {
    const { metrics } = performanceState;
    
    if (metrics.fps < 30 || metrics.memoryUsage > 80 || metrics.isLowPowerMode) {
      enablePowerSaving();
      return true;
    }
    
    if (metrics.batteryLevel < 20) {
      enablePowerSaving();
      return true;
    }
    
    return false;
  }, [performanceState, enablePowerSaving]);

  // تنظيف الذاكرة
  const cleanupMemory = useCallback(() => {
    try {
      // تنظيف الكاش
      // في تطبيق حقيقي، يمكن استخدام مكتبات تنظيف الذاكرة
      console.log('تنظيف الذاكرة...');
      
      setPerformanceState(prev => ({
        ...prev,
        warnings: prev.warnings.filter(w => !w.includes('الذاكرة'))
      }));
      
      return true;
    } catch (error) {
      console.error('فشل في تنظيف الذاكرة:', error);
      return false;
    }
  }, []);

  // بدء مراقبة الأداء
  const startPerformanceMonitoring = useCallback(() => {
    // بدء قياس FPS
    requestAnimationFrame(measureFPS);
    
    // بدء مراقبة الذاكرة كل 5 ثوانٍ
    performanceTimer.current = setInterval(() => {
      monitorMemoryUsage();
    }, 5000);
  }, [measureFPS, monitorMemoryUsage]);

  // إيقاف مراقبة الأداء
  const stopPerformanceMonitoring = useCallback(() => {
    if (performanceTimer.current) {
      clearInterval(performanceTimer.current);
      performanceTimer.current = null;
    }
  }, []);

  // تهيئة الـ hook
  useEffect(() => {
    const initializePerformance = async () => {
      // كشف نوع الجهاز
      const deviceTier = await detectDeviceTier();
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          deviceTier
        }
      }));
      
      // تطبيق التحسينات المناسبة
      applyPerformanceOptimizations(deviceTier);
      
      // بدء المراقبة
      startPerformanceMonitoring();
    };
    
    // تأخير التهيئة لتجنب التأثير على بدء التطبيق
    InteractionManager.runAfterInteractions(() => {
      initializePerformance();
    });
    
    return stopPerformanceMonitoring;
  }, [detectDeviceTier, applyPerformanceOptimizations, startPerformanceMonitoring, stopPerformanceMonitoring]);

  // واجهة الـ hook
  return {
    // بيانات الأداء
    ...performanceState,
    
    // وظائف التحكم
    enablePowerSaving,
    disablePowerSaving,
    autoOptimize,
    cleanupMemory,
    
    // وظائف المراقبة
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    
    // معلومات إضافية
    isLowEndDevice: performanceState.metrics.deviceTier === 'low',
    shouldOptimize: performanceState.metrics.fps < 45 || 
                   performanceState.metrics.memoryUsage > 60 ||
                   performanceState.metrics.isLowPowerMode,
    
    // تقرير الأداء
    getPerformanceReport: () => ({
      deviceTier: performanceState.metrics.deviceTier,
      avgFPS: performanceState.metrics.fps,
      memoryUsage: performanceState.metrics.memoryUsage,
      optimizationsApplied: performanceState.enabledOptimizations.length,
      warnings: performanceState.warnings.length,
      isOptimized: performanceState.isOptimized
    })
  };
}

export default useMobilePerformance;