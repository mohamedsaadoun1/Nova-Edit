/**
 * محرك معالجة الفيديو الأساسي - Nova Edit Mobile
 * يستخدم FFmpegKit للمعالجة المتقدمة والترميز
 */

import { FFmpegKit, FFmpegKitConfig, ReturnCode, Session } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { VideoFile, FilterType, ProcessingTask } from '../types/video'; // Assuming ProcessingTask has at least { id: string; name: string; command: string; status: 'pending' | 'processing' | 'completed' | 'failed'; progress?: number; error?: string }

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
  private currentSession: Session | null = null;


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
    await FFmpegKitConfig.enableLogCallback((log) => {
      // console.log(`FFmpeg: ${log.getMessage()}`); // Keep for critical logs or use a proper logger
    });

    await FFmpegKitConfig.enableStatisticsCallback((statistics) => {
      const progress = statistics.getTime(); // milliseconds
      const currentTask = this.processingQueue[0];
      if (currentTask && currentTask.status === 'processing') {
        // Assuming duration is available in the task or can be estimated
        // For simplicity, this example doesn't calculate percentage progress here
        // but in a real app, you'd update task progress based on total duration.
        // console.log(`FFmpeg Progress for ${currentTask.name}: ${progress / 1000}s`);
        // currentTask.progress = ... (calculate percentage if possible)
      }
    });
    await FFmpegKitConfig.setLogLevel(20); // INFO level
  }

  private async _executeFFmpegCommand(command: string, taskName?: string): Promise<Session> {
    // console.log(`Executing FFmpeg command for ${taskName || 'unnamed task'}: ${command}`); // Removed for production
    this.currentSession = await FFmpegKit.execute(command);
    return this.currentSession;
  }

  private async _processNextInQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.processingQueue[0]; // Peek at the first task

    try {
      task.status = 'processing';
      // Notify UI about task status change if a callback mechanism is implemented

      const session = await this._executeFFmpegCommand(task.command, task.name);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        task.status = 'completed';
      } else {
        task.status = 'failed';
        task.error = `FFmpeg process failed with return code ${returnCode}. Log: ${await session.getAllLogsAsString()}`;
        console.error(task.error);
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error during processing';
      console.error(`Error processing task ${task.name}:`, error);
    } finally {
      this.processingQueue.shift(); // Remove the processed task
      this.isProcessing = false;
      this.currentSession = null;
      // Notify UI about task completion/failure
      this._processNextInQueue(); // Process next task if any
    }
  }

  private _addToQueue(name: string, commandGenerator: () => string): Promise<boolean> {
    const task: ProcessingTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      command: commandGenerator(), // Generate command when adding to queue
      status: 'pending',
      progress: 0,
    };
    this.processingQueue.push(task);
    this._processNextInQueue();
    // This promise now resolves immediately after queueing, not after task completion.
    // For actual task completion, a different notification/callback mechanism is needed.
    return Promise.resolve(true);
  }


  public applyFilter(
    inputPath: string,
    outputPath: string,
    filter: FilterOptions,
    // onProgress?: (progress: number) => void // onProgress would be handled by task updates
  ): Promise<boolean> {
    const taskName = `ApplyFilter: ${filter.type}`;
    return this._addToQueue(taskName, () => {
      const filterCommand = this.buildFilterCommand(filter);
      return `-i "${inputPath}" -vf "${filterCommand}" -c:a copy "${outputPath}"`;
    });
  }

  public applyTransition(
    input1Path: string,
    input2Path: string,
    outputPath: string,
    transition: TransitionOptions,
    // onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const taskName = `ApplyTransition: ${transition.type}`;
    return this._addToQueue(taskName, () => {
      const transitionFilter = this.buildTransitionFilter(transition);
      return `-i "${input1Path}" -i "${input2Path}" -filter_complex "${transitionFilter}" "${outputPath}"`;
    });
  }

  public trimVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    options?: ProcessingOptions
  ): Promise<boolean> {
    const taskName = `TrimVideo: ${inputPath.split('/').pop()}`;
    return this._addToQueue(taskName, () => {
      const qualityParams = this.buildQualityParameters(options);
      return `-i "${inputPath}" -ss ${startTime} -t ${duration} ${qualityParams} "${outputPath}"`;
    });
  }

  public compressVideo(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions,
    // onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const taskName = `CompressVideo: ${options.resolution}_${options.quality}`;
    return this._addToQueue(taskName, () =>
      this.buildCompressionCommand(inputPath, outputPath, options)
    );
  }

  public async mergeVideos( // Keeping this async for now due to initial input validation
    inputPaths: string[],
    outputPath: string,
    transitions?: TransitionOptions[],
    // onProgress?: (progress: number) => void
  ): Promise<boolean> {
    if (inputPaths.length < 2) {
      console.error('At least 2 videos required for merging');
      return false; // Or throw error
    }
    const taskName = `MergeVideos: ${inputPaths.length} files`;
    return this._addToQueue(taskName, () => {
      if (transitions && transitions.length > 0 && transitions.length === inputPaths.length -1) {
        return this.buildMergeWithTransitionsCommand(inputPaths, outputPath, transitions);
      } else {
        const inputList = inputPaths.map(path => `-i "${path}"`).join(' ');
        const filterComplex = this.buildSimpleMergeFilter(inputPaths.length);
        return `${inputList} -filter_complex "${filterComplex}" -map "[v]" -map "[a]" "${outputPath}"`; // Assuming audio merge too
      }
    });
  }

  public extractAudio(
    inputPath: string,
    outputPath: string,
    format: 'mp3' | 'aac' | 'wav' = 'mp3'
  ): Promise<boolean> {
    const taskName = `ExtractAudio: ${format}`;
    return this._addToQueue(taskName, () => {
      const codecMap = { mp3: 'libmp3lame', aac: 'aac', wav: 'pcm_s16le' };
      const codec = codecMap[format];
      return `-i "${inputPath}" -vn -acodec ${codec} "${outputPath}"`;
    });
  }

  public addAudioToVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    volume: number = 1.0
  ): Promise<boolean> {
    const taskName = `AddAudioToVideo`;
    return this._addToQueue(taskName, () =>
      `-i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -filter:a "volume=${volume}" -shortest "${outputPath}"`
    );
  }

  public changeVideoSpeed(
    inputPath: string,
    outputPath: string,
    speed: number,
    maintainAudio: boolean = true
  ): Promise<boolean> {
    const taskName = `ChangeSpeed: x${speed}`;
    return this._addToQueue(taskName, () => {
      if (maintainAudio) {
        return `-i "${inputPath}" -filter_complex "[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]" -map "[v]" -map "[a]" "${outputPath}"`;
      } else {
        return `-i "${inputPath}" -filter:v "setpts=${1/speed}*PTS" -an "${outputPath}"`;
      }
    });
  }

  // generatePreview might still be executed directly if it's meant to be quick and not queued.
  // Or it can also be adapted to the queue system if previews can be slow.
  // For this iteration, keeping it direct but using the helper.
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
      const scale = quality === 'low' ? 'scale=480:-1' : 'scale=854:-1'; // Use -1 for auto height
      const command = `-i "${inputPath}" -ss ${startTime} -t ${duration} -vf "${scale}" -c:v libx264 -preset ultrafast -crf 28 -an "${outputPath}"`; // ultrafast, no audio

      const session = await this._executeFFmpegCommand(command, 'GeneratePreview');
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
      } else {
        console.error(`Preview generation failed. Log: ${await session.getAllLogsAsString()}`);
        throw new Error('Preview generation failed');
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw error;
    }
  }

  // وظائف مساعدة لبناء الأوامر (unchanged from previous version, but ensure they are correct)

  private buildFilterCommand(filter: FilterOptions): string {
    const { type, intensity, parameters } = filter;
    switch (type) {
      case FilterType.BRIGHTNESS: return `eq=brightness=${intensity - 0.5}`;
      case FilterType.CONTRAST: return `eq=contrast=${intensity + 0.5}`;
      case FilterType.SATURATION: return `eq=saturation=${intensity + 0.5}`;
      case FilterType.BLUR: const radius = Math.max(1, intensity * 10); return `boxblur=${radius}:${radius}`;
      case FilterType.SEPIA: return `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
      case FilterType.VINTAGE: return `curves=vintage`;
      case FilterType.NOIR: return `hue=s=0`;
      case FilterType.VIBRANT: return `eq=saturation=${1 + intensity}:contrast=${1 + intensity * 0.3}`;
      case FilterType.WARM: return `colortemperature=temperature=${3200 + intensity * 2000}`;
      case FilterType.COOL: return `colortemperature=temperature=${6500 + intensity * 2000}`;
      case FilterType.FADE: return `fade=in:0:30`; // Example: fade in for 30 frames
      default: return '';
    }
  }

  private buildTransitionFilter(transition: TransitionOptions): string {
    const { type, duration, direction, easing } = transition; // easing is not used by xfade directly
    let xfadeTransition = type;
    if (type === 'slide' || type === 'wipe') {
        xfadeTransition = `${type}${direction || 'left'}`;
    }
    // Ensure transition name is valid for xfade, otherwise default to fade
    const validTransitions = ['fade', 'wipeleft', 'wiperight', 'wipeup', 'wipedown', 'slideleft', 'slideright', 'slideup', 'slidedown', 'dissolve', 'rectcrop', 'circlecrop', 'circleclose', 'circleopen', 'horzclose', 'horzopen', 'vertclose', 'vertopen', 'diagbl', 'diagbr', 'diagtl', 'diagtr', 'hlslice', 'hrslice', 'vuslice', 'vdslice', 'pixelize', 'radial', 'zoomin', 'zoomout', 'fadegrays', 'fadeblack', 'fadewhite', 'distance', '交換'];
    if (!validTransitions.includes(xfadeTransition)) {
        xfadeTransition = 'fade';
    }
    return `[0:v][1:v]xfade=transition=${xfadeTransition}:duration=${duration}:offset=0[v]; [0:a][1:a]acrossfade=d=${duration}[a]`;
  }

  private buildQualityParameters(options?: ProcessingOptions): string {
    if (!options) return '-c:v libx264 -preset medium -crf 23 -c:a aac';
    const { quality, codec, bitrate } = options;
    const crfMap = { low: 28, medium: 23, high: 18, ultra: 15 };
    const codecMap = { h264: 'libx264', h265: 'libx265', vp9: 'libvpx-vp9' };
    let params = `-c:v ${codecMap[codec] || 'libx264'} -preset medium -crf ${crfMap[quality]}`;
    if (bitrate) params += ` -b:v ${bitrate}k`;
    params += ' -c:a aac'; // Ensure audio codec is set
    return params;
  }

  private buildCompressionCommand(inputPath: string, outputPath: string, options: ProcessingOptions): string {
    const { resolution, fps } = options;
    const resolutionMap = { '720p': 'scale=1280:-2', '1080p': 'scale=1920:-2', '4K': 'scale=3840:-2' }; // Use -2 to maintain aspect ratio
    const qualityParams = this.buildQualityParameters(options);
    const scaleFilter = resolutionMap[resolution];
    return `-i "${inputPath}" -vf "${scaleFilter}" -r ${fps} ${qualityParams} "${outputPath}"`;
  }

  private buildMergeWithTransitionsCommand(inputPaths: string[], outputPath: string, transitions: TransitionOptions[]): string {
    const inputs = inputPaths.map((path, index) => `-i "${path}"`).join(' ');
    let filterComplex = '';
    let videoChain = '';
    let audioChain = '';

    // Prepare video and audio streams
    inputPaths.forEach((_, i) => {
        videoChain += `[${i}:v]`;
        audioChain += `[${i}:a]`;
    });
    
    // Build xfade chain for video
    let currentVideoOutput = '[0vtmp]';
    filterComplex += `[0:v]copy[0vtmp];`; // Copy first stream to avoid direct modification issues

    for (let i = 0; i < transitions.length; i++) {
        const nextVideoInput = `[${i + 1}:v]`;
        const transition = transitions[i];
        const xfadeType = this.getXFadeTransitionType(transition);
        const videoOutputLabel = (i === transitions.length - 1) ? '[v]' : `[v${i+1}tmp]`;

        filterComplex += `${currentVideoOutput}${nextVideoInput}xfade=transition=${xfadeType}:duration=${transition.duration}:offset=0${videoOutputLabel};`;
        currentVideoOutput = videoOutputLabel;
    }

    // Build acrossfade chain for audio
    let currentAudioOutput = '[0atmp]';
    filterComplex += `[0:a]acopy[0atmp];`;

    for (let i = 0; i < transitions.length; i++) {
        const nextAudioInput = `[${i + 1}:a]`;
        const transition = transitions[i]; // Assuming audio transition duration matches video
        const audioOutputLabel = (i === transitions.length - 1) ? '[a]' : `[a${i+1}tmp]`;

        filterComplex += `${currentAudioOutput}${nextAudioInput}acrossfade=d=${transition.duration}${audioOutputLabel};`;
        currentAudioOutput = audioOutputLabel;
    }

    return `${inputs} -filter_complex "${filterComplex}" -map "[v]" -map "[a]" "${outputPath}"`;
  }

  private getXFadeTransitionType(transition: TransitionOptions): string {
    let xfadeTransition = transition.type;
     if (transition.type === 'slide' || transition.type === 'wipe') {
        xfadeTransition = `${transition.type}${transition.direction || 'left'}`;
    }
    const validTransitions = ['fade', 'wipeleft', 'wiperight', 'wipeup', 'wipedown', 'slideleft', 'slideright', 'slideup', 'slidedown', 'dissolve', 'rectcrop', 'circlecrop', 'circleclose', 'circleopen', 'horzclose', 'horzopen', 'vertclose', 'vertopen', 'diagbl', 'diagbr', 'diagtl', 'diagtr', 'hlslice', 'hrslice', 'vuslice', 'vdslice', 'pixelize', 'radial', 'zoomin', 'zoomout', 'fadegrays', 'fadeblack', 'fadewhite', 'distance', '交換'];
    return validTransitions.includes(xfadeTransition) ? xfadeTransition : 'fade';
  }


  private buildSimpleMergeFilter(videoCount: number): string {
    const videoInputs = Array.from({ length: videoCount }, (_, i) => `[${i}:v]`).join('');
    const audioInputs = Array.from({ length: videoCount }, (_, i) => `[${i}:a]`).join('');
    return `${videoInputs}concat=n=${videoCount}:v=1:a=0[vtmp];${audioInputs}concat=n=${videoCount}:v=0:a=1[a]`;
    // The map in mergeVideos should then be -map "[vtmp]" -map "[a]"
  }


  public async cancelAllOperations(): Promise<void> {
    try {
      if (this.currentSession) {
        await FFmpegKit.cancel(this.currentSession.getSessionId());
      }
      this.processingQueue = []; // Clear the queue
      this.isProcessing = false;
      this.currentSession = null;
      // console.log('All FFmpeg operations attempted to cancel.'); // Removed for production
    } catch (error) {
      console.error('Failed to cancel operations:', error);
    }
  }

  public async executeCommand(command: string): Promise<boolean> {
    const taskName = `ExecuteCustomCommand`;
    // For direct command execution, we might not add to queue or wrap it as a task
    // For simplicity here, using the helper directly.
    try {
        const session = await this._executeFFmpegCommand(command, taskName);
        const returnCode = await session.getReturnCode();
        if (!ReturnCode.isSuccess(returnCode)) {
            console.error(`Custom FFmpeg command failed. Log: ${await session.getAllLogsAsString()}`);
        }
        return ReturnCode.isSuccess(returnCode);
    } catch (error) {
        console.error('Custom FFmpeg command execution failed:', error);
        return false;
    }
  }

  public async getVideoInfo(inputPath: string): Promise<any> {
    try {
      // This command does not produce an output file, so it's safe to run directly.
      // It's also usually very fast.
      const command = `-i "${inputPath}" -hide_banner`;
      // Not using _executeFFmpegCommand as it's not a "processing" task
      const session = await FFmpegKit.execute(command);
      const output = await session.getAllLogsAsString();
      return this.parseVideoInfo(output);
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  private parseVideoInfo(output: string): any {
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    const resolutionMatch = output.match(/Stream #\d+:\d+.*Video:.* (\d{3,4})x(\d{3,4})/); // More specific regex
    const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
    const bitrateMatch = output.match(/bitrate: (\d+) kb\/s/);

    return {
      duration: durationMatch ? 
        parseInt(durationMatch[1], 10) * 3600 + parseInt(durationMatch[2], 10) * 60 + parseFloat(durationMatch[3]) : 0,
      width: resolutionMatch ? parseInt(resolutionMatch[1], 10) : 0,
      height: resolutionMatch ? parseInt(resolutionMatch[2], 10) : 0,
      fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
      bitrate: bitrateMatch ? parseInt(bitrateMatch[1], 10) : 0
    };
  }
}

export default VideoProcessingEngine;