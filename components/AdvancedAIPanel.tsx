/**
 * Advanced AI Panel Component
 * Provides a comprehensive interface for all AI features
 * Includes real-time processing, batch operations, and settings
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Slider,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { UnifiedAIService, AIFeatureConfig, ProcessingResult } from '../services/UnifiedAIService';
import { useVideoStore } from '../store/videoStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AIProcessingTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

export default function AdvancedAIPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('captioning');
  const [aiService] = useState(() => new UnifiedAIService());
  const [isInitializing, setIsInitializing] = useState(true);
  const [processingTasks, setProcessingTasks] = useState<AIProcessingTask[]>([]);
  const [realtimeProcessing, setRealtimeProcessing] = useState(false);
  
  // AI Configuration
  const [aiConfig, setAiConfig] = useState<AIFeatureConfig>({
    speechToText: {
      enabled: true,
      model: 'web-speech',
      language: 'en-US'
    },
    backgroundRemoval: {
      enabled: true,
      model: 'general',
      realTime: true
    },
    motionTracking: {
      enabled: true,
      type: 'general',
      stabilization: true
    },
    visualEffects: {
      enabled: true,
      webglAcceleration: true
    },
    huggingFace: {
      enabled: true
    }
  });

  // Panel animation
  const panelAnimation = useRef(new Animated.Value(-screenWidth * 0.8)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // State for different AI features
  const [captionSettings, setCaptionSettings] = useState({
    language: 'en-US',
    autoSync: true,
    showConfidence: true
  });

  const [backgroundSettings, setBackgroundSettings] = useState({
    model: 'general',
    edgeRefinement: true,
    feathering: 0.3,
    backgroundType: 'transparent'
  });

  const [trackingSettings, setTrackingSettings] = useState({
    maxObjects: 10,
    confidenceThreshold: 0.5,
    enableStabilization: true
  });

  const [effectSettings, setEffectSettings] = useState({
    selectedEffect: 'blur',
    intensity: 0.5,
    realtime: false
  });

  const { currentProject, videoFiles, addProcessingTask, updateProcessingTask } = useVideoStore();

  useEffect(() => {
    initializeAIService();
  }, []);

  useEffect(() => {
    if (isVisible) {
      showPanel();
    } else {
      hidePanel();
    }
  }, [isVisible]);

  const initializeAIService = async () => {
    try {
      setIsInitializing(true);
      await aiService.initialize();
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      Alert.alert('Error', 'Failed to initialize AI features. Some functionality may be limited.');
    } finally {
      setIsInitializing(false);
    }
  };

  const showPanel = () => {
    Animated.parallel([
      Animated.timing(panelAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hidePanel = () => {
    Animated.parallel([
      Animated.timing(panelAnimation, {
        toValue: -screenWidth * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addTask = (type: string): string => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: AIProcessingTask = {
      id: taskId,
      type,
      status: 'pending',
      progress: 0
    };
    
    setProcessingTasks(prev => [...prev, task]);
    return taskId;
  };

  const updateTask = (taskId: string, updates: Partial<AIProcessingTask>) => {
    setProcessingTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const removeTask = (taskId: string) => {
    setProcessingTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // AI Feature Handlers
  const handleGenerateCaptions = async () => {
    if (!currentProject || videoFiles.length === 0) {
      Alert.alert('Error', 'Please select a video file first');
      return;
    }

    const taskId = addTask('captions');
    updateTask(taskId, { status: 'processing', progress: 10 });

    try {
      // Mock audio data for demo
      const mockAudioBuffer = new ArrayBuffer(44100 * 4); // 1 second of audio
      
      updateTask(taskId, { progress: 50 });
      
      const result = await aiService.generateAutoCaptions(mockAudioBuffer, {
        language: captionSettings.language,
        continuous: true,
        interimResults: false,
        maxAlternatives: 1
      });

      if (result.success) {
        updateTask(taskId, { 
          status: 'completed', 
          progress: 100, 
          result: result.result 
        });
        
        Alert.alert('Success', 'Captions generated successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateTask(taskId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      Alert.alert('Error', 'Failed to generate captions');
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentProject || videoFiles.length === 0) {
      Alert.alert('Error', 'Please select a video file first');
      return;
    }

    const taskId = addTask('background-removal');
    updateTask(taskId, { status: 'processing', progress: 10 });

    try {
      // Mock image data for demo
      const mockImageData = new ImageData(1920, 1080);
      
      updateTask(taskId, { progress: 50 });
      
      const result = await aiService.removeBackground(mockImageData, {
        model: backgroundSettings.model as any,
        edgeRefinement: backgroundSettings.edgeRefinement,
        feathering: backgroundSettings.feathering,
        backgroundType: backgroundSettings.backgroundType as any
      });

      if (result.success) {
        updateTask(taskId, { 
          status: 'completed', 
          progress: 100, 
          result: result.result 
        });
        
        Alert.alert('Success', 'Background removed successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateTask(taskId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      Alert.alert('Error', 'Failed to remove background');
    }
  };

  const handleTrackObjects = async () => {
    if (!currentProject || videoFiles.length === 0) {
      Alert.alert('Error', 'Please select a video file first');
      return;
    }

    const taskId = addTask('object-tracking');
    updateTask(taskId, { status: 'processing', progress: 10 });

    try {
      // Mock image data for demo
      const mockImageData = new ImageData(1920, 1080);
      
      updateTask(taskId, { progress: 50 });
      
      const result = await aiService.trackObjects(mockImageData, {
        trackingType: 'general',
        maxObjects: trackingSettings.maxObjects,
        confidenceThreshold: trackingSettings.confidenceThreshold,
        enableStabilization: trackingSettings.enableStabilization,
        enableMotionBlur: false,
        trackingPersistence: 5
      });

      if (result.success) {
        updateTask(taskId, { 
          status: 'completed', 
          progress: 100, 
          result: result.result 
        });
        
        Alert.alert('Success', 'Object tracking completed!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateTask(taskId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      Alert.alert('Error', 'Failed to track objects');
    }
  };

  const handleApplyEffect = async () => {
    if (!currentProject || videoFiles.length === 0) {
      Alert.alert('Error', 'Please select a video file first');
      return;
    }

    const taskId = addTask('visual-effects');
    updateTask(taskId, { status: 'processing', progress: 10 });

    try {
      // Mock image data for demo
      const mockImageData = new ImageData(1920, 1080);
      
      updateTask(taskId, { progress: 50 });
      
      const result = await aiService.applyVisualEffect(mockImageData, effectSettings.selectedEffect, {
        intensity: effectSettings.intensity,
        parameters: {}
      });

      if (result.success) {
        updateTask(taskId, { 
          status: 'completed', 
          progress: 100, 
          result: result.result 
        });
        
        Alert.alert('Success', 'Visual effect applied successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateTask(taskId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      Alert.alert('Error', 'Failed to apply visual effect');
    }
  };

  const handleGenerateImage = async () => {
    const taskId = addTask('image-generation');
    updateTask(taskId, { status: 'processing', progress: 10 });

    try {
      updateTask(taskId, { progress: 50 });
      
      const result = await aiService.generateImageFromText('A beautiful sunset over mountains', {
        model: 'runwayml/stable-diffusion-v1-5'
      });

      if (result.success) {
        updateTask(taskId, { 
          status: 'completed', 
          progress: 100, 
          result: result.result 
        });
        
        Alert.alert('Success', 'Image generated successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateTask(taskId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      Alert.alert('Error', 'Failed to generate image');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'captioning':
        return renderCaptioningTab();
      case 'background':
        return renderBackgroundTab();
      case 'tracking':
        return renderTrackingTab();
      case 'effects':
        return renderEffectsTab();
      case 'generation':
        return renderGenerationTab();
      case 'processing':
        return renderProcessingTab();
      default:
        return null;
    }
  };

  const renderCaptioningTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Auto-Captioning</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Language</Text>
        <TouchableOpacity style={styles.languageSelector}>
          <Text style={styles.languageText}>{captionSettings.language}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Auto-sync with timeline</Text>
        <Switch
          value={captionSettings.autoSync}
          onValueChange={(value) => setCaptionSettings(prev => ({ ...prev, autoSync: value }))}
          trackColor={{ false: '#767577', true: '#007AFF' }}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Show confidence scores</Text>
        <Switch
          value={captionSettings.showConfidence}
          onValueChange={(value) => setCaptionSettings(prev => ({ ...prev, showConfidence: value }))}
          trackColor={{ false: '#767577', true: '#007AFF' }}
        />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleGenerateCaptions}>
        <MaterialIcons name="closed-caption" size={24} color="white" />
        <Text style={styles.actionButtonText}>Generate Captions</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          AI-powered speech recognition will automatically generate captions for your video. 
          Supports multiple languages and provides confidence scores for accuracy.
        </Text>
      </View>
    </ScrollView>
  );

  const renderBackgroundTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Background Removal</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Model Type</Text>
        <TouchableOpacity style={styles.modelSelector}>
          <Text style={styles.modelText}>{backgroundSettings.model}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Edge Refinement</Text>
        <Switch
          value={backgroundSettings.edgeRefinement}
          onValueChange={(value) => setBackgroundSettings(prev => ({ ...prev, edgeRefinement: value }))}
          trackColor={{ false: '#767577', true: '#007AFF' }}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Feathering: {backgroundSettings.feathering.toFixed(1)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={backgroundSettings.feathering}
          onValueChange={(value) => setBackgroundSettings(prev => ({ ...prev, feathering: value }))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E0E0E0"
        />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleRemoveBackground}>
        <MaterialIcons name="auto-fix-high" size={24} color="white" />
        <Text style={styles.actionButtonText}>Remove Background</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Advanced AI background removal with edge refinement and feathering. 
          Choose from different models optimized for portraits, landscapes, or general content.
        </Text>
      </View>
    </ScrollView>
  );

  const renderTrackingTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Motion Tracking</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Max Objects: {trackingSettings.maxObjects}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={trackingSettings.maxObjects}
          onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, maxObjects: Math.round(value) }))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E0E0E0"
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Confidence: {trackingSettings.confidenceThreshold.toFixed(1)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.1}
          maximumValue={1.0}
          value={trackingSettings.confidenceThreshold}
          onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, confidenceThreshold: value }))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E0E0E0"
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Camera Stabilization</Text>
        <Switch
          value={trackingSettings.enableStabilization}
          onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, enableStabilization: value }))}
          trackColor={{ false: '#767577', true: '#007AFF' }}
        />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleTrackObjects}>
        <MaterialIcons name="track-changes" size={24} color="white" />
        <Text style={styles.actionButtonText}>Track Objects</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          AI-powered object tracking and motion analysis. 
          Automatically tracks moving objects and provides camera stabilization.
        </Text>
      </View>
    </ScrollView>
  );

  const renderEffectsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Visual Effects</Text>
      
      <View style={styles.effectGrid}>
        {['blur', 'sharpen', 'glow', 'vintage', 'colorGrading', 'filmGrain'].map((effect) => (
          <TouchableOpacity
            key={effect}
            style={[
              styles.effectCard,
              effectSettings.selectedEffect === effect && styles.selectedEffectCard
            ]}
            onPress={() => setEffectSettings(prev => ({ ...prev, selectedEffect: effect }))}
          >
            <MaterialIcons 
              name={getEffectIcon(effect)} 
              size={32} 
              color={effectSettings.selectedEffect === effect ? '#007AFF' : '#666'} 
            />
            <Text style={[
              styles.effectName,
              effectSettings.selectedEffect === effect && styles.selectedEffectName
            ]}>
              {effect.charAt(0).toUpperCase() + effect.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Intensity: {effectSettings.intensity.toFixed(1)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={effectSettings.intensity}
          onValueChange={(value) => setEffectSettings(prev => ({ ...prev, intensity: value }))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E0E0E0"
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Real-time Preview</Text>
        <Switch
          value={effectSettings.realtime}
          onValueChange={(value) => setEffectSettings(prev => ({ ...prev, realtime: value }))}
          trackColor={{ false: '#767577', true: '#007AFF' }}
        />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleApplyEffect}>
        <MaterialIcons name="auto-awesome" size={24} color="white" />
        <Text style={styles.actionButtonText}>Apply Effect</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGenerationTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>AI Generation</Text>
      
      <View style={styles.generationOptions}>
        <TouchableOpacity style={styles.generationCard} onPress={handleGenerateImage}>
          <MaterialIcons name="image" size={48} color="#007AFF" />
          <Text style={styles.generationTitle}>Generate Image</Text>
          <Text style={styles.generationDescription}>
            Create images from text descriptions using AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.generationCard}>
          <MaterialIcons name="music-note" size={48} color="#007AFF" />
          <Text style={styles.generationTitle}>Generate Music</Text>
          <Text style={styles.generationDescription}>
            Create background music with AI composition
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.generationCard}>
          <MaterialIcons name="voice-over-off" size={48} color="#007AFF" />
          <Text style={styles.generationTitle}>Generate Voice</Text>
          <Text style={styles.generationDescription}>
            Convert text to natural-sounding speech
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderProcessingTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Processing Queue</Text>
      
      {processingTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
          <Text style={styles.emptyStateText}>No active processing tasks</Text>
        </View>
      ) : (
        processingTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskType}>{task.type}</Text>
              <TouchableOpacity onPress={() => removeTask(task.id)}>
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.taskProgress}>
              <View style={[styles.progressBar, { width: `${task.progress}%` }]} />
            </View>
            
            <View style={styles.taskStatus}>
              {task.status === 'processing' && (
                <ActivityIndicator size="small" color="#007AFF" />
              )}
              <Text style={[
                styles.statusText,
                { color: getStatusColor(task.status) }
              ]}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Text>
            </View>
            
            {task.error && (
              <Text style={styles.errorText}>{task.error}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const getEffectIcon = (effect: string): string => {
    const iconMap: { [key: string]: string } = {
      blur: 'blur-on',
      sharpen: 'flare',
      glow: 'brightness-high',
      vintage: 'filter-vintage',
      colorGrading: 'palette',
      filmGrain: 'grain'
    };
    return iconMap[effect] || 'auto-awesome';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'processing':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  const tabs = [
    { id: 'captioning', label: 'Captions', icon: 'closed-caption' },
    { id: 'background', label: 'Background', icon: 'auto-fix-high' },
    { id: 'tracking', label: 'Tracking', icon: 'track-changes' },
    { id: 'effects', label: 'Effects', icon: 'auto-awesome' },
    { id: 'generation', label: 'Generate', icon: 'create' },
    { id: 'processing', label: 'Queue', icon: 'queue' }
  ];

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing AI Services...</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => setIsVisible(true)}
        testID="ai-panel-button"
      >
        <MaterialIcons name="psychology" size={24} color="white" />
        <Text style={styles.aiButtonText}>AI</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View 
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity 
              style={StyleSheet.absoluteFill}
              onPress={() => setIsVisible(false)}
            />
          </Animated.View>

          <Animated.View 
            style={[
              styles.panel,
              { transform: [{ translateX: panelAnimation }] }
            ]}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>AI Studio</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal style={styles.tabContainer} showsHorizontalScrollIndicator={false}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && styles.activeTab
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <MaterialIcons 
                    name={tab.icon as any} 
                    size={20} 
                    color={activeTab === tab.id ? '#007AFF' : '#666'} 
                  />
                  <Text style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {renderTabContent()}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  aiButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  aiButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.8,
    backgroundColor: 'white',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  languageText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modelText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  slider: {
    flex: 1,
    marginLeft: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  effectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  effectCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    margin: '1%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEffectCard: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  effectName: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedEffectName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  generationOptions: {
    gap: 16,
  },
  generationCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  generationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  generationDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  taskCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskProgress: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
});