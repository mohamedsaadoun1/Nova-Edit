import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
  Image,
  PanGestureHandler,
  State
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  illustration: 'video' | 'ai' | 'export' | 'community' | 'features';
  backgroundColor: string[];
  textColor: string;
  features?: string[];
  action?: {
    text: string;
    onPress: () => void;
  };
}

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  theme?: 'dark' | 'light';
  customSteps?: OnboardingStep[];
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'مرحباً بك في Nova Edit! 🎬',
    description: 'أقوى محرر فيديو مجاني مع ذكاء اصطناعي متطور',
    illustration: 'video',
    backgroundColor: ['#667eea', '#764ba2'],
    textColor: '#ffffff',
    features: [
      'تحرير احترافي مجاني 100%',
      'ذكاء اصطناعي متقدم',
      'تأثيرات هوليوودية',
      'تصدير بجودة 4K'
    ]
  },
  {
    id: 'ai_features',
    title: 'قوة الذكاء الاصطناعي ⚡',
    description: 'استخدم أحدث تقنيات AI لتحرير فيديوهاتك بذكاء',
    illustration: 'ai',
    backgroundColor: ['#f093fb', '#f5576c'],
    textColor: '#ffffff',
    features: [
      'إزالة الخلفية تلقائياً',
      'تتبع الحركة الذكي',
      'تحويل الكلام إلى نص',
      'تحسين جودة الفيديو'
    ]
  },
  {
    id: 'easy_editing',
    title: 'تحرير بسيط وقوي 🚀',
    description: 'واجهة سهلة الاستخدام مع أدوات احترافية متقدمة',
    illustration: 'features',
    backgroundColor: ['#4facfe', '#00f2fe'],
    textColor: '#ffffff',
    features: [
      'Timeline متطور',
      'طبقات متعددة',
      'انتقالات سينمائية',
      'تأثيرات بصرية مذهلة'
    ]
  },
  {
    id: 'export_share',
    title: 'شارك إبداعك مع العالم 🌟',
    description: 'صدّر بأعلى جودة وشارك على جميع المنصات',
    illustration: 'export',
    backgroundColor: ['#fa709a', '#fee140'],
    textColor: '#ffffff',
    features: [
      'تصدير فوري بجودة 4K',
      'تحسين للمنصات الاجتماعية',
      'مشاركة مباشرة',
      'حفظ في المعرض'
    ]
  },
  {
    id: 'community',
    title: 'انضم لمجتمع المبدعين 👥',
    description: 'تعلم وشارك وتفاعل مع آلاف المبدعين حول العالم',
    illustration: 'community',
    backgroundColor: ['#a8edea', '#fed6e3'],
    textColor: '#333333',
    features: [
      'دروس تعليمية مجانية',
      'مجتمع داعم ومتفاعل',
      'تحديثات مستمرة',
      'دعم فني سريع'
    ]
  }
];

export default function OnboardingFlow({
  visible,
  onComplete,
  onSkip,
  theme = 'dark',
  customSteps
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const steps = customSteps || defaultSteps;

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: (currentStep + 1) / steps.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep, visible]);

  const handleNext = () => {
    if (isAnimating) return;

    if (currentStep < steps.length - 1) {
      animateToNext();
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (isAnimating || currentStep === 0) return;
    animateToPrevious();
  };

  const animateToNext = () => {
    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => prev + 1);
      slideAnim.setValue(screenWidth);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const animateToPrevious = () => {
    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => prev - 1);
      slideAnim.setValue(-screenWidth);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handleComplete = async () => {
    // Mark onboarding as completed
    await AsyncStorage.setItem('nova_edit_onboarding_completed', 'true');
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('nova_edit_onboarding_completed', 'true');
    onSkip();
  };

  const renderIllustration = (type: string) => {
    const iconSize = 120;
    const iconColor = steps[currentStep].textColor;

    switch (type) {
      case 'video':
        return (
          <View style={styles.illustrationContainer}>
            <Ionicons name="videocam" size={iconSize} color={iconColor} />
            <View style={[styles.illustrationAccent, { backgroundColor: iconColor }]} />
          </View>
        );
      case 'ai':
        return (
          <View style={styles.illustrationContainer}>
            <Ionicons name="sparkles" size={iconSize} color={iconColor} />
            <Ionicons 
              name="flash" 
              size={40} 
              color={iconColor} 
              style={styles.illustrationOverlay}
            />
          </View>
        );
      case 'features':
        return (
          <View style={styles.illustrationContainer}>
            <Ionicons name="layers" size={iconSize} color={iconColor} />
            <Ionicons 
              name="color-wand" 
              size={50} 
              color={iconColor} 
              style={styles.illustrationOverlay}
            />
          </View>
        );
      case 'export':
        return (
          <View style={styles.illustrationContainer}>
            <Ionicons name="share" size={iconSize} color={iconColor} />
            <Ionicons 
              name="checkmark-circle" 
              size={40} 
              color={iconColor} 
              style={styles.illustrationOverlay}
            />
          </View>
        );
      case 'community':
        return (
          <View style={styles.illustrationContainer}>
            <Ionicons name="people" size={iconSize} color={iconColor} />
            <Ionicons 
              name="heart" 
              size={40} 
              color={iconColor} 
              style={styles.illustrationOverlay}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderFeatures = (features: string[]) => (
    <View style={styles.featuresContainer}>
      {features.map((feature, index) => (
        <Animated.View
          key={index}
          style={[
            styles.featureItem,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }
          ]}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={steps[currentStep].textColor} 
          />
          <Text style={[
            styles.featureText,
            { color: steps[currentStep].textColor }
          ]}>
            {feature}
          </Text>
        </Animated.View>
      ))}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {steps.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentStep 
                ? steps[currentStep].textColor 
                : `${steps[currentStep].textColor}40`,
            }
          ]}
          onPress={() => {
            if (!isAnimating && index !== currentStep) {
              setCurrentStep(index);
            }
          }}
        />
      ))}
    </View>
  );

  if (!visible) return null;

  const currentStepData = steps[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient
        colors={currentStepData.backgroundColor}
        style={styles.container}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: currentStepData.textColor,
                }
              ]}
            />
          </View>
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: currentStepData.textColor }]}>
            تخطي
          </Text>
        </TouchableOpacity>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim }
              ],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Illustration */}
          <View style={styles.illustrationSection}>
            {renderIllustration(currentStepData.illustration)}
          </View>

          {/* Text Content */}
          <View style={styles.textSection}>
            <Text style={[
              styles.title,
              { color: currentStepData.textColor }
            ]}>
              {currentStepData.title}
            </Text>
            
            <Text style={[
              styles.description,
              { color: currentStepData.textColor }
            ]}>
              {currentStepData.description}
            </Text>

            {/* Features */}
            {currentStepData.features && renderFeatures(currentStepData.features)}
          </View>
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {/* Dots */}
          {renderDots()}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.backButton,
                  { borderColor: currentStepData.textColor }
                ]}
                onPress={handlePrevious}
                disabled={isAnimating}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={currentStepData.textColor} 
                />
                <Text style={[
                  styles.backButtonText,
                  { color: currentStepData.textColor }
                ]}>
                  السابق
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                { backgroundColor: currentStepData.textColor }
              ]}
              onPress={handleNext}
              disabled={isAnimating}
            >
              <Text style={[
                styles.nextButtonText,
                { color: currentStepData.backgroundColor[0] }
              ]}>
                {currentStep === steps.length - 1 ? 'ابدأ الآن!' : 'التالي'}
              </Text>
              {currentStep < steps.length - 1 && (
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={currentStepData.backgroundColor[0]} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

// Check if onboarding should be shown
export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem('nova_edit_onboarding_completed');
    return completed !== 'true';
  } catch (error) {
    return true; // Show onboarding if unable to check
  }
};

// Reset onboarding (for testing)
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('nova_edit_onboarding_completed');
  } catch (error) {
    console.warn('Failed to reset onboarding status');
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  progressContainer: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 30,
    padding: 10,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  illustrationSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationAccent: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.2,
    bottom: -20,
    right: -20,
  },
  illustrationOverlay: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  textSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
    opacity: 0.9,
  },
  featuresContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  navigation: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  nextButton: {
    marginLeft: 'auto',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
});