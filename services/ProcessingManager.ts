/**
 * مدير المعالجة الرئيسي - Nova Edit Mobile
 * ينسق بين جميع خدمات المعالجة ويوفر واجهة موحدة
 */

import { VideoProcessingEngine } from './VideoProcessingEngine';
import { AIProcessingService } from './AIProcessingService';
import { FrameProcessingService, FrameEffect } from './FrameProcessingService';
import { VideoFile, ProcessingTask, FilterType, Timeline } from '../types/video';
import * as FileSystem from 'expo-file-system';

export interface ProcessingJob {
  id: string;
  type: 'video' | 'audio' | 'export' | 'preview';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  inputFiles: string[];
  outputPath: string;
  effects: FrameEffect[];
  options: any;
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
}

export interface ExportOptions {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4K';
  format: 'mp4' | 'mov' | 'webm';
  fps: number;
  enableAI: boolean;
  enableTransitions: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export class ProcessingManager {
  private static instance: ProcessingManager;
  private videoEngine: VideoProcessingEngine;
  private aiService: AIProcessingService;
  private frameService: FrameProcessingService;
  private processingJobs: Map<string, ProcessingJob> = new Map();
  private isInitialized = false;
  private maxConcurrentJobs = 2;
  private activeJobsCount = 0;

  private constructor() {
    this.videoEngine = VideoProcessingEngine.getInstance();
    this.aiService = AIProcessingService.getInstance();
    this.frameService = FrameProcessingService.getInstance();
  }

  public static getInstance(): ProcessingManager {
    if (!ProcessingManager.instance) {
      ProcessingManager.instance = new ProcessingManager();
    }
    return ProcessingManager.instance;
  }

  /**
   * تهيئة مدير المعالجة
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Processing Manager...');

      // تهيئة جميع الخدمات
      await Promise.all([
        this.aiService.initialize(),
        this.frameService.initialize()
      ]);

      // إنشاء مجلدات العمل
      await this.createWorkDirectories();

      this.isInitialized = true;
      console.log('Processing Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Processing Manager:', error);
      throw error;
    }
  }

  /**
   * تصدير فيديو مع تطبيق جميع التأثيرات
   */
  public async exportVideo(
    timeline: Timeline,
    outputPath: string,
    options: ExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const jobId = this.generateJobId();
    
    try {
      // إنشاء مهمة معالجة جديدة
      const job: ProcessingJob = {
        id: jobId,
        type: 'export',
        status: 'pending',
        progress: 0,
        inputFiles: timeline.tracks.flatMap(track => 
          track.clips.map(clip => clip.videoFileId)
        ),
        outputPath,
        effects: this.convertTimelineToEffects(timeline),
        options,
        startTime: new Date()
      };

      this.processingJobs.set(jobId, job);

      // تحديث حالة المهمة
      this.updateJobStatus(jobId, 'processing');

      // معالجة كل مسار على حدة
      const processedTracks: string[] = [];
      const totalTracks = timeline.tracks.filter(track => track.clips.length > 0).length;
      let processedTracksCount = 0;

      for (const track of timeline.tracks) {
        if (track.clips.length === 0) continue;

        const trackOutput = await this.processTrack(track, options, (trackProgress) => {
          const overallProgress = ((processedTracksCount + (trackProgress / 100)) / totalTracks) * 80;
          this.updateJobProgress(jobId, overallProgress);
          if (onProgress) onProgress(overallProgress);
        });

        processedTracks.push(trackOutput);
        processedTracksCount++;
      }

      // دمج جميع المسارات
      this.updateJobProgress(jobId, 85);
      if (onProgress) onProgress(85);

      const mergedOutput = await this.mergeTracks(processedTracks, outputPath, options);

      // تطبيق التأثيرات النهائية
      this.updateJobProgress(jobId, 95);
      if (onProgress) onProgress(95);

      const finalOutput = await this.applyFinalEffects(mergedOutput, options);

      // اكتمال المهمة
      this.updateJobStatus(jobId, 'completed');
      this.updateJobProgress(jobId, 100);
      if (onProgress) onProgress(100);

      return finalOutput;
    } catch (error) {
      console.error('Export failed:', error);
      this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * إنشاء معاينة سريعة
   */
  public async generatePreview(
    clipPath: string,
    startTime: number,
    duration: number = 5,
    effects: FrameEffect[] = []
  ): Promise<string> {
    const jobId = this.generateJobId();

    try {
      const job: ProcessingJob = {
        id: jobId,
        type: 'preview',
        status: 'processing',
        progress: 0,
        inputFiles: [clipPath],
        outputPath: '',
        effects,
        options: { quality: 'medium' },
        startTime: new Date()
      };

      this.processingJobs.set(jobId, job);

      // إنشاء معاينة أساسية
      const previewPath = await this.videoEngine.generatePreview(
        clipPath,
        startTime,
        duration,
        'medium'
      );

      this.updateJobProgress(jobId, 50);

      // تطبيق التأثيرات إذا وجدت
      if (effects.length > 0) {
        const enhancedPreview = await this.frameService.processVideo(
          previewPath,
          previewPath.replace('.mp4', '_enhanced.mp4'),
          effects,
          {
            enableAI: true,
            enableFilters: true,
            enableTransitions: false,
            quality: 'medium',
            maxFPS: 30,
            realTime: false
          }
        );

        if (enhancedPreview) {
          // حذف الملف الأصلي
          await FileSystem.deleteAsync(previewPath, { idempotent: true });
          this.updateJobStatus(jobId, 'completed');
          this.updateJobProgress(jobId, 100);
          return previewPath.replace('.mp4', '_enhanced.mp4');
        }
      }

      this.updateJobStatus(jobId, 'completed');
      this.updateJobProgress(jobId, 100);
      return previewPath;
    } catch (error) {
      console.error('Preview generation failed:', error);
      this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * تطبيق فلتر على مقطع فيديو
   */
  public async applyFilter(
    inputPath: string,
    outputPath: string,
    filterType: FilterType,
    intensity: number = 0.5
  ): Promise<boolean> {
    const jobId = this.generateJobId();

    try {
      const job: ProcessingJob = {
        id: jobId,
        type: 'video',
        status: 'processing',
        progress: 0,
        inputFiles: [inputPath],
        outputPath,
        effects: [{
          id: this.generateJobId(),
          type: 'filter',
          enabled: true,
          parameters: { filterType },
          intensity
        }],
        options: {},
        startTime: new Date()
      };

      this.processingJobs.set(jobId, job);

      const success = await this.videoEngine.applyFilter(
        inputPath,
        outputPath,
        { type: filterType, intensity, parameters: {} }
      );

      this.updateJobStatus(jobId, success ? 'completed' : 'failed');
      this.updateJobProgress(jobId, 100);

      return success;
    } catch (error) {
      console.error('Filter application failed:', error);
      this.updateJobStatus(jobId, 'failed', error.message);
      return false;
    }
  }

  /**
   * ضغط فيديو
   */
  public async compressVideo(
    inputPath: string,
    outputPath: string,
    options: ExportOptions
  ): Promise<boolean> {
    const jobId = this.generateJobId();

    try {
      const job: ProcessingJob = {
        id: jobId,
        type: 'video',
        status: 'processing',
        progress: 0,
        inputFiles: [inputPath],
        outputPath,
        effects: [],
        options,
        startTime: new Date()
      };

      this.processingJobs.set(jobId, job);

      const success = await this.videoEngine.compressVideo(
        inputPath,
        outputPath,
        {
          quality: options.quality,
          resolution: options.resolution,
          fps: options.fps,
          codec: 'h264'
        }
      );

      this.updateJobStatus(jobId, success ? 'completed' : 'failed');
      this.updateJobProgress(jobId, 100);

      return success;
    } catch (error) {
      console.error('Video compression failed:', error);
      this.updateJobStatus(jobId, 'failed', error.message);
      return false;
    }
  }

  /**
   * دمج عدة مقاطع فيديو
   */
  public async mergeVideos(
    inputPaths: string[],
    outputPath: string,
    transitions?: any[]
  ): Promise<boolean> {
    const jobId = this.generateJobId();

    try {
      const job: ProcessingJob = {
        id: jobId,
        type: 'video',
        status: 'processing',
        progress: 0,
        inputFiles: inputPaths,
        outputPath,
        effects: [],
        options: { transitions },
        startTime: new Date()
      };

      this.processingJobs.set(jobId, job);

      const success = await this.videoEngine.mergeVideos(
        inputPaths,
        outputPath,
        transitions
      );

      this.updateJobStatus(jobId, success ? 'completed' : 'failed');
      this.updateJobProgress(jobId, 100);

      return success;
    } catch (error) {
      console.error('Video merging failed:', error);
      this.updateJobStatus(jobId, 'failed', error.message);
      return false;
    }
  }

  /**
   * إلغاء مهمة معالجة
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = this.processingJobs.get(jobId);
      if (!job) return false;

      // إلغاء العمليات الجارية
      await this.videoEngine.cancelAllOperations();
      
      this.updateJobStatus(jobId, 'cancelled');
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);

      return true;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  /**
   * الحصول على حالة مهمة
   */
  public getJobStatus(jobId: string): ProcessingJob | null {
    return this.processingJobs.get(jobId) || null;
  }

  /**
   * الحصول على جميع المهام
   */
  public getAllJobs(): ProcessingJob[] {
    return Array.from(this.processingJobs.values());
  }

  /**
   * تنظيف المهام المكتملة القديمة
   */
  public cleanupCompletedJobs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    for (const [jobId, job] of this.processingJobs) {
      if (job.status === 'completed' && job.endTime && job.endTime < cutoffTime) {
        this.processingJobs.delete(jobId);
      }
    }
  }

  // وظائف مساعدة خاصة

  private async createWorkDirectories(): Promise<void> {
    const directories = [
      'exports',
      'previews',
      'temp_processing',
      'compressed_videos'
    ];

    for (const dir of directories) {
      const dirPath = `${FileSystem.documentDirectory}${dir}/`;
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateJobStatus(
    jobId: string, 
    status: ProcessingJob['status'], 
    errorMessage?: string
  ): void {
    const job = this.processingJobs.get(jobId);
    if (job) {
      job.status = status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        job.endTime = new Date();
        this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      }
      if (errorMessage) {
        job.errorMessage = errorMessage;
      }
    }
  }

  private updateJobProgress(jobId: string, progress: number): void {
    const job = this.processingJobs.get(jobId);
    if (job) {
      job.progress = Math.min(100, Math.max(0, progress));
    }
  }

  private convertTimelineToEffects(timeline: Timeline): FrameEffect[] {
    const effects: FrameEffect[] = [];
    
    timeline.tracks.forEach(track => {
      track.clips.forEach(clip => {
        // تحويل فلاتر المقطع إلى تأثيرات إطارات
        clip.filters.forEach(filter => {
          effects.push({
            id: filter.id,
            type: 'filter',
            enabled: true,
            parameters: { filterType: filter.type, ...filter.parameters },
            intensity: filter.intensity,
            startTime: clip.position,
            endTime: clip.position + clip.duration
          });
        });
      });
    });

    return effects;
  }

  private async processTrack(
    track: any,
    options: ExportOptions,
    onProgress: (progress: number) => void
  ): Promise<string> {
    // معالجة مسار واحد
    const outputPath = `${FileSystem.documentDirectory}temp_processing/track_${track.id}_${Date.now()}.mp4`;
    
    if (track.clips.length === 1) {
      // مقطع واحد - تطبيق التأثيرات مباشرة
      const clip = track.clips[0];
      // تنفيذ معالجة المقطع
      onProgress(100);
      return outputPath;
    } else {
      // عدة مقاطع - دمج أولاً ثم تطبيق التأثيرات
      const clipPaths = track.clips.map((clip: any) => clip.videoFileId);
      await this.videoEngine.mergeVideos(clipPaths, outputPath);
      onProgress(100);
      return outputPath;
    }
  }

  private async mergeTracks(
    trackPaths: string[],
    outputPath: string,
    options: ExportOptions
  ): Promise<string> {
    if (trackPaths.length === 1) {
      return trackPaths[0];
    }

    const mergedPath = `${FileSystem.documentDirectory}temp_processing/merged_${Date.now()}.mp4`;
    await this.videoEngine.mergeVideos(trackPaths, mergedPath);
    return mergedPath;
  }

  private async applyFinalEffects(
    inputPath: string,
    options: ExportOptions
  ): Promise<string> {
    // تطبيق التأثيرات النهائية والضغط
    const finalPath = `${FileSystem.documentDirectory}exports/final_${Date.now()}.${options.format}`;
    
    await this.videoEngine.compressVideo(inputPath, finalPath, {
      quality: options.quality,
      resolution: options.resolution,
      fps: options.fps,
      codec: 'h264'
    });

    return finalPath;
  }

  /**
   * إحصائيات الأداء
   */
  public getPerformanceStats(): any {
    return {
      isInitialized: this.isInitialized,
      activeJobs: this.activeJobsCount,
      totalJobs: this.processingJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      completedJobs: Array.from(this.processingJobs.values()).filter(job => job.status === 'completed').length,
      failedJobs: Array.from(this.processingJobs.values()).filter(job => job.status === 'failed').length,
      frameServiceStats: this.frameService.getPerformanceStats()
    };
  }

  /**
   * تنظيف شامل للموارد
   */
  public async cleanup(): Promise<void> {
    try {
      // إلغاء جميع المهام النشطة
      for (const [jobId, job] of this.processingJobs) {
        if (job.status === 'processing') {
          await this.cancelJob(jobId);
        }
      }

      // تنظيف الخدمات
      await this.frameService.cleanup();
      this.aiService.dispose();

      // تنظيف الملفات المؤقتة
      const tempDirs = ['temp_processing', 'previews'];
      for (const dir of tempDirs) {
        const dirPath = `${FileSystem.documentDirectory}${dir}/`;
        await FileSystem.deleteAsync(dirPath, { idempotent: true });
      }

      this.processingJobs.clear();
      this.activeJobsCount = 0;
      this.isInitialized = false;

      console.log('Processing Manager cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export default ProcessingManager;