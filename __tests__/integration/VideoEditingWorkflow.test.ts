/**
 * Integration Tests for Video Editing Workflow
 * Tests the complete flow from importing video to exporting final result
 */

import { VideoProcessingEngine } from '../../services/VideoProcessingEngine';
import { AIProcessingService } from '../../services/AIProcessingService';
import { useVideoStore } from '../../store/videoStore';
import { ProjectManager } from '../../services/ProjectManager';

describe('Video Editing Workflow Integration', () => {
  let videoEngine: VideoProcessingEngine;
  let aiService: AIProcessingService;
  let projectManager: ProjectManager;

  beforeEach(async () => {
    videoEngine = new VideoProcessingEngine();
    aiService = new AIProcessingService();
    projectManager = new ProjectManager();
    
    await aiService.initialize();
    
    // Reset store state
    useVideoStore.setState({
      videoFiles: [],
      projects: [],
      currentProject: null,
      timeline: { tracks: [] },
      playbackState: {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        playbackRate: 1,
      },
      processingTasks: [],
      ui: {
        selectedTool: null,
        timelineZoom: 1,
        selectedClips: [],
        selectedTrack: null,
      },
    });
  });

  describe('Complete Video Editing Flow', () => {
    it('should handle full workflow: import -> edit -> apply AI -> export', async () => {
      const store = useVideoStore.getState();
      
      // 1. Import video file
      const mockVideoFile = {
        ...global.mockVideoFile,
        id: 'video-1',
        uri: 'file://test-video.mp4',
        name: 'test-video.mp4',
        duration: 30000,
      };

      store.addVideoFile(mockVideoFile);
      
      // 2. Create new project
      store.createProject('Test Integration Project');
      
      const currentProject = useVideoStore.getState().currentProject;
      expect(currentProject).toBeTruthy();
      expect(currentProject?.name).toBe('Test Integration Project');

      // 3. Add video to timeline
      const videoClip = {
        id: 'clip-1',
        videoFileId: 'video-1',
        startTime: 0,
        endTime: 15000,
        trackStartTime: 0,
        duration: 15000,
        trimStart: 0,
        trimEnd: 15000,
        filters: [],
        transforms: {
          scale: 1,
          rotation: 0,
          x: 0,
          y: 0,
        },
      };

      // First ensure we have a track
      const trackId = 'main-track';
      useVideoStore.setState({
        timeline: {
          tracks: [{
            id: trackId,
            type: 'video',
            name: 'Main Video Track',
            clips: [],
            isLocked: false,
            isMuted: false,
            volume: 1,
          }]
        }
      });

      store.addClipToTrack(trackId, videoClip);

      // 4. Apply AI background removal
      const mockImageData = new ImageData(640, 480);
      const processedImage = await aiService.removeBackground(mockImageData);
      expect(processedImage).toBeInstanceOf(ImageData);

      // 5. Apply filters
      const filterOptions = [
        {
          type: 'brightness' as const,
          intensity: 0.6,
          parameters: { value: 0.2 },
        },
        {
          type: 'contrast' as const,
          intensity: 0.8,
          parameters: { value: 1.3 },
        },
      ];

      const filteredResult = await videoEngine.applyFilters(
        mockVideoFile.uri,
        'file://filtered-output.mp4',
        filterOptions
      );

      expect(filteredResult.success).toBe(true);

      // 6. Add transitions
      const transitionClip = {
        id: 'clip-2',
        videoFileId: 'video-1',
        startTime: 15000,
        endTime: 30000,
        trackStartTime: 14000, // 1 second overlap
        duration: 15000,
        trimStart: 15000,
        trimEnd: 30000,
        filters: [],
        transforms: {
          scale: 1,
          rotation: 0,
          x: 0,
          y: 0,
        },
      };

      store.addClipToTrack(trackId, transitionClip);

      // 7. Export final video
      const exportResult = await videoEngine.exportVideo(
        'file://timeline-composition.mp4',
        'file://final-export.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.outputPath).toBe('file://final-export.mp4');

      // 8. Save project
      await projectManager.saveProject(currentProject!);

      // Verify final state
      const finalState = useVideoStore.getState();
      expect(finalState.videoFiles).toHaveLength(1);
      expect(finalState.timeline.tracks[0].clips).toHaveLength(2);
      expect(finalState.currentProject?.name).toBe('Test Integration Project');
    });

    it('should handle workflow with audio editing', async () => {
      const store = useVideoStore.getState();
      
      // Create project with video and audio
      store.createProject('Audio Integration Test');
      
      const videoFile = {
        ...global.mockVideoFile,
        id: 'video-with-audio',
        uri: 'file://video-with-audio.mp4',
      };

      store.addVideoFile(videoFile);

      // Add audio track
      const audioTrackId = 'audio-track-1';
      useVideoStore.setState({
        timeline: {
          tracks: [
            {
              id: 'video-track-1',
              type: 'video',
              name: 'Video Track',
              clips: [],
              isLocked: false,
              isMuted: false,
              volume: 1,
            },
            {
              id: audioTrackId,
              type: 'audio',
              name: 'Audio Track',
              clips: [],
              isLocked: false,
              isMuted: false,
              volume: 0.8,
            },
          ]
        }
      });

      // Extract audio from video
      const audioExtractionResult = await videoEngine.extractAudio(
        videoFile.uri,
        'file://extracted-audio.mp3'
      );

      expect(audioExtractionResult.success).toBe(true);

      // Apply audio effects
      const audioTracks = [
        { path: 'file://extracted-audio.mp3', volume: 0.8, startTime: 0 },
        { path: 'file://background-music.mp3', volume: 0.3, startTime: 2000 },
      ];

      const mixedAudioResult = await videoEngine.mixAudioTracks(
        audioTracks,
        'file://mixed-audio.mp3'
      );

      expect(mixedAudioResult.success).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle processing failures gracefully', async () => {
      const store = useVideoStore.getState();
      
      // Create project
      store.createProject('Error Handling Test');
      
      // Try to process non-existent file
      const result = await videoEngine.processVideo(
        'file://non-existent.mp4',
        'file://output.mp4',
        {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          codec: 'h264',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();

      // Store should remain in valid state
      const finalState = useVideoStore.getState();
      expect(finalState.currentProject?.name).toBe('Error Handling Test');
    });

    it('should handle AI processing failures', async () => {
      // Test with invalid image data
      const invalidImageData = new ImageData(0, 0);
      
      await expect(aiService.removeBackground(invalidImageData))
        .rejects.toThrow();
    });

    it('should handle memory limitations', async () => {
      // Test with very large image
      const largeImageData = new ImageData(4096, 4096);
      
      // Should either succeed or fail gracefully
      try {
        const result = await aiService.removeBackground(largeImageData);
        expect(result).toBeInstanceOf(ImageData);
      } catch (error) {
        // Should fail with a clear error message
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should manage memory efficiently during long editing sessions', async () => {
      const store = useVideoStore.getState();
      
      // Create project with multiple videos
      store.createProject('Performance Test');
      
      const videoFiles = Array(5).fill(null).map((_, index) => ({
        ...global.mockVideoFile,
        id: `video-${index}`,
        uri: `file://video-${index}.mp4`,
        name: `video-${index}.mp4`,
      }));

      videoFiles.forEach(file => store.addVideoFile(file));

      // Process multiple videos
      for (const file of videoFiles.slice(0, 3)) {
        const result = await videoEngine.processVideo(
          file.uri,
          `file://processed-${file.id}.mp4`,
          {
            quality: 'medium',
            resolution: '720p',
            fps: 30,
            codec: 'h264',
          }
        );
        
        // Each processing should succeed independently
        expect(result.success).toBe(true);
      }

      // Memory should be managed properly
      expect(useVideoStore.getState().videoFiles).toHaveLength(5);
    });

    it('should handle concurrent processing requests', async () => {
      const processingPromises = Array(3).fill(null).map((_, index) => 
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

      const results = await Promise.allSettled(processingPromises);
      
      // Should handle multiple concurrent requests
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  describe('Data Persistence', () => {
    it('should persist project state correctly', async () => {
      const store = useVideoStore.getState();
      
      // Create and configure project
      store.createProject('Persistence Test');
      
      const videoFile = {
        ...global.mockVideoFile,
        id: 'persistent-video',
      };

      store.addVideoFile(videoFile);

      const currentProject = useVideoStore.getState().currentProject;
      
      // Save project
      await projectManager.saveProject(currentProject!);
      
      // Clear state and reload
      useVideoStore.setState({
        projects: [],
        currentProject: null,
        videoFiles: [],
      });

      // Load project
      const loadedProject = await projectManager.loadProject(currentProject!.id);
      store.loadProject(loadedProject.id);

      // Verify state is restored
      const restoredState = useVideoStore.getState();
      expect(restoredState.currentProject?.name).toBe('Persistence Test');
    });
  });
});