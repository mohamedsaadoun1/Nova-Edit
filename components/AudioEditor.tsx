import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface AudioTrack {
  id: string;
  name: string;
  uri: string;
  duration: number;
  volume: number;
  startTime: number;
  endTime: number;
  fadeIn: number;
  fadeOut: number;
  pitch: number;
  tempo: number;
  effects: AudioEffect[];
  muted: boolean;
}

interface AudioEffect {
  id: string;
  type: AudioEffectType;
  intensity: number;
  parameters: { [key: string]: any };
}

enum AudioEffectType {
  REVERB = 'reverb',
  ECHO = 'echo',
  BASS_BOOST = 'bassBoost',
  TREBLE_BOOST = 'trebleBoost',
  VOCAL_ENHANCE = 'vocalEnhance',
  NOISE_REDUCTION = 'noiseReduction',
  COMPRESSOR = 'compressor',
  EQUALIZER = 'equalizer',
  DISTORTION = 'distortion',
  CHORUS = 'chorus',
  FLANGER = 'flanger',
  PHASER = 'phaser'
}

interface AudioEditorProps {
  visible: boolean;
  onClose: () => void;
  audioTracks: AudioTrack[];
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  onAddTrack: (track: AudioTrack) => void;
  selectedTrackId: string | null;
  videoDuration: number;
}

const audioEffects = [
  {
    type: AudioEffectType.REVERB,
    name: 'صدى',
    icon: 'radio-outline',
    description: 'إضافة صدى طبيعي للصوت'
  },
  {
    type: AudioEffectType.ECHO,
    name: 'ترديد',
    icon: 'repeat-outline',
    description: 'تكرار الصوت بفترات زمنية'
  },
  {
    type: AudioEffectType.BASS_BOOST,
    name: 'تقوية البيس',
    icon: 'musical-note',
    description: 'تحسين الترددات المنخفضة'
  },
  {
    type: AudioEffectType.TREBLE_BOOST,
    name: 'تقوية الحدة',
    icon: 'trending-up-outline',
    description: 'تحسين الترددات العالية'
  },
  {
    type: AudioEffectType.VOCAL_ENHANCE,
    name: 'تحسين الصوت',
    icon: 'mic-outline',
    description: 'وضوح أفضل للأصوات البشرية'
  },
  {
    type: AudioEffectType.NOISE_REDUCTION,
    name: 'تقليل الضوضاء',
    icon: 'volume-mute-outline',
    description: 'إزالة الضوضاء الخلفية'
  },
  {
    type: AudioEffectType.COMPRESSOR,
    name: 'ضاغط',
    icon: 'contract-outline',
    description: 'توحيد مستوى الصوت'
  },
  {
    type: AudioEffectType.EQUALIZER,
    name: 'معادل',
    icon: 'stats-chart-outline',
    description: 'تحكم دقيق في الترددات'
  },
  {
    type: AudioEffectType.DISTORTION,
    name: 'تشويه',
    icon: 'warning-outline',
    description: 'تأثير صوتي فني'
  },
  {
    type: AudioEffectType.CHORUS,
    name: 'كورس',
    icon: 'people-outline',
    description: 'تأثير تعدد الأصوات'
  }
];

const musicLibrary = [
  {
    id: '1',
    name: 'موسيقى هادئة',
    category: 'مزاج',
    duration: 180,
    preview: '🎵'
  },
  {
    id: '2',
    name: 'إيقاع حماسي',
    category: 'رياضة',
    duration: 120,
    preview: '🥁'
  },
  {
    id: '3',
    name: 'لحن رومانسي',
    category: 'رومانسي',
    duration: 200,
    preview: '💝'
  },
  {
    id: '4',
    name: 'موسيقى تركيز',
    category: 'عمل',
    duration: 300,
    preview: '🧠'
  },
  {
    id: '5',
    name: 'إيقاع بوب',
    category: 'شبابي',
    duration: 160,
    preview: '🎸'
  }
];

export default function AudioEditor({
  visible,
  onClose,
  audioTracks,
  onUpdateTrack,
  onAddTrack,
  selectedTrackId,
  videoDuration
}: AudioEditorProps) {
  const [activeTab, setActiveTab] = useState<'tracks' | 'effects' | 'music' | 'record'>('tracks');
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const volumeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const selectedAudioTrack = selectedTrackId 
    ? audioTracks.find(t => t.id === selectedTrackId) 
    : null;

  // إنشاء الرسوم المتحركة لمستوى الصوت
  const getVolumeAnimation = (trackId: string) => {
    if (!volumeAnimations[trackId]) {
      volumeAnimations[trackId] = new Animated.Value(0);
    }
    return volumeAnimations[trackId];
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // مؤقت التسجيل
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(timer);
      }, 60000); // حد أقصى دقيقة

    } catch (error) {
      console.error('خطأ في بدء التسجيل:', error);
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        
        if (uri) {
          const newTrack: AudioTrack = {
            id: Date.now().toString(),
            name: `تسجيل_${new Date().toISOString().slice(0, 10)}`,
            uri,
            duration: recordingDuration,
            volume: 1,
            startTime: 0,
            endTime: recordingDuration,
            fadeIn: 0,
            fadeOut: 0,
            pitch: 1,
            tempo: 1,
            effects: [],
            muted: false
          };

          onAddTrack(newTrack);
        }

        recordingRef.current = null;
        setIsRecording(false);
        setRecordingDuration(0);
      } catch (error) {
        console.error('خطأ في إيقاف التسجيل:', error);
      }
    }
  };

  const applyEffect = (trackId: string, effectType: AudioEffectType) => {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const existingEffect = track.effects.find(e => e.type === effectType);
    if (existingEffect) {
      // إزالة التأثير إذا كان موجود
      const newEffects = track.effects.filter(e => e.type !== effectType);
      onUpdateTrack(trackId, { effects: newEffects });
    } else {
      // إضافة تأثير جديد
      const newEffect: AudioEffect = {
        id: Date.now().toString(),
        type: effectType,
        intensity: 0.5,
        parameters: {}
      };
      onUpdateTrack(trackId, { effects: [...track.effects, newEffect] });
    }
  };

  const adjustVolume = (trackId: string, volume: number) => {
    onUpdateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) });
    
    // تحريك الرسوم المتحركة
    Animated.timing(getVolumeAnimation(trackId), {
      toValue: volume,
      duration: 200,
      useNativeDriver: false
    }).start();
  };

  const renderTracksTab = () => (
    <ScrollView style={styles.tabContent}>
      {audioTracks.map((track) => (
        <View key={track.id} style={styles.trackItem}>
          <View style={styles.trackHeader}>
            <TouchableOpacity onPress={() => setSelectedTrack(track)}>
              <Text style={styles.trackName}>{track.name}</Text>
            </TouchableOpacity>
            
            <View style={styles.trackControls}>
              <TouchableOpacity
                onPress={() => onUpdateTrack(track.id, { muted: !track.muted })}
              >
                <Ionicons 
                  name={track.muted ? "volume-mute" : "volume-medium"} 
                  size={20} 
                  color={track.muted ? "#666" : "#fff"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.trackDetails}>
            <Text style={styles.trackDuration}>
              {formatTime(track.duration)}
            </Text>
            <Text style={styles.trackEffects}>
              {track.effects.length} تأثير
            </Text>
          </View>

          {/* مستوى الصوت */}
          <View style={styles.volumeContainer}>
            <Text style={styles.volumeLabel}>مستوى الصوت</Text>
            <View style={styles.volumeSlider}>
              <View style={styles.volumeTrack}>
                <Animated.View 
                  style={[
                    styles.volumeFill,
                    { width: getVolumeAnimation(track.id).interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })}
                  ]}
                />
              </View>
              <Text style={styles.volumeValue}>
                {Math.round(track.volume * 100)}%
              </Text>
            </View>
            
            <View style={styles.volumeButtons}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => adjustVolume(track.id, track.volume - 0.1)}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => adjustVolume(track.id, track.volume + 0.1)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* تحكم في السرعة والطبقة */}
          <View style={styles.advancedControls}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>السرعة</Text>
              <Text style={styles.controlValue}>{track.tempo}x</Text>
            </View>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>الطبقة</Text>
              <Text style={styles.controlValue}>{track.pitch > 1 ? '+' : ''}{Math.round((track.pitch - 1) * 100)}%</Text>
            </View>
          </View>
        </View>
      ))}

      {audioTracks.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>لا توجد مسارات صوتية</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderEffectsTab = () => (
    <ScrollView style={styles.tabContent}>
      {selectedAudioTrack ? (
        <>
          <Text style={styles.sectionTitle}>
            تأثيرات صوتية - {selectedAudioTrack.name}
          </Text>
          
          <View style={styles.effectsGrid}>
            {audioEffects.map((effect) => {
              const hasEffect = selectedAudioTrack.effects.some(e => e.type === effect.type);
              
              return (
                <TouchableOpacity
                  key={effect.type}
                  style={[
                    styles.effectButton,
                    hasEffect && styles.activeEffect
                  ]}
                  onPress={() => applyEffect(selectedAudioTrack.id, effect.type)}
                >
                  <Ionicons 
                    name={effect.icon as any} 
                    size={24} 
                    color={hasEffect ? "#007AFF" : "#666"} 
                  />
                  <Text style={[
                    styles.effectName,
                    hasEffect && styles.activeEffectText
                  ]}>
                    {effect.name}
                  </Text>
                  <Text style={styles.effectDescription}>
                    {effect.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="options-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>اختر مسار صوتي أولاً</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderMusicTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>مكتبة الموسيقى</Text>
      
      {musicLibrary.map((music) => (
        <TouchableOpacity key={music.id} style={styles.musicItem}>
          <Text style={styles.musicPreview}>{music.preview}</Text>
          <View style={styles.musicInfo}>
            <Text style={styles.musicName}>{music.name}</Text>
            <Text style={styles.musicCategory}>{music.category}</Text>
            <Text style={styles.musicDuration}>{formatTime(music.duration)}</Text>
          </View>
          <TouchableOpacity style={styles.addMusicButton}>
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRecordTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.recordingContainer}>
        <View style={styles.recordingVisualizer}>
          <Ionicons 
            name={isRecording ? "mic" : "mic-outline"} 
            size={64} 
            color={isRecording ? "#FF3B30" : "#666"} 
          />
          {isRecording && (
            <Text style={styles.recordingTime}>
              {formatTime(recordingDuration)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>

        <Text style={styles.recordingHint}>
          {isRecording ? 'اضغط لإيقاف التسجيل' : 'اضغط لبدء التسجيل'}
        </Text>
      </View>
    </View>
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>إغلاق</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>محرر الصوت</Text>
          
          <TouchableOpacity>
            <Ionicons name="save-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'tracks', label: 'المسارات', icon: 'list-outline' },
            { key: 'effects', label: 'التأثيرات', icon: 'options-outline' },
            { key: 'music', label: 'موسيقى', icon: 'musical-notes-outline' },
            { key: 'record', label: 'تسجيل', icon: 'mic-outline' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'tracks' && renderTracksTab()}
          {activeTab === 'effects' && renderEffectsTab()}
          {activeTab === 'music' && renderMusicTab()}
          {activeTab === 'record' && renderRecordTab()}
        </View>
      </View>
    </Modal>
  );
}

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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  trackItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackControls: {
    flexDirection: 'row',
  },
  trackDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackDuration: {
    color: '#666',
    fontSize: 14,
  },
  trackEffects: {
    color: '#007AFF',
    fontSize: 14,
  },
  volumeContainer: {
    marginBottom: 12,
  },
  volumeLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  volumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginRight: 12,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  volumeValue: {
    color: '#007AFF',
    fontSize: 12,
    minWidth: 35,
  },
  volumeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  volumeButton: {
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  advancedControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlGroup: {
    alignItems: 'center',
  },
  controlLabel: {
    color: '#666',
    fontSize: 12,
  },
  controlValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectButton: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeEffect: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  effectName: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  activeEffectText: {
    color: '#fff',
  },
  effectDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  musicPreview: {
    fontSize: 32,
    marginRight: 16,
  },
  musicInfo: {
    flex: 1,
  },
  musicName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  musicCategory: {
    color: '#666',
    fontSize: 14,
  },
  musicDuration: {
    color: '#007AFF',
    fontSize: 12,
  },
  addMusicButton: {
    padding: 8,
  },
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingVisualizer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordingTime: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: '#666',
  },
  recordingHint: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});