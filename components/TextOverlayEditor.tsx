import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  PanResponder,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  rotation: number;
  opacity: number;
  animation?: string;
  startTime: number;
  endTime: number;
}

interface TextOverlayEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (overlay: TextOverlay) => void;
  overlay?: TextOverlay;
  videoDuration: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const fonts = [
  { name: 'افتراضي', value: 'System' },
  { name: 'عريض', value: 'Arial-Bold' },
  { name: 'خفيف', value: 'Arial-Light' },
  { name: 'مزخرف', value: 'Courier' },
  { name: 'حديث', value: 'Helvetica' }
];

const colors = [
  '#FFFFFF', '#000000', '#FF3B30', '#007AFF', '#34C759',
  '#FFCC00', '#FF9500', '#AF52DE', '#FF2D92', '#8E8E93'
];

const animations = [
  { name: 'بدون', value: 'none' },
  { name: 'ظهور تدريجي', value: 'fadeIn' },
  { name: 'انزلاق من اليسار', value: 'slideLeft' },
  { name: 'انزلاق من اليمين', value: 'slideRight' },
  { name: 'انزلاق من الأعلى', value: 'slideUp' },
  { name: 'انزلاق من الأسفل', value: 'slideDown' },
  { name: 'تكبير', value: 'zoomIn' },
  { name: 'دوران', value: 'rotate' },
  { name: 'ارتداد', value: 'bounce' },
  { name: 'نبضة', value: 'pulse' }
];

export default function TextOverlayEditor({
  visible,
  onClose,
  onSave,
  overlay,
  videoDuration
}: TextOverlayEditorProps) {
  const [currentOverlay, setCurrentOverlay] = useState<TextOverlay>(
    overlay || {
      id: Date.now().toString(),
      text: 'النص هنا',
      x: screenWidth / 2 - 50,
      y: screenHeight / 2 - 100,
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'System',
      bold: false,
      italic: false,
      underline: false,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      rotation: 0,
      opacity: 1,
      animation: 'none',
      startTime: 0,
      endTime: Math.min(5, videoDuration)
    }
  );

  const [activeTab, setActiveTab] = useState<'text' | 'style' | 'animation' | 'timing'>('text');
  const [isEditingPosition, setIsEditingPosition] = useState(false);

  const textPosition = useRef(new Animated.ValueXY({ x: currentOverlay.x, y: currentOverlay.y })).current;

  // إيماءات سحب النص
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isEditingPosition,
    onMoveShouldSetPanResponder: () => isEditingPosition,
    
    onPanResponderMove: Animated.event(
      [null, { dx: textPosition.x, dy: textPosition.y }],
      { useNativeDriver: false }
    ),
    
    onPanResponderRelease: (evt, gestureState) => {
      const newX = currentOverlay.x + gestureState.dx;
      const newY = currentOverlay.y + gestureState.dy;
      
      setCurrentOverlay(prev => ({
        ...prev,
        x: Math.max(0, Math.min(screenWidth - 100, newX)),
        y: Math.max(100, Math.min(screenHeight - 200, newY))
      }));
      
      textPosition.setOffset({
        x: newX,
        y: newY
      });
      textPosition.setValue({ x: 0, y: 0 });
    }
  });

  const handleSave = () => {
    if (currentOverlay.text.trim()) {
      onSave(currentOverlay);
      onClose();
    }
  };

  const updateOverlay = (updates: Partial<TextOverlay>) => {
    setCurrentOverlay(prev => ({ ...prev, ...updates }));
  };

  const renderTextTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>النص</Text>
      <TextInput
        style={styles.textInput}
        value={currentOverlay.text}
        onChangeText={(text) => updateOverlay({ text })}
        placeholder="اكتب النص هنا..."
        placeholderTextColor="#666"
        multiline
        maxLength={200}
      />

      <Text style={styles.sectionLabel}>الخط</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.fontsList}>
          {fonts.map((font) => (
            <TouchableOpacity
              key={font.value}
              style={[
                styles.fontButton,
                currentOverlay.fontFamily === font.value && styles.selectedFont
              ]}
              onPress={() => updateOverlay({ fontFamily: font.value })}
            >
              <Text style={[
                styles.fontButtonText,
                { fontFamily: font.value },
                currentOverlay.fontFamily === font.value && styles.selectedFontText
              ]}>
                {font.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.textStyleControls}>
        <TouchableOpacity
          style={[styles.styleButton, currentOverlay.bold && styles.activeStyleButton]}
          onPress={() => updateOverlay({ bold: !currentOverlay.bold })}
        >
          <Ionicons name="text" size={20} color={currentOverlay.bold ? "#007AFF" : "#666"} />
          <Text style={styles.styleButtonText}>عريض</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.styleButton, currentOverlay.italic && styles.activeStyleButton]}
          onPress={() => updateOverlay({ italic: !currentOverlay.italic })}
        >
          <Ionicons name="text-outline" size={20} color={currentOverlay.italic ? "#007AFF" : "#666"} />
          <Text style={styles.styleButtonText}>مائل</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.styleButton, currentOverlay.underline && styles.activeStyleButton]}
          onPress={() => updateOverlay({ underline: !currentOverlay.underline })}
        >
          <Ionicons name="remove-outline" size={20} color={currentOverlay.underline ? "#007AFF" : "#666"} />
          <Text style={styles.styleButtonText}>خط تحت</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStyleTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>حجم الخط</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderValue}>{currentOverlay.fontSize}px</Text>
        {/* يمكن إضافة Slider هنا */}
        <View style={styles.sizeButtons}>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => updateOverlay({ fontSize: Math.max(12, currentOverlay.fontSize - 2) })}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => updateOverlay({ fontSize: Math.min(72, currentOverlay.fontSize + 2) })}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionLabel}>لون النص</Text>
      <View style={styles.colorGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              currentOverlay.color === color && styles.selectedColor
            ]}
            onPress={() => updateOverlay({ color })}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>لون الخلفية</Text>
      <View style={styles.colorGrid}>
        <TouchableOpacity
          style={[
            styles.colorButton,
            styles.transparentButton,
            currentOverlay.backgroundColor === 'transparent' && styles.selectedColor
          ]}
          onPress={() => updateOverlay({ backgroundColor: 'transparent' })}
        >
          <Ionicons name="close" size={16} color="#666" />
        </TouchableOpacity>
        {colors.map((color) => (
          <TouchableOpacity
            key={`bg-${color}`}
            style={[
              styles.colorButton,
              { backgroundColor: color + '80' },
              currentOverlay.backgroundColor === color + '80' && styles.selectedColor
            ]}
            onPress={() => updateOverlay({ backgroundColor: color + '80' })}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>الشفافية</Text>
      <Text style={styles.sliderValue}>{Math.round(currentOverlay.opacity * 100)}%</Text>
    </View>
  );

  const renderAnimationTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>نوع الحركة</Text>
      <ScrollView style={styles.animationsList}>
        {animations.map((animation) => (
          <TouchableOpacity
            key={animation.value}
            style={[
              styles.animationButton,
              currentOverlay.animation === animation.value && styles.selectedAnimation
            ]}
            onPress={() => updateOverlay({ animation: animation.value })}
          >
            <Text style={[
              styles.animationButtonText,
              currentOverlay.animation === animation.value && styles.selectedAnimationText
            ]}>
              {animation.name}
            </Text>
            <Ionicons 
              name="checkmark" 
              size={16} 
              color={currentOverlay.animation === animation.value ? "#007AFF" : "transparent"} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimingTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>وقت البداية</Text>
      <Text style={styles.timeValue}>{formatTime(currentOverlay.startTime)}</Text>
      
      <Text style={styles.sectionLabel}>وقت النهاية</Text>
      <Text style={styles.timeValue}>{formatTime(currentOverlay.endTime)}</Text>
      
      <Text style={styles.sectionLabel}>المدة: {formatTime(currentOverlay.endTime - currentOverlay.startTime)}</Text>
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
            <Text style={styles.cancelButton}>إلغاء</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>تحرير النص</Text>
          
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>حفظ</Text>
          </TouchableOpacity>
        </View>

        {/* Preview Area */}
        <View style={styles.previewArea}>
          <Animated.View
            style={[
              styles.textPreview,
              {
                transform: [
                  ...textPosition.getTranslateTransform(),
                  { rotate: `${currentOverlay.rotation}deg` }
                ]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <Text
              style={[
                styles.previewText,
                {
                  fontSize: currentOverlay.fontSize,
                  color: currentOverlay.color,
                  fontFamily: currentOverlay.fontFamily,
                  fontWeight: currentOverlay.bold ? 'bold' : 'normal',
                  fontStyle: currentOverlay.italic ? 'italic' : 'normal',
                  textDecorationLine: currentOverlay.underline ? 'underline' : 'none',
                  backgroundColor: currentOverlay.backgroundColor,
                  opacity: currentOverlay.opacity,
                  borderColor: currentOverlay.borderColor,
                  borderWidth: currentOverlay.borderWidth
                }
              ]}
            >
              {currentOverlay.text}
            </Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.positionButton}
            onPress={() => setIsEditingPosition(!isEditingPosition)}
          >
            <Ionicons 
              name={isEditingPosition ? "checkmark" : "move"} 
              size={16} 
              color="#007AFF" 
            />
            <Text style={styles.positionButtonText}>
              {isEditingPosition ? "تم" : "تحريك"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'text', label: 'النص', icon: 'text-outline' },
            { key: 'style', label: 'التنسيق', icon: 'color-palette-outline' },
            { key: 'animation', label: 'الحركة', icon: 'play-circle-outline' },
            { key: 'timing', label: 'التوقيت', icon: 'time-outline' }
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

        {/* Tab Content */}
        <ScrollView style={styles.content}>
          {activeTab === 'text' && renderTextTab()}
          {activeTab === 'style' && renderStyleTab()}
          {activeTab === 'animation' && renderAnimationTab()}
          {activeTab === 'timing' && renderTimingTab()}
        </ScrollView>
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
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewArea: {
    height: 200,
    backgroundColor: '#000',
    position: 'relative',
  },
  textPreview: {
    position: 'absolute',
  },
  previewText: {
    padding: 8,
    textAlign: 'center',
  },
  positionButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  positionButtonText: {
    color: '#007AFF',
    fontSize: 12,
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
    padding: 20,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fontsList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  fontButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedFont: {
    backgroundColor: '#007AFF',
  },
  fontButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedFontText: {
    color: '#fff',
  },
  textStyleControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  styleButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    minWidth: 60,
  },
  activeStyleButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  styleButtonText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderValue: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sizeButtons: {
    flexDirection: 'row',
  },
  sizeButton: {
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  transparentButton: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationsList: {
    maxHeight: 300,
  },
  animationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAnimation: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  animationButtonText: {
    color: '#ccc',
    fontSize: 16,
  },
  selectedAnimationText: {
    color: '#fff',
  },
  timeValue: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});