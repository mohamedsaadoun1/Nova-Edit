/**
 * Video Stabilization Panel Component
 * Professional video stabilization with motion analysis and compensation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { VideoStabilization, StabilizationOptions, MotionAnalysis } from '../services/VideoStabilization';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Line, Circle, Path, G } from 'react-native-svg';

interface Props {
  visible: boolean;
  onClose: () => void;
  videoElement?: HTMLVideoElement;
  onStabilized: (stabilizedVideo: any) => void;
}

export const VideoStabilizationPanel: React.FC<Props> = ({
  visible,
  onClose,
  videoElement,
  onStabilized,
}) => {
  const [stabilization] = useState(() => new VideoStabilization());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [motionAnalysis, setMotionAnalysis] = useState<MotionAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Stabilization settings
  const [settings, setSettings] = useState<StabilizationOptions>({
    strength: 75,
    smoothness: 50,
    cropRatio: 0.1,
    method: 'optical_flow',
    rollingShutterCorrection: false,
    adaptiveFiltering: true,
    edgeCompensation: true,
    motionCompensation: {
      translation: true,
      rotation: true,
      scale: false,
      skew: false,
    },
    advancedOptions: {
      blockSize: 16,
      searchRange: 32,
      overlapRatio: 0.5,
      temporalWindow: 15,
      spatialSigma: 1.0,
      temporalSigma: 0.5,
    },
  });

  // Preview settings
  const [showMotionVectors, setShowMotionVectors] = useState(false);
  const [showCropPreview, setShowCropPreview] = useState(true);
  const [showOriginalOverlay, setShowOriginalOverlay] = useState(false);

  // Motion vectors for visualization
  const [motionVectors, setMotionVectors] = useState<any[]>([]);

  // Analyze motion in video
  const analyzeMotion = useCallback(async () => {
    if (!videoElement) {
      Alert.alert('Error', 'No video element available');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      const analysis = await stabilization.analyzeMotion(videoElement, {
        onProgress: (progress) => setProgress(progress),
        onMotionVectors: (vectors) => setMotionVectors(vectors),
      });
      
      setMotionAnalysis(analysis);
      
      // Show analysis results
      Alert.alert(
        'Motion Analysis Complete',
        `Detected ${analysis.instabilityScore > 0.5 ? 'significant' : 'mild'} camera shake.\n` +
        `Instability Score: ${(analysis.instabilityScore * 100).toFixed(1)}%\n` +
        `Recommended Method: ${analysis.recommendedMethod}`
      );
      
    } catch (error) {
      console.error('Motion analysis failed:', error);
      Alert.alert('Error', 'Failed to analyze motion');
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [stabilization, videoElement]);

  // Apply stabilization
  const applyStabilization = useCallback(async () => {
    if (!videoElement || !motionAnalysis) {
      Alert.alert('Error', 'Please analyze motion first');
      return;
    }

    setIsStabilizing(true);
    setProgress(0);

    try {
      const stabilizedVideo = await stabilization.stabilizeVideo(
        videoElement,
        motionAnalysis,
        settings,
        {
          onProgress: (progress) => setProgress(progress),
        }
      );
      
      onStabilized(stabilizedVideo);
      Alert.alert('Success', 'Video stabilization completed');
      
    } catch (error) {
      console.error('Stabilization failed:', error);
      Alert.alert('Error', 'Failed to stabilize video');
    } finally {
      setIsStabilizing(false);
      setProgress(0);
    }
  }, [stabilization, videoElement, motionAnalysis, settings, onStabilized]);

  // Motion Vectors Visualization
  const MotionVectorsVisualization = () => (
    <View style={styles.visualizationContainer}>
      <Text style={styles.sectionTitle}>Motion Analysis</Text>
      
      {motionAnalysis && (
        <View style={styles.analysisStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Instability Score</Text>
            <View style={styles.statBar}>
              <View 
                style={[
                  styles.statFill, 
                  { 
                    width: `${motionAnalysis.instabilityScore * 100}%`,
                    backgroundColor: motionAnalysis.instabilityScore > 0.7 ? '#FF3B30' : 
                                   motionAnalysis.instabilityScore > 0.4 ? '#FF9500' : '#34C759'
                  }
                ]} 
              />
            </View>
            <Text style={styles.statValue}>
              {(motionAnalysis.instabilityScore * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Motion Type</Text>
            <Text style={styles.statValue}>{motionAnalysis.dominantMotionType}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Recommended Method</Text>
            <Text style={styles.statValue}>{motionAnalysis.recommendedMethod}</Text>
          </View>
        </View>
      )}

      {showMotionVectors && motionVectors.length > 0 && (
        <View style={styles.motionVectorsContainer}>
          <Svg width={300} height={200} style={styles.motionVectorsSvg}>
            {/* Grid */}
            <G opacity={0.3}>
              {Array.from({ length: 10 }).map((_, i) => (
                <G key={i}>
                  <Line x1={i * 30} y1={0} x2={i * 30} y2={200} stroke="#666" strokeWidth={1} />
                  <Line x1={0} y1={i * 20} x2={300} y2={i * 20} stroke="#666" strokeWidth={1} />
                </G>
              ))}
            </G>
            
            {/* Motion vectors */}
            {motionVectors.slice(0, 50).map((vector, index) => (
              <G key={index}>
                <Line
                  x1={vector.x}
                  y1={vector.y}
                  x2={vector.x + vector.dx * 5}
                  y2={vector.y + vector.dy * 5}
                  stroke="#007AFF"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />
                <Circle cx={vector.x} cy={vector.y} r={2} fill="#007AFF" />
              </G>
            ))}
          </Svg>
        </View>
      )}
    </View>
  );

  // Stabilization Settings
  const StabilizationSettings = () => (
    <ScrollView style={styles.settingsContainer}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Stabilization Method</Text>
        
        <View style={styles.methodSelector}>
          {[
            { key: 'optical_flow', label: 'Optical Flow', icon: 'eye-outline' },
            { key: 'feature_tracking', label: 'Feature Tracking', icon: 'grid-outline' },
            { key: 'gyroscope', label: 'Gyroscope', icon: 'compass-outline' },
            { key: 'hybrid', label: 'Hybrid', icon: 'settings-outline' },
          ].map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodButton,
                settings.method === method.key && styles.activeMethodButton,
              ]}
              onPress={() => setSettings(prev => ({ ...prev, method: method.key as any }))}
            >
              <Ionicons
                name={method.icon as any}
                size={20}
                color={settings.method === method.key ? '#007AFF' : '#999'}
              />
              <Text style={[
                styles.methodLabel,
                settings.method === method.key && styles.activeMethodLabel,
              ]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Stabilization Strength</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Strength</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={settings.strength}
            onValueChange={(strength) => setSettings(prev => ({ ...prev, strength }))}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.settingValue}>{Math.round(settings.strength)}%</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Smoothness</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={settings.smoothness}
            onValueChange={(smoothness) => setSettings(prev => ({ ...prev, smoothness }))}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.settingValue}>{Math.round(settings.smoothness)}%</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Crop Ratio</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={0.3}
            value={settings.cropRatio}
            onValueChange={(cropRatio) => setSettings(prev => ({ ...prev, cropRatio }))}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.settingValue}>{(settings.cropRatio * 100).toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Motion Compensation</Text>
        
        {Object.entries(settings.motionCompensation).map(([key, value]) => (
          <View key={key} style={styles.switchItem}>
            <Text style={styles.switchLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Switch
              value={value}
              onValueChange={(newValue) => 
                setSettings(prev => ({
                  ...prev,
                  motionCompensation: { ...prev.motionCompensation, [key]: newValue }
                }))
              }
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={value ? "#FFF" : "#f4f3f4"}
            />
          </View>
        ))}
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Advanced Options</Text>
        
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Rolling Shutter Correction</Text>
          <Switch
            value={settings.rollingShutterCorrection}
            onValueChange={(rollingShutterCorrection) => 
              setSettings(prev => ({ ...prev, rollingShutterCorrection }))
            }
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={settings.rollingShutterCorrection ? "#FFF" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Adaptive Filtering</Text>
          <Switch
            value={settings.adaptiveFiltering}
            onValueChange={(adaptiveFiltering) => 
              setSettings(prev => ({ ...prev, adaptiveFiltering }))
            }
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={settings.adaptiveFiltering ? "#FFF" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Edge Compensation</Text>
          <Switch
            value={settings.edgeCompensation}
            onValueChange={(edgeCompensation) => 
              setSettings(prev => ({ ...prev, edgeCompensation }))
            }
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={settings.edgeCompensation ? "#FFF" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preview Options</Text>
        
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Show Motion Vectors</Text>
          <Switch
            value={showMotionVectors}
            onValueChange={setShowMotionVectors}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={showMotionVectors ? "#FFF" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Show Crop Preview</Text>
          <Switch
            value={showCropPreview}
            onValueChange={setShowCropPreview}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={showCropPreview ? "#FFF" : "#f4f3f4"}
          />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Video Stabilization</Text>
          <TouchableOpacity onPress={() => {}} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, isAnalyzing && styles.disabledButton]}
            onPress={analyzeMotion}
            disabled={isAnalyzing || !videoElement}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="analytics-outline" size={20} color="#FFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Motion'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryActionButton,
              (isStabilizing || !motionAnalysis) && styles.disabledButton
            ]}
            onPress={applyStabilization}
            disabled={isStabilizing || !motionAnalysis}
          >
            {isStabilizing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isStabilizing ? 'Stabilizing...' : 'Apply Stabilization'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        {(isAnalyzing || isStabilizing) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}

        <MotionVectorsVisualization />
        
        <StabilizationSettings />
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
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    color: '#999',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  visualizationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  analysisStats: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    width: 120,
  },
  statBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    width: 60,
    textAlign: 'right',
  },
  motionVectorsContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 10,
  },
  motionVectorsSvg: {
    backgroundColor: 'transparent',
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  methodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: '48%',
    gap: 6,
  },
  activeMethodButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  methodLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  activeMethodLabel: {
    color: '#007AFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 14,
    width: 100,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 15,
  },
  settingValue: {
    color: '#999',
    fontSize: 12,
    width: 50,
    textAlign: 'right',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 14,
  },
});

export default VideoStabilizationPanel;