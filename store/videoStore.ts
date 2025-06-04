import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AppState, 
  VideoFile, 
  VideoClip, 
  Track, 
  Project, 
  ProcessingTask, 
  Tool, 
  FilterType,
  ExportSettings 
} from '../types/video';

interface VideoStore extends AppState {
  // Video file actions
  addVideoFile: (file: VideoFile) => void;
  removeVideoFile: (id: string) => void;
  updateVideoFile: (id: string, updates: Partial<VideoFile>) => void;

  // Project actions
  createProject: (name: string) => void;
  loadProject: (id: string) => void;
  saveProject: () => void;
  deleteProject: (id: string) => void;

  // Timeline actions
  addClipToTrack: (trackId: string, clip: VideoClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<VideoClip>) => void;
  splitClip: (clipId: string, time: number) => void;
  trimClip: (clipId: string, startTime: number, endTime: number) => void;

  // Selection actions
  selectClip: (clipId: string) => void;
  selectMultipleClips: (clipIds: string[]) => void;
  clearSelection: () => void;

  // Playback actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMute: () => void;

  // Processing actions
  addProcessingTask: (task: ProcessingTask) => void;
  updateProcessingTask: (taskId: string, updates: Partial<ProcessingTask>) => void;
  removeProcessingTask: (taskId: string) => void;

  // Filter actions
  applyFilter: (clipId: string, filterType: FilterType, intensity: number) => void;
  removeFilter: (clipId: string, filterId: string) => void;

  // UI actions
  setSelectedTool: (tool: Tool) => void;
  toggleSidebar: () => void;
  setTimelineHeight: (height: number) => void;
  toggleDarkMode: () => void;

  // Export actions
  exportVideo: (settings: ExportSettings) => Promise<string>;

  // Reset
  reset: () => void;
}

const initialState: AppState = {
  projects: [],
  currentProject: null,
  videoFiles: [],
  timeline: {
    duration: 0,
    currentTime: 0,
    tracks: [
      {
        id: 'video-track-1',
        type: 'video',
        clips: [],
        volume: 1,
        muted: false,
        locked: false,
        visible: true
      },
      {
        id: 'audio-track-1',
        type: 'audio',
        clips: [],
        volume: 1,
        muted: false,
        locked: false,
        visible: true
      }
    ],
    zoom: 1,
    selectedClipIds: []
  },
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    loop: false
  },
  processingTasks: [],
  ui: {
    selectedTool: Tool.SELECT,
    timelineHeight: 200,
    previewMode: 'fit',
    showGrid: false,
    snapToGrid: true,
    darkMode: true,
    sidebarOpen: false
  }
};

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Video file actions
      addVideoFile: (file: VideoFile) => {
        set((state) => ({
          videoFiles: [...state.videoFiles, file]
        }));
      },

      removeVideoFile: (id: string) => {
        set((state) => ({
          videoFiles: state.videoFiles.filter(f => f.id !== id)
        }));
      },

      updateVideoFile: (id: string, updates: Partial<VideoFile>) => {
        set((state) => ({
          videoFiles: state.videoFiles.map(f => 
            f.id === id ? { ...f, ...updates } : f
          )
        }));
      },

      // Project actions
      createProject: (name: string) => {
        const newProject: Project = {
          id: Date.now().toString(),
          name,
          timeline: { ...initialState.timeline },
          videoFiles: [],
          exportSettings: {
            quality: 'high',
            resolution: '1080p',
            format: 'mp4',
            fps: 30
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject,
          timeline: newProject.timeline,
          videoFiles: newProject.videoFiles
        }));
      },

      loadProject: (id: string) => {
        const project = get().projects.find(p => p.id === id);
        if (project) {
          set({
            currentProject: project,
            timeline: project.timeline,
            videoFiles: project.videoFiles
          });
        }
      },

      saveProject: () => {
        const { currentProject, timeline, videoFiles } = get();
        if (currentProject) {
          const updatedProject = {
            ...currentProject,
            timeline,
            videoFiles,
            updatedAt: new Date()
          };

          set((state) => ({
            projects: state.projects.map(p => 
              p.id === currentProject.id ? updatedProject : p
            ),
            currentProject: updatedProject
          }));
        }
      },

      deleteProject: (id: string) => {
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        }));
      },

      // Timeline actions
      addClipToTrack: (trackId: string, clip: VideoClip) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            tracks: state.timeline.tracks.map(track =>
              track.id === trackId
                ? { ...track, clips: [...track.clips, clip] }
                : track
            )
          }
        }));
      },

      removeClip: (clipId: string) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            tracks: state.timeline.tracks.map(track => ({
              ...track,
              clips: track.clips.filter(clip => clip.id !== clipId)
            })),
            selectedClipIds: state.timeline.selectedClipIds.filter(id => id !== clipId)
          }
        }));
      },

      updateClip: (clipId: string, updates: Partial<VideoClip>) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            tracks: state.timeline.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip =>
                clip.id === clipId ? { ...clip, ...updates } : clip
              )
            }))
          }
        }));
      },

      splitClip: (clipId: string, time: number) => {
        // Implementation for splitting a clip at a specific time
        const { timeline } = get();
        const clip = timeline.tracks
          .flatMap(track => track.clips)
          .find(c => c.id === clipId);

        if (clip && time > clip.startTime && time < clip.endTime) {
          const newClip: VideoClip = {
            ...clip,
            id: Date.now().toString(),
            startTime: time,
            position: clip.position + (time - clip.startTime)
          };

          get().updateClip(clipId, { endTime: time });
          get().addClipToTrack(clip.trackIndex.toString(), newClip);
        }
      },

      trimClip: (clipId: string, startTime: number, endTime: number) => {
        get().updateClip(clipId, {
          startTime,
          endTime,
          duration: endTime - startTime
        });
      },

      // Selection actions
      selectClip: (clipId: string) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            selectedClipIds: [clipId]
          }
        }));
      },

      selectMultipleClips: (clipIds: string[]) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            selectedClipIds: clipIds
          }
        }));
      },

      clearSelection: () => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            selectedClipIds: []
          }
        }));
      },

      // Playback actions
      play: () => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            isPlaying: true
          }
        }));
      },

      pause: () => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            isPlaying: false
          }
        }));
      },

      stop: () => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            isPlaying: false,
            currentTime: 0
          },
          timeline: {
            ...state.timeline,
            currentTime: 0
          }
        }));
      },

      setCurrentTime: (time: number) => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            currentTime: time
          },
          timeline: {
            ...state.timeline,
            currentTime: time
          }
        }));
      },

      setVolume: (volume: number) => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            volume: Math.max(0, Math.min(1, volume))
          }
        }));
      },

      setPlaybackRate: (rate: number) => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            playbackRate: rate
          }
        }));
      },

      toggleMute: () => {
        set((state) => ({
          playbackState: {
            ...state.playbackState,
            muted: !state.playbackState.muted
          }
        }));
      },

      // Processing actions
      addProcessingTask: (task: ProcessingTask) => {
        set((state) => ({
          processingTasks: [...state.processingTasks, task]
        }));
      },

      updateProcessingTask: (taskId: string, updates: Partial<ProcessingTask>) => {
        set((state) => ({
          processingTasks: state.processingTasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        }));
      },

      removeProcessingTask: (taskId: string) => {
        set((state) => ({
          processingTasks: state.processingTasks.filter(task => task.id !== taskId)
        }));
      },

      // Filter actions
      applyFilter: (clipId: string, filterType: FilterType, intensity: number) => {
        const filter = {
          id: Date.now().toString(),
          type: filterType,
          parameters: {},
          intensity
        };

        get().updateClip(clipId, {
          filters: [
            ...get().timeline.tracks
              .flatMap(track => track.clips)
              .find(c => c.id === clipId)?.filters || [],
            filter
          ]
        });
      },

      removeFilter: (clipId: string, filterId: string) => {
        const clip = get().timeline.tracks
          .flatMap(track => track.clips)
          .find(c => c.id === clipId);

        if (clip) {
          get().updateClip(clipId, {
            filters: clip.filters.filter(f => f.id !== filterId)
          });
        }
      },

      // UI actions
      setSelectedTool: (tool: Tool) => {
        set((state) => ({
          ui: {
            ...state.ui,
            selectedTool: tool
          }
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            sidebarOpen: !state.ui.sidebarOpen
          }
        }));
      },

      setTimelineHeight: (height: number) => {
        set((state) => ({
          ui: {
            ...state.ui,
            timelineHeight: height
          }
        }));
      },

      toggleDarkMode: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            darkMode: !state.ui.darkMode
          }
        }));
      },

      // Export actions
      exportVideo: async (settings: ExportSettings): Promise<string> => {
        // This will be implemented with actual video processing
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('exported-video-uri');
          }, 3000);
        });
      },

      // Reset
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'nova-edit-mobile-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        ui: {
          ...state.ui,
          sidebarOpen: false // Don't persist sidebar state
        }
      })
    }
  )
);