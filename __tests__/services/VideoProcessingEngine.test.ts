import { VideoProcessingEngine } from '../../services/VideoProcessingEngine';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

// Mock dependencies
jest.mock('ffmpeg-kit-react-native');
jest.mock('expo-file-system');

describe('VideoProcessingEngine', () => {
  let engine: VideoProcessingEngine;
  const mockFFmpegKit = FFmpegKit as jest.Mocked<typeof FFmpegKit>;
  const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

  beforeEach(() => {
    engine = new VideoProcessingEngine();
    jest.clearAllMocks();
  });

  describe('Video Processing', () => {
    it('should process video with basic options', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024000,
        isDirectory: false,
        uri: 'file://output.mp4',
        modificationTime: Date.now(),
      });

      const result = await engine.processVideo(
        'file://input.mp4',
        'file://output.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('file://output.mp4');
      expect(mockFFmpegKit.executeAsync).toHaveBeenCalled();
    });

    it('should handle processing failure', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => false }),
        getOutput: jest.fn().mockReturnValue('Processing failed'),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const result = await engine.processVideo(
        'file://input.mp4',
        'file://output.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Processing failed');
    });

    it('should apply filters correctly', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      await engine.applyFilters(
        'file://input.mp4',
        'file://output.mp4',
        [
          {
            type: 'brightness',
            intensity: 0.5,
            parameters: { value: 0.2 },
          },
          {
            type: 'contrast',
            intensity: 0.7,
            parameters: { value: 1.2 },
          },
        ]
      );

      const executeCall = mockFFmpegKit.executeAsync.mock.calls[0][0];
      expect(executeCall).toContain('eq=brightness=0.2:contrast=1.2');
    });

    it('should merge multiple video clips', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const clips = [
        {
          inputPath: 'file://clip1.mp4',
          startTime: 0,
          duration: 5000,
          filters: [],
        },
        {
          inputPath: 'file://clip2.mp4',
          startTime: 0,
          duration: 3000,
          filters: [],
        },
      ];

      const result = await engine.mergeClips(clips, 'file://output.mp4');

      expect(result.success).toBe(true);
      expect(mockFFmpegKit.executeAsync).toHaveBeenCalled();
    });
  });

  describe('Audio Processing', () => {
    it('should extract audio from video', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const result = await engine.extractAudio(
        'file://input.mp4',
        'file://audio.mp3'
      );

      expect(result.success).toBe(true);
      const executeCall = mockFFmpegKit.executeAsync.mock.calls[0][0];
      expect(executeCall).toContain('-vn'); // No video flag
      expect(executeCall).toContain('.mp3');
    });

    it('should mix audio tracks', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const audioTracks = [
        { path: 'file://audio1.mp3', volume: 1.0, startTime: 0 },
        { path: 'file://audio2.mp3', volume: 0.5, startTime: 2000 },
      ];

      const result = await engine.mixAudioTracks(
        audioTracks,
        'file://mixed.mp3'
      );

      expect(result.success).toBe(true);
      expect(mockFFmpegKit.executeAsync).toHaveBeenCalled();
    });
  });

  describe('Export Functions', () => {
    it('should export with different quality settings', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const result = await engine.exportVideo(
        'file://input.mp4',
        'file://output.mp4',
        {
          quality: 'ultra',
          resolution: '4K',
          fps: 60,
          codec: 'h265',
          bitrate: 50000,
        }
      );

      expect(result.success).toBe(true);
      const executeCall = mockFFmpegKit.executeAsync.mock.calls[0][0];
      expect(executeCall).toContain('3840x2160'); // 4K resolution
      expect(executeCall).toContain('60'); // FPS
      expect(executeCall).toContain('50000k'); // Bitrate
    });

    it('should handle export with progress callback', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const progressCallback = jest.fn();

      await engine.exportVideo(
        'file://input.mp4',
        'file://output.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        },
        progressCallback
      );

      expect(mockFFmpegKit.executeAsync).toHaveBeenCalled();
    });
  });

  describe('Thumbnail Generation', () => {
    it('should generate video thumbnail', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const result = await engine.generateThumbnail(
        'file://input.mp4',
        'file://thumbnail.jpg',
        { timeOffset: 5000, width: 320, height: 180 }
      );

      expect(result.success).toBe(true);
      const executeCall = mockFFmpegKit.executeAsync.mock.calls[0][0];
      expect(executeCall).toContain('-ss 5'); // Time offset
      expect(executeCall).toContain('320x180'); // Size
    });

    it('should generate multiple thumbnails', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);

      const result = await engine.generateThumbnails(
        'file://input.mp4',
        'file://thumbs/',
        { count: 10, width: 160, height: 90 }
      );

      expect(result.success).toBe(true);
      expect(result.thumbnails).toHaveLength(10);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track processing time', async () => {
      const mockSession = {
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => true }),
        getOutput: jest.fn().mockReturnValue(''),
      };

      mockFFmpegKit.executeAsync.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSession), 100))
      );

      const result = await engine.processVideo(
        'file://input.mp4',
        'file://output.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );

      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle processing cancellation', async () => {
      const mockSession = {
        getSessionId: jest.fn().mockReturnValue('session-123'),
        getReturnCode: jest.fn().mockReturnValue({ isSuccess: () => false }),
        getOutput: jest.fn().mockReturnValue('Cancelled'),
      };

      mockFFmpegKit.executeAsync.mockResolvedValue(mockSession);
      mockFFmpegKit.cancel.mockResolvedValue();

      const processingPromise = engine.processVideo(
        'file://input.mp4',
        'file://output.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );

      // Cancel processing
      await engine.cancelProcessing('session-123');

      const result = await processingPromise;

      expect(mockFFmpegKit.cancel).toHaveBeenCalledWith('session-123');
      expect(result.success).toBe(false);
    });
  });
});