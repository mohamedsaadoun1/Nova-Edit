import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Transition {
  id: string;
  name: string;
  type: TransitionType;
  duration: number;
  easing: EasingType;
  preview: string;
  description: string;
}

enum TransitionType {
  FADE = 'fade',
  SLIDE_LEFT = 'slideLeft',
  SLIDE_RIGHT = 'slideRight',
  SLIDE_UP = 'slideUp',
  SLIDE_DOWN = 'slideDown',
  ZOOM_IN = 'zoomIn',
  ZOOM_OUT = 'zoomOut',
  ROTATE = 'rotate',
  FLIP = 'flip',
  DISSOLVE = 'dissolve',
  WIPE_LEFT = 'wipeLeft',
  WIPE_RIGHT = 'wipeRight',
  CIRCLE = 'circle',
  DIAMOND = 'diamond',
  HEART = 'heart',
  STAR = 'star',
  GLITCH = 'glitch',
  BLUR = 'blur',
  PIXELATE = 'pixelate',
  RGB_SPLIT = 'rgbSplit'
}

enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic'
}

interface TransitionsEditorProps {
  visible: boolean;
  onClose: () => void;
  onApplyTransition: (clipId: string, transition: Transition) => void;
  selectedClipId: string | null;
}

const transitions: Transition[] = [
  {
    id: '1',
    name: 'ظهور تدريجي',
    type: TransitionType.FADE,
    duration: 0.5,
    easing: EasingType.EASE_IN_OUT,
    preview: '🌟',
    description: 'انتقال سلس بالشفافية'
  },
  {
    id: '2',
    name: 'انزلاق يسار',
    type: TransitionType.SLIDE_LEFT,
    duration: 0.8,
    easing: EasingType.EASE_OUT,
    preview: '⬅️',
    description: 'انزلاق من اليمين إلى اليسار'
  },
  {
    id: '3',
    name: 'انزلاق يمين',
    type: TransitionType.SLIDE_RIGHT,
    duration: 0.8,
    easing: EasingType.EASE_OUT,
    preview: '➡️',
    description: 'انزلاق من اليسار إلى اليمين'
  },
  {
    id: '4',
    name: 'انزلاق لأعلى',
    type: TransitionType.SLIDE_UP,
    duration: 0.6,
    easing: EasingType.EASE_IN_OUT,
    preview: '⬆️',
    description: 'انزلاق من الأسفل للأعلى'
  },
  {
    id: '5',
    name: 'انزلاق لأسفل',
    type: TransitionType.SLIDE_DOWN,
    duration: 0.6,
    easing: EasingType.EASE_IN_OUT,
    preview: '⬇️',
    description: 'انزلاق من الأعلى للأسفل'
  },
  {
    id: '6',
    name: 'تكبير',
    type: TransitionType.ZOOM_IN,
    duration: 0.7,
    easing: EasingType.EASE_OUT,
    preview: '🔍',
    description: 'تكبير تدريجي للمشهد'
  },
  {
    id: '7',
    name: 'تصغير',
    type: TransitionType.ZOOM_OUT,
    duration: 0.7,
    easing: EasingType.EASE_IN,
    preview: '🔎',
    description: 'تصغير تدريجي للمشهد'
  },
  {
    id: '8',
    name: 'دوران',
    type: TransitionType.ROTATE,
    duration: 1.0,
    easing: EasingType.EASE_IN_OUT,
    preview: '🔄',
    description: 'دوران حول المحور'
  },
  {
    id: '9',
    name: 'قلب',
    type: TransitionType.FLIP,
    duration: 0.8,
    easing: EasingType.EASE_IN_OUT,
    preview: '🔃',
    description: 'قلب المشهد أفقياً أو عمودياً'
  },
  {
    id: '10',
    name: 'إذابة',
    type: TransitionType.DISSOLVE,
    duration: 1.2,
    easing: EasingType.LINEAR,
    preview: '💫',
    description: 'إذابة تدريجية بين المشاهد'
  },
  {
    id: '11',
    name: 'مسح يسار',
    type: TransitionType.WIPE_LEFT,
    duration: 0.6,
    easing: EasingType.LINEAR,
    preview: '🧹',
    description: 'مسح من اليمين لليسار'
  },
  {
    id: '12',
    name: 'مسح يمين',
    type: TransitionType.WIPE_RIGHT,
    duration: 0.6,
    easing: EasingType.LINEAR,
    preview: '🧽',
    description: 'مسح من اليسار لليمين'
  },
  {
    id: '13',
    name: 'دائرة',
    type: TransitionType.CIRCLE,
    duration: 0.9,
    easing: EasingType.EASE_OUT,
    preview: '⭕',
    description: 'انتقال دائري من المركز'
  },
  {
    id: '14',
    name: 'معين',
    type: TransitionType.DIAMOND,
    duration: 0.8,
    easing: EasingType.EASE_IN_OUT,
    preview: '💎',
    description: 'انتقال على شكل معين'
  },
  {
    id: '15',
    name: 'قلب',
    type: TransitionType.HEART,
    duration: 1.0,
    easing: EasingType.EASE_OUT,
    preview: '❤️',
    description: 'انتقال رومانسي على شكل قلب'
  },
  {
    id: '16',
    name: 'نجمة',
    type: TransitionType.STAR,
    duration: 1.1,
    easing: EasingType.BOUNCE,
    preview: '⭐',
    description: 'انتقال على شكل نجمة'
  },
  {
    id: '17',
    name: 'خلل رقمي',
    type: TransitionType.GLITCH,
    duration: 0.4,
    easing: EasingType.LINEAR,
    preview: '📺',
    description: 'تأثير خلل تقني حديث'
  },
  {
    id: '18',
    name: 'ضبابي',
    type: TransitionType.BLUR,
    duration: 0.7,
    easing: EasingType.EASE_IN_OUT,
    preview: '🌫️',
    description: 'انتقال ضبابي ناعم'
  },
  {
    id: '19',
    name: 'بكسل',
    type: TransitionType.PIXELATE,
    duration: 0.8,
    easing: EasingType.EASE_IN,
    preview: '🎮',
    description: 'تأثير بكسل كلاسيكي'
  },
  {
    id: '20',
    name: 'انقسام RGB',
    type: TransitionType.RGB_SPLIT,
    duration: 0.5,
    easing: EasingType.EASE_OUT,
    preview: '🌈',
    description: 'انقسام الألوان الأساسية'
  }
];

const durations = [0.2, 0.5, 0.8, 1.0, 1.5, 2.0];
const easings = [
  { name: 'خطي', value: EasingType.LINEAR },
  { name: 'بطيء لسريع', value: EasingType.EASE_IN },
  { name: 'سريع لبطيء', value: EasingType.EASE_OUT },
  { name: 'بطيء-سريع-بطيء', value: EasingType.EASE_IN_OUT },
  { name: 'ارتداد', value: EasingType.BOUNCE },
  { name: 'مرن', value: EasingType.ELASTIC }
];

export default function TransitionsEditor({
  visible,
  onClose,
  onApplyTransition,
  selectedClipId
}: TransitionsEditorProps) {
  const [selectedTransition, setSelectedTransition] = useState<Transition | null>(null);
  const [customDuration, setCustomDuration] = useState(0.5);
  const [customEasing, setCustomEasing] = useState(EasingType.EASE_IN_OUT);
  const [previewMode, setPreviewMode] = useState<'grid' | 'list'>('grid');

  const handleApply = () => {
    if (selectedTransition && selectedClipId) {
      const customTransition: Transition = {
        ...selectedTransition,
        duration: customDuration,
        easing: customEasing
      };
      
      onApplyTransition(selectedClipId, customTransition);
      onClose();
    }
  };

  const renderTransitionCard = (transition: Transition) => {
    const isSelected = selectedTransition?.id === transition.id;
    
    if (previewMode === 'list') {
      return (
        <TouchableOpacity
          key={transition.id}
          style={[
            styles.transitionListItem,
            isSelected && styles.selectedTransition
          ]}
          onPress={() => setSelectedTransition(transition)}
        >
          <View style={styles.transitionListContent}>
            <Text style={styles.transitionPreview}>{transition.preview}</Text>
            <View style={styles.transitionInfo}>
              <Text style={[
                styles.transitionName,
                isSelected && styles.selectedTransitionText
              ]}>
                {transition.name}
              </Text>
              <Text style={styles.transitionDescription}>
                {transition.description}
              </Text>
              <Text style={styles.transitionDetails}>
                {transition.duration}ث • {getEasingName(transition.easing)}
              </Text>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={transition.id}
        style={[
          styles.transitionCard,
          isSelected && styles.selectedTransition
        ]}
        onPress={() => setSelectedTransition(transition)}
      >
        <View style={styles.transitionPreviewContainer}>
          <Text style={styles.transitionPreview}>{transition.preview}</Text>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </View>
        <Text style={[
          styles.transitionName,
          isSelected && styles.selectedTransitionText
        ]}>
          {transition.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const getEasingName = (easing: EasingType): string => {
    return easings.find(e => e.value === easing)?.name || 'خطي';
  };

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
          
          <Text style={styles.title}>الانتقالات</Text>
          
          <TouchableOpacity
            onPress={handleApply}
            disabled={!selectedTransition || !selectedClipId}
            style={[
              styles.applyButton,
              (!selectedTransition || !selectedClipId) && styles.disabledButton
            ]}
          >
            <Text style={[
              styles.applyButtonText,
              (!selectedTransition || !selectedClipId) && styles.disabledButtonText
            ]}>
              تطبيق
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              previewMode === 'grid' && styles.activeViewMode
            ]}
            onPress={() => setPreviewMode('grid')}
          >
            <Ionicons 
              name="grid-outline" 
              size={20} 
              color={previewMode === 'grid' ? "#007AFF" : "#666"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              previewMode === 'list' && styles.activeViewMode
            ]}
            onPress={() => setPreviewMode('list')}
          >
            <Ionicons 
              name="list-outline" 
              size={20} 
              color={previewMode === 'list' ? "#007AFF" : "#666"} 
            />
          </TouchableOpacity>
        </View>

        {/* Transitions Grid/List */}
        <ScrollView 
          style={styles.transitionsContainer}
          contentContainerStyle={
            previewMode === 'grid' ? styles.transitionsGrid : styles.transitionsList
          }
        >
          {transitions.map(renderTransitionCard)}
        </ScrollView>

        {/* Settings */}
        {selectedTransition && (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>إعدادات الانتقال</Text>
            
            {/* Duration */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>المدة (ثانية)</Text>
              <View style={styles.durationButtons}>
                {durations.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      customDuration === duration && styles.selectedDuration
                    ]}
                    onPress={() => setCustomDuration(duration)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      customDuration === duration && styles.selectedDurationText
                    ]}>
                      {duration}ث
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Easing */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>نوع الحركة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.easingButtons}>
                  {easings.map((easing) => (
                    <TouchableOpacity
                      key={easing.value}
                      style={[
                        styles.easingButton,
                        customEasing === easing.value && styles.selectedEasing
                      ]}
                      onPress={() => setCustomEasing(easing.value)}
                    >
                      <Text style={[
                        styles.easingButtonText,
                        customEasing === easing.value && styles.selectedEasingText
                      ]}>
                        {easing.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>معاينة الانتقال</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewEmoji}>{selectedTransition.preview}</Text>
                <Text style={styles.previewText}>
                  {selectedTransition.name} • {customDuration}ث
                </Text>
              </View>
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
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  disabledButtonText: {
    color: '#666',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeViewMode: {
    backgroundColor: '#007AFF',
  },
  transitionsContainer: {
    flex: 1,
  },
  transitionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  transitionsList: {
    padding: 16,
  },
  transitionCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTransition: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  transitionPreviewContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  transitionPreview: {
    fontSize: 24,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionName: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedTransitionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  transitionListItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  transitionListContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transitionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  transitionDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  transitionDetails: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 4,
  },
  settingsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durationButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDuration: {
    backgroundColor: '#007AFF',
  },
  durationButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedDurationText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  easingButtons: {
    flexDirection: 'row',
  },
  easingButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedEasing: {
    backgroundColor: '#007AFF',
  },
  easingButtonText: {
    color: '#ccc',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  selectedEasingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewTitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  previewText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});