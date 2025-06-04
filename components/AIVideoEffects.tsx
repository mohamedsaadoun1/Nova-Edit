import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIEffect {
  id: string;
  name: string;
  type: AIEffectType;
  icon: string;
  description: string;
  isProcessing?: boolean;
  isAvailable: boolean;
  preview: string;
}

enum AIEffectType {
  BACKGROUND_REMOVAL = 'backgroundRemoval',
  FACE_BEAUTY = 'faceBeauty',
  AUTO_ENHANCE = 'autoEnhance',
  OBJECT_TRACKING = 'objectTracking',
  MOTION_BLUR = 'motionBlur',
  STYLE_TRANSFER = 'styleTransfer',
  COLOR_CORRECTION = 'colorCorrection',
  NOISE_REDUCTION = 'noiseReduction',
  SUPER_RESOLUTION = 'superResolution',
  STABILIZATION = 'stabilization',
  SLOW_MOTION = 'slowMotion',
  TIME_LAPSE = 'timeLapse'
}

interface AIVideoEffectsProps {
  visible: boolean;
  onClose: () => void;
  onApplyEffect: (effectType: AIEffectType, parameters: any) => void;
  selectedClipId: string | null;
  isProcessing?: boolean;
}

const aiEffects: AIEffect[] = [
  {
    id: '1',
    name: 'إزالة الخلفية',
    type: AIEffectType.BACKGROUND_REMOVAL,
    icon: 'person-outline',
    description: 'إزالة الخلفية بذكاء اصطناعي متقدم',
    isAvailable: true,
    preview: '🎭'
  },
  {
    id: '2',
    name: 'تجميل الوجه',
    type: AIEffectType.FACE_BEAUTY,
    icon: 'happy-outline',
    description: 'تحسين ملامح الوجه وإزالة العيوب',
    isAvailable: true,
    preview: '✨'
  },
  {
    id: '3',
    name: 'تحسين تلقائي',
    type: AIEffectType.AUTO_ENHANCE,
    icon: 'flash-outline',
    description: 'تحسين الجودة والألوان تلقائياً',
    isAvailable: true,
    preview: '🎨'
  },
  {
    id: '4',
    name: 'تتبع الكائنات',
    type: AIEffectType.OBJECT_TRACKING,
    icon: 'scan-outline',
    description: 'تتبع الأشخاص والكائنات بدقة',
    isAvailable: true,
    preview: '🎯'
  },
  {
    id: '5',
    name: 'ضبابية الحركة',
    type: AIEffectType.MOTION_BLUR,
    icon: 'trail-sign-outline',
    description: 'إضافة ضبابية واقعية للحركة السريعة',
    isAvailable: true,
    preview: '💨'
  },
  {
    id: '6',
    name: 'نقل الأسلوب',
    type: AIEffectType.STYLE_TRANSFER,
    icon: 'brush-outline',
    description: 'تطبيق أساليب فنية مختلفة',
    isAvailable: true,
    preview: '🖼️'
  },
  {
    id: '7',
    name: 'تصحيح الألوان',
    type: AIEffectType.COLOR_CORRECTION,
    icon: 'color-palette-outline',
    description: 'تحسين وتوحيد الألوان بالذكاء الاصطناعي',
    isAvailable: true,
    preview: '🌈'
  },
  {
    id: '8',
    name: 'تقليل الضوضاء',
    type: AIEffectType.NOISE_REDUCTION,
    icon: 'volume-mute-outline',
    description: 'إزالة التشويش والضوضاء البصرية',
    isAvailable: true,
    preview: '🔇'
  },
  {
    id: '9',
    name: 'دقة فائقة',
    type: AIEffectType.SUPER_RESOLUTION,
    icon: 'expand-outline',
    description: 'زيادة دقة الفيديو بالذكاء الاصطناعي',
    isAvailable: false, // يتطلب موارد قوية
    preview: '🔍'
  },
  {
    id: '10',
    name: 'تثبيت الفيديو',
    type: AIEffectType.STABILIZATION,
    icon: 'git-merge-outline',
    description: 'إزالة الاهتزاز والحركة غير المرغوبة',
    isAvailable: true,
    preview: '⚖️'
  },
  {
    id: '11',
    name: 'حركة بطيئة',
    type: AIEffectType.SLOW_MOTION,
    icon: 'hourglass-outline',
    description: 'إنشاء حركة بطيئة سلسة وواقعية',
    isAvailable: true,
    preview: '🐌'
  },
  {
    id: '12',
    name: 'فاصل زمني',
    type: AIEffectType.TIME_LAPSE,
    icon: 'time-outline',
    description: 'ضغط الوقت لإنشاء فيديو سريع',
    isAvailable: true,
    preview: '⚡'
  }
];

const styleOptions = [
  { name: 'فان جوخ', preview: '🌻', style: 'vangogh' },
  { name: 'بيكاسو', preview: '🎭', style: 'picasso' },
  { name: 'موناليزا', preview: '👩‍🎨', style: 'monalisa' },
  { name: 'كارتون', preview: '🎨', style: 'cartoon' },
  { name: 'أنمي', preview: '👺', style: 'anime' },
  { name: 'رسم زيتي', preview: '🖌️', style: 'oilpainting' }
];

export default function AIVideoEffects({
  visible,
  onClose,
  onApplyEffect,
  selectedClipId,
  isProcessing = false
}: AIVideoEffectsProps) {
  const [selectedEffect, setSelectedEffect] = useState<AIEffect | null>(null);
  const [processingEffects, setProcessingEffects] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'effects' | 'styles' | 'settings'>('effects');
  const [effectSettings, setEffectSettings] = useState<{ [key: string]: any }>({});

  const handleApplyEffect = async (effect: AIEffect) => {
    if (!selectedClipId || !effect.isAvailable) {
      Alert.alert('خطأ', 'يرجى تحديد مقطع فيديو أولاً أو التأكد من توفر التأثير');
      return;
    }

    // إضافة التأثير لقائمة المعالجة
    setProcessingEffects(prev => new Set([...prev, effect.id]));

    try {
      // محاكاة معالجة AI (في التطبيق الحقيقي ستكون API calls)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const parameters = {
        intensity: effectSettings[effect.type]?.intensity || 0.5,
        style: effectSettings[effect.type]?.style || 'default',
        ...effectSettings[effect.type]
      };

      onApplyEffect(effect.type, parameters);
      
      Alert.alert('نجح', `تم تطبيق ${effect.name} بنجاح`);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تطبيق التأثير');
    } finally {
      // إزالة من قائمة المعالجة
      setProcessingEffects(prev => {
        const newSet = new Set(prev);
        newSet.delete(effect.id);
        return newSet;
      });
    }
  };

  const updateEffectSetting = (effectType: AIEffectType, key: string, value: any) => {
    setEffectSettings(prev => ({
      ...prev,
      [effectType]: {
        ...prev[effectType],
        [key]: value
      }
    }));
  };

  const renderEffectCard = (effect: AIEffect) => {
    const isEffectProcessing = processingEffects.has(effect.id);
    
    return (
      <TouchableOpacity
        key={effect.id}
        style={[
          styles.effectCard,
          !effect.isAvailable && styles.disabledCard,
          selectedEffect?.id === effect.id && styles.selectedCard
        ]}
        onPress={() => {
          if (effect.isAvailable && !isEffectProcessing) {
            setSelectedEffect(effect);
          }
        }}
        disabled={!effect.isAvailable || isEffectProcessing}
      >
        <View style={styles.effectPreview}>
          {isEffectProcessing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.effectEmoji}>{effect.preview}</Text>
          )}
          
          {!effect.isAvailable && (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={16} color="#666" />
            </View>
          )}
        </View>
        
        <Text style={[
          styles.effectName,
          !effect.isAvailable && styles.disabledText,
          selectedEffect?.id === effect.id && styles.selectedText
        ]}>
          {effect.name}
        </Text>
        
        <Text style={[
          styles.effectDescription,
          !effect.isAvailable && styles.disabledText
        ]}>
          {effect.description}
        </Text>

        {isEffectProcessing && (
          <View style={styles.processingBadge}>
            <Text style={styles.processingText}>جاري المعالجة...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStylesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>أساليب فنية</Text>
      <View style={styles.stylesGrid}>
        {styleOptions.map((style) => (
          <TouchableOpacity
            key={style.style}
            style={[
              styles.styleCard,
              effectSettings[AIEffectType.STYLE_TRANSFER]?.style === style.style && styles.selectedStyle
            ]}
            onPress={() => updateEffectSetting(AIEffectType.STYLE_TRANSFER, 'style', style.style)}
          >
            <Text style={styles.stylePreview}>{style.preview}</Text>
            <Text style={styles.styleName}>{style.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      {selectedEffect && (
        <>
          <Text style={styles.sectionTitle}>إعدادات {selectedEffect.name}</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>شدة التأثير</Text>
            <Text style={styles.settingValue}>
              {Math.round((effectSettings[selectedEffect.type]?.intensity || 0.5) * 100)}%
            </Text>
          </View>

          {selectedEffect.type === AIEffectType.FACE_BEAUTY && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>نعومة البشرة</Text>
                <Text style={styles.settingValue}>
                  {Math.round((effectSettings[selectedEffect.type]?.smoothness || 0.3) * 100)}%
                </Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>إشراق العينين</Text>
                <Text style={styles.settingValue}>
                  {Math.round((effectSettings[selectedEffect.type]?.eyeBrightness || 0.2) * 100)}%
                </Text>
              </View>
            </>
          )}

          {selectedEffect.type === AIEffectType.BACKGROUND_REMOVAL && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>دقة الحواف</Text>
              <Text style={styles.settingValue}>
                {effectSettings[selectedEffect.type]?.edgeAccuracy || 'عالية'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.applyButton,
              (!selectedClipId || processingEffects.has(selectedEffect.id)) && styles.disabledButton
            ]}
            onPress={() => handleApplyEffect(selectedEffect)}
            disabled={!selectedClipId || processingEffects.has(selectedEffect.id)}
          >
            <Text style={styles.applyButtonText}>
              {processingEffects.has(selectedEffect.id) ? 'جاري التطبيق...' : 'تطبيق التأثير'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

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
          
          <Text style={styles.title}>تأثيرات الذكاء الاصطناعي</Text>
          
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={20} color="#007AFF" />
            <Text style={styles.aiText}>AI</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'effects', label: 'التأثيرات', icon: 'sparkles-outline' },
            { key: 'styles', label: 'الأساليب', icon: 'brush-outline' },
            { key: 'settings', label: 'الإعدادات', icon: 'settings-outline' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
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
          {activeTab === 'effects' && (
            <ScrollView 
              style={styles.tabContent}
              contentContainerStyle={styles.effectsGrid}
            >
              {aiEffects.map(renderEffectCard)}
            </ScrollView>
          )}
          
          {activeTab === 'styles' && renderStylesTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </View>

        {/* Processing Indicator */}
        {processingEffects.size > 0 && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingTitle}>
                تطبيق تأثيرات الذكاء الاصطناعي
              </Text>
              <Text style={styles.processingSubtitle}>
                يتم الآن معالجة الفيديو...
              </Text>
            </View>
          </View>
        )}
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
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  disabledCard: {
    opacity: 0.5,
  },
  effectPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    position: 'relative',
  },
  effectEmoji: {
    fontSize: 24,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectName: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedText: {
    color: '#fff',
  },
  disabledText: {
    color: '#666',
  },
  effectDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  processingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  processingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  styleCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStyle: {
    borderColor: '#007AFF',
  },
  stylePreview: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleName: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  settingValue: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: '80%',
  },
  processingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});