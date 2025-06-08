/**
 * Enhanced AI Panel Component
 * لوحة ذكاء اصطناعي محسنة مع ميزات متقدمة وواجهة تفاعلية
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Slider,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Animated,
  PanGestureHandler,
  State
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import AI services
import { EnhancedAIEngine } from '../services/EnhancedAIEngine';
import { SmartCreativeAssistant, CreativeAnalysis, SmartRecommendation } from '../services/SmartCreativeAssistant';
import { RealTimeAIProcessor } from '../services/RealTimeAIProcessor';
import { AdvancedEffectsEngine, Effect, EffectCategory } from '../services/AdvancedEffectsEngine';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AIFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  processing: boolean;
  confidence?: number;
  lastResult?: any;
}

interface AIRecommendationCard {
  recommendation: SmartRecommendation;
  onApply: () => void;
  onDismiss: () => void;
}

export default function EnhancedAIPanel() {
  // Services
  const aiEngine = useRef(EnhancedAIEngine.getInstance());
  const creativeAssistant = useRef(SmartCreativeAssistant.getInstance());
  const realtimeProcessor = useRef(RealTimeAIProcessor.getInstance());
  const effectsEngine = useRef(AdvancedEffectsEngine.getInstance());

  // State
  const [currentTab, setCurrentTab] = useState<'features' | 'recommendations' | 'effects' | 'settings'>('features');
  const [aiFeatures, setAIFeatures] = useState<AIFeature[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [contentAnalysis, setContentAnalysis] = useState<CreativeAnalysis | null>(null);
  const [availableEffects, setAvailableEffects] = useState<Effect[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [autoEnhanceEnabled, setAutoEnhanceEnabled] = useState(true);
  
  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    latency: 0,
    memoryUsage: 0,
    processingLoad: 0
  });

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize component
  useEffect(() => {
    initializeAIServices();
  }, []);

  // Update performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = realtimeProcessor.current.getMetrics();
      setPerformanceMetrics({
        fps: Math.round(metrics.currentFPS),
        latency: Math.round(metrics.averageLatency),
        memoryUsage: Math.round(metrics.memoryUsage),
        processingLoad: Math.round(metrics.processingLoad)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeAIServices = async () => {
    try {
      setIsProcessing(true);
      
      // Initialize all AI services
      await Promise.all([
        aiEngine.current.initialize(),
        creativeAssistant.current.initialize(),
        realtimeProcessor.current.initialize(),
        effectsEngine.current.initialize()
      ]);

      // Setup AI features
      setupAIFeatures();
      
      // Load available effects
      const effects = effectsEngine.current.getAvailableEffects();
      setAvailableEffects(effects);

      setIsProcessing(false);
      
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
      Alert.alert('خطأ', 'فشل في تهيئة خدمات الذكاء الاصطناعي');
      setIsProcessing(false);
    }
  };

  const setupAIFeatures = () => {
    const features: AIFeature[] = [
      {
        id: 'content_analysis',
        name: 'تحليل المحتوى الذكي',
        icon: 'analytics',
        description: 'تحليل المشاهد والكائنات والألوان تلقائياً',
        enabled: true,
        processing: false
      },
      {
        id: 'auto_editing',
        name: 'التحرير التلقائي',
        icon: 'cut',
        description: 'اقتراح قطع وانتقالات ذكية',
        enabled: true,
        processing: false
      },
      {
        id: 'smart_effects',
        name: 'التأثيرات الذكية',
        icon: 'sparkles',
        description: 'تطبيق تأثيرات مناسبة للمحتوى',
        enabled: true,
        processing: false
      },
      {
        id: 'background_removal',
        name: 'إزالة الخلفية',
        icon: 'layers',
        description: 'إزالة وتغيير الخلفية بدقة عالية',
        enabled: true,
        processing: false
      },
      {
        id: 'speech_to_text',
        name: 'تحويل الكلام لنص',
        icon: 'mic',
        description: 'ترجمة الكلام لنص بـ 12 لغة',
        enabled: true,
        processing: false
      },
      {
        id: 'motion_tracking',
        name: 'تتبع الحركة',
        icon: 'locate',
        description: 'تتبع الكائنات والوجوه والحركة',
        enabled: true,
        processing: false
      }
    ];

    setAIFeatures(features);
  };

  const analyzeContent = async () => {
    try {
      setIsProcessing(true);
      
      // Mock video frames for analysis
      const mockFrames: ImageData[] = [];
      
      const analysis = await creativeAssistant.current.analyzeContent(mockFrames);
      setContentAnalysis(analysis);
      
      // Generate recommendations based on analysis
      const recs = await creativeAssistant.current.generateRecommendations(analysis);
      setRecommendations(recs);
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Content analysis failed:', error);
      setIsProcessing(false);
    }
  };

  const toggleAIFeature = (featureId: string) => {
    setAIFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ));
  };

  const applyRecommendation = async (recommendation: SmartRecommendation) => {
    try {
      setIsProcessing(true);
      
      // Apply the recommendation based on its type
      switch (recommendation.type) {
        case 'music':
          // Add music to timeline
          console.log('Adding music:', recommendation.content?.title);
          break;
        case 'template':
          // Apply video template
          console.log('Applying template:', recommendation.content?.title);
          break;
        case 'effect':
          // Apply visual effect
          console.log('Applying effect:', recommendation.suggestion);
          break;
        case 'color':
          // Apply color grading
          console.log('Applying color grading:', recommendation.suggestion);
          break;
      }
      
      // Remove recommendation from list
      setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      setIsProcessing(false);
    }
  };

  const toggleEffect = (effectId: string) => {
    setSelectedEffects(prev => 
      prev.includes(effectId)
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  const startRealTimeProcessing = async () => {
    try {
      setRealTimeEnabled(true);
      
      // Start real-time processing with selected effects
      // This would integrate with camera/video input
      console.log('Starting real-time processing with effects:', selectedEffects);
      
    } catch (error) {
      console.error('Failed to start real-time processing:', error);
      setRealTimeEnabled(false);
    }
  };

  const stopRealTimeProcessing = () => {
    setRealTimeEnabled(false);
    realtimeProcessor.current.stopProcessingStream();
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'features', label: 'الميزات', icon: 'settings' },
        { id: 'recommendations', label: 'التوصيات', icon: 'bulb' },
        { id: 'effects', label: 'التأثيرات', icon: 'color-palette' },
        { id: 'settings', label: 'الإعدادات', icon: 'options' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            currentTab === tab.id && styles.tabButtonActive
          ]}
          onPress={() => setCurrentTab(tab.id as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={currentTab === tab.id ? '#007AFF' : '#666'}
          />
          <Text style={[
            styles.tabLabel,
            currentTab === tab.id && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFeaturesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Content Analysis Card */}
      <View style={styles.analysisCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>تحليل المحتوى</Text>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={analyzeContent}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.analyzeButtonText}>تحليل</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {contentAnalysis && (
          <View style={styles.analysisResults}>
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>نوع المحتوى:</Text>
              <Text style={styles.analysisValue}>{contentAnalysis.contentType}</Text>
            </View>
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>المزاج:</Text>
              <Text style={styles.analysisValue}>{contentAnalysis.mood}</Text>
            </View>
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>النمط:</Text>
              <Text style={styles.analysisValue}>{contentAnalysis.style}</Text>
            </View>
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>المنصة المقترحة:</Text>
              <Text style={styles.analysisValue}>{contentAnalysis.platform}</Text>
            </View>
          </View>
        )}
      </View>

      {/* AI Features List */}
      <Text style={styles.sectionTitle}>ميزات الذكاء الاصطناعي</Text>
      {aiFeatures.map(feature => (
        <View key={feature.id} style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View style={styles.featureInfo}>
              <Ionicons name={feature.icon as any} size={24} color="#007AFF" />
              <View style={styles.featureText}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
            <View style={styles.featureControls}>
              {feature.processing && (
                <ActivityIndicator size="small" color="#007AFF" style={styles.featureLoader} />
              )}
              <Switch
                value={feature.enabled}
                onValueChange={() => toggleAIFeature(feature.id)}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
          </View>
          
          {feature.confidence && (
            <View style={styles.confidenceBar}>
              <Text style={styles.confidenceLabel}>الثقة: {Math.round(feature.confidence * 100)}%</Text>
              <View style={styles.confidenceBarContainer}>
                <View 
                  style={[
                    styles.confidenceBarFill,
                    { width: `${feature.confidence * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderRecommendationsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>التوصيات الذكية</Text>
      
      {recommendations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bulb-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>لا توجد توصيات حالياً</Text>
          <Text style={styles.emptyStateSubtext}>قم بتحليل المحتوى للحصول على توصيات ذكية</Text>
        </View>
      ) : (
        recommendations.map(recommendation => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onApply={() => applyRecommendation(recommendation)}
            onDismiss={() => setRecommendations(prev => prev.filter(r => r.id !== recommendation.id))}
          />
        ))
      )}
    </ScrollView>
  );

  const renderEffectsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>التأثيرات المتقدمة</Text>
      
      {/* Effect Categories */}
      {Object.values(EffectCategory).map(category => {
        const categoryEffects = availableEffects.filter(effect => effect.category === category);
        if (categoryEffects.length === 0) return null;

        return (
          <View key={category} style={styles.effectCategory}>
            <Text style={styles.categoryTitle}>{getCategoryLabel(category)}</Text>
            <View style={styles.effectsGrid}>
              {categoryEffects.map(effect => (
                <TouchableOpacity
                  key={effect.id}
                  style={[
                    styles.effectCard,
                    selectedEffects.includes(effect.id) && styles.effectCardSelected
                  ]}
                  onPress={() => toggleEffect(effect.id)}
                >
                  <View style={styles.effectHeader}>
                    <Text style={styles.effectName}>{effect.name}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(effect.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>
                        {getDifficultyLabel(effect.difficulty)}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedEffects.includes(effect.id) && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" style={styles.selectedIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>إعدادات الأداء</Text>
      
      {/* Performance Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>مقاييس الأداء</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.fps}</Text>
            <Text style={styles.metricLabel}>FPS</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.latency}ms</Text>
            <Text style={styles.metricLabel}>زمن الاستجابة</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.memoryUsage}MB</Text>
            <Text style={styles.metricLabel}>الذاكرة</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.processingLoad}%</Text>
            <Text style={styles.metricLabel}>حمل المعالجة</Text>
          </View>
        </View>
      </View>

      {/* Real-time Processing */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Text style={styles.settingTitle}>المعالجة في الوقت الفعلي</Text>
          <Switch
            value={realTimeEnabled}
            onValueChange={realTimeEnabled ? stopRealTimeProcessing : startRealTimeProcessing}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.settingDescription}>
          تفعيل المعالجة المباشرة للفيديو والتأثيرات
        </Text>
      </View>

      {/* Auto Enhancement */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Text style={styles.settingTitle}>التحسين التلقائي</Text>
          <Switch
            value={autoEnhanceEnabled}
            onValueChange={setAutoEnhanceEnabled}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.settingDescription}>
          تطبيق تحسينات ذكية تلقائياً على المحتوى
        </Text>
      </View>

      {/* Advanced Settings */}
      <TouchableOpacity
        style={styles.advancedButton}
        onPress={() => setShowAdvancedSettings(true)}
      >
        <Ionicons name="settings" size={20} color="#007AFF" />
        <Text style={styles.advancedButtonText}>الإعدادات المتقدمة</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </ScrollView>
  );

  const RecommendationCard: React.FC<AIRecommendationCard> = ({ recommendation, onApply, onDismiss }) => (
    <View style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <View style={styles.recommendationInfo}>
          <Ionicons name={getRecommendationIcon(recommendation.type)} size={20} color="#007AFF" />
          <Text style={styles.recommendationTitle}>{recommendation.suggestion}</Text>
        </View>
        <View style={styles.recommendationBadge}>
          <Text style={styles.confidenceText}>{Math.round(recommendation.confidence * 100)}%</Text>
        </View>
      </View>
      
      <Text style={styles.recommendationReason}>{recommendation.reason}</Text>
      
      <View style={styles.recommendationFooter}>
        <View style={styles.recommendationMeta}>
          <Text style={styles.impactText}>التأثير: {getImpactLabel(recommendation.impact)}</Text>
          <Text style={styles.timeText}>الوقت: {recommendation.timeToApply}ث</Text>
        </View>
        
        <View style={styles.recommendationActions}>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close" size={16} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>تطبيق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Helper functions
  const getCategoryLabel = (category: EffectCategory): string => {
    const labels = {
      [EffectCategory.COLOR]: 'الألوان',
      [EffectCategory.DISTORTION]: 'التشويه',
      [EffectCategory.BLUR]: 'الضبابية',
      [EffectCategory.ARTISTIC]: 'فني',
      [EffectCategory.TRANSITION]: 'الانتقالات',
      [EffectCategory.PARTICLE]: 'الجسيمات',
      [EffectCategory.AI_GENERATED]: 'مولد بالذكاء الاصطناعي',
      [EffectCategory.CINEMATIC]: 'سينمائي',
      [EffectCategory.VINTAGE]: 'كلاسيكي',
      [EffectCategory.FUTURISTIC]: 'مستقبلي'
    };
    return labels[category] || category;
  };

  const getDifficultyLabel = (difficulty: string): string => {
    const labels = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
    return labels[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors = { beginner: '#4CAF50', intermediate: '#FF9800', advanced: '#F44336' };
    return colors[difficulty] || '#999';
  };

  const getRecommendationIcon = (type: string): string => {
    const icons = {
      music: 'musical-notes',
      template: 'videocam',
      effect: 'sparkles',
      color: 'color-palette',
      editing: 'cut'
    };
    return icons[type] || 'bulb';
  };

  const getImpactLabel = (impact: string): string => {
    const labels = { low: 'منخفض', medium: 'متوسط', high: 'عالي' };
    return labels[impact] || impact;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>الذكاء الاصطناعي المحسن</Text>
        <Text style={styles.headerSubtitle}>ميزات متقدمة للتحرير الاحترافي</Text>
      </LinearGradient>

      {renderTabButtons()}

      <View style={styles.content}>
        {currentTab === 'features' && renderFeaturesTab()}
        {currentTab === 'recommendations' && renderRecommendationsTab()}
        {currentTab === 'effects' && renderEffectsTab()}
        {currentTab === 'settings' && renderSettingsTab()}
      </View>

      {/* Advanced Settings Modal */}
      <Modal
        visible={showAdvancedSettings}
        animationType="slide"
        onRequestClose={() => setShowAdvancedSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>الإعدادات المتقدمة</Text>
            <TouchableOpacity onPress={() => setShowAdvancedSettings(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {/* Advanced settings content would go here */}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    textAlign: 'center',
    marginTop: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: '#E3F2FD'
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    paddingTop: 16
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  analyzeButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  analyzeButtonText: {
    color: '#007AFF',
    fontWeight: '600'
  },
  analysisResults: {
    marginTop: 12
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  analysisLabel: {
    fontSize: 14,
    color: '#666'
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  featureText: {
    marginLeft: 12,
    flex: 1
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  featureControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  featureLoader: {
    marginRight: 8
  },
  confidenceBar: {
    marginTop: 12
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  confidenceBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  recommendationBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF'
  },
  recommendationReason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recommendationMeta: {
    flex: 1
  },
  impactText: {
    fontSize: 11,
    color: '#666'
  },
  timeText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2
  },
  recommendationActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dismissButton: {
    padding: 8,
    marginRight: 8
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  effectCategory: {
    marginBottom: 24
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6
  },
  effectCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  effectCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  effectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  effectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  difficultyText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600'
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8
  },
  metricsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  metricItem: {
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  settingDescription: {
    fontSize: 12,
    color: '#666'
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  advancedButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    flex: 1
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  }
});