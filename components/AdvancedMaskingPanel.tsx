/**
 * Advanced Masking Panel Component
 * Professional masking tools with shape, brush, and smart selection capabilities
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanGestureHandler,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { AdvancedMaskingSystem, MaskType, BrushSettings, ShapeSettings } from '../services/AdvancedMaskingSystem';
import Svg, { Path, Circle, Rect, Polygon, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  videoElement?: HTMLVideoElement;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onMaskApplied: (maskData: any) => void;
}

export const AdvancedMaskingPanel: React.FC<Props> = ({
  visible,
  onClose,
  videoElement,
  canvasRef,
  onMaskApplied,
}) => {
  const [maskingSystem] = useState(() => new AdvancedMaskingSystem());
  const [activeTool, setActiveTool] = useState<MaskType>('rectangle');
  const [currentMask, setCurrentMask] = useState<any>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskPaths, setMaskPaths] = useState<string[]>([]);
  const [maskShapes, setMaskShapes] = useState<any[]>([]);
  
  // Tool settings
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 50,
    hardness: 0.8,
    opacity: 1.0,
    flow: 1.0,
    spacing: 0.1,
    dynamics: {
      sizeVariation: 0,
      opacityVariation: 0,
      hardnessVariation: 0,
    },
  });

  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>({
    feather: 5,
    expansion: 0,
    cornerRadius: 0,
    aspectRatio: 'free',
  });

  // Mask properties
  const [maskProperties, setMaskProperties] = useState({
    opacity: 100,
    feather: 0,
    density: 100,
    invert: false,
    blendMode: 'normal' as const,
  });

  // Canvas interaction
  const canvasSize = width - 40;
  const canvasHeight = canvasSize * 0.75;
  const drawingCanvasRef = useRef<any>(null);

  // Initialize masking system
  useEffect(() => {
    if (canvasRef?.current) {
      maskingSystem.initialize(canvasRef.current);
    }
  }, [canvasRef, maskingSystem]);

  // Handle drawing gestures
  const handleDrawingGesture = useCallback((event: any) => {
    const { state, translationX, translationY, x, y } = event.nativeEvent;
    
    if (activeTool === 'brush') {
      switch (state) {
        case State.BEGAN:
          setIsDrawing(true);
          maskingSystem.startBrushStroke(x, y, brushSettings);
          break;
        case State.ACTIVE:
          if (isDrawing) {
            maskingSystem.continueBrushStroke(x, y);
          }
          break;
        case State.END:
          setIsDrawing(false);
          maskingSystem.endBrushStroke();
          break;
      }
    }
  }, [activeTool, isDrawing, brushSettings, maskingSystem]);

  // Create mask
  const createMask = useCallback(async (type: MaskType, points?: number[]) => {
    if (!canvasRef?.current) return;

    try {
      let mask;
      switch (type) {
        case 'rectangle':
          mask = await maskingSystem.createRectangleMask(
            points?.[0] || 50,
            points?.[1] || 50,
            points?.[2] || 200,
            points?.[3] || 150,
            shapeSettings
          );
          break;
        case 'ellipse':
          mask = await maskingSystem.createEllipseMask(
            points?.[0] || 150,
            points?.[1] || 125,
            points?.[2] || 100,
            points?.[3] || 75,
            shapeSettings
          );
          break;
        case 'polygon':
          mask = await maskingSystem.createPolygonMask(
            points || [50, 50, 250, 50, 200, 200, 100, 200],
            shapeSettings
          );
          break;
        case 'path':
          // Path will be created through brush strokes
          break;
        case 'smart':
          if (videoElement) {
            mask = await maskingSystem.createSmartMask(videoElement, { threshold: 0.5 });
          }
          break;
      }

      if (mask) {
        setCurrentMask(mask);
        onMaskApplied(mask);
      }
    } catch (error) {
      console.error('Failed to create mask:', error);
    }
  }, [maskingSystem, shapeSettings, canvasRef, videoElement, onMaskApplied]);

  // Apply mask properties
  const applyMaskProperties = useCallback(async () => {
    if (!currentMask) return;

    try {
      await maskingSystem.updateMaskProperties(currentMask.id, {
        opacity: maskProperties.opacity / 100,
        feather: maskProperties.feather,
        expansion: maskProperties.density / 100,
        invert: maskProperties.invert,
      });
    } catch (error) {
      console.error('Failed to apply mask properties:', error);
    }
  }, [maskingSystem, currentMask, maskProperties]);

  // Tool Selection Component
  const ToolSelector = () => (
    <View style={styles.toolSelector}>
      {[
        { type: 'rectangle', icon: 'square-outline', label: 'Rectangle' },
        { type: 'ellipse', icon: 'ellipse-outline', label: 'Ellipse' },
        { type: 'polygon', icon: 'triangle-outline', label: 'Polygon' },
        { type: 'brush', icon: 'brush-outline', label: 'Brush' },
        { type: 'smart', icon: 'scan-outline', label: 'Smart' },
      ].map((tool) => (
        <TouchableOpacity
          key={tool.type}
          style={[
            styles.toolButton,
            activeTool === tool.type && styles.activeToolButton,
          ]}
          onPress={() => setActiveTool(tool.type as MaskType)}
        >
          <Ionicons
            name={tool.icon as any}
            size={20}
            color={activeTool === tool.type ? '#007AFF' : '#999'}
          />
          <Text style={[
            styles.toolLabel,
            activeTool === tool.type && styles.activeToolLabel,
          ]}>
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Drawing Canvas Component
  const DrawingCanvas = () => (
    <View style={styles.canvasContainer}>
      <PanGestureHandler onGestureEvent={handleDrawingGesture}>
        <View style={styles.canvas}>
          <Svg width={canvasSize} height={canvasHeight} style={styles.svgCanvas}>
            {/* Background grid */}
            <G opacity={0.2}>
              {Array.from({ length: 20 }).map((_, i) => (
                <G key={i}>
                  <Path
                    d={`M ${(i * canvasSize) / 20} 0 L ${(i * canvasSize) / 20} ${canvasHeight}`}
                    stroke="#333"
                    strokeWidth={1}
                  />
                  <Path
                    d={`M 0 ${(i * canvasHeight) / 20} L ${canvasSize} ${(i * canvasHeight) / 20}`}
                    stroke="#333"
                    strokeWidth={1}
                  />
                </G>
              ))}
            </G>

            {/* Mask shapes */}
            {maskShapes.map((shape, index) => {
              switch (shape.type) {
                case 'rectangle':
                  return (
                    <Rect
                      key={index}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill="none"
                      stroke="#007AFF"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  );
                case 'ellipse':
                  return (
                    <Circle
                      key={index}
                      cx={shape.cx}
                      cy={shape.cy}
                      rx={shape.rx}
                      ry={shape.ry}
                      fill="none"
                      stroke="#007AFF"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  );
                case 'polygon':
                  return (
                    <Polygon
                      key={index}
                      points={shape.points}
                      fill="none"
                      stroke="#007AFF"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  );
                default:
                  return null;
              }
            })}

            {/* Brush paths */}
            {maskPaths.map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke="#007AFF"
                strokeWidth={brushSettings.size / 10}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={brushSettings.opacity}
              />
            ))}
          </Svg>

          {/* Quick action buttons */}
          <View style={styles.canvasActions}>
            <TouchableOpacity
              style={styles.canvasActionButton}
              onPress={() => createMask(activeTool)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.canvasActionButton}
              onPress={() => setMaskShapes([])}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </PanGestureHandler>
    </View>
  );

  // Tool Settings Component
  const ToolSettings = () => (
    <ScrollView style={styles.settingsContainer}>
      {activeTool === 'brush' && (
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Brush Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Size</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={200}
              value={brushSettings.size}
              onValueChange={(size) => setBrushSettings(prev => ({ ...prev, size }))}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.settingValue}>{Math.round(brushSettings.size)}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Hardness</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={brushSettings.hardness}
              onValueChange={(hardness) => setBrushSettings(prev => ({ ...prev, hardness }))}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.settingValue}>{Math.round(brushSettings.hardness * 100)}%</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Opacity</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={brushSettings.opacity}
              onValueChange={(opacity) => setBrushSettings(prev => ({ ...prev, opacity }))}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.settingValue}>{Math.round(brushSettings.opacity * 100)}%</Text>
          </View>
        </View>
      )}

      {(activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'polygon') && (
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Shape Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Feather</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={50}
              value={shapeSettings.feather}
              onValueChange={(feather) => setShapeSettings(prev => ({ ...prev, feather }))}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.settingValue}>{Math.round(shapeSettings.feather)}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Expansion</Text>
            <Slider
              style={styles.slider}
              minimumValue={-20}
              maximumValue={20}
              value={shapeSettings.expansion}
              onValueChange={(expansion) => setShapeSettings(prev => ({ ...prev, expansion }))}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.settingValue}>{Math.round(shapeSettings.expansion)}</Text>
          </View>
        </View>
      )}

      {/* Mask Properties */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Mask Properties</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Opacity</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={maskProperties.opacity}
            onValueChange={(opacity) => setMaskProperties(prev => ({ ...prev, opacity }))}
            onSlidingComplete={applyMaskProperties}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.settingValue}>{Math.round(maskProperties.opacity)}%</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Feather</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={50}
            value={maskProperties.feather}
            onValueChange={(feather) => setMaskProperties(prev => ({ ...prev, feather }))}
            onSlidingComplete={applyMaskProperties}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.settingValue}>{Math.round(maskProperties.feather)}</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Invert</Text>
          <Switch
            value={maskProperties.invert}
            onValueChange={(invert) => {
              setMaskProperties(prev => ({ ...prev, invert }));
              setTimeout(applyMaskProperties, 100);
            }}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={maskProperties.invert ? "#FFF" : "#f4f3f4"}
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
          <Text style={styles.title}>Advanced Masking</Text>
          <TouchableOpacity onPress={() => {}} style={styles.resetButton}>
            <Text style={styles.resetText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ToolSelector />
        
        <DrawingCanvas />
        
        <ToolSettings />
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
    color: '#FF3B30',
    fontSize: 16,
  },
  toolSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeToolButton: {
    backgroundColor: '#333',
  },
  toolLabel: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
  },
  activeToolLabel: {
    color: '#007AFF',
  },
  canvasContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  canvas: {
    backgroundColor: '#111',
    borderRadius: 8,
    position: 'relative',
  },
  svgCanvas: {
    backgroundColor: 'transparent',
  },
  canvasActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  canvasActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 14,
    width: 80,
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
});

export default AdvancedMaskingPanel;