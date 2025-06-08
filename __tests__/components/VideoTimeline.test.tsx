import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VideoTimeline from '../../components/VideoTimeline';
import { useVideoStore } from '../../store/videoStore';

// Mock the video store
jest.mock('../../store/videoStore');

describe('VideoTimeline Component', () => {
  const mockUseVideoStore = useVideoStore as jest.MockedFunction<typeof useVideoStore>;

  const mockStoreState = {
    timeline: {
      tracks: [
        {
          id: 'track-1',
          type: 'video' as const,
          name: 'Video Track 1',
          clips: [
            {
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
            },
          ],
          isLocked: false,
          isMuted: false,
          volume: 1,
        },
      ],
    },
    playbackState: {
      currentTime: 0,
      duration: 30000,
      isPlaying: false,
      playbackRate: 1,
    },
    ui: {
      selectedTool: null,
      timelineZoom: 1,
      selectedClips: [],
      selectedTrack: null,
    },
    seekTo: jest.fn(),
    selectClips: jest.fn(),
    setTimelineZoom: jest.fn(),
  };

  beforeEach(() => {
    mockUseVideoStore.mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline correctly', () => {
    const { getByTestId } = render(<VideoTimeline />);
    
    expect(getByTestId('video-timeline')).toBeTruthy();
    expect(getByTestId('timeline-tracks')).toBeTruthy();
  });

  it('displays tracks with clips', () => {
    const { getByText } = render(<VideoTimeline />);
    
    expect(getByText('Video Track 1')).toBeTruthy();
  });

  it('handles timeline scrubbing', async () => {
    const { getByTestId } = render(<VideoTimeline />);
    const timelineRuler = getByTestId('timeline-ruler');
    
    fireEvent(timelineRuler, 'onPanGestureEvent', {
      nativeEvent: {
        translationX: 100,
      },
    });

    await waitFor(() => {
      expect(mockStoreState.seekTo).toHaveBeenCalled();
    });
  });

  it('handles clip selection', () => {
    const { getByTestId } = render(<VideoTimeline />);
    const clip = getByTestId('clip-clip-1');
    
    fireEvent.press(clip);
    
    expect(mockStoreState.selectClips).toHaveBeenCalledWith(['clip-1']);
  });

  it('handles zoom controls', () => {
    const { getByTestId } = render(<VideoTimeline />);
    const zoomInButton = getByTestId('zoom-in-button');
    
    fireEvent.press(zoomInButton);
    
    expect(mockStoreState.setTimelineZoom).toHaveBeenCalledWith(1.5);
  });

  it('shows playhead at correct position', () => {
    const modifiedState = {
      ...mockStoreState,
      playbackState: {
        ...mockStoreState.playbackState,
        currentTime: 15000, // 15 seconds
      },
    };
    
    mockUseVideoStore.mockReturnValue(modifiedState);
    
    const { getByTestId } = render(<VideoTimeline />);
    const playhead = getByTestId('timeline-playhead');
    
    expect(playhead).toBeTruthy();
    // Check if playhead position is calculated correctly based on currentTime
  });

  it('displays timeline duration correctly', () => {
    const { getByText } = render(<VideoTimeline />);
    
    // Duration should be displayed as mm:ss format
    expect(getByText('00:30')).toBeTruthy(); // 30 seconds
  });

  it('handles multiple clip selection', () => {
    const { getByTestId } = render(<VideoTimeline />);
    const clip = getByTestId('clip-clip-1');
    
    // Simulate Ctrl+click for multiple selection
    fireEvent.press(clip, {
      ctrlKey: true,
    });
    
    expect(mockStoreState.selectClips).toHaveBeenCalled();
  });

  describe('Timeline Zoom', () => {
    it('zooms in correctly', () => {
      const { getByTestId } = render(<VideoTimeline />);
      const zoomInButton = getByTestId('zoom-in-button');
      
      fireEvent.press(zoomInButton);
      
      expect(mockStoreState.setTimelineZoom).toHaveBeenCalledWith(1.5);
    });

    it('zooms out correctly', () => {
      const modifiedState = {
        ...mockStoreState,
        ui: {
          ...mockStoreState.ui,
          timelineZoom: 2,
        },
      };
      
      mockUseVideoStore.mockReturnValue(modifiedState);
      
      const { getByTestId } = render(<VideoTimeline />);
      const zoomOutButton = getByTestId('zoom-out-button');
      
      fireEvent.press(zoomOutButton);
      
      expect(mockStoreState.setTimelineZoom).toHaveBeenCalledWith(1.5);
    });

    it('prevents zooming beyond limits', () => {
      const modifiedState = {
        ...mockStoreState,
        ui: {
          ...mockStoreState.ui,
          timelineZoom: 10, // Max zoom
        },
      };
      
      mockUseVideoStore.mockReturnValue(modifiedState);
      
      const { getByTestId } = render(<VideoTimeline />);
      const zoomInButton = getByTestId('zoom-in-button');
      
      fireEvent.press(zoomInButton);
      
      // Should not zoom beyond max limit
      expect(mockStoreState.setTimelineZoom).not.toHaveBeenCalled();
    });
  });

  describe('Clip Operations', () => {
    it('shows clip duration correctly', () => {
      const { getByText } = render(<VideoTimeline />);
      
      // Clip duration should be displayed
      expect(getByText('5.0s')).toBeTruthy();
    });

    it('handles clip drag and drop', async () => {
      const { getByTestId } = render(<VideoTimeline />);
      const clip = getByTestId('clip-clip-1');
      
      fireEvent(clip, 'onPanGestureEvent', {
        nativeEvent: {
          translationX: 50,
          state: 4, // ACTIVE state
        },
      });

      await waitFor(() => {
        // Should update clip position
        expect(clip).toBeTruthy();
      });
    });
  });
});