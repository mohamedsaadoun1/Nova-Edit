import { useVideoStore } from '../../store/videoStore';
import { VideoFile, Project, VideoClip } from '../../types/video';

// Mock AsyncStorage for Zustand persist
jest.mock('@react-native-async-storage/async-storage');

describe('VideoStore', () => {
  let store: ReturnType<typeof useVideoStore>;

  beforeEach(() => {
    // Reset store state before each test
    store = useVideoStore.getState();
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

  describe('Video Files Management', () => {
    it('should add video file correctly', () => {
      const mockVideo: VideoFile = {
        ...global.mockVideoFile,
        id: 'video-1',
        name: 'test-video.mp4',
      };

      store.addVideoFile(mockVideo);
      const state = useVideoStore.getState();
      
      expect(state.videoFiles).toHaveLength(1);
      expect(state.videoFiles[0]).toEqual(mockVideo);
    });

    it('should remove video file correctly', () => {
      const mockVideo: VideoFile = {
        ...global.mockVideoFile,
        id: 'video-1',
      };

      store.addVideoFile(mockVideo);
      store.removeVideoFile('video-1');
      
      const state = useVideoStore.getState();
      expect(state.videoFiles).toHaveLength(0);
    });

    it('should update video file correctly', () => {
      const mockVideo: VideoFile = {
        ...global.mockVideoFile,
        id: 'video-1',
        name: 'original-name.mp4',
      };

      store.addVideoFile(mockVideo);
      store.updateVideoFile('video-1', { name: 'updated-name.mp4' });
      
      const state = useVideoStore.getState();
      expect(state.videoFiles[0].name).toBe('updated-name.mp4');
    });
  });

  describe('Project Management', () => {
    it('should create new project correctly', () => {
      store.createProject('Test Project');
      
      const state = useVideoStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.currentProject?.name).toBe('Test Project');
      expect(state.currentProject?.id).toBeDefined();
    });

    it('should load existing project', () => {
      const mockProject: Project = {
        ...global.mockProject,
        id: 'project-1',
        name: 'Loaded Project',
      };

      // First add project to the store
      useVideoStore.setState({
        projects: [mockProject],
        currentProject: null,
      });

      store.loadProject('project-1');
      
      const state = useVideoStore.getState();
      expect(state.currentProject?.id).toBe('project-1');
      expect(state.currentProject?.name).toBe('Loaded Project');
    });

    it('should delete project correctly', () => {
      const mockProject: Project = {
        ...global.mockProject,
        id: 'project-1',
      };

      useVideoStore.setState({
        projects: [mockProject],
        currentProject: mockProject,
      });

      store.deleteProject('project-1');
      
      const state = useVideoStore.getState();
      expect(state.projects).toHaveLength(0);
      expect(state.currentProject).toBeNull();
    });
  });

  describe('Timeline Operations', () => {
    beforeEach(() => {
      // Set up a project with tracks
      const mockProject: Project = {
        ...global.mockProject,
        tracks: [
          {
            id: 'track-1',
            type: 'video',
            name: 'Video Track 1',
            clips: [],
            isLocked: false,
            isMuted: false,
            volume: 1,
          },
        ],
      };

      useVideoStore.setState({
        currentProject: mockProject,
        timeline: { tracks: mockProject.tracks },
      });
    });

    it('should add clip to track correctly', () => {
      const mockClip: VideoClip = {
        id: 'clip-1',
        videoFileId: 'video-1',
        startTime: 0,
        endTime: 5000,
        trackStartTime: 0,
        duration: 5000,
        trimStart: 0,
        trimEnd: 5000,
        filters: [],
        transforms: {
          scale: 1,
          rotation: 0,
          x: 0,
          y: 0,
        },
      };

      store.addClipToTrack('track-1', mockClip);
      
      const state = useVideoStore.getState();
      const track = state.timeline.tracks.find(t => t.id === 'track-1');
      expect(track?.clips).toHaveLength(1);
      expect(track?.clips[0]).toEqual(mockClip);
    });

    it('should remove clip correctly', () => {
      const mockClip: VideoClip = {
        id: 'clip-1',
        videoFileId: 'video-1',
        startTime: 0,
        endTime: 5000,
        trackStartTime: 0,
        duration: 5000,
        trimStart: 0,
        trimEnd: 5000,
        filters: [],
        transforms: {
          scale: 1,
          rotation: 0,
          x: 0,
          y: 0,
        },
      };

      store.addClipToTrack('track-1', mockClip);
      store.removeClip('clip-1');
      
      const state = useVideoStore.getState();
      const track = state.timeline.tracks.find(t => t.id === 'track-1');
      expect(track?.clips).toHaveLength(0);
    });
  });

  describe('Playback Control', () => {
    it('should play video correctly', () => {
      store.play();
      
      const state = useVideoStore.getState();
      expect(state.playbackState.isPlaying).toBe(true);
    });

    it('should pause video correctly', () => {
      store.play();
      store.pause();
      
      const state = useVideoStore.getState();
      expect(state.playbackState.isPlaying).toBe(false);
    });

    it('should seek to specific time', () => {
      store.seekTo(15000);
      
      const state = useVideoStore.getState();
      expect(state.playbackState.currentTime).toBe(15000);
    });

    it('should set playback rate correctly', () => {
      store.setPlaybackRate(2);
      
      const state = useVideoStore.getState();
      expect(state.playbackState.playbackRate).toBe(2);
    });
  });

  describe('UI State Management', () => {
    it('should select tool correctly', () => {
      store.selectTool('trim');
      
      const state = useVideoStore.getState();
      expect(state.ui.selectedTool).toBe('trim');
    });

    it('should set timeline zoom correctly', () => {
      store.setTimelineZoom(2.5);
      
      const state = useVideoStore.getState();
      expect(state.ui.timelineZoom).toBe(2.5);
    });

    it('should select clips correctly', () => {
      store.selectClips(['clip-1', 'clip-2']);
      
      const state = useVideoStore.getState();
      expect(state.ui.selectedClips).toEqual(['clip-1', 'clip-2']);
    });
  });
});