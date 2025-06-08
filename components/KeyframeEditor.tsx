/**
 * محرر الإطارات المفتاحية - Nova Edit Mobile
 * واجهة متقدمة لإدارة وتحرير الإطارات المفتاحية
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Alert
} from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Keyframe, KeyframeProperty } from './AdvancedVideoTimeline';

interface KeyframeEditorProps {
  visible: boolean;
  keyframes: Keyframe[];
  selectedKeyframes: string[];
  clipDuration: number;
  currentTime: number;
  onClose: () => void;
  onKeyframeAdd: (property: KeyframeProperty, time: number, value: any) => void;
  onKeyframeUpdate: (keyframeId: string, value: any) => void;
  onKeyframeDelete: (keyframeId: string) => void;
  onKeyframeMove: (keyframeId: string, newTime: number) => void;
  onSelectionChange: (keyframeIds: string[]) => void;
}

interface BezierControlPoint {
  x: number;
  y: number;
}

interface AnimationCurve {
  keyframe1: Keyframe;
  keyframe2: Keyframe;
  controlPoints: {
    cp1: BezierControlPoint;
    cp2: BezierControlPoint;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GRAPH_HEIGHT = 200;
const GRAPH_WIDTH = screenWidth - 40;
const KEYFRAME_RADIUS = 6;

export default function KeyframeEditor({
  visible,
  keyframes,
  selectedKeyframes,
  clipDuration,
  currentTime,
  onClose,
  onKeyframeAdd,
  onKeyframeUpdate,
  onKeyframeDelete,
  onKeyframeMove,
  onSelectionChange
}: KeyframeEditorProps) {
  
  const [selectedProperty, setSelectedProperty] = useState<KeyframeProperty>(KeyframeProperty.OPACITY);
  const [showCurveEditor, setShowCurveEditor] = useState(false);
  const [editingKeyframe, setEditingKeyframe] = useState<Keyframe | null>(null);
  const [curveMode, setCurveMode] = useState<'linear' | 'bezier'>('bezier');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // فلترة الإطارات المفتاحية حسب الخاصية المحددة
  const filteredKeyframes = useMemo(() => {
    return keyframes.filter(kf => kf.property === selectedProperty);
  }, [keyframes, selectedProperty]);

  // حساب منحنيات الأنيميشن
  const animationCurves = useMemo(() => {
    const curves: AnimationCurve[] = [];
    const sortedKeyframes = [...filteredKeyframes].sort((a, b) => a.time - b.time);
    
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const kf1 = sortedKeyframes[i];
      const kf2 = sortedKeyframes[i + 1];
      
      curves.push({
        keyframe1: kf1,
        keyframe2: kf2,
        controlPoints: calculateBezierPoints(kf1, kf2)
      });
    }
    
    return curves;
  }, [filteredKeyframes]);

  // حساب نقاط التحكم للمنحنى البيزيه
  const calculateBezierPoints = (kf1: Keyframe, kf2: Keyframe): {
    cp1: BezierControlPoint;
    cp2: BezierControlPoint;
  } => {
    const timeDiff = kf2.time - kf1.time;
    const valueDiff = kf2.value - kf1.value;
    
    // نقاط التحكم الافتراضية بناءً على نوع التسهيل
    let cp1: BezierControlPoint;
    let cp2: BezierControlPoint;
    
    switch (kf1.easing) {
      case 'ease-in':
        cp1 = { x: kf1.time + timeDiff * 0.42, y: kf1.value };
        cp2 = { x: kf1.time + timeDiff * 1.0, y: kf1.value + valueDiff };
        break;
      case 'ease-out':
        cp1 = { x: kf1.time, y: kf1.value };
        cp2 = { x: kf1.time + timeDiff * 0.58, y: kf1.value + valueDiff };
        break;
      case 'ease-in-out':
        cp1 = { x: kf1.time + timeDiff * 0.42, y: kf1.value };
        cp2 = { x: kf1.time + timeDiff * 0.58, y: kf1.value + valueDiff };
        break;
      default: // linear
        cp1 = { x: kf1.time + timeDiff * 0.33, y: kf1.value + valueDiff * 0.33 };
        cp2 = { x: kf1.time + timeDiff * 0.67, y: kf1.value + valueDiff * 0.67 };
    }
    
    return { cp1, cp2 };
  };

  // تحويل الوقت إلى موضع X في الرسم البياني
  const timeToX = useCallback((time: number): number => {
    return (time / clipDuration) * GRAPH_WIDTH;
  }, [clipDuration]);

  // تحويل القيمة إلى موضع Y في الرسم البياني
  const valueToY = useCallback((value: number, property: KeyframeProperty): number => {
    const range = getPropertyRange(property);
    const normalizedValue = (value - range.min) / (range.max - range.min);
    return GRAPH_HEIGHT - (normalizedValue * GRAPH_HEIGHT);
  }, []);

  // تحويل موضع X إلى وقت
  const xToTime = useCallback((x: number): number => {
    return (x / GRAPH_WIDTH) * clipDuration;
  }, [clipDuration]);

  // تحويل موضع Y إلى قيمة
  const yToValue = useCallback((y: number, property: KeyframeProperty): number => {
    const range = getPropertyRange(property);
    const normalizedValue = (GRAPH_HEIGHT - y) / GRAPH_HEIGHT;
    return range.min + (normalizedValue * (range.max - range.min));
  }, []);

  // الحصول على نطاق القيم للخاصية
  const getPropertyRange = (property: KeyframeProperty): { min: number; max: number } => {
    const ranges = {
      [KeyframeProperty.SCALE]: { min: 0, max: 3 },
      [KeyframeProperty.ROTATION]: { min: 0, max: 360 },
      [KeyframeProperty.POSITION_X]: { min: -100, max: 100 },
      [KeyframeProperty.POSITION_Y]: { min: -100, max: 100 },
      [KeyframeProperty.OPACITY]: { min: 0, max: 1 },
      [KeyframeProperty.VOLUME]: { min: 0, max: 2 },
      [KeyframeProperty.BRIGHTNESS]: { min: -1, max: 1 },
      [KeyframeProperty.CONTRAST]: { min: -1, max: 1 },
      [KeyframeProperty.SATURATION]: { min: -1, max: 1 }
    };
    
    return ranges[property] || { min: 0, max: 1 };
  };

  // إيماءات السحب للإطارات المفتاحية
  const createKeyframePanResponder = (keyframe: Keyframe) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        setEditingKeyframe(keyframe);
        if (!selectedKeyframes.includes(keyframe.id)) {
          onSelectionChange([keyframe.id]);
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const newX = timeToX(keyframe.time) + gestureState.dx;
        const newY = valueToY(keyframe.value, keyframe.property) + gestureState.dy;
        
        const newTime = Math.max(0, Math.min(clipDuration, xToTime(newX)));
        const newValue = yToValue(newY, keyframe.property);
        
        // تحديث مؤقت للمعاينة
        onKeyframeUpdate(keyframe.id, newValue);
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const newX = timeToX(keyframe.time) + gestureState.dx;
        const newTime = Math.max(0, Math.min(clipDuration, xToTime(newX)));
        
        onKeyframeMove(keyframe.id, newTime);
        setEditingKeyframe(null);
      }
    });
  };

  // رسم الرسم البياني
  const renderGraph = () => {
    return (
      <View style={styles.graphContainer}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.graph}>
          {/* خطوط الشبكة */}
          {renderGridLines()}
          
          {/* منحنيات الأنيميشن */}
          {animationCurves.map((curve, index) => renderAnimationCurve(curve, index))}
          
          {/* الإطارات المفتاحية */}
          {filteredKeyframes.map(kf => renderKeyframePoint(kf))}
          
          {/* مؤشر الوقت الحالي */}
          {renderCurrentTimeIndicator()}
        </Svg>
        
        {/* تراكبات التفاعل */}
        {filteredKeyframes.map(kf => renderKeyframeOverlay(kf))}
      </View>
    );
  };

  // رسم خطوط الشبكة
  const renderGridLines = () => {
    const lines = [];
    const timeStep = clipDuration / 10;
    const range = getPropertyRange(selectedProperty);
    const valueStep = (range.max - range.min) / 10;
    
    // خطوط عمودية (الوقت)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * GRAPH_WIDTH;
      lines.push(
        <Line
          key={`vertical-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={GRAPH_HEIGHT}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={i % 5 === 0 ? 1 : 0.5}
        />
      );
    }
    
    // خطوط أفقية (القيم)
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * GRAPH_HEIGHT;
      lines.push(
        <Line
          key={`horizontal-${i}`}
          x1={0}
          y1={y}
          x2={GRAPH_WIDTH}
          y2={y}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={i % 5 === 0 ? 1 : 0.5}
        />
      );
    }
    
    return <G>{lines}</G>;
  };

  // رسم منحنى الأنيميشن
  const renderAnimationCurve = (curve: AnimationCurve, index: number) => {
    const { keyframe1, keyframe2, controlPoints } = curve;
    
    const x1 = timeToX(keyframe1.time);
    const y1 = valueToY(keyframe1.value, selectedProperty);
    const x2 = timeToX(keyframe2.time);
    const y2 = valueToY(keyframe2.value, selectedProperty);
    
    const { cp1, cp2 } = controlPoints;
    const cp1X = timeToX(cp1.x);
    const cp1Y = valueToY(cp1.y, selectedProperty);
    const cp2X = timeToX(cp2.x);
    const cp2Y = valueToY(cp2.y, selectedProperty);
    
    const pathData = `M ${x1} ${y1} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x2} ${y2}`;
    
    return (
      <G key={`curve-${index}`}>
        <Path
          d={pathData}
          stroke="#007AFF"
          strokeWidth={2}
          fill="none"
        />
        
        {/* نقاط التحكم للمنحنى البيزيه */}
        {curveMode === 'bezier' && showCurveEditor && (
          <>
            <Line x1={x1} y1={y1} x2={cp1X} y2={cp1Y} stroke="#666" strokeWidth={1} />
            <Line x1={x2} y1={y2} x2={cp2X} y2={cp2Y} stroke="#666" strokeWidth={1} />
            <Circle cx={cp1X} cy={cp1Y} r={4} fill="#666" />
            <Circle cx={cp2X} cy={cp2Y} r={4} fill="#666" />
          </>
        )}
      </G>
    );
  };

  // رسم نقطة الإطار المفتاحي
  const renderKeyframePoint = (keyframe: Keyframe) => {
    const x = timeToX(keyframe.time);
    const y = valueToY(keyframe.value, selectedProperty);
    const isSelected = selectedKeyframes.includes(keyframe.id);
    
    return (
      <Circle
        key={`keyframe-${keyframe.id}`}
        cx={x}
        cy={y}
        r={KEYFRAME_RADIUS}
        fill={isSelected ? "#FF3B30" : "#007AFF"}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  // رسم مؤشر الوقت الحالي
  const renderCurrentTimeIndicator = () => {
    const x = timeToX(currentTime);
    
    return (
      <Line
        x1={x}
        y1={0}
        x2={x}
        y2={GRAPH_HEIGHT}
        stroke="#FF3B30"
        strokeWidth={2}
      />
    );
  };

  // رسم تراكب التفاعل للإطار المفتاحي
  const renderKeyframeOverlay = (keyframe: Keyframe) => {
    const x = timeToX(keyframe.time);
    const y = valueToY(keyframe.value, selectedProperty);
    const panResponder = createKeyframePanResponder(keyframe);
    
    return (
      <Animated.View
        key={`overlay-${keyframe.id}`}
        style={[
          styles.keyframeOverlay,
          {
            left: x - 15,
            top: y - 15
          }
        ]}
        {...panResponder.panHandlers}
      />
    );
  };

  // قائمة خصائص الإطارات المفتاحية
  const renderPropertyList = () => {
    const properties = Object.values(KeyframeProperty);
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.propertyList}
      >
        {properties.map(property => {
          const propertyKeyframes = keyframes.filter(kf => kf.property === property);
          const isActive = property === selectedProperty;
          
          return (
            <TouchableOpacity
              key={property}
              style={[
                styles.propertyButton,
                isActive && styles.activePropertyButton
              ]}
              onPress={() => setSelectedProperty(property)}
            >
              <Ionicons 
                name={getPropertyIcon(property)} 
                size={18} 
                color={isActive ? "#fff" : "#666"} 
              />
              <Text style={[
                styles.propertyText,
                isActive && styles.activePropertyText
              ]}>
                {getPropertyDisplayName(property)}
              </Text>
              {propertyKeyframes.length > 0 && (
                <View style={styles.keyframeCount}>
                  <Text style={styles.keyframeCountText}>
                    {propertyKeyframes.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // أدوات التحرير
  const renderEditingTools = () => {
    return (
      <View style={styles.editingTools}>
        <View style={styles.toolGroup}>
          <TouchableOpacity
            style={[styles.toolButton, curveMode === 'linear' && styles.activeToolButton]}
            onPress={() => setCurveMode('linear')}
          >
            <Ionicons name="trending-up" size={18} color="#fff" />
            <Text style={styles.toolButtonText}>خطي</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolButton, curveMode === 'bezier' && styles.activeToolButton]}
            onPress={() => setCurveMode('bezier')}
          >
            <Ionicons name="git-branch" size={18} color="#fff" />
            <Text style={styles.toolButtonText}>منحني</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolButton, showCurveEditor && styles.activeToolButton]}
            onPress={() => setShowCurveEditor(!showCurveEditor)}
          >
            <Ionicons name="options" size={18} color="#fff" />
            <Text style={styles.toolButtonText}>منحنيات</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.toolGroup}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddKeyframe}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>إضافة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleDeleteSelectedKeyframes}
            disabled={selectedKeyframes.length === 0}
          >
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // محرر القيم المباشر
  const renderValueEditor = () => {
    if (selectedKeyframes.length !== 1) return null;
    
    const keyframe = keyframes.find(kf => kf.id === selectedKeyframes[0]);
    if (!keyframe) return null;
    
    const range = getPropertyRange(keyframe.property);
    
    return (
      <View style={styles.valueEditor}>
        <Text style={styles.valueEditorTitle}>
          {getPropertyDisplayName(keyframe.property)}
        </Text>
        
        <View style={styles.valueSliderContainer}>
          <Text style={styles.valueLabel}>{range.min}</Text>
          <Slider
            style={styles.valueSlider}
            minimumValue={range.min}
            maximumValue={range.max}
            value={keyframe.value}
            onValueChange={(value) => onKeyframeUpdate(keyframe.id, value)}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#666"
            thumbStyle={{ backgroundColor: '#007AFF' }}
          />
          <Text style={styles.valueLabel}>{range.max}</Text>
        </View>
        
        <Text style={styles.currentValue}>
          القيمة: {keyframe.value.toFixed(2)}
        </Text>
        
        <Text style={styles.currentTime}>
          الوقت: {keyframe.time.toFixed(2)}s
        </Text>
      </View>
    );
  };

  // معالجات الأحداث
  const handleAddKeyframe = () => {
    const range = getPropertyRange(selectedProperty);
    const defaultValue = (range.min + range.max) / 2;
    
    onKeyframeAdd(selectedProperty, currentTime, defaultValue);
  };

  const handleDeleteSelectedKeyframes = () => {
    if (selectedKeyframes.length === 0) return;
    
    Alert.alert(
      'حذف الإطارات المفتاحية',
      `هل أنت متأكد من حذف ${selectedKeyframes.length} إطار مفتاحي؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            selectedKeyframes.forEach(id => onKeyframeDelete(id));
            onSelectionChange([]);
          }
        }
      ]
    );
  };

  // وظائف مساعدة
  const getPropertyIcon = (property: KeyframeProperty): string => {
    const icons = {
      [KeyframeProperty.SCALE]: 'resize',
      [KeyframeProperty.ROTATION]: 'refresh',
      [KeyframeProperty.POSITION_X]: 'arrow-forward',
      [KeyframeProperty.POSITION_Y]: 'arrow-up',
      [KeyframeProperty.OPACITY]: 'eye',
      [KeyframeProperty.VOLUME]: 'volume-medium',
      [KeyframeProperty.BRIGHTNESS]: 'sunny',
      [KeyframeProperty.CONTRAST]: 'contrast',
      [KeyframeProperty.SATURATION]: 'color-palette'
    };
    
    return icons[property] || 'ellipse';
  };

  const getPropertyDisplayName = (property: KeyframeProperty): string => {
    const names = {
      [KeyframeProperty.SCALE]: 'الحجم',
      [KeyframeProperty.ROTATION]: 'الدوران',
      [KeyframeProperty.POSITION_X]: 'الموضع X',
      [KeyframeProperty.POSITION_Y]: 'الموضع Y',
      [KeyframeProperty.OPACITY]: 'الشفافية',
      [KeyframeProperty.VOLUME]: 'الصوت',
      [KeyframeProperty.BRIGHTNESS]: 'السطوع',
      [KeyframeProperty.CONTRAST]: 'التباين',
      [KeyframeProperty.SATURATION]: 'التشبع'
    };
    
    return names[property] || property;
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
        {/* الرأس */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>إغلاق</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>محرر الإطارات المفتاحية</Text>
          
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.doneButton}>تم</Text>
          </TouchableOpacity>
        </View>

        {/* قائمة الخصائص */}
        {renderPropertyList()}

        {/* الرسم البياني */}
        {renderGraph()}

        {/* أدوات التحرير */}
        {renderEditingTools()}

        {/* محرر القيم */}
        {renderValueEditor()}
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
  doneButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  propertyList: {
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  propertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activePropertyButton: {
    backgroundColor: '#007AFF',
  },
  propertyText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 6,
  },
  activePropertyText: {
    color: '#fff',
  },
  keyframeCount: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  keyframeCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  graphContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  graph: {
    backgroundColor: '#2a2a2a',
  },
  keyframeOverlay: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: 'transparent',
  },
  editingTools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  activeToolButton: {
    backgroundColor: '#007AFF',
  },
  toolButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  valueEditor: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  valueEditorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  valueSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueLabel: {
    color: '#666',
    fontSize: 12,
    minWidth: 30,
  },
  valueSlider: {
    flex: 1,
    marginHorizontal: 16,
  },
  currentValue: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  currentTime: {
    color: '#ccc',
    fontSize: 14,
  },
});

export default KeyframeEditor;