/**
 * Performance Tests for Nova Edit
 * Tests memory usage, processing speed, and app responsiveness
 */

import { VideoProcessingEngine } from '../../services/VideoProcessingEngine';
import { AIProcessingService } from '../../services/AIProcessingService';
import { useVideoStore } from '../../store/videoStore';

describe('Performance Tests', () => {
  let videoEngine: VideoProcessingEngine;
  let aiService: AIProcessingService;

  beforeAll(async () => {
    videoEngine = new VideoProcessingEngine();
    aiService = new AIProcessingService();
    await aiService.initialize();
  });

  afterAll(() => {
    aiService.cleanup();
  });

  describe('Memory Management', () => {
    const MEMORY_THRESHOLD = 512 * 1024 * 1024; // 512MB

    beforeEach(() => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });

    it('should not exceed memory threshold during video processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple videos
      const processingTasks = Array(5).fill(null).map((_, index) =>
        videoEngine.processVideo(
          `file://input-${index}.mp4`,
          `file://output-${index}.mp4`,
          {
            quality: 'medium',
            resolution: '720p',
            fps: 30,
            codec: 'h264',
          }
        )
      );

      await Promise.all(processingTasks);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLD);
    });

    it('should cleanup AI models after processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple images with AI
      const images = Array(10).fill(null).map(() => new ImageData(640, 480));
      
      for (const image of images) {
        await aiService.removeBackground(image);
      }

      // Force cleanup
      aiService.cleanup();

      const finalMemory = process.memoryUsage().heapUsed;
      expect(finalMemory).toBeLessThanOrEqual(initialMemory * 1.5); // Allow 50% increase
    });

    it('should handle large store state efficiently', () => {
      const store = useVideoStore.getState();
      
      const startTime = performance.now();
      
      // Add many video files
      for (let i = 0; i < 1000; i++) {
        store.addVideoFile({
          id: `video-${i}`,
          uri: `file://video-${i}.mp4`,
          name: `video-${i}.mp4`,
          duration: 30000,
          width: 1920,
          height: 1080,
          fps: 30,
          size: 10485760,
          mimeType: 'video/mp4',
          thumbnailUri: `file://thumb-${i}.jpg`,
        });
      }
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Should complete in under 1 second
      expect(operationTime).toBeLessThan(1000);
      
      // Cleanup
      useVideoStore.setState({ videoFiles: [] });
    });
  });

  describe('Processing Speed', () => {
    it('should process video in reasonable time', async () => {
      const startTime = performance.now();
      
      const result = await videoEngine.processVideo(
        'file://test-video.mp4',
        'file://output.mp4',
        {
          quality: 'medium',
          resolution: '720p',
          fps: 30,
          codec: 'h264',
        }
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      
      // For a 30-second video, processing should be under 2 minutes
      expect(processingTime).toBeLessThan(120000);
    });

    it('should apply filters efficiently', async () => {
      const startTime = performance.now();
      
      const result = await videoEngine.applyFilters(
        'file://input.mp4',
        'file://filtered.mp4',
        [
          { type: 'brightness', intensity: 0.5, parameters: { value: 0.2 } },
          { type: 'contrast', intensity: 0.7, parameters: { value: 1.2 } },
          { type: 'saturation', intensity: 0.6, parameters: { value: 1.1 } },
        ]
      );
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      
      // Multiple filters should process in under 90 seconds
      expect(filterTime).toBeLessThan(90000);
    });

    it('should generate thumbnails quickly', async () => {
      const startTime = performance.now();
      
      const result = await videoEngine.generateThumbnails(
        'file://input.mp4',
        'file://thumbs/',
        { count: 20, width: 160, height: 90 }
      );
      
      const endTime = performance.now();
      const thumbnailTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.thumbnails).toHaveLength(20);
      
      // 20 thumbnails should generate in under 30 seconds
      expect(thumbnailTime).toBeLessThan(30000);
    });
  });

  describe('AI Processing Performance', () => {
    it('should process background removal efficiently', async () => {
      const image = new ImageData(1920, 1080);
      
      const startTime = performance.now();
      
      const result = await aiService.removeBackground(image);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(result).toBeInstanceOf(ImageData);
      
      // Full HD background removal should take under 10 seconds
      expect(processingTime).toBeLessThan(10000);
    });

    it('should batch process images efficiently', async () => {
      const images = Array(10).fill(null).map(() => new ImageData(640, 480));
      
      const startTime = performance.now();
      
      const results = await Promise.all(
        images.map(img => aiService.removeBackground(img))
      );
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;
      
      expect(results).toHaveLength(10);
      
      // Batch processing should be more efficient than sequential
      expect(batchTime).toBeLessThan(30000); // 3 seconds per image max
    });

    it('should handle style transfer within time limit', async () => {
      const contentImage = new ImageData(512, 512);
      const styleImage = new ImageData(256, 256);
      
      const startTime = performance.now();
      
      const result = await aiService.applyStyleTransfer(
        contentImage,
        styleImage,
        { strength: 0.8 }
      );
      
      const endTime = performance.now();
      const styleTime = endTime - startTime;
      
      expect(result).toBeInstanceOf(ImageData);
      
      // Style transfer should complete in under 15 seconds
      expect(styleTime).toBeLessThan(15000);
    });
  });

  describe('Timeline Performance', () => {
    it('should handle large timelines smoothly', () => {
      const store = useVideoStore.getState();
      
      // Create timeline with many clips
      const tracks = Array(10).fill(null).map((_, trackIndex) => ({
        id: `track-${trackIndex}`,
        type: 'video' as const,
        name: `Track ${trackIndex}`,
        clips: Array(50).fill(null).map((_, clipIndex) => ({
          id: `clip-${trackIndex}-${clipIndex}`,
          videoFileId: `video-${clipIndex}`,
          startTime: clipIndex * 2000,
          endTime: (clipIndex + 1) * 2000,
          trackStartTime: clipIndex * 2000,
          duration: 2000,
          trimStart: 0,
          trimEnd: 2000,
          filters: [],
          transforms: {
            scale: 1,
            rotation: 0,
            x: 0,
            y: 0,
          },
        })),
        isLocked: false,
        isMuted: false,
        volume: 1,
      }));

      const startTime = performance.now();
      
      useVideoStore.setState({
        timeline: { tracks },
      });
      
      // Simulate timeline operations
      store.seekTo(25000);
      store.setTimelineZoom(2);
      store.selectClips(['clip-0-10', 'clip-1-15']);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Complex timeline operations should be instant
      expect(operationTime).toBeLessThan(100);
    });

    it('should update playback position smoothly', () => {
      const store = useVideoStore.getState();
      
      const startTime = performance.now();
      
      // Simulate frequent playback updates (60 FPS)
      for (let i = 0; i < 1800; i++) { // 30 seconds at 60 FPS
        store.seekTo(i * 16.67); // ~60 FPS intervals
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // 1800 updates should complete quickly
      expect(updateTime).toBeLessThan(1000);
    });
  });

  describe('Export Performance', () => {
    it('should export video with reasonable speed', async () => {
      const startTime = performance.now();
      
      const result = await videoEngine.exportVideo(
        'file://timeline.mp4',
        'file://export.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );
      
      const endTime = performance.now();
      const exportTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      
      // Export should be faster than real-time for optimized content
      expect(exportTime).toBeLessThan(60000); // Under 1 minute for 30s video
    });

    it('should handle multiple export formats efficiently', async () => {
      const formats = [
        { resolution: '720p', codec: 'h264' },
        { resolution: '1080p', codec: 'h264' },
        { resolution: '720p', codec: 'h265' },
      ];

      const startTime = performance.now();
      
      const results = await Promise.all(
        formats.map((format, index) =>
          videoEngine.exportVideo(
            'file://source.mp4',
            `file://export-${index}.mp4`,
            {
              quality: 'medium',
              resolution: format.resolution as any,
              fps: 30,
              codec: format.codec as any,
            }
          )
        )
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(results.every(r => r.success)).toBe(true);
      
      // Multiple exports should complete in parallel efficiently
      expect(totalTime).toBeLessThan(180000); // Under 3 minutes total
    });
  });

  describe('Stress Tests', () => {
    it('should handle concurrent operations without degradation', async () => {
      const operations = [
        // Video processing
        videoEngine.processVideo('file://1.mp4', 'file://out1.mp4', {
          quality: 'medium', resolution: '720p', fps: 30, codec: 'h264'
        }),
        
        // AI processing
        aiService.removeBackground(new ImageData(640, 480)),
        
        // Timeline operations
        Promise.resolve().then(() => {
          const store = useVideoStore.getState();
          store.seekTo(15000);
          store.setTimelineZoom(1.5);
          return true;
        }),
        
        // Thumbnail generation
        videoEngine.generateThumbnails('file://2.mp4', 'file://thumbs/', {
          count: 10, width: 120, height: 80
        }),
      ];

      const startTime = performance.now();
      
      const results = await Promise.allSettled(operations);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All operations should succeed or fail gracefully
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
      
      // Concurrent operations should not take excessively long
      expect(totalTime).toBeLessThan(45000);
    });

    it('should recover from memory pressure', async () => {
      // Create memory pressure
      const largeArrays = Array(100).fill(null).map(() => 
        new Array(1000000).fill(Math.random())
      );

      try {
        // Attempt processing under memory pressure
        const result = await aiService.removeBackground(new ImageData(320, 240));
        expect(result).toBeInstanceOf(ImageData);
      } catch (error) {
        // Should fail gracefully with clear error
        expect(error).toBeInstanceOf(Error);
      } finally {
        // Cleanup
        largeArrays.length = 0;
      }
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup FFmpeg sessions properly', async () => {
      const initialSessions = videoEngine.getActiveSessions();
      
      // Start multiple processing tasks
      const tasks = Array(5).fill(null).map((_, i) =>
        videoEngine.processVideo(`file://input-${i}.mp4`, `file://output-${i}.mp4`, {
          quality: 'low', resolution: '720p', fps: 30, codec: 'h264'
        })
      );

      await Promise.allSettled(tasks);
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalSessions = videoEngine.getActiveSessions();
      expect(finalSessions.length).toBeLessThanOrEqual(initialSessions.length + 1);
    });

    it('should dispose TensorFlow tensors properly', async () => {
      const initialTensors = (global as any).tf?.memory?.().numTensors || 0;
      
      // Create and process multiple images
      for (let i = 0; i < 5; i++) {
        const image = new ImageData(320, 240);
        await aiService.removeBackground(image);
      }
      
      // Force cleanup
      aiService.cleanup();
      
      const finalTensors = (global as any).tf?.memory?.().numTensors || 0;
      expect(finalTensors).toBeLessThanOrEqual(initialTensors + 2); // Allow some baseline tensors
    });
  });
});