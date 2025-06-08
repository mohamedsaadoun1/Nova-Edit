import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetComponent: string;
  targetPosition: { x: number; y: number; width: number; height: number };
  spotlightRadius: number;
  tipPosition: 'top' | 'bottom' | 'left' | 'right';
  animation?: 'pulse' | 'slide' | 'bounce';
  action?: () => void;
}

interface TutorialOverlayProps {
  visible: boolean;
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  theme?: 'dark' | 'light';
}

export default function TutorialOverlay({
  visible,
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  theme = 'dark'
}: TutorialOverlayProps) {
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [spotlightScale] = useState(new Animated.Value(0.8));
  const [tipTranslateY] = useState(new Animated.Value(20));
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (visible) {
      // Animation entrance
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(spotlightScale, {
          toValue: 1,
          damping: 8,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(tipTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for spotlight
      if (currentStepData?.animation === 'pulse') {
        startPulseAnimation();
      }
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, currentStep]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }
    
    if (isLastStep) {
      onComplete();
    } else {
      // Animate out current tip
      Animated.timing(tipTranslateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onNext();
        // Animate in new tip
        tipTranslateY.setValue(20);
        Animated.timing(tipTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleSkip = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onSkip();
    });
  };

  const renderSpotlight = () => {
    if (!currentStepData?.targetPosition) return null;

    const { x, y, width, height } = currentStepData.targetPosition;
    const radius = currentStepData.spotlightRadius || 60;

    return (
      <Animated.View
        style={[
          styles.spotlight,
          {
            left: x + width / 2 - radius,
            top: y + height / 2 - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            transform: [
              { scale: spotlightScale },
              { scale: currentStepData.animation === 'pulse' ? pulseAnimation : 1 }
            ],
          },
        ]}
      />
    );
  };

  const renderTip = () => {
    if (!currentStepData) return null;

    const { targetPosition, tipPosition } = currentStepData;
    let tipStyle = {};
    let arrowStyle = {};

    if (targetPosition) {
      const { x, y, width, height } = targetPosition;
      
      switch (tipPosition) {
        case 'top':
          tipStyle = {
            left: Math.max(20, Math.min(x - 100, screenWidth - 220)),
            top: y - 180,
          };
          arrowStyle = {
            position: 'absolute',
            bottom: -8,
            left: '50%',
            marginLeft: -8,
            width: 0,
            height: 0,
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderTopWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          };
          break;
        case 'bottom':
          tipStyle = {
            left: Math.max(20, Math.min(x - 100, screenWidth - 220)),
            top: y + height + 20,
          };
          arrowStyle = {
            position: 'absolute',
            top: -8,
            left: '50%',
            marginLeft: -8,
            width: 0,
            height: 0,
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderBottomWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          };
          break;
        case 'left':
          tipStyle = {
            left: x - 220,
            top: Math.max(100, y - 80),
          };
          arrowStyle = {
            position: 'absolute',
            right: -8,
            top: '50%',
            marginTop: -8,
            width: 0,
            height: 0,
            borderTopWidth: 8,
            borderBottomWidth: 8,
            borderLeftWidth: 8,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          };
          break;
        case 'right':
          tipStyle = {
            left: x + width + 20,
            top: Math.max(100, y - 80),
          };
          arrowStyle = {
            position: 'absolute',
            left: -8,
            top: '50%',
            marginTop: -8,
            width: 0,
            height: 0,
            borderTopWidth: 8,
            borderBottomWidth: 8,
            borderRightWidth: 8,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRightColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          };
          break;
      }
    } else {
      // Center tip if no target position
      tipStyle = {
        left: (screenWidth - 200) / 2,
        top: (screenHeight - 200) / 2,
      };
    }

    return (
      <Animated.View
        style={[
          styles.tipContainer,
          tipStyle,
          { transform: [{ translateY: tipTranslateY }] },
        ]}
      >
        <View style={[
          styles.tipCard,
          { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff' }
        ]}>
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <Text style={[
              styles.stepText,
              { color: theme === 'dark' ? '#007AFF' : '#0066CC' }
            ]}>
              {currentStep + 1} من {steps.length}
            </Text>
          </View>

          {/* Title */}
          <Text style={[
            styles.tipTitle,
            { color: theme === 'dark' ? '#ffffff' : '#333333' }
          ]}>
            {currentStepData.title}
          </Text>

          {/* Description */}
          <Text style={[
            styles.tipDescription,
            { color: theme === 'dark' ? '#cccccc' : '#666666' }
          ]}>
            {currentStepData.description}
          </Text>

          {/* Controls */}
          <View style={styles.tipControls}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[
                styles.skipButtonText,
                { color: theme === 'dark' ? '#999999' : '#666666' }
              ]}>
                تخطي
              </Text>
            </TouchableOpacity>

            <View style={styles.navigationButtons}>
              {!isFirstStep && (
                <TouchableOpacity
                  onPress={onPrevious}
                  style={[styles.navButton, styles.prevButton]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={theme === 'dark' ? '#007AFF' : '#0066CC'}
                  />
                  <Text style={[
                    styles.navButtonText,
                    { color: theme === 'dark' ? '#007AFF' : '#0066CC' }
                  ]}>
                    السابق
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.navButton,
                  styles.nextButton,
                  { backgroundColor: theme === 'dark' ? '#007AFF' : '#0066CC' }
                ]}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'إنهاء' : 'التالي'}
                </Text>
                {!isLastStep && (
                  <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Arrow */}
          <View style={arrowStyle} />
        </View>
      </Animated.View>
    );
  };

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / steps.length) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBar,
          { backgroundColor: theme === 'dark' ? '#333333' : '#e0e0e0' }
        ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: theme === 'dark' ? '#007AFF' : '#0066CC'
              }
            ]}
          />
        </View>
      </View>
    );
  };

  if (!visible || !currentStepData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {/* Dark overlay */}
        <View style={styles.darkOverlay} />

        {/* Spotlight */}
        {renderSpotlight()}

        {/* Tutorial tip */}
        {renderTip()}

        {/* Progress bar */}
        {renderProgressBar()}

        {/* Background tap to skip */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleSkip} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  tipContainer: {
    position: 'absolute',
    width: 200,
    zIndex: 1000,
  },
  tipCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stepIndicator: {
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  tipControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  prevButton: {
    backgroundColor: 'transparent',
  },
  nextButton: {
    minWidth: 80,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});