/**
 * React Hook للمعالجة المتقدمة - Nova Edit Mobile
 * يوفر واجهة سهلة لاستخدام جميع خدمات المعالجة
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ProcessingManager, { ProcessingJob, ExportOptions } from '../services/ProcessingManager';
import { FrameEffect } from '../services/FrameProcessingService';
import { FilterType, Timeline } from '../types/video';
import ProcessingConfigManager from '../config/ProcessingConfig';

export interface ProcessingState {
  isInitialized: boolean;
  isProcessing: boolean;
  currentJobs: ProcessingJob[];
  progress: number;
  error: string | null;
  performanceStats: any;
}

export interface ProcessingControls {
  // تهيئة
  initialize: () => Promise<void>;
  
  // معالجة الفيديو
  exportVideo: (
    timeline: Timeline,
    outputPath: string,
    options: ExportOptions
  ) => Promise<string>;
  
  applyFilter: (
    inputPath: string,
    outputPath: string,
    filterType: FilterType,
    intensity?: number
  ) => Promise<boolean>;
  
  compressVideo: (
    inputPath: string,
    outputPath: string,
    options: ExportOptions
  ) => Promise<boolean>;
  
  mergeVideos: (
    inputPaths: string[],
    outputPath: string,
    transitions?: any[]
  ) => Promise<boolean>;
  
  // معاينة
  generatePreview: (
    clipPath: string,
    startTime: number,
    duration?: number,
    effects?: FrameEffect[]
  ) => Promise<string>;
  
  // إدارة المهام
  cancelJob: (jobId: string) => Promise<boolean>;
  getJobStatus: (jobId: string) => ProcessingJob | null;
  
  // تنظيف
  cleanup: () => Promise<void>;
  
  // إعدادات
  updateConfig: (config: any) => void;
  resetConfig: () => void;
}

export function useVideoProcessing(): [ProcessingState, ProcessingControls] {
  const [state, setState] = useState<ProcessingState>({
    isInitialized: false,
    isProcessing: false,
    currentJobs: [],
    progress: 0,
    error: null,
    performanceStats: null
  });

  const processingManager = useRef<ProcessingManager>();
  const configManager = useRef<ProcessingConfigManager>();
  const jobsUpdateInterval = useRef<NodeJS.Timeout>();
  const performanceUpdateInterval = useRef<NodeJS.Timeout>();

  // تهيئة المدراء
  useEffect(() => {
    processingManager.current = ProcessingManager.getInstance();
    configManager.current = ProcessingConfigManager.getInstance();
    
    return () => {
      if (jobsUpdateInterval.current) {
        clearInterval(jobsUpdateInterval.current);
      }
      if (performanceUpdateInterval.current) {
        clearInterval(performanceUpdateInterval.current);
      }
    };
  }, []);

  // تحديث دوري لحالة المهام
  const startJobsMonitoring = useCallback(() => {
    if (jobsUpdateInterval.current) {
      clearInterval(jobsUpdateInterval.current);
    }

    jobsUpdateInterval.current = setInterval(() => {
      if (processingManager.current) {
        const jobs = processingManager.current.getAllJobs();
        const activeJobs = jobs.filter(job => job.status === 'processing');
        const isProcessing = activeJobs.length > 0;
        
        // حساب متوسط التقدم للمهام النشطة
        const totalProgress = activeJobs.reduce((sum, job) => sum + job.progress, 0);
        const averageProgress = activeJobs.length > 0 ? totalProgress / activeJobs.length : 0;

        setState(prev => ({
          ...prev,
          currentJobs: jobs,
          isProcessing,
          progress: averageProgress
        }));
      }
    }, 1000); // تحديث كل ثانية
  }, []);

  // تحديث دوري لإحصائيات الأداء
  const startPerformanceMonitoring = useCallback(() => {
    if (performanceUpdateInterval.current) {
      clearInterval(performanceUpdateInterval.current);
    }

    performanceUpdateInterval.current = setInterval(() => {
      if (processingManager.current) {
        const stats = processingManager.current.getPerformanceStats();
        setState(prev => ({
          ...prev,
          performanceStats: stats
        }));
      }
    }, 5000); // تحديث كل 5 ثوانٍ
  }, []);

  // تهيئة خدمات المعالجة
  const initialize = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!processingManager.current) {
        throw new Error('Processing manager not available');
      }

      await processingManager.current.initialize();
      
      setState(prev => ({ ...prev, isInitialized: true }));
      
      // بدء المراقبة
      startJobsMonitoring();
      startPerformanceMonitoring();
      
      console.log('Video processing hook initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isInitialized: false 
      }));
      console.error('Video processing initialization failed:', error);
    }
  }, [startJobsMonitoring, startPerformanceMonitoring]);

  // تصدير فيديو
  const exportVideo = useCallback(async (
    timeline: Timeline,
    outputPath: string,
    options: ExportOptions
  ): Promise<string> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!processingManager.current) {
        throw new Error('Processing manager not initialized');
      }

      const result = await processingManager.current.exportVideo(
        timeline,
        outputPath,
        options,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      );

      setState(prev => ({ ...prev, progress: 0 }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setState(prev => ({ ...prev, error: errorMessage, progress: 0 }));
      throw error;
    }
  }, []);

  // تطبيق فلتر
  const applyFilter = useCallback(async (
    inputPath: string,
    outputPath: string,
    filterType: FilterType,
    intensity: number = 0.5
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!processingManager.current) {
        throw new Error('Processing manager not initialized');
      }

      return await processingManager.current.applyFilter(
        inputPath,
        outputPath,
        filterType,
        intensity
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Filter application failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  // ضغط فيديو
  const compressVideo = useCallback(async (
    inputPath: string,
    outputPath: string,
    options: ExportOptions
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!processingManager.current) {
        throw new Error('Processing manager not initialized');
      }

      return await processingManager.current.compressVideo(
        inputPath,
        outputPath,
        options
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  // دمج فيديوهات
  const mergeVideos = useCallback(async (
    inputPaths: string[],
    outputPath: string,
    transitions?: any[]
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!processingManager.current) {
        throw new Error('Processing manager not initialized');
      }

      return await processingManager.current.mergeVideos(
        inputPaths,
        outputPath,
        transitions
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Merge failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  // إنشاء معاينة
  const generatePreview = useCallback(async (
    clipPath: string,
    startTime: number,
    duration: number = 5,
    effects: FrameEffect[] = []
  ): Promise<string> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!processingManager.current) {
        throw new Error('Processing manager not initialized');
      }

      return await processingManager.current.generatePreview(
        clipPath,
        startTime,
        duration,
        effects
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Preview generation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // إلغاء مهمة
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      if (!processingManager.current) {
        return false;
      }

      const result = await processingManager.current.cancelJob(jobId);
      
      // تحديث قائمة المهام فوراً
      const jobs = processingManager.current.getAllJobs();
      setState(prev => ({ ...prev, currentJobs: jobs }));
      
      return result;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }, []);

  // الحصول على حالة مهمة
  const getJobStatus = useCallback((jobId: string): ProcessingJob | null => {
    if (!processingManager.current) {
      return null;
    }

    return processingManager.current.getJobStatus(jobId);
  }, []);

  // تحديث إعدادات
  const updateConfig = useCallback((config: any): void => {
    if (configManager.current) {
      configManager.current.updateConfig(config);
    }
  }, []);

  // إعادة تعيين إعدادات
  const resetConfig = useCallback((): void => {
    if (configManager.current) {
      configManager.current.resetToDefaults();
    }
  }, []);

  // تنظيف الموارد
  const cleanup = useCallback(async (): Promise<void> => {
    try {
      // إيقاف المراقبة
      if (jobsUpdateInterval.current) {
        clearInterval(jobsUpdateInterval.current);
      }
      if (performanceUpdateInterval.current) {
        clearInterval(performanceUpdateInterval.current);
      }

      // تنظيف مدير المعالجة
      if (processingManager.current) {
        await processingManager.current.cleanup();
      }

      setState({
        isInitialized: false,
        isProcessing: false,
        currentJobs: [],
        progress: 0,
        error: null,
        performanceStats: null
      });

      console.log('Video processing hook cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }, []);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const controls: ProcessingControls = {
    initialize,
    exportVideo,
    applyFilter,
    compressVideo,
    mergeVideos,
    generatePreview,
    cancelJob,
    getJobStatus,
    cleanup,
    updateConfig,
    resetConfig
  };

  return [state, controls];
}

// Hook مبسط للمعاينة السريعة
export function useQuickPreview() {
  const [state, controls] = useVideoProcessing();
  
  const generateQuickPreview = useCallback(async (
    clipPath: string,
    startTime: number = 0,
    duration: number = 3
  ): Promise<string | null> => {
    try {
      if (!state.isInitialized) {
        await controls.initialize();
      }
      
      return await controls.generatePreview(clipPath, startTime, duration);
    } catch (error) {
      console.error('Quick preview failed:', error);
      return null;
    }
  }, [state.isInitialized, controls]);

  return {
    generatePreview: generateQuickPreview,
    isProcessing: state.isProcessing,
    error: state.error
  };
}

// Hook للفلاتر السريعة
export function useQuickFilters() {
  const [state, controls] = useVideoProcessing();
  
  const applyQuickFilter = useCallback(async (
    inputPath: string,
    filterType: FilterType,
    intensity: number = 0.5
  ): Promise<string | null> => {
    try {
      if (!state.isInitialized) {
        await controls.initialize();
      }
      
      const timestamp = Date.now();
      const outputPath = `${inputPath.replace(/\.[^/.]+$/, '')}_filtered_${timestamp}.mp4`;
      
      const success = await controls.applyFilter(
        inputPath,
        outputPath,
        filterType,
        intensity
      );
      
      return success ? outputPath : null;
    } catch (error) {
      console.error('Quick filter failed:', error);
      return null;
    }
  }, [state.isInitialized, controls]);

  return {
    applyFilter: applyQuickFilter,
    isProcessing: state.isProcessing,
    error: state.error
  };
}

// Hook لإحصائيات الأداء
export function useProcessingStats() {
  const [state] = useVideoProcessing();
  
  return {
    stats: state.performanceStats,
    activeJobs: state.currentJobs.filter(job => job.status === 'processing'),
    completedJobs: state.currentJobs.filter(job => job.status === 'completed'),
    failedJobs: state.currentJobs.filter(job => job.status === 'failed'),
    totalJobs: state.currentJobs.length
  };
}

export default useVideoProcessing;