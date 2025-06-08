import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timeline, VideoClip, Track } from '../types/video';

interface VideoTimelineProps {
  timeline: Timeline;
  onTimeChange: (time: number) => void;
  onClipSelect: (clipId: string) => void;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const PIXELS_PER_SECOND = 20;
const TRACK_HEIGHT = 60;
const RULER_HEIGHT = 30;

export default function VideoTimeline({
  timeline,
  onTimeChange,
  onClipSelect,
  style
}: VideoTimelineProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(screenWidth);
  const playheadPosition = useRef(new Animated.Value(0)).current;

  const totalWidth = Math.max(timeline.duration * PIXELS_PER_SECOND, screenWidth);

  // تحديث موضع رأس التشغيل
  useEffect(() => {
    if (!isDraggingPlayhead) {
      const position = timeline.currentTime * PIXELS_PER_SECOND;
      Animated.timing(playheadPosition, {
        toValue: position,
        duration: 100,
        useNativeDriver: false
      }).start();
    }
  }, [timeline.currentTime, isDraggingPlayhead]);

  // إيماءات سحب رأس التشغيل
  const playheadPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: () => {
      setIsDraggingPlayhead(true);
    },
    
    onPanResponderMove: (evt, gestureState) => {
      const newPosition = Math.max(0, Math.min(totalWidth, gestureState.moveX));
      const newTime = newPosition / PIXELS_PER_SECOND;
      
      playheadPosition.setValue(newPosition);
      onTimeChange(newTime);
    },
    
    onPanResponderRelease: () => {
      setIsDraggingPlayhead(false);
    }
  });

  const renderTimeRuler = () => {
    const marks = [];
    const interval = 5; // علامة كل 5 ثوانٍ
    
    for (let i = 0; i <= timeline.duration; i += interval) {
      const position = i * PIXELS_PER_SECOND;
      marks.push(
        <View key={i} style={[styles.timeMark, { left: position }]}>
          <View style={styles.timeMarkLine} />
          <Text style={styles.timeMarkText}>{formatTime(i)}</Text>
        </View>
      );
    }
    
    return marks;
  };

  const renderTrack = (track: Track, index: number) => {
    return (
      <View key={track.id} style={styles.track}>
        {/* Track Header */}
        <View style={styles.trackHeader}>
          <Text style={styles.trackTitle}>
            {track.type === 'video' ? 'فيديو' : 
             track.type === 'audio' ? 'صوت' : 'نص'}
          </Text>
          
          <View style={styles.trackControls}>
            <TouchableOpacity>
              <Ionicons 
                name={track.muted ? "volume-mute" : "volume-medium"} 
                size={16} 
                color={track.muted ? "#666" : "#fff"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity>
              <Ionicons 
                name={track.visible ? "eye" : "eye-off"} 
                size={16} 
                color={track.visible ? "#fff" : "#666"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Track Content */}
        <View style={styles.trackContent}>
          {track.clips.map(clip => renderClip(clip, track.type))}
        </View>
      </View>
    );
  };

  const renderClip = (clip: VideoClip, trackType: string) => {
    const clipWidth = clip.duration * PIXELS_PER_SECOND;
    const clipLeft = clip.position * PIXELS_PER_SECOND;
    const isSelected = timeline.selectedClipIds.includes(clip.id);

    return (
      <TouchableOpacity
        key={clip.id}
        style={[
          styles.clip,
          {
            left: clipLeft,
            width: clipWidth,
            backgroundColor: getClipColor(trackType, isSelected)
          }
        ]}
        onPress={() => onClipSelect(clip.id)}
      >
        <View style={styles.clipContent}>
          <Text style={styles.clipText} numberOfLines={1}>
            {`Clip ${clip.id.slice(-4)}`}
          </Text>
          
          {/* مؤشرات الفلاتر */}
          {clip.filters.length > 0 && (
            <View style={styles.filterIndicator}>
              <Ionicons name="color-filter" size={12} color="#fff" />
            </View>
          )}
          
          {/* مؤشر السرعة */}
          {clip.speed !== 1 && (
            <View style={styles.speedIndicator}>
              <Text style={styles.speedText}>{clip.speed}x</Text>
            </View>
          )}
        </View>

        {/* مقابض التحرير */}
        {isSelected && (
          <>
            <View style={[styles.clipHandle, styles.leftHandle]} />
            <View style={[styles.clipHandle, styles.rightHandle]} />
          </>
        )}
      </TouchableOpacity>
    );
  };

  const getClipColor = (trackType: string, isSelected: boolean) => {
    let baseColor;
    switch (trackType) {
      case 'video':
        baseColor = '#007AFF';
        break;
      case 'audio':
        baseColor = '#34C759';
        break;
      case 'text':
        baseColor = '#FF9500';
        break;
      default:
        baseColor = '#666';
    }
    
    return isSelected ? baseColor : `${baseColor}CC`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Time Ruler */}
      <View style={styles.ruler}>
        <View style={styles.rulerContent} style={{ width: totalWidth }}>
          {renderTimeRuler()}
        </View>
      </View>

      {/* Tracks */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tracksContainer}
        contentContainerStyle={{ width: totalWidth }}
      >
        <View style={styles.tracksContent}>
          {timeline.tracks.map((track, index) => renderTrack(track, index))}
        </View>

        {/* Playhead */}
        <Animated.View
          style={[
            styles.playhead,
            {
              left: playheadPosition,
              height: timeline.tracks.length * TRACK_HEIGHT + RULER_HEIGHT
            }
          ]}
          {...playheadPanResponder.panHandlers}
        >
          <View style={styles.playheadLine} />
          <View style={styles.playheadHandle} />
        </Animated.View>
      </ScrollView>

      {/* Timeline Controls */}
      <View style={styles.timelineControls}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="remove" size={16} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.zoomLevel}>{Math.round(timeline.zoom * 100)}%</Text>
        
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="fit-screen" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  ruler: {
    height: RULER_HEIGHT,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  rulerContent: {
    height: '100%',
    position: 'relative',
  },
  timeMark: {
    position: 'absolute',
    top: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeMarkLine: {
    width: 1,
    height: 10,
    backgroundColor: '#666',
  },
  timeMarkText: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
  tracksContainer: {
    flex: 1,
  },
  tracksContent: {
    flex: 1,
  },
  track: {
    height: TRACK_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
  },
  trackHeader: {
    width: 80,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: '#333',
    justifyContent: 'space-between',
  },
  trackTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trackContent: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  clip: {
    position: 'absolute',
    height: TRACK_HEIGHT - 10,
    top: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  clipContent: {
    flex: 1,
    padding: 4,
    justifyContent: 'space-between',
  },
  clipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  speedIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  speedText: {
    color: '#fff',
    fontSize: 8,
  },
  clipHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  leftHandle: {
    left: -4,
  },
  rightHandle: {
    right: -4,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    width: 2,
    zIndex: 1000,
  },
  playheadLine: {
    flex: 1,
    backgroundColor: '#FF3B30',
    width: 2,
  },
  playheadHandle: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 12,
    height: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  zoomLevel: {
    color: '#ccc',
    fontSize: 12,
    marginHorizontal: 12,
  },
});