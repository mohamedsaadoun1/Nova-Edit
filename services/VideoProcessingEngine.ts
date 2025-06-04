/**
 * محرك معالجة الفيديو الأساسي - Nova Edit Mobile
 * يستخدم FFmpegKit للمعالجة المتقدمة والترميز
 */

import { FFmpegKit, FFmpegKitConfig, ReturnCode, Session } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { VideoFile, FilterType, ProcessingTask } from '../types/video';

export interface ProcessingOptions {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  bitrate?: number;
  codec: 'h264' | 'h265' | 'vp9';
}

export interface FilterOptions {
  type: FilterType;
  intensity: number;
  parameters: { [key: string]: any };
}

export interface TransitionOptions {
  type: 'fade' | 'dissolve' | 'slide' | 'wipe' | 'zoom';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export class VideoProcessingEngine {
  private static instance: VideoProcessingEngine;
  private processingQueue: ProcessingTask[] = [];
  private isProcessing = false;

  private constructor() {
    this.initializeFFmpeg();
  }

  public static getInstance(): VideoProcessingEngine {
    if (!VideoProcessingEngine.instance) {
      VideoProcessingEngine.instance = new VideoProcessingEngine();
    }
    return VideoProcessingEngine.instance;
  }

  private async initializeFFmpeg(): Promise<void> {
    // تهيئة إعدادات FFmpeg
    await FFmpegKitConfig.enableLogCallback((log) => {
      console.log(`FFmpeg: ${log.getMessage()}`);
    });

    await FFmpegKitConfig.enableStatisticsCallback((statistics) => {
      const progress = statistics.getTime() / 1000; // في الثواني
      console.log(`FFmpeg Progress: ${progress}s`);
    });

    // تعيين مستوى السجلات
    await FFmpegKitConfig.setLogLevel(20); // INFO level
  }

  /**
   * تطبيق فلتر على مقطع فيديو
   */
  public async applyFilter(
    inputPath: string,
    outputPath: string,
    filter: FilterOptions,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const filterCommand = this.buildFilterCommand(filter);
      const command = `-i "${inputPath}" -vf "${filterCommand}" -c:a copy "${outputPath}"`;

      console.log(`Applying filter: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Filter application failed:', error);
      return false;
    }
  }

  /**
   * تطبيق انتقال بين مقطعين
   */
  public async applyTransition(
    input1Path: string,
    input2Path: string,
    outputPath: string,
    transition: TransitionOptions,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const transitionFilter = this.buildTransitionFilter(transition);
      const command = `-i "${input1Path}" -i "${input2Path}" -filter_complex "${transitionFilter}" "${outputPath}"`;

      console.log(`Applying transition: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Transition application failed:', error);
      return false;
    }
  }

  /**
   * تقليم مقطع فيديو
   */
  public async trimVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    options?: ProcessingOptions
  ): Promise<boolean> {
    try {
      const qualityParams = this.buildQualityParameters(options);
      const command = `-i "${inputPath}" -ss ${startTime} -t ${duration} ${qualityParams} "${outputPath}"`;

      console.log(`Trimming video: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Video trimming failed:', error);
      return false;
    }
  }

  /**
   * ضغط الفيديو
   */
  public async compressVideo(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const command = this.buildCompressionCommand(inputPath, outputPath, options);

      console.log(`Compressing video: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Video compression failed:', error);
      return false;
    }
  }

  /**
   * دمج عدة مقاطع فيديو
   */
  public async mergeVideos(
    inputPaths: string[],
    outputPath: string,
    transitions?: TransitionOptions[],
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      if (inputPaths.length < 2) {
        throw new Error('At least 2 videos required for merging');
      }

      let command: string;

      if (transitions && transitions.length > 0) {
        // دمج مع انتقالات
        command = this.buildMergeWithTransitionsCommand(inputPaths, outputPath, transitions);
      } else {
        // دمج بسيط
        const inputList = inputPaths.map(path => `-i "${path}"`).join(' ');
        const filterComplex = this.buildSimpleMergeFilter(inputPaths.length);
        command = `${inputList} -filter_complex "${filterComplex}" "${outputPath}"`;
      }

      console.log(`Merging videos: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Video merging failed:', error);
      return false;
    }
  }

  /**
   * استخراج الصوت من فيديو
   */
  public async extractAudio(
    inputPath: string,
    outputPath: string,
    format: 'mp3' | 'aac' | 'wav' = 'mp3'
  ): Promise<boolean> {
    try {
      const codecMap = {
        mp3: 'libmp3lame',
        aac: 'aac',
        wav: 'pcm_s16le'
      };

      const codec = codecMap[format];
      const command = `-i "${inputPath}" -vn -acodec ${codec} "${outputPath}"`;

      console.log(`Extracting audio: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Audio extraction failed:', error);
      return false;
    }
  }

  /**
   * إضافة الصوت لفيديو
   */
  public async addAudioToVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    volume: number = 1.0
  ): Promise<boolean> {
    try {
      const command = `-i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -filter:a "volume=${volume}" "${outputPath}"`;

      console.log(`Adding audio to video: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Adding audio failed:', error);
      return false;
    }
  }

  /**
   * تغيير سرعة الفيديو
   */
  public async changeVideoSpeed(
    inputPath: string,
    outputPath: string,
    speed: number,
    maintainAudio: boolean = true
  ): Promise<boolean> {
    try {
      let command: string;

      if (maintainAudio) {
        // تغيير سرعة الفيديو والصوت معاً
        command = `-i "${inputPath}" -filter_complex "[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]" -map "[v]" -map "[a]" "${outputPath}"`;
      } else {
        // تغيير سرعة الفيديو فقط
        command = `-i "${inputPath}" -filter:v "setpts=${1/speed}*PTS" -an "${outputPath}"`;
      }

      console.log(`Changing video speed: ${command}`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('Speed change failed:', error);
      return false;
    }
  }

  /**
   * إنشاء مقطع فيديو مؤقت للمعاينة
   */
  public async generatePreview(
    inputPath: string,
    startTime: number,
    duration: number = 5,
    quality: 'low' | 'medium' = 'medium'
  ): Promise<string> {
    try {
      const outputDir = `${FileSystem.documentDirectory}previews/`;
      await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
      
      const outputPath = `${outputDir}preview_${Date.now()}.mp4`;
      const scale = quality === 'low' ? 'scale=480:270' : 'scale=854:480';
      
      const command = `-i "${inputPath}" -ss ${startTime} -t ${duration} -vf "${scale}" -c:v libx264 -preset fast -crf 28 "${outputPath}"`;

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
      } else {
        throw new Error('Preview generation failed');
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw error;
    }
  }

  // وظائف مساعدة لبناء الأوامر

  private buildFilterCommand(filter: FilterOptions): string {
    const { type, intensity, parameters } = filter;

    switch (type) {
      case FilterType.BRIGHTNESS:
        return `eq=brightness=${intensity - 0.5}`;
      
      case FilterType.CONTRAST:
        return `eq=contrast=${intensity + 0.5}`;
      
      case FilterType.SATURATION:
        return `eq=saturation=${intensity + 0.5}`;
      
      case FilterType.BLUR:
        const radius = Math.max(1, intensity * 10);
        return `boxblur=${radius}:${radius}`;
      
      case FilterType.SEPIA:
        return `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
      
      case FilterType.VINTAGE:
        return `curves=vintage`;
      
      case FilterType.NOIR:
        return `hue=s=0`;
      
      case FilterType.VIBRANT:
        return `eq=saturation=${1 + intensity}:contrast=${1 + intensity * 0.3}`;
      
      case FilterType.WARM:
        return `colortemperature=temperature=${3200 + intensity * 2000}`;
      
      case FilterType.COOL:
        return `colortemperature=temperature=${6500 + intensity * 2000}`;
      
      case FilterType.FADE:
        return `fade=in:0:30`;
      
      default:
        return '';
    }
  }

  private buildTransitionFilter(transition: TransitionOptions): string {
    const { type, duration, direction, easing } = transition;

    switch (type) {
      case 'fade':
        return `[0:v][1:v]xfade=transition=fade:duration=${duration}:offset=0[outv]`;
      
      case 'dissolve':
        return `[0:v][1:v]xfade=transition=dissolve:duration=${duration}:offset=0[outv]`;
      
      case 'slide':
        const slideDirection = direction || 'left';
        return `[0:v][1:v]xfade=transition=slide${slideDirection}:duration=${duration}:offset=0[outv]`;
      
      case 'wipe':
        const wipeDirection = direction || 'left';
        return `[0:v][1:v]xfade=transition=wipe${wipeDirection}:duration=${duration}:offset=0[outv]`;
      
      case 'zoom':
        return `[0:v][1:v]xfade=transition=zoomin:duration=${duration}:offset=0[outv]`;
      
      default:
        return `[0:v][1:v]xfade=transition=fade:duration=${duration}:offset=0[outv]`;
    }
  }

  private buildQualityParameters(options?: ProcessingOptions): string {
    if (!options) {
      return '-c:v libx264 -preset medium -crf 23';
    }

    const { quality, codec, bitrate } = options;
    
    const crfMap = {
      low: 28,
      medium: 23,
      high: 18,
      ultra: 15
    };

    const codecMap = {
      h264: 'libx264',
      h265: 'libx265',
      vp9: 'libvpx-vp9'
    };

    let params = `-c:v ${codecMap[codec] || 'libx264'} -preset medium -crf ${crfMap[quality]}`;
    
    if (bitrate) {
      params += ` -b:v ${bitrate}k`;
    }

    return params;
  }

  private buildCompressionCommand(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions
  ): string {
    const { quality, resolution, fps, codec } = options;
    
    const resolutionMap = {
      '720p': 'scale=1280:720',
      '1080p': 'scale=1920:1080',
      '4K': 'scale=3840:2160'
    };

    const qualityParams = this.buildQualityParameters(options);
    const scaleFilter = resolutionMap[resolution];
    
    return `-i "${inputPath}" -vf "${scaleFilter}" -r ${fps} ${qualityParams} "${outputPath}"`;
  }

  private buildMergeWithTransitionsCommand(
    inputPaths: string[],
    outputPath: string,
    transitions: TransitionOptions[]
  ): string {
    const inputs = inputPaths.map(path => `-i "${path}"`).join(' ');
    
    // بناء فلتر معقد للانتقالات
    let filterComplex = '';
    let currentOutput = '[0:v]';
    
    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i];
      const nextInput = `[${i + 1}:v]`;
      const outputLabel = i === transitions.length - 1 ? '[outv]' : `[v${i}]`;
      
      const transitionFilter = this.buildTransitionFilter(transition);
      filterComplex += transitionFilter.replace('[0:v][1:v]', `${currentOutput}${nextInput}`).replace('[outv]', outputLabel);
      
      if (i < transitions.length - 1) {
        filterComplex += ';';
        currentOutput = `[v${i}]`;
      }
    }

    return `${inputs} -filter_complex "${filterComplex}" -map "[outv]" "${outputPath}"`;
  }

  private buildSimpleMergeFilter(videoCount: number): string {
    const inputs = Array.from({ length: videoCount }, (_, i) => `[${i}:v]`).join('');
    return `${inputs}concat=n=${videoCount}:v=1:a=0[outv]`;
  }

  /**
   * إلغاء جميع العمليات الجارية
   */
  public async cancelAllOperations(): Promise<void> {
    try {
      await FFmpegKit.cancel();
      this.processingQueue = [];
      this.isProcessing = false;
      console.log('All FFmpeg operations cancelled');
    } catch (error) {
      console.error('Failed to cancel operations:', error);
    }
  }

  /**
   * تنفيذ أمر FFmpeg مخصص
   */
  public async executeCommand(command: string): Promise<boolean> {
    try {
      console.log(`Executing FFmpeg command: ${command}`);
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();
      return ReturnCode.isSuccess(returnCode);
    } catch (error) {
      console.error('FFmpeg command execution failed:', error);
      return false;
    }
  }

  /**
   * الحصول على معلومات ملف الفيديو
   */
  public async getVideoInfo(inputPath: string): Promise<any> {
    try {
      const command = `-i "${inputPath}" -hide_banner`;
      const session = await FFmpegKit.execute(command);
      const output = await session.getAllLogsAsString();
      
      // تحليل معلومات الفيديو من الإخراج
      return this.parseVideoInfo(output);
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  private parseVideoInfo(output: string): any {
    // تحليل بسيط لمعلومات الفيديو
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    const resolutionMatch = output.match(/(\d{3,4})x(\d{3,4})/);
    const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
    const bitrateMatch = output.match(/bitrate: (\d+) kb\/s/);

    return {
      duration: durationMatch ? 
        parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0,
      width: resolutionMatch ? parseInt(resolutionMatch[1]) : 0,
      height: resolutionMatch ? parseInt(resolutionMatch[2]) : 0,
      fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
      bitrate: bitrateMatch ? parseInt(bitrateMatch[1]) : 0
    };
  }
}

export default VideoProcessingEngine;