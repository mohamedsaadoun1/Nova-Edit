import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  PanResponder
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useVideoStore } from '../../store/videoStore';
import { VideoFile, Tool, FilterType } from '../../types/video';
import VideoTimeline from '../../components/VideoTimeline';
import VideoPreview from '../../components/VideoPreview';
import ToolPanel from '../../components/ToolPanel';
import FilterPanel from '../../components/FilterPanel';
import ProjectManager from '../../components/ProjectManager';
import CameraScreen from '../../components/CameraScreen';
import TextOverlayEditor from '../../components/TextOverlayEditor';
import TransitionsEditor from '../../components/TransitionsEditor';
import AudioEditor from '../../components/AudioEditor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoEditor() {
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showTransitions, setShowTransitions] = useState(false);
  const [showAudioEditor, setShowAudioEditor] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const timelineHeight = useRef(new Animated.Value(200)).current;
  const toolPanelOpacity = useRef(new Animated.Value(1)).current;

  const {
    currentProject,
    videoFiles,
    timeline,
    playbackState,
    ui,
    processingTasks,
    addVideoFile,
    createProject,
    play,
    pause,
    setSelectedTool,
    applyFilter,
    setCurrentTime
  } = useVideoStore();

  useEffect(() => {
    // تشغيل الرسوم المتحركة عند فتح التطبيق
    Animated.parallel([
      Animated.timing(timelineHeight, {
        toValue: ui.sidebarOpen ? 300 : 200,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(toolPanelOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false
      })
    ]).start();
  }, [ui.sidebarOpen]);

  const requestPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إلى إذن الوصول لمكتبة الوسائط');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const importVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsImporting(true);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: false,
        multiple: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          const videoFile: VideoFile = {
            id: Date.now().toString() + Math.random(),
            name: asset.name || 'video.mp4',
            uri: asset.uri,
            size: asset.size || 0,
            duration: 0, // سيتم حساب المدة لاحقاً
            width: 1920,
            height: 1080,
            format: asset.mimeType || 'video/mp4'
          };
          
          addVideoFile(videoFile);
        }
        
        // إنشاء مشروع جديد إذا لم يكن موجود
        if (!currentProject) {
          createProject('مشروع جديد');
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء استيراد الفيديو');
      console.error('Video import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const togglePlayback = () => {
    if (playbackState.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const onToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    
    // إظهار الأدوات المناسبة
    switch (tool) {
      case Tool.FILTER:
        setShowFilters(true);
        break;
      case Tool.TEXT:
        setShowTextEditor(true);
        break;
      case Tool.TRANSITION:
        setShowTransitions(true);
        break;
      case Tool.AUDIO:
        setShowAudioEditor(true);
        break;
      default:
        // إخفاء جميع النوافذ المنبثقة
        setShowFilters(false);
        setShowTextEditor(false);
        setShowTransitions(false);
        setShowAudioEditor(false);
        break;
    }
  };

  const onFilterApply = (clipId: string, filterType: FilterType, intensity: number) => {
    applyFilter(clipId, filterType, intensity);
    Alert.alert('نجح', 'تم تطبيق الفلتر بنجاح');
  };

  const isProcessing = processingTasks.some(task => task.status === 'processing');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowProjectManager(true)}>
          <Ionicons name="folder-outline" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentProject?.name || 'Nova Edit Mobile'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowCamera(true)} 
            style={styles.headerActionButton}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={importVideo} disabled={isImporting}>
            <Ionicons 
              name={isImporting ? "hourglass-outline" : "add-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Video Preview */}
        <VideoPreview 
          style={styles.preview}
          videoFiles={videoFiles}
          timeline={timeline}
          playbackState={playbackState}
          onTimeUpdate={setCurrentTime}
        />

        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity onPress={() => setCurrentTime(0)}>
            <Ionicons name="play-skip-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={togglePlayback}
            style={styles.playButton}
            disabled={videoFiles.length === 0}
          >
            <Ionicons 
              name={playbackState.isPlaying ? "pause" : "play"} 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setCurrentTime(timeline.duration)}>
            <Ionicons name="play-skip-forward" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {formatTime(playbackState.currentTime)} / {formatTime(timeline.duration)}
            </Text>
          </View>
        </View>

        {/* Tool Panel */}
        <Animated.View style={[styles.toolPanel, { opacity: toolPanelOpacity }]}>
          <ToolPanel 
            selectedTool={ui.selectedTool}
            onToolSelect={onToolSelect}
            disabled={videoFiles.length === 0}
          />
        </Animated.View>

        {/* Timeline */}
        <Animated.View style={[styles.timelineContainer, { height: timelineHeight }]}>
          <VideoTimeline 
            timeline={timeline}
            onTimeChange={setCurrentTime}
            onClipSelect={(clipId) => {
              // Handle clip selection
            }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <Ionicons name="hourglass-outline" size={32} color="#007AFF" />
            <Text style={styles.processingText}>جاري المعالجة...</Text>
          </View>
        </View>
      )}

      {/* Modals */}
      {showProjectManager && (
        <ProjectManager 
          visible={showProjectManager}
          onClose={() => setShowProjectManager(false)}
        />
      )}

      {showFilters && (
        <FilterPanel 
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilter={onFilterApply}
          selectedClips={timeline.selectedClipIds}
        />
      )}

      {/* Camera Screen */}
      <CameraScreen 
        visible={showCamera}
        onClose={() => setShowCamera(false)}
      />

      {/* Text Overlay Editor */}
      {showTextEditor && (
        <TextOverlayEditor 
          visible={showTextEditor}
          onClose={() => setShowTextEditor(false)}
          onSave={(overlay) => {
            // Handle text overlay save
            Alert.alert('نجح', 'تم إضافة النص بنجاح');
            setShowTextEditor(false);
          }}
          videoDuration={timeline.duration}
        />
      )}

      {/* Transitions Editor */}
      {showTransitions && (
        <TransitionsEditor 
          visible={showTransitions}
          onClose={() => setShowTransitions(false)}
          onApplyTransition={(clipId, transition) => {
            // Handle transition application
            Alert.alert('نجح', `تم تطبيق انتقال ${transition.name} بنجاح`);
            setShowTransitions(false);
          }}
          selectedClipId={timeline.selectedClipIds[0] || null}
        />
      )}

      {/* Audio Editor */}
      {showAudioEditor && (
        <AudioEditor 
          visible={showAudioEditor}
          onClose={() => setShowAudioEditor(false)}
          audioTracks={[]} // يمكن إضافة مسارات الصوت هنا
          onUpdateTrack={(trackId, updates) => {
            // Handle audio track updates
          }}
          onAddTrack={(track) => {
            // Handle new audio track
            Alert.alert('نجح', 'تم إضافة المسار الصوتي بنجاح');
          }}
          selectedTrackId={null}
          videoDuration={timeline.duration}
        />
      )}

      {/* Empty State */}
      {videoFiles.length === 0 && !isImporting && (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-outline" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>ابدأ مشروعك الأول</Text>
          <Text style={styles.emptyStateText}>
            اضغط على + لاستيراد فيديو وابدأ في التحرير
          </Text>
          <TouchableOpacity style={styles.importButton} onPress={importVideo}>
            <Text style={styles.importButtonText}>استيراد فيديو</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  preview: {
    flex: 1,
    backgroundColor: '#000',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  playButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  timeDisplay: {
    position: 'absolute',
    right: 20,
  },
  timeText: {
    color: '#ccc',
    fontSize: 12,
  },
  toolPanel: {
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  timelineContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: '#2a2a2a',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyState: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});