/**
 * Advanced Color Grading Panel Component
 * Professional color correction interface with color wheels, curves, and LUT support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanGestureHandler,
  State,
  Slider,
  Modal,
} from 'react-native';
import { AdvancedColorGrading, ColorGradingOptions, ColorWheelAdjustment, HSLCurve, RGBCurve } from '../services/AdvancedColorGrading';
import { LUTManager } from '../services/LUTManager';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  videoElement?: HTMLVideoElement;
  onApply: (settings: ColorGradingOptions) => void;
}

export const AdvancedColorGradingPanel: React.FC<Props> = ({
  visible,
  onClose,
  videoElement,
  onApply,
}) => {
  const [colorGrading] = useState(() => new AdvancedColorGrading());
  const [lutManager] = useState(() => new LUTManager());
  const [activeTab, setActiveTab] = useState<'basic' | 'wheels' | 'curves' | 'luts'>('basic');
  
  // Basic adjustments
  const [basicSettings, setBasicSettings] = useState<ColorGradingOptions>({
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    vibrance: 0,
    saturation: 0,
    temperature: 6500,
    tint: 0,
    hue: 0,
  });

  // Color wheels
  const [colorWheels, setColorWheels] = useState<ColorWheelAdjustment>({
    shadows: { lift: 0, gamma: 0, gain: 0 },
    midtones: { lift: 0, gamma: 0, gain: 0 },
    highlights: { lift: 0, gamma: 0, gain: 0 },
    master: { lift: 0, gamma: 0, gain: 0 },
  });

  // Curves
  const [hslCurves, setHslCurves] = useState<HSLCurve>({
    hue: new Array(256).fill(0).map((_, i) => i),
    saturation: new Array(256).fill(0).map((_, i) => i),
    luminance: new Array(256).fill(0).map((_, i) => i),
  });

  const [rgbCurves, setRgbCurves] = useState<RGBCurve>({
    red: new Array(256).fill(0).map((_, i) => i),
    green: new Array(256).fill(0).map((_, i) => i),
    blue: new Array(256).fill(0).map((_, i) => i),
    master: new Array(256).fill(0).map((_, i) => i),
  });

  const [activeCurve, setActiveCurve] = useState<'hsl' | 'rgb'>('rgb');
  const [selectedLUT, setSelectedLUT] = useState<string | null>(null);
  const [lutStrength, setLutStrength] = useState(100);

  // Apply color grading in real-time
  const applyColorGrading = useCallback(async () => {
    if (!videoElement) return;

    try {
      await colorGrading.applyColorGrading(videoElement, basicSettings);
      onApply(basicSettings);
    } catch (error) {
      console.error('Failed to apply color grading:', error);
    }
  }, [colorGrading, videoElement, basicSettings, onApply]);

  // Apply LUT
  const applyLUT = useCallback(async (lutId: string) => {
    if (!videoElement) return;

    try {
      await lutManager.applyLUT(videoElement, lutId, lutStrength);
      setSelectedLUT(lutId);
    } catch (error) {
      console.error('Failed to apply LUT:', error);
    }
  }, [lutManager, videoElement, lutStrength]);

  // Color Wheel Component
  const ColorWheel: React.FC<{
    value: { lift: number; gamma: number; gain: number };
    onChange: (value: { lift: number; gamma: number; gain: number }) => void;
    title: string;
  }> = ({ value, onChange, title }) => {
    const wheelSize = 120;
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = 50;

    const handleWheelGesture = (event: any) => {
      const { translationX, translationY } = event.nativeEvent;
      const distance = Math.sqrt(translationX * translationX + translationY * translationY);
      const angle = Math.atan2(translationY, translationX);
      
      if (distance <= radius) {
        const lift = (translationX / radius) * 100;
        const gamma = (translationY / radius) * 100;
        onChange({ ...value, lift: Math.max(-100, Math.min(100, lift)), gamma: Math.max(-100, Math.min(100, gamma)) });
      }
    };

    return (
      <View style={styles.colorWheelContainer}>
        <Text style={styles.colorWheelTitle}>{title}</Text>
        <PanGestureHandler onGestureEvent={handleWheelGesture}>
          <View style={styles.colorWheel}>
            <Svg width={wheelSize} height={wheelSize}>
              <Circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#333" strokeWidth={2} />
              <Circle 
                cx={centerX + (value.lift / 100) * radius} 
                cy={centerY + (value.gamma / 100) * radius} 
                r={8} 
                fill="#007AFF" 
              />
            </Svg>
          </View>
        </PanGestureHandler>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Gain</Text>
          <Slider
            style={styles.slider}
            minimumValue={-100}
            maximumValue={100}
            value={value.gain}
            onValueChange={(gain) => onChange({ ...value, gain })}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
        </View>
      </View>
    );
  };

  // Curve Editor Component
  const CurveEditor: React.FC<{
    curve: number[];
    onChange: (curve: number[]) => void;
    color: string;
    title: string;
  }> = ({ curve, onChange, color, title }) => {
    const curveSize = width - 40;
    const curveHeight = 200;

    const generatePath = () => {
      let path = `M 0 ${curveHeight}`;
      for (let i = 0; i < curve.length; i += 4) {
        const x = (i / (curve.length - 1)) * curveSize;
        const y = curveHeight - ((curve[i] / 255) * curveHeight);
        path += ` L ${x} ${y}`;
      }
      return path;
    };

    return (
      <View style={styles.curveContainer}>
        <Text style={[styles.curveTitle, { color }]}>{title}</Text>
        <View style={styles.curveEditor}>
          <Svg width={curveSize} height={curveHeight}>
            {/* Grid */}
            {[0, 1, 2, 3, 4].map((i) => (
              <G key={i}>
                <Line 
                  x1={i * curveSize / 4} 
                  y1={0} 
                  x2={i * curveSize / 4} 
                  y2={curveHeight} 
                  stroke="#333" 
                  strokeWidth={1} 
                  opacity={0.3} 
                />
                <Line 
                  x1={0} 
                  y1={i * curveHeight / 4} 
                  x2={curveSize} 
                  y2={i * curveHeight / 4} 
                  stroke="#333" 
                  strokeWidth={1} 
                  opacity={0.3} 
                />
              </G>
            ))}
            {/* Curve */}
            <Path d={generatePath()} stroke={color} strokeWidth={2} fill="none" />
          </Svg>
        </View>
      </View>
    );
  };

  // Basic Controls
  const BasicControls = () => (
    <ScrollView style={styles.controlsContainer}>
      {Object.entries(basicSettings).map(([key, value]) => (
        <View key={key} style={styles.controlItem}>
          <Text style={styles.controlLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          <View style={styles.controlRow}>
            <Slider
              style={styles.controlSlider}
              minimumValue={key === 'temperature' ? 2000 : key === 'hue' ? -180 : -100}
              maximumValue={key === 'temperature' ? 11000 : key === 'hue' ? 180 : 100}
              value={value}
              onValueChange={(newValue) => {
                setBasicSettings(prev => ({ ...prev, [key]: newValue }));
              }}
              onSlidingComplete={applyColorGrading}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.controlValue}>
              {key === 'temperature' ? `${Math.round(value)}K` : Math.round(value)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Color Wheels Tab
  const ColorWheelsTab = () => (
    <ScrollView style={styles.controlsContainer}>
      <View style={styles.colorWheelsGrid}>
        {Object.entries(colorWheels).map(([key, value]) => (
          <ColorWheel
            key={key}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
            value={value}
            onChange={(newValue) => {
              setColorWheels(prev => ({ ...prev, [key]: newValue }));
            }}
          />
        ))}
      </View>
    </ScrollView>
  );

  // Curves Tab
  const CurvesTab = () => (
    <ScrollView style={styles.controlsContainer}>
      <View style={styles.curveTypeSelector}>
        <TouchableOpacity
          style={[styles.curveTypeButton, activeCurve === 'rgb' && styles.activeTab]}
          onPress={() => setActiveCurve('rgb')}
        >
          <Text style={[styles.curveTypeText, activeCurve === 'rgb' && styles.activeTabText]}>RGB</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.curveTypeButton, activeCurve === 'hsl' && styles.activeTab]}
          onPress={() => setActiveCurve('hsl')}
        >
          <Text style={[styles.curveTypeText, activeCurve === 'hsl' && styles.activeTabText]}>HSL</Text>
        </TouchableOpacity>
      </View>

      {activeCurve === 'rgb' ? (
        <>
          <CurveEditor curve={rgbCurves.master} onChange={(curve) => setRgbCurves(prev => ({ ...prev, master: curve }))} color="#FFF" title="Master" />
          <CurveEditor curve={rgbCurves.red} onChange={(curve) => setRgbCurves(prev => ({ ...prev, red: curve }))} color="#FF0000" title="Red" />
          <CurveEditor curve={rgbCurves.green} onChange={(curve) => setRgbCurves(prev => ({ ...prev, green: curve }))} color="#00FF00" title="Green" />
          <CurveEditor curve={rgbCurves.blue} onChange={(curve) => setRgbCurves(prev => ({ ...prev, blue: curve }))} color="#0000FF" title="Blue" />
        </>
      ) : (
        <>
          <CurveEditor curve={hslCurves.hue} onChange={(curve) => setHslCurves(prev => ({ ...prev, hue: curve }))} color="#FF6B6B" title="Hue" />
          <CurveEditor curve={hslCurves.saturation} onChange={(curve) => setHslCurves(prev => ({ ...prev, saturation: curve }))} color="#4ECDC4" title="Saturation" />
          <CurveEditor curve={hslCurves.luminance} onChange={(curve) => setHslCurves(prev => ({ ...prev, luminance: curve }))} color="#45B7D1" title="Luminance" />
        </>
      )}
    </ScrollView>
  );

  // LUTs Tab
  const LUTsTab = () => {
    const [availableLUTs, setAvailableLUTs] = useState<any[]>([]);

    useEffect(() => {
      const loadLUTs = async () => {
        try {
          const luts = await lutManager.getAvailableLUTs();
          setAvailableLUTs(luts);
        } catch (error) {
          console.error('Failed to load LUTs:', error);
        }
      };
      loadLUTs();
    }, []);

    return (
      <ScrollView style={styles.controlsContainer}>
        <View style={styles.lutStrengthContainer}>
          <Text style={styles.controlLabel}>LUT Strength</Text>
          <Slider
            style={styles.controlSlider}
            minimumValue={0}
            maximumValue={100}
            value={lutStrength}
            onValueChange={setLutStrength}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.controlValue}>{Math.round(lutStrength)}%</Text>
        </View>
        
        <View style={styles.lutsGrid}>
          {availableLUTs.map((lut) => (
            <TouchableOpacity
              key={lut.id}
              style={[
                styles.lutItem,
                selectedLUT === lut.id && styles.selectedLUT
              ]}
              onPress={() => applyLUT(lut.id)}
            >
              {lut.thumbnail && (
                <Image source={{ uri: lut.thumbnail }} style={styles.lutThumbnail} />
              )}
              <Text style={styles.lutName}>{lut.metadata.name}</Text>
              <Text style={styles.lutCategory}>{lut.metadata.category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Color Grading</Text>
          <TouchableOpacity onPress={() => {}} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {[
            { key: 'basic', label: 'Basic', icon: 'options' },
            { key: 'wheels', label: 'Wheels', icon: 'color-palette' },
            { key: 'curves', label: 'Curves', icon: 'analytics' },
            { key: 'luts', label: 'LUTs', icon: 'color-filter' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#007AFF' : '#666'} 
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {activeTab === 'basic' && <BasicControls />}
          {activeTab === 'wheels' && <ColorWheelsTab />}
          {activeTab === 'curves' && <CurvesTab />}
          {activeTab === 'luts' && <LUTsTab />}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: '#007AFF',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    padding: 20,
  },
  controlItem: {
    marginBottom: 20,
  },
  controlLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlSlider: {
    flex: 1,
    height: 40,
  },
  controlValue: {
    color: '#999',
    fontSize: 12,
    width: 50,
    textAlign: 'right',
    marginLeft: 10,
  },
  colorWheelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorWheelContainer: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
  },
  colorWheelTitle: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
  },
  colorWheel: {
    marginBottom: 10,
  },
  sliderContainer: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 30,
  },
  sliderLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  curveTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  curveTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#222',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  curveTypeText: {
    color: '#666',
    fontWeight: '500',
  },
  curveContainer: {
    marginBottom: 30,
  },
  curveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  curveEditor: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 10,
  },
  lutStrengthContainer: {
    marginBottom: 20,
  },
  lutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lutItem: {
    width: '48%',
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedLUT: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  lutThumbnail: {
    width: 60,
    height: 40,
    borderRadius: 4,
    marginBottom: 8,
  },
  lutName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  lutCategory: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default AdvancedColorGradingPanel;