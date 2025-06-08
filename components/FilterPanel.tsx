import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { FilterType } from '../types/video';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (clipId: string, filterType: FilterType, intensity: number) => void;
  selectedClips: string[];
}

interface FilterItem {
  type: FilterType;
  name: string;
  icon: string;
  color: string;
  preview: string;
}

const filters: FilterItem[] = [
  {
    type: FilterType.BRIGHTNESS,
    name: 'السطوع',
    icon: 'sunny-outline',
    color: '#FFD60A',
    preview: '☀️'
  },
  {
    type: FilterType.CONTRAST,
    name: 'التباين',
    icon: 'contrast-outline',
    color: '#007AFF',
    preview: '⚪⚫'
  },
  {
    type: FilterType.SATURATION,
    name: 'التشبع',
    icon: 'color-palette-outline',
    color: '#FF2D92',
    preview: '🌈'
  },
  {
    type: FilterType.BLUR,
    name: 'ضبابي',
    icon: 'eye-off-outline',
    color: '#8E8E93',
    preview: '🌫️'
  },
  {
    type: FilterType.SEPIA,
    name: 'سيبيا',
    icon: 'camera-outline',
    color: '#D2691E',
    preview: '📸'
  },
  {
    type: FilterType.VINTAGE,
    name: 'قديم',
    icon: 'film-outline',
    color: '#8B4513',
    preview: '📼'
  },
  {
    type: FilterType.NOIR,
    name: 'أبيض وأسود',
    icon: 'moon-outline',
    color: '#000000',
    preview: '🎭'
  },
  {
    type: FilterType.VIBRANT,
    name: 'نابض',
    icon: 'flash-outline',
    color: '#FF3B30',
    preview: '✨'
  },
  {
    type: FilterType.WARM,
    name: 'دافئ',
    icon: 'thermometer-outline',
    color: '#FF6B35',
    preview: '🔥'
  },
  {
    type: FilterType.COOL,
    name: 'بارد',
    icon: 'snow-outline',
    color: '#00C7F7',
    preview: '❄️'
  },
  {
    type: FilterType.FADE,
    name: 'باهت',
    icon: 'radio-button-off-outline',
    color: '#C7C7CC',
    preview: '🌸'
  }
];

export default function FilterPanel({ 
  visible, 
  onClose, 
  onApplyFilter, 
  selectedClips 
}: FilterPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const [intensity, setIntensity] = useState(0.5);

  const handleApplyFilter = () => {
    if (selectedFilter && selectedClips.length > 0) {
      selectedClips.forEach(clipId => {
        onApplyFilter(clipId, selectedFilter, intensity);
      });
      onClose();
    }
  };

  const renderFilterButton = (filter: FilterItem) => {
    const isSelected = selectedFilter === filter.type;
    
    return (
      <TouchableOpacity
        key={filter.type}
        style={[
          styles.filterButton,
          isSelected && { backgroundColor: filter.color }
        ]}
        onPress={() => setSelectedFilter(filter.type)}
      >
        <View style={styles.filterPreview}>
          <Text style={styles.filterEmoji}>{filter.preview}</Text>
        </View>
        
        <Text style={[
          styles.filterName,
          isSelected && styles.selectedFilterName
        ]}>
          {filter.name}
        </Text>
      </TouchableOpacity>
    );
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
          
          <Text style={styles.title}>الفلاتر</Text>
          
          <TouchableOpacity 
            onPress={handleApplyFilter}
            disabled={!selectedFilter || selectedClips.length === 0}
            style={[
              styles.applyButton,
              (!selectedFilter || selectedClips.length === 0) && styles.disabledButton
            ]}
          >
            <Text style={[
              styles.applyButtonText,
              (!selectedFilter || selectedClips.length === 0) && styles.disabledButtonText
            ]}>
              تطبيق
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Grid */}
        <ScrollView 
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <View style={styles.filtersGrid}>
            {filters.map(renderFilterButton)}
          </View>
        </ScrollView>

        {/* Intensity Control */}
        {selectedFilter && (
          <View style={styles.intensityContainer}>
            <Text style={styles.intensityLabel}>
              شدة التأثير: {Math.round(intensity * 100)}%
            </Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>0%</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={intensity}
                onValueChange={setIntensity}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#C7C7CC"
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.sliderLabel}>100%</Text>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
            <Text style={styles.tipText}>
              حدد مقطع فيديو أولاً لتطبيق الفلتر
            </Text>
          </View>
          
          {selectedClips.length > 1 && (
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>
                سيتم تطبيق الفلتر على {selectedClips.length} مقاطع
              </Text>
            </View>
          )}
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
  cancelButton: {
    color: '#007AFF',
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
  filtersContainer: {
    flex: 1,
  },
  filtersContent: {
    padding: 20,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterButton: {
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
  filterPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  filterEmoji: {
    fontSize: 20,
  },
  filterName: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedFilterName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  intensityContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  intensityLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 16,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
  },
  sliderLabel: {
    color: '#666',
    fontSize: 12,
  },
  tipsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});