/**
 * Mobile Performance Hook
 * Hook مخصص لإدارة وتحسين الأداء على الأجهزة المحمولة
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, DeviceInfo, InteractionManager } from 'react-native'; // DeviceInfo is not directly used, consider removing if not planned
import { MobileConfigManager } from '../config/MobileConfig';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // MB
  cpuUsage: number; // Percentage
  batteryLevel: number; // 0-100
  isLowPowerMode: boolean;
  networkType: string; // e.g., 'wifi', 'cellular', 'none'
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
      networkType: 'unknown', // Default to unknown
      deviceTier: 'medium'
    },
    isOptimized: false,
    enabledOptimizations: [],
    warnings: []
  });

  const mobileConfig = useRef(MobileConfigManager.getInstance()).current; // Use ref for singleton instance
  const performanceTimer = useRef<NodeJS.Timeout | null>(null);
  const fpsCounter = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: Date.now() });

  const detectDeviceTier = useCallback(async (): Promise<'low' | 'medium' | 'high'> => {
    try {
      const platform = Platform.OS;
      const version = Platform.Version;
      
      if (platform === 'android') {
        if (typeof version === 'number' && version < 28) return 'low';
        if (typeof version === 'number' && version < 30) return 'medium';
        return 'high';
      } else if (platform === 'ios') {
        if (typeof version === 'string') {
          const iosVersion = parseFloat(version);
          if (iosVersion < 13) return 'low';
          if (iosVersion < 15) return 'medium';
          return 'high';
        }
      }
      return 'medium';
    } catch (error) {
      console.warn('Could not detect device tier:', error);
      return 'medium';
    }
  }, []);

  const measureFPS = useCallback(() => {
    const now = Date.now();
    fpsCounter.current.frames++;
    
    if (now - fpsCounter.current.lastTime >= 1000) {
      const fps = fpsCounter.current.frames;
      fpsCounter.current.frames = 0;
      fpsCounter.current.lastTime = now;
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, fps }
      }));
      
      if (fps < 30 && !prev.warnings.some(w => w.startsWith('FPS منخفض'))) { // Avoid duplicate warnings
        setPerformanceState(prev => ({
          ...prev,
          warnings: [...prev.warnings, `FPS منخفض: ${fps}`]
        }));
      } else if (fps >= 30) {
         setPerformanceState(prev => ({
          ...prev,
          warnings: prev.warnings.filter(w => !w.startsWith('FPS منخفض'))
        }));
      }
    }
    requestAnimationFrame(measureFPS);
  }, []);

  const monitorMemoryUsage = useCallback(() => {
    try {
      // This is a placeholder. Real memory usage monitoring in React Native is complex
      // and often requires native modules or specific libraries.
      const estimatedMemory = Math.random() * 100 + 50; // Simulated: 50-150MB
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, memoryUsage: estimatedMemory }
      }));
      
      if (estimatedMemory > 120 && !prev.warnings.some(w => w.startsWith('استخدام الذاكرة مرتفع'))) { // Example threshold
         setPerformanceState(prev => ({
          ...prev,
          warnings: [...prev.warnings, `استخدام الذاكرة مرتفع: ${estimatedMemory.toFixed(1)}MB`]
        }));
      } else if (estimatedMemory <= 120) {
         setPerformanceState(prev => ({
          ...prev,
          warnings: prev.warnings.filter(w => !w.startsWith('استخدام الذاكرة مرتفع'))
        }));
      }
    } catch (error) {
      console.warn('Could not monitor memory usage:', error);
    }
  }, []);

  const applyPerformanceOptimizations = useCallback((deviceTier: 'low' | 'medium' | 'high') => {
    const optimizations: string[] = [];
    const config = mobileConfig.getConfig(); // Get current config before updating
    
    if (deviceTier === 'low') {
      mobileConfig.optimizeForLowEndDevice();
      optimizations.push('تقليل جودة الفيديو الافتراضية');
      optimizations.push('تعطيل بعض التأثيرات المكلفة');
    } else if (deviceTier === 'medium') {
      mobileConfig.updateConfig({
        performance: {
          ...config.performance, // Spread existing performance config
          memory: { ...config.performance.memory, maxVideoResolution: { width: 1920, height: 1080 } },
          rendering: { ...config.performance.rendering, maxFPS: 45 }
        }
      });
      optimizations.push('تحسين جودة متوسطة وعالية الأداء');
    }
    
    setPerformanceState(prev => ({
      ...prev,
      isOptimized: optimizations.length > 0,
      enabledOptimizations: optimizations
    }));
  }, [mobileConfig]);

  const enablePowerSaving = useCallback(() => {
    mobileConfig.enablePowerSavingMode();
    setPerformanceState(prev => ({
      ...prev,
      enabledOptimizations: Array.from(new Set([...prev.enabledOptimizations, 'وضع توفير البطارية'])) // Ensure unique
    }));
  }, [mobileConfig]);

  const disablePowerSaving = useCallback(() => {
    const config = mobileConfig.getConfig();
    mobileConfig.updateConfig({
      performance: {
        ...config.performance,
        battery: { ...config.performance.battery, enablePowerSaving: false, reduceCPUUsage: false },
        rendering: { ...config.performance.rendering, maxFPS: 60, reducedMotion: false }
      }
    });
    setPerformanceState(prev => ({
      ...prev,
      enabledOptimizations: prev.enabledOptimizations.filter(opt => opt !== 'وضع توفير البطارية')
    }));
  }, [mobileConfig]);

  const autoOptimize = useCallback(() => {
    const { metrics } = performanceState;
    if (metrics.fps < 30 || metrics.memoryUsage > 120 || metrics.isLowPowerMode || metrics.batteryLevel < 20) {
      if (!performanceState.enabledOptimizations.includes('وضع توفير البطارية')) {
        enablePowerSaving();
      }
      return true;
    }
    return false;
  }, [performanceState, enablePowerSaving]);

  const cleanupMemory = useCallback(() => {
    try {
      // console.log('تنظيف الذاكرة...'); // Removed for production
      // Actual memory cleanup logic would be platform-specific or library-dependent
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

  const startPerformanceMonitoring = useCallback(() => {
    requestAnimationFrame(measureFPS);
    if (performanceTimer.current) clearInterval(performanceTimer.current); // Clear existing timer
    performanceTimer.current = setInterval(monitorMemoryUsage, 5000);
  }, [measureFPS, monitorMemoryUsage]);

  const stopPerformanceMonitoring = useCallback(() => {
    // To stop requestAnimationFrame, you'd typically use cancelAnimationFrame with the ID,
    // but since measureFPS calls itself, we can just not start it again.
    // For simplicity, we'll just clear the interval here.
    if (performanceTimer.current) {
      clearInterval(performanceTimer.current);
      performanceTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const tier = await detectDeviceTier();
      setPerformanceState(prev => ({ ...prev, metrics: { ...prev.metrics, deviceTier: tier } }));
      applyPerformanceOptimizations(tier);
      startPerformanceMonitoring();
    };
    
    const task = InteractionManager.runAfterInteractions(() => {
      initialize();
    });
    
    return () => {
      stopPerformanceMonitoring();
      if (task) task.cancel();
    };
  }, [detectDeviceTier, applyPerformanceOptimizations, startPerformanceMonitoring, stopPerformanceMonitoring]);

  return {
    ...performanceState,
    enablePowerSaving,
    disablePowerSaving,
    autoOptimize,
    cleanupMemory,
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    isLowEndDevice: performanceState.metrics.deviceTier === 'low',
    shouldOptimize: performanceState.metrics.fps < 45 || 
                   performanceState.metrics.memoryUsage > 100 || // Adjusted threshold
                   performanceState.metrics.isLowPowerMode,
    getPerformanceReport: () => ({
      deviceTier: performanceState.metrics.deviceTier,
      avgFPS: performanceState.metrics.fps, // This is current FPS, not avg. Consider calculating avg.
      memoryUsage: performanceState.metrics.memoryUsage,
      optimizationsApplied: performanceState.enabledOptimizations.length,
      warnings: performanceState.warnings.length,
      isOptimized: performanceState.isOptimized
    })
  };
}

export default useMobilePerformance;