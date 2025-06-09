import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  VideoFile,
  VideoClip,
  // Track, // Track is part of AppState.timeline
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
  updateTimelineDuration: () => void; // Action to recalculate timeline duration

  // Selection actions
  selectClip: (clipId: string) => void;
  selectMultipleClips: (clipIds: string[]) => void;
  clearSelection: () => void;

  // Playback actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void; // Will primarily update timeline.currentTime
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
  videoFiles: [], // Files specific to the current project
  timeline: {
    duration: 0,    // Overall duration of the timeline
    currentTime: 0, // Current playback/seek position on the timeline
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
  playbackState: { // State purely for AV playback component
    isPlaying: false,
    // currentTime and duration will be driven by timeline state via selectors/effects for playback component
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

// Selectors
export const selectIsPlaying = (state: AppState) => state.playbackState.isPlaying;
export const selectCurrentTimelineTime = (state: AppState) => state.timeline.currentTime;
export const selectTimelineDuration = (state: AppState) => state.timeline.duration;
export const selectSelectedClips = (state: AppState) => {
  const selectedIds = new Set(state.timeline.selectedClipIds);
  return state.timeline.tracks.flatMap(track => track.clips.filter(clip => selectedIds.has(clip.id)));
};
export const selectCurrentProject = (state: AppState) => state.currentProject;
export const selectProcessingTasks = (state: AppState) => state.processingTasks;
export const selectVideoFiles = (state: AppState) => state.videoFiles; // Files for the current project
export const selectAllTimelineClips = (state: AppState) => state.timeline.tracks.flatMap(track => track.clips);

/**
 * Documentation on Selectors:
 * The selectors (selectIsPlaying, selectCurrentTimelineTime, etc.) are exported
 * and should be used by components to subscribe to specific parts of the state.
 * This is the recommended way to consume the store to optimize performance by
 * preventing unnecessary re-renders when unrelated parts of the state change.
 *
 * Example usage in a component:
 * import { useVideoStore, selectIsPlaying } from './videoStore';
 * // import { shallow } from 'zustand/shallow'; // For non-primitive selectors
 *
 * const MyComponent = () => {
 *   const isPlaying = useVideoStore(selectIsPlaying);
 *   // const selectedClips = useVideoStore(selectSelectedClips, shallow); // Example with shallow
 *   // ...
 * };
 */

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

      updateTimelineDuration: () => {
        set(state => {
          const newDuration = state.timeline.tracks.reduce((max, track) =>
            Math.max(max, ...track.clips.map(c => c.position + c.duration)), 0);
          if (state.timeline.duration !== newDuration) {
            return {
              timeline: {
                ...state.timeline,
                duration: newDuration,
              }
            };
          }
          return {}; // No change
        });
      },

      // Project actions
      createProject: (name: string) => {
        const newProject: Project = {
          id: Date.now().toString(),
          name,
          // Ensure tracks are fresh and empty for a new project, inheriting other timeline defaults
          timeline: { ...initialState.timeline, tracks: initialState.timeline.tracks.map(t => ({...t, clips:[]})) },
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
          timeline: { ...newProject.timeline },
          videoFiles: [],
          playbackState: { ...initialState.playbackState },
        }));
      },

      loadProject: (id: string) => {
        const project = get().projects.find(p => p.id === id);
        if (project) {
          set({
            currentProject: project,
            timeline: project.timeline,
            videoFiles: project.videoFiles,
            playbackState: { ...initialState.playbackState },
          });
        }
      },

      saveProject: () => {
        const { currentProject, timeline, videoFiles } = get();
        if (currentProject) {
          // Ensure timeline duration is up-to-date before saving
          const currentTimelineDuration = timeline.tracks.reduce((max, track) =>
            Math.max(max, ...track.clips.map(c => c.position + c.duration)), 0);

          const updatedProject: Project = {
            ...currentProject,
            timeline: { ...timeline, duration: currentTimelineDuration },
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
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          ...(state.currentProject?.id === id ? {
            videoFiles: [],
            timeline: { ...initialState.timeline, tracks: initialState.timeline.tracks.map(t => ({...t, clips:[]})) },
            playbackState: { ...initialState.playbackState }
          } : {})
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
        get().updateTimelineDuration();
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
        get().updateTimelineDuration();
      },

      updateClip: (clipId: string, updates: Partial<VideoClip>) => {
        let clipFoundAndUpdated = false;
        set((state) => ({
          timeline: {
            ...state.timeline,
            tracks: state.timeline.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip => {
                if (clip.id === clipId) {
                  clipFoundAndUpdated = true;
                  return { ...clip, ...updates };
                }
                return clip;
              })
            }))
          }
        }));
        if (clipFoundAndUpdated) {
          get().updateTimelineDuration();
        }
      },

      splitClip: (clipId: string, time: number) => {
        const { timeline } = get();
        let targetTrackId: string | null = null;
        const clipToSplit = timeline.tracks
          .flatMap(track => {
            const foundClip = track.clips.find(c => c.id === clipId);
            if (foundClip) targetTrackId = track.id;
            return foundClip ? [foundClip] : [];
          })[0];

        if (clipToSplit && targetTrackId && time > clipToSplit.startTime && time < clipToSplit.endTime) {
          const firstPartDuration = time - clipToSplit.startTime;
          const secondPartDuration = clipToSplit.endTime - time;

          const newClip: VideoClip = {
            ...clipToSplit,
            id: Date.now().toString() + '_split',
            startTime: clipToSplit.startTime + firstPartDuration, // Original asset start time for the second part
            duration: secondPartDuration,
            position: clipToSplit.position + firstPartDuration, // Timeline position for the second part
            endTime: clipToSplit.endTime // Original asset end time for the second part remains same as original clip's end initially
          };

          get().updateClip(clipId, {
            duration: firstPartDuration,
            endTime: time // New end time for the first part in original asset context
          });
          get().addClipToTrack(targetTrackId, newClip);
        }
      },

      trimClip: (clipId: string, newStartTimeInAsset: number, newEndTimeInAsset: number) => {
        // newStartTimeInAsset and newEndTimeInAsset are absolute times in the original video file.
        // The clip's position on the main timeline does not change.
        const clip = get().timeline.tracks
          .flatMap(track => track.clips)
          .find(c => c.id === clipId);

        if (clip) {
          const newDuration = newEndTimeInAsset - newStartTimeInAsset;
          if (newDuration > 0) {
            get().updateClip(clipId, {
              startTime: newStartTimeInAsset, // This is the new start offset in the original video asset
              duration: newDuration,
              endTime: newEndTimeInAsset,     // This is the new end offset in the original video asset
            });
          }
        }
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
          playbackState: { ...state.playbackState, isPlaying: true }
        }));
      },

      pause: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, isPlaying: false }
        }));
      },

      stop: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, isPlaying: false },
          timeline: { ...state.timeline, currentTime: 0 }
        }));
      },

      setCurrentTime: (time: number) => {
        set((state) => ({
          timeline: { ...state.timeline, currentTime: time }
        }));
      },

      setVolume: (volume: number) => {
        set((state) => ({
          playbackState: { ...state.playbackState, volume: Math.max(0, Math.min(1, volume)) }
        }));
      },

      setPlaybackRate: (rate: number) => {
        set((state) => ({
          playbackState: { ...state.playbackState, playbackRate: rate }
        }));
      },

      toggleMute: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, muted: !state.playbackState.muted }
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

        const clip = get().timeline.tracks
          .flatMap(track => track.clips)
          .find(c => c.id === clipId);

        if (clip) {
          get().updateClip(clipId, {
            filters: [...(clip.filters || []), filter]
          });
        }
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
          ui: { ...state.ui, selectedTool: tool }
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
        }));
      },

      setTimelineHeight: (height: number) => {
        set((state) => ({
          ui: { ...state.ui, timelineHeight: height }
        }));
      },

      toggleDarkMode: () => {
        set((state) => ({
          ui: { ...state.ui, darkMode: !state.ui.darkMode }
        }));
      },

      // Export actions
      exportVideo: async (settings: ExportSettings): Promise<string> => {
        const taskId = `export_${Date.now()}`;
        get().addProcessingTask({
          id: taskId,
          name: `Exporting video (${settings.resolution})`,
          progress: 0,
          status: 'processing'
        });

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            get().updateProcessingTask(taskId, { progress: 50, status: 'processing' });
          }, 1500);
          setTimeout(() => {
            const success = Math.random() > 0.2;
            if (success) {
              get().updateProcessingTask(taskId, { progress: 100, status: 'completed' });
              resolve('exported-video-uri');
            } else {
              get().updateProcessingTask(taskId, { progress: 0, status: 'failed', error: 'Simulated export error' });
              reject(new Error('Simulated export error'));
            }
          }, 3000);
        });
      },

      // Reset
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'nova-edit-mobile-store', // unique name
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { playbackState, processingTasks, ui, timeline, ...restOfState } = state;
        return {
          ...restOfState, // Persists projects, currentProject, videoFiles (if top-level)
          timeline: { // Persist essential timeline data, excluding transient parts
            duration: timeline.duration,
            tracks: timeline.tracks, // Assuming clips within tracks are desired to be persisted
            zoom: timeline.zoom,
            // Excluded: currentTime, selectedClipIds
          },
          ui: { // Persist only non-transient UI settings
            timelineHeight: ui.timelineHeight,
            previewMode: ui.previewMode,
            showGrid: ui.showGrid,
            snapToGrid: ui.snapToGrid,
            darkMode: ui.darkMode,
            // Excluded: sidebarOpen, selectedTool
          },
        };
      },
    }
  )
);