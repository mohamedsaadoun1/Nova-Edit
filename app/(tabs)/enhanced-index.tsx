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

// Import enhanced components
import { EnhancedUI, ModernHeader, FloatingActionButton, AnimatedCard, ModernButton } from '../../components/EnhancedUI';
import TutorialOverlay from '../../components/TutorialOverlay';
import ContextualTips, { defaultTips, SmartTipsManager } from '../../components/ContextualTips';
import HelpSystem from '../../components/HelpSystem';
import OnboardingFlow, { checkOnboardingStatus } from '../../components/OnboardingFlow';
import UXManager from '../../services/UXManager';

// Import existing components
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

export default function EnhancedVideoEditor() {
  // Existing state
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showTransitions, setShowTransitions] = useState(false);
  const [showAudioEditor, setShowAudioEditor] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Enhanced UX state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentContext, setCurrentContext] = useState('main');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [uiTheme, setUITheme] = useState<'dark' | 'light'>('dark');
  
  // Animation refs
  const timelineHeight = useRef(new Animated.Value(200)).current;
  const toolPanelOpacity = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // UX Manager instance
  const uxManager = UXManager.getInstance();
  const smartTipsManager = SmartTipsManager.getInstance();

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

  // Initialize UX Manager and check onboarding
  useEffect(() => {
    const initializeUX = async () => {
      try {
        await uxManager.initialize();
        
        const userProfile = uxManager.getUserProfile();
        const uiPersonalization = uxManager.getUIPersonalization();
        
        if (userProfile) {
          setUserLevel(userProfile.level);
        }
        
        if (uiPersonalization) {
          setUITheme(uiPersonalization.theme as 'dark' | 'light');
        }

        // Check if onboarding should be shown
        const shouldShowOnboarding = await checkOnboardingStatus();
        if (shouldShowOnboarding && !userProfile?.onboardingCompleted) {
          setShowOnboarding(true);
        }

        // Set initial context
        if (videoFiles.length === 0) {
          setCurrentContext('empty_project');
        } else {
          setCurrentContext('main');
        }

      } catch (error) {
        console.error('Failed to initialize UX:', error);
      }
    };

    initializeUX();
  }, []);

  // Update context based on app state
  useEffect(() => {
    let newContext = 'main';
    
    if (videoFiles.length === 0) {
      newContext = 'empty_project';
    } else if (showFilters) {
      newContext = 'filters';
    } else if (ui.selectedTool) {
      newContext = `tool_${ui.selectedTool}`;
    } else if (processingTasks.some(task => task.status === 'processing')) {
      newContext = 'processing';
    }

    if (newContext !== currentContext) {
      setCurrentContext(newContext);
      smartTipsManager.setContext(newContext);
    }
  }, [videoFiles.length, showFilters, ui.selectedTool, processingTasks]);

  // Tutorial steps configuration
  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'مرحباً بك في Nova Edit!',
      description: 'سنتعلم معاً كيفية استخدام أقوى محرر فيديو مجاني',
      targetComponent: 'header',
      targetPosition: { x: 0, y: 0, width: screenWidth, height: 100 },
      spotlightRadius: 60,
      tipPosition: 'bottom' as const,
      animation: 'pulse' as const
    },
    {
      id: 'import',
      title: 'استيراد الفيديو',
      description: 'اضغط على زر + لاستيراد أول فيديو لك',
      targetComponent: 'import_button',
      targetPosition: { x: screenWidth - 70, y: 50, width: 50, height: 50 },
      spotlightRadius: 40,
      tipPosition: 'left' as const,
      action: () => uxManager.trackFeatureUsage('tutorial_import_shown', 'tutorial')
    },
    {
      id: 'tools',
      title: 'لوحة الأدوات',
      description: 'هنا تجد جميع أدوات التحرير المتقدمة',
      targetComponent: 'tool_panel',
      targetPosition: { x: 0, y: screenHeight - 200, width: screenWidth, height: 100 },
      spotlightRadius: 80,
      tipPosition: 'top' as const
    },
    {
      id: 'timeline',
      title: 'الخط الزمني',
      description: 'اسحب المقاطع هنا لترتيبها وتحريرها',
      targetComponent: 'timeline',
      targetPosition: { x: 0, y: screenHeight - 300, width: screenWidth, height: 150 },
      spotlightRadius: 100,
      tipPosition: 'top' as const
    }
  ];

  // Enhanced animations
  useEffect(() => {
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

  // Enhanced import function with UX tracking
  const importVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsImporting(true);
    uxManager.trackFeatureUsage('import_video', currentContext);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: false,
        multiple: true
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          const videoFile: VideoFile = {
            id: Date.now().toString() + Math.random(),
            name: asset.name || 'video.mp4',
            uri: asset.uri,
            size: asset.size || 0,
            duration: 0,
            width: 1920,
            height: 1080,
            format: asset.mimeType || 'video/mp4'
          };
          
          addVideoFile(videoFile);
        }
        
        if (!currentProject) {
          createProject('مشروع جديد');
        }

        // Update context and track progress
        setCurrentContext('video_imported');
        uxManager.trackFeatureUsage('video_imported', 'import');

        // Show contextual tip for first-time users
        if (userLevel === 'beginner' && videoFiles.length === 0) {
          setTimeout(() => {
            setCurrentContext('first_import');
          }, 1000);
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء استيراد الفيديو');
      uxManager.reportPerformanceIssue('crash', { error: error.message, context: 'import_video' });
    } finally {
      setIsImporting(false);
    }
  };

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إلى إذن الوصول لمكتبة الوسائط');
      return false;
    }
    return true;
  };

  const togglePlayback = () => {
    if (playbackState.isPlaying) {
      pause();
      uxManager.trackFeatureUsage('video_pause', currentContext);
    } else {
      play();
      uxManager.trackFeatureUsage('video_play', currentContext);
    }
  };

  const onToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    uxManager.trackFeatureUsage(`tool_${tool}`, currentContext);
    
    switch (tool) {
      case Tool.FILTER:
        setShowFilters(true);
        setCurrentContext('filters');
        break;
      case Tool.TEXT:
        setShowTextEditor(true);
        setCurrentContext('text_editor');
        break;
      case Tool.TRANSITION:
        setShowTransitions(true);
        setCurrentContext('transitions');
        break;
      case Tool.AUDIO:
        setShowAudioEditor(true);
        setCurrentContext('audio_editor');
        break;
      default:
        setShowFilters(false);
        setShowTextEditor(false);
        setShowTransitions(false);
        setShowAudioEditor(false);
        setCurrentContext('main');
        break;
    }
  };

  const onFilterApply = (clipId: string, filterType: FilterType, intensity: number) => {
    applyFilter(clipId, filterType, intensity);
    uxManager.trackFeatureUsage('filter_applied', 'filters');
    Alert.alert('نجح', 'تم تطبيق الفلتر بنجاح');
  };

  // Tutorial handlers
  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
      uxManager.completeTutorialStep(tutorialSteps[tutorialStep].id);
    } else {
      handleTutorialComplete();
    }
  };

  const handleTutorialPrevious = () => {
    if (tutorialStep > 0) {
      setTutorialStep(prev => prev - 1);
    }
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
    uxManager.skipTutorialStep(tutorialSteps[tutorialStep].id);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    uxManager.completeTutorialStep('tutorial_completed');
    Alert.alert('تهانينا!', 'لقد أكملت الدورة التعليمية بنجاح!');
  };

  // Onboarding handlers
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    uxManager.trackEvent('onboarding_completed', {});
    
    // Show tutorial for beginners
    if (userLevel === 'beginner') {
      setTimeout(() => {
        setShowTutorial(true);
        uxManager.startTutorial(tutorialSteps.length);
      }, 500);
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    uxManager.trackEvent('onboarding_skipped', {});
  };

  // Help system handlers
  const handleHelpRequest = (query: string, category?: string) => {
    uxManager.requestHelp(query, category);
  };

  const isProcessing = processingTasks.some(task => task.status === 'processing');

  return (
    <EnhancedUI 
      theme={uiTheme} 
      backgroundStyle="gradient" 
      enableGestures={true}
    >
      <View style={styles.container}>
        {/* Modern Header */}
        <ModernHeader
          title={currentProject?.name || 'Nova Edit'}
          subtitle={videoFiles.length > 0 ? `${videoFiles.length} فيديو` : 'ابدأ مشروعك الأول'}
          leftIcon="folder-outline"
          rightIcon="help-circle-outline"
          onLeftPress={() => {
            setShowProjectManager(true);
            uxManager.trackFeatureUsage('project_manager_opened', currentContext);
          }}
          onRightPress={() => {
            setShowHelp(true);
            uxManager.trackFeatureUsage('help_opened', currentContext);
          }}
          gradient={true}
          theme={uiTheme}
        />

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Video Preview */}
          <AnimatedCard
            style={styles.previewCard}
            animationType="scale"
            theme={uiTheme}
          >
            <VideoPreview 
              style={styles.preview}
              videoFiles={videoFiles}
              timeline={timeline}
              playbackState={playbackState}
              onTimeUpdate={setCurrentTime}
            />
          </AnimatedCard>

          {/* Playback Controls */}
          <AnimatedCard 
            style={styles.controlsCard}
            animationType="slide"
            delay={200}
            theme={uiTheme}
          >
            <View style={styles.playbackControls}>
              <TouchableOpacity onPress={() => setCurrentTime(0)}>
                <Ionicons name="play-skip-back" size={24} color={uiTheme === 'dark' ? '#fff' : '#333'} />
              </TouchableOpacity>
              
              <ModernButton
                title=""
                icon={playbackState.isPlaying ? "pause" : "play"}
                onPress={togglePlayback}
                variant="primary"
                size="large"
                disabled={videoFiles.length === 0}
                theme={uiTheme}
                style={styles.playButton}
              />
              
              <TouchableOpacity onPress={() => setCurrentTime(timeline.duration)}>
                <Ionicons name="play-skip-forward" size={24} color={uiTheme === 'dark' ? '#fff' : '#333'} />
              </TouchableOpacity>
              
              <View style={styles.timeDisplay}>
                <Text style={[styles.timeText, { color: uiTheme === 'dark' ? '#ccc' : '#666' }]}>
                  {formatTime(playbackState.currentTime)} / {formatTime(timeline.duration)}
                </Text>
              </View>
            </View>
          </AnimatedCard>

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
                uxManager.trackFeatureUsage('clip_selected', 'timeline');
              }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

        {/* Floating Action Buttons */}
        <FloatingActionButton
          icon="add"
          onPress={importVideo}
          position="bottom-right"
          size="large"
          disabled={isImporting}
          label={isImporting ? "جاري الاستيراد..." : "استيراد فيديو"}
        />

        <FloatingActionButton
          icon="camera"
          onPress={() => {
            setShowCamera(true);
            uxManager.trackFeatureUsage('camera_opened', currentContext);
          }}
          position="top-right"
          size="medium"
          color="#28a745"
        />

        {/* Contextual Tips */}
        <ContextualTips
          tips={smartTipsManager.getSuggestedTips(currentContext, userLevel)}
          userLevel={userLevel}
          currentContext={currentContext}
          onTipShown={(tipId) => uxManager.trackEvent('tip_shown', { tipId, context: currentContext })}
          onTipDismissed={(tipId) => uxManager.trackEvent('tip_dismissed', { tipId })}
          theme={uiTheme}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <AnimatedCard style={styles.processingOverlay} animationType="fade" theme={uiTheme}>
            <View style={styles.processingCard}>
              <Ionicons name="hourglass-outline" size={32} color="#007AFF" />
              <Text style={styles.processingText}>جاري المعالجة...</Text>
            </View>
          </AnimatedCard>
        )}

        {/* Modals - keeping existing functionality */}
        {showProjectManager && (
          <ProjectManager 
            visible={showProjectManager}
            onClose={() => setShowProjectManager(false)}
          />
        )}

        {showFilters && (
          <FilterPanel 
            visible={showFilters}
            onClose={() => {
              setShowFilters(false);
              setCurrentContext('main');
            }}
            onApplyFilter={onFilterApply}
            selectedClips={timeline.selectedClipIds}
          />
        )}

        <CameraScreen 
          visible={showCamera}
          onClose={() => setShowCamera(false)}
        />

        {showTextEditor && (
          <TextOverlayEditor 
            visible={showTextEditor}
            onClose={() => {
              setShowTextEditor(false);
              setCurrentContext('main');
            }}
            onSave={(overlay) => {
              uxManager.trackFeatureUsage('text_overlay_added', 'text_editor');
              Alert.alert('نجح', 'تم إضافة النص بنجاح');
              setShowTextEditor(false);
            }}
            videoDuration={timeline.duration}
          />
        )}

        {showTransitions && (
          <TransitionsEditor 
            visible={showTransitions}
            onClose={() => {
              setShowTransitions(false);
              setCurrentContext('main');
            }}
            onApplyTransition={(clipId, transition) => {
              uxManager.trackFeatureUsage('transition_applied', 'transitions');
              Alert.alert('نجح', `تم تطبيق انتقال ${transition.name} بنجاح`);
              setShowTransitions(false);
            }}
            selectedClipId={timeline.selectedClipIds[0] || null}
          />
        )}

        {showAudioEditor && (
          <AudioEditor 
            visible={showAudioEditor}
            onClose={() => {
              setShowAudioEditor(false);
              setCurrentContext('main');
            }}
            audioTracks={[]}
            onUpdateTrack={(trackId, updates) => {
              uxManager.trackFeatureUsage('audio_track_updated', 'audio_editor');
            }}
            onAddTrack={(track) => {
              uxManager.trackFeatureUsage('audio_track_added', 'audio_editor');
              Alert.alert('نجح', 'تم إضافة المسار الصوتي بنجاح');
            }}
            selectedTrackId={null}
            videoDuration={timeline.duration}
          />
        )}

        {/* Enhanced UX Components */}
        <OnboardingFlow
          visible={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          theme={uiTheme}
        />

        <TutorialOverlay
          visible={showTutorial}
          steps={tutorialSteps}
          currentStep={tutorialStep}
          onNext={handleTutorialNext}
          onPrevious={handleTutorialPrevious}
          onSkip={handleTutorialSkip}
          onComplete={handleTutorialComplete}
          theme={uiTheme}
        />

        <HelpSystem
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          theme={uiTheme}
          userLevel={userLevel}
        />

        {/* Enhanced Empty State */}
        {videoFiles.length === 0 && !isImporting && (
          <AnimatedCard 
            style={styles.emptyState}
            animationType="bounce"
            delay={500}
            theme={uiTheme}
          >
            <Ionicons name="videocam-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>ابدأ مشروعك الأول</Text>
            <Text style={styles.emptyStateText}>
              اضغط على + لاستيراد فيديو وابدأ في التحرير
            </Text>
            <ModernButton
              title="استيراد فيديو"
              icon="add"
              onPress={importVideo}
              variant="primary"
              size="large"
              theme={uiTheme}
              style={styles.importButton}
            />
            
            {userLevel === 'beginner' && (
              <ModernButton
                title="عرض الدليل التعليمي"
                icon="school"
                onPress={() => setShowTutorial(true)}
                variant="outline"
                size="medium"
                theme={uiTheme}
                style={styles.tutorialButton}
              />
            )}
          </AnimatedCard>
        )}
      </View>
    </EnhancedUI>
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
  },
  mainContent: {
    flex: 1,
  },
  previewCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    height: 250,
    backgroundColor: '#000',
  },
  controlsCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  playButton: {
    marginHorizontal: 20,
    borderRadius: 25,
  },
  timeDisplay: {
    position: 'absolute',
    right: 20,
  },
  timeText: {
    fontSize: 12,
  },
  toolPanel: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  timelineContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  processingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
  },
  processingCard: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyState: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    alignItems: 'center',
    padding: 40,
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
    marginBottom: 30,
    lineHeight: 24,
  },
  importButton: {
    marginBottom: 16,
  },
  tutorialButton: {
    marginTop: 8,
  },
});