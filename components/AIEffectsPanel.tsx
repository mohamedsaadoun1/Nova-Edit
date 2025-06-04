/**
 * لوحة تأثيرات الذكاء الاصطناعي - Nova Edit Mobile
 * واجهة متقدمة لتطبيق وتخصيص تأثيرات الذكاء الاصطناعي
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Slider,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
  PanGestureHandler,
  State
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import AIEffectsIntegration, {
  AIEffect,
  AIEffectParameter,
  AIEffectPreset,
  ProcessingResult,
  AIEffectCategory,
  ParameterType,
  EffectComplexity
} from '../services/AIEffectsIntegration';
import { ProcessingFrame } from '../services/AIProcessingService';

const { width, height } = Dimensions.get('window');

interface AIEffectsPanelProps {
  currentFrame?: ProcessingFrame;
  onEffectApply?: (effectId: string, parameters: any) => Promise<ProcessingResult>;
  onParametersChange?: (effectId: string, parameters: any) => void;
  onPresetSelect?: (effectId: string, preset: AIEffectPreset) => void;
  selectedEffectId?: string;
  isProcessing?: boolean;
  realTimePreview?: boolean;
}

interface EffectState {
  effect: AIEffect;
  parameters: { [key: string]: any };
  isActive: boolean;
  processingTime?: number;
  lastResult?: ProcessingResult;
}

export default function AIEffectsPanel({
  currentFrame,
  onEffectApply,
  onParametersChange,
  onPresetSelect,
  selectedEffectId,
  isProcessing = false,
  realTimePreview = false
}: AIEffectsPanelProps) {
  const [effectsState, setEffectsState] = useState<Map<string, EffectState>>(new Map());
  const [availableEffects, setAvailableEffects] = useState<AIEffect[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AIEffectCategory | 'all'>('all');
  const [expandedEffect, setExpandedEffect] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const aiManager = useMemo(() => AIEffectsIntegration.getInstance(), []);
  const animatedValue = useMemo(() => new Animated.Value(0), []);

  const categories = [
    { id: 'all', name: 'الكل', icon: 'apps-outline', color: '#6C63FF' },
    { id: AIEffectCategory.BEAUTY, name: 'تجميل', icon: 'sparkles-outline', color: '#FF6B9D' },
    { id: AIEffectCategory.BACKGROUND, name: 'خلفية', icon: 'image-outline', color: '#4ECDC4' },
    { id: AIEffectCategory.MOTION, name: 'حركة', icon: 'walk-outline', color: '#45B7D1' },
    { id: AIEffectCategory.ENHANCEMENT, name: 'تحسين', icon: 'color-wand-outline', color: '#96CEB4' },
    { id: AIEffectCategory.ARTISTIC, name: 'فني', icon: 'brush-outline', color: '#FFEAA7' },
    { id: AIEffectCategory.DETECTION, name: 'كشف', icon: 'eye-outline', color: '#DDA0DD' },
    { id: AIEffectCategory.TRACKING, name: 'تتبع', icon: 'locate-outline', color: '#98D8C8' }
  ];

  useEffect(() => {
    initializeAIEffects();
  }, []);

  useEffect(() => {
    if (realTimePreview && selectedEffectId && currentFrame) {
      debouncePreview();
    }
  }, [effectsState, selectedEffectId, currentFrame, realTimePreview]);

  const initializeAIEffects = async () => {
    try {
      setLoading(true);
      await aiManager.initialize();
      const effects = aiManager.getAvailableEffects();
      setAvailableEffects(effects);
      
      // تهيئة حالة التأثيرات
      const newEffectsState = new Map<string, EffectState>();
      effects.forEach(effect => {
        const defaultParameters: { [key: string]: any } = {};
        effect.parameters.forEach(param => {
          defaultParameters[param.name] = param.defaultValue;
        });
        
        newEffectsState.set(effect.id, {
          effect,
          parameters: defaultParameters,
          isActive: false
        });
      });
      
      setEffectsState(newEffectsState);
    } catch (error) {
      console.error('Failed to initialize AI effects:', error);
      Alert.alert('خطأ', 'فشل في تحميل تأثيرات الذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  const debouncePreview = useCallback(
    debounce(async () => {
      if (selectedEffectId && currentFrame) {
        await performPreview(selectedEffectId);
      }
    }, 500),
    [selectedEffectId, currentFrame]
  );

  const performPreview = async (effectId: string) => {
    if (!currentFrame) return;

    const effectState = effectsState.get(effectId);
    if (!effectState) return;

    try {
      const startTime = Date.now();
      const result = await aiManager.applyEffect(
        effectId,
        currentFrame,
        effectState.parameters
      );
      
      const processingTime = Date.now() - startTime;
      
      setPreviewResult(result);
      
      // تحديث حالة التأثير
      const updatedState = { ...effectState, processingTime, lastResult: result };
      setEffectsState(prev => new Map(prev.set(effectId, updatedState)));
      
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleEffectToggle = async (effectId: string) => {
    const effectState = effectsState.get(effectId);
    if (!effectState) return;

    const newIsActive = !effectState.isActive;
    
    // تحديث الحالة
    const updatedState = { ...effectState, isActive: newIsActive };
    setEffectsState(prev => new Map(prev.set(effectId, updatedState)));

    if (newIsActive && onEffectApply && currentFrame) {
      try {
        const result = await onEffectApply(effectId, effectState.parameters);
        updatedState.lastResult = result;
        setEffectsState(prev => new Map(prev.set(effectId, updatedState)));
      } catch (error) {
        console.error('Effect application failed:', error);
        // إرجاع الحالة
        updatedState.isActive = false;
        setEffectsState(prev => new Map(prev.set(effectId, updatedState)));
      }
    }
  };

  const handleParameterChange = (effectId: string, paramName: string, value: any) => {
    const effectState = effectsState.get(effectId);
    if (!effectState) return;

    const newParameters = { ...effectState.parameters, [paramName]: value };
    const updatedState = { ...effectState, parameters: newParameters };
    
    setEffectsState(prev => new Map(prev.set(effectId, updatedState)));
    onParametersChange?.(effectId, newParameters);
  };

  const handlePresetSelect = (effectId: string, preset: AIEffectPreset) => {
    const effectState = effectsState.get(effectId);
    if (!effectState) return;

    const updatedState = { ...effectState, parameters: { ...preset.parameters } };
    setEffectsState(prev => new Map(prev.set(effectId, updatedState)));
    
    onPresetSelect?.(effectId, preset);
  };

  const getFilteredEffects = () => {
    if (selectedCategory === 'all') {
      return availableEffects;
    }
    return availableEffects.filter(effect => effect.category === selectedCategory);
  };

  const getComplexityColor = (complexity: EffectComplexity): string => {
    switch (complexity) {
      case EffectComplexity.LOW: return '#4CAF50';
      case EffectComplexity.MEDIUM: return '#FF9800';
      case EffectComplexity.HIGH: return '#F44336';
      case EffectComplexity.EXTREME: return '#9C27B0';
      default: return '#666';
    }
  };

  const getComplexityIcon = (complexity: EffectComplexity): string => {
    switch (complexity) {
      case EffectComplexity.LOW: return 'flash-outline';
      case EffectComplexity.MEDIUM: return 'speedometer-outline';
      case EffectComplexity.HIGH: return 'flame-outline';
      case EffectComplexity.EXTREME: return 'nuclear-outline';
      default: return 'help-outline';
    }
  };

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
      contentContainerStyle={styles.categoriesContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryTab,
            selectedCategory === category.id && styles.activeCategoryTab
          ]}
          onPress={() => setSelectedCategory(category.id as any)}
        >
          <LinearGradient
            colors={
              selectedCategory === category.id
                ? [category.color, category.color + '80']
                : ['transparent', 'transparent']
            }
            style={styles.categoryGradient}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.id ? '#fff' : category.color}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.activeCategoryText
            ]}>
              {category.name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderParameterControl = (effectId: string, parameter: AIEffectParameter) => {
    const effectState = effectsState.get(effectId);
    if (!effectState) return null;

    const value = effectState.parameters[parameter.name];

    switch (parameter.type) {
      case ParameterType.SLIDER:
        return (
          <View style={styles.sliderContainer}>
            <View style={styles.parameterHeader}>
              <Text style={styles.parameterName}>{parameter.name}</Text>
              <Text style={styles.parameterValue}>
                {typeof value === 'number' ? value.toFixed(2) : value}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              value={value}
              minimumValue={parameter.range?.min || 0}
              maximumValue={parameter.range?.max || 1}
              onValueChange={(newValue) => 
                handleParameterChange(effectId, parameter.name, newValue)
              }
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E1E8ED"
              thumbStyle={styles.sliderThumb}
            />
            <Text style={styles.parameterDescription}>
              {parameter.description}
            </Text>
          </View>
        );

      case ParameterType.TOGGLE:
        return (
          <View style={styles.toggleContainer}>
            <View style={styles.parameterHeader}>
              <Text style={styles.parameterName}>{parameter.name}</Text>
              <Switch
                value={value}
                onValueChange={(newValue) =>
                  handleParameterChange(effectId, parameter.name, newValue)
                }
                trackColor={{ false: '#E1E8ED', true: '#007AFF80' }}
                thumbColor={value ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.parameterDescription}>
              {parameter.description}
            </Text>
          </View>
        );

      case ParameterType.SELECT:
        return (
          <View style={styles.selectContainer}>
            <Text style={styles.parameterName}>{parameter.name}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.optionsScroll}
            >
              {parameter.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    value === option && styles.selectedOption
                  ]}
                  onPress={() =>
                    handleParameterChange(effectId, parameter.name, option)
                  }
                >
                  <Text style={[
                    styles.optionText,
                    value === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.parameterDescription}>
              {parameter.description}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderEffectPresets = (effect: AIEffect) => {
    if (effect.presets.length === 0) return null;

    return (
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>الإعدادات المسبقة</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsScroll}
        >
          {effect.presets.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetCard}
              onPress={() => handlePresetSelect(effect.id, preset)}
            >
              <Image
                source={{ uri: preset.thumbnail }}
                style={styles.presetThumbnail}
                defaultSource={{ uri: 'https://via.placeholder.com/80x80/95A5A6/FFF?text=⚙️' }}
              />
              <Text style={styles.presetName}>{preset.name}</Text>
              <Text style={styles.presetDescription} numberOfLines={2}>
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEffectCard = (effect: AIEffect) => {
    const effectState = effectsState.get(effect.id);
    if (!effectState) return null;

    const isExpanded = expandedEffect === effect.id;
    const isSelected = selectedEffectId === effect.id;
    const categoryColor = categories.find(c => c.id === effect.category)?.color || '#666';

    return (
      <View key={effect.id} style={[
        styles.effectCard,
        isSelected && styles.selectedEffectCard
      ]}>
        <TouchableOpacity
          style={styles.effectHeader}
          onPress={() => setExpandedEffect(isExpanded ? null : effect.id)}
        >
          <View style={styles.effectInfo}>
            <View style={styles.effectTitleRow}>
              <Text style={styles.effectName}>{effect.name}</Text>
              <View style={[styles.complexityBadge, { backgroundColor: getComplexityColor(effect.complexity) }]}>
                <Ionicons
                  name={getComplexityIcon(effect.complexity) as any}
                  size={12}
                  color="#fff"
                />
              </View>
            </View>
            
            <Text style={styles.effectDescription} numberOfLines={2}>
              {effect.description}
            </Text>
            
            <View style={styles.effectMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                  {categories.find(c => c.id === effect.category)?.name}
                </Text>
              </View>
              
              {effect.realTimeCapable && (
                <View style={styles.realtimeBadge}>
                  <Ionicons name="flash" size={12} color="#4CAF50" />
                  <Text style={styles.realtimeText}>مباشر</Text>
                </View>
              )}
              
              {effectState.processingTime && (
                <Text style={styles.processingTime}>
                  {effectState.processingTime}ms
                </Text>
              )}
            </View>
          </View>

          <View style={styles.effectControls}>
            <Switch
              value={effectState.isActive}
              onValueChange={() => handleEffectToggle(effect.id)}
              trackColor={{ false: '#E1E8ED', true: categoryColor + '40' }}
              thumbColor={effectState.isActive ? categoryColor : '#f4f3f4'}
              disabled={isProcessing}
            />
            
            <TouchableOpacity style={styles.expandButton}>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.effectDetails}>
            {renderEffectPresets(effect)}
            
            <View style={styles.parametersContainer}>
              <Text style={styles.parametersTitle}>المعاملات</Text>
              {effect.parameters.map((parameter) =>
                renderParameterControl(effect.id, parameter)
              )}
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderProcessingIndicator = () => {
    if (!isProcessing) return null;

    return (
      <BlurView intensity={80} style={styles.processingOverlay}>
        <View style={styles.processingIndicator}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>جاري المعالجة...</Text>
        </View>
      </BlurView>
    );
  };

  const renderPreviewResult = () => {
    if (!previewResult || !previewResult.success) return null;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>نتيجة المعاينة</Text>
        <View style={styles.previewStats}>
          <View style={styles.previewStat}>
            <Text style={styles.previewStatLabel}>وقت المعالجة</Text>
            <Text style={styles.previewStatValue}>{previewResult.processingTime}ms</Text>
          </View>
          <View style={styles.previewStat}>
            <Text style={styles.previewStatLabel}>GPU</Text>
            <Text style={styles.previewStatValue}>
              {previewResult.usedGPU ? 'مُفعل' : 'معطل'}
            </Text>
          </View>
          {previewResult.metadata?.confidence && (
            <View style={styles.previewStat}>
              <Text style={styles.previewStatLabel}>الثقة</Text>
              <Text style={styles.previewStatValue}>
                {(previewResult.metadata.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري تحميل تأثيرات الذكاء الاصطناعي...</Text>
      </View>
    );
  }

  const filteredEffects = getFilteredEffects();

  return (
    <View style={styles.container}>
      {renderCategoryTabs()}
      
      <ScrollView
        style={styles.effectsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.effectsContent}
      >
        {filteredEffects.map(renderEffectCard)}
        
        {realTimePreview && renderPreviewResult()}
      </ScrollView>

      {renderProcessingIndicator()}
    </View>
  );
}

// دالة مساعدة للتأخير (debounce)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  categoryTab: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden'
  },
  activeCategoryTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6
  },
  activeCategoryText: {
    color: '#fff'
  },
  effectsList: {
    flex: 1
  },
  effectsContent: {
    padding: 16
  },
  effectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  selectedEffectCard: {
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  effectHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center'
  },
  effectInfo: {
    flex: 1,
    marginRight: 16
  },
  effectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  effectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  complexityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8
  },
  effectDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12
  },
  effectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500'
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4
  },
  realtimeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4
  },
  processingTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  effectControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  expandButton: {
    marginLeft: 12,
    padding: 8
  },
  effectDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16
  },
  presetsContainer: {
    marginBottom: 20
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right'
  },
  presetsScroll: {
    marginHorizontal: -16
  },
  presetCard: {
    width: 100,
    marginLeft: 16,
    alignItems: 'center'
  },
  presetThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 8
  },
  presetName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  presetDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14
  },
  parametersContainer: {
    marginTop: 16
  },
  parametersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right'
  },
  sliderContainer: {
    marginBottom: 20
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  parameterName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  parameterValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600'
  },
  slider: {
    width: '100%',
    height: 40
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20
  },
  parameterDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right'
  },
  toggleContainer: {
    marginBottom: 20
  },
  selectContainer: {
    marginBottom: 20
  },
  optionsScroll: {
    marginVertical: 8
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8
  },
  selectedOption: {
    backgroundColor: '#007AFF'
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  selectedOptionText: {
    color: '#fff'
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right'
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  previewStat: {
    alignItems: 'center'
  },
  previewStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  previewStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  processingIndicator: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  processingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    fontWeight: '500'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center'
  }
});