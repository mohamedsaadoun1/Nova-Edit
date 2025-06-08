import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, PanResponder } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { VideoFile, Timeline, PlaybackState } from '../types/video';

interface VideoPreviewProps {
  style?: any;
  videoFiles: VideoFile[];
  timeline: Timeline;
  playbackState: PlaybackState;
  onTimeUpdate: (time: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoPreview({
  style,
  videoFiles,
  timeline,
  playbackState,
  onTimeUpdate
}: VideoPreviewProps) {
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const currentVideoFile = videoFiles.length > 0 ? videoFiles[0] : null;

  // إيماءات اللمس للتحكم في الفيديو
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: () => {
      // إظهار أدوات التحكم عند اللمس
      showControlsTemporarily();
    },
    
    onPanResponderMove: (evt, gestureState) => {
      // التحكم في مستوى الصوت بالحركة العمودية
      if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
        const volumeChange = -gestureState.dy / 200;
        // يمكن إضافة تغيير مستوى الصوت هنا
      }
      
      // التحكم في الوقت بالحركة الأفقية
      if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
        const timeChange = gestureState.dx / screenWidth * timeline.duration;
        const newTime = Math.max(0, Math.min(timeline.duration, timeline.currentTime + timeChange));
        onTimeUpdate(newTime);
      }
    }
  });

  useEffect(() => {
    if (videoRef.current) {
      if (playbackState.isPlaying) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [playbackState.isPlaying]);

  useEffect(() => {
    if (videoRef.current && timeline.currentTime !== playbackState.currentTime) {
      videoRef.current.setPositionAsync(timeline.currentTime * 1000);
    }
  }, [timeline.currentTime]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setVideoStatus(status);
    
    if (status.isLoaded && status.positionMillis !== undefined) {
      const currentTime = status.positionMillis / 1000;
      onTimeUpdate(currentTime);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (playbackState.isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  };

  if (!currentVideoFile) {
    return (
      <View style={[styles.container, style, styles.emptyContainer]}>
        <Ionicons name="videocam-outline" size={64} color="#666" />
        <Text style={styles.emptyText}>لا يوجد فيديو للمعاينة</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      <Video
        ref={videoRef}
        source={{ uri: currentVideoFile.uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={playbackState.isPlaying}
        isLooping={playbackState.loop}
        volume={playbackState.muted ? 0 : playbackState.volume}
        rate={playbackState.playbackRate}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        useNativeControls={false}
      />

      {/* Overlay Controls */}
      {showControls && (
        <View style={styles.overlayControls}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Ionicons 
              name={playbackState.isPlaying ? "pause" : "play"} 
              size={48} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {/* نص معلومات الفيديو */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoInfoText}>
              {currentVideoFile.name}
            </Text>
            <Text style={styles.videoInfoText}>
              {formatTime(playbackState.currentTime)} / {formatTime(timeline.duration)}
            </Text>
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {videoStatus && !videoStatus.isLoaded && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(playbackState.currentTime / timeline.duration) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>

      {/* Gesture Hints */}
      <View style={styles.gestureHints}>
        <Text style={styles.gestureHintText}>
          اسحب أفقياً للتنقل • اسحب عمودياً للصوت
        </Text>
      </View>
    </View>
  );
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  overlayControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  videoInfoText: {
    color: '#fff',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 1.5,
  },
  gestureHints: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gestureHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
});