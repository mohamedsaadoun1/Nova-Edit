import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EnhancedUIProps {
  children: React.ReactNode;
  theme?: 'dark' | 'light' | 'auto';
  accentColor?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'blur';
  enableGestures?: boolean;
  showStatusBar?: boolean;
}

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center-bottom';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
  disabled?: boolean;
}

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  transparent?: boolean;
  gradient?: boolean;
  theme?: 'dark' | 'light';
}

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  animationType?: 'scale' | 'slide' | 'fade' | 'bounce';
  delay?: number;
  disabled?: boolean;
  theme?: 'dark' | 'light';
}

interface GradientBackgroundProps {
  colors?: string[];
  locations?: number[];
  angle?: number;
  animated?: boolean;
  children: React.ReactNode;
}

// Main Enhanced UI Container
export function EnhancedUI({
  children,
  theme = 'dark',
  accentColor = '#007AFF',
  backgroundStyle = 'gradient',
  enableGestures = true,
  showStatusBar = true
}: EnhancedUIProps) {
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  useEffect(() => {
    if (theme === 'auto') {
      // Auto-detect system theme
      setCurrentTheme('dark'); // Default to dark for now
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const getBackgroundColors = () => {
    if (currentTheme === 'dark') {
      return ['#0a0a0a', '#1a1a1a', '#2a2a2a'];
    } else {
      return ['#f8f9fa', '#e9ecef', '#dee2e6'];
    }
  };

  const renderBackground = () => {
    switch (backgroundStyle) {
      case 'gradient':
        return (
          <GradientBackground colors={getBackgroundColors()} animated>
            {children}
          </GradientBackground>
        );
      case 'blur':
        return (
          <BlurView intensity={80} style={StyleSheet.absoluteFillObject}>
            {children}
          </BlurView>
        );
      case 'solid':
      default:
        return (
          <View style={[
            styles.solidBackground,
            { backgroundColor: currentTheme === 'dark' ? '#1a1a1a' : '#f8f9fa' }
          ]}>
            {children}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showStatusBar && (
        <StatusBar
          barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
      )}
      {renderBackground()}
    </SafeAreaView>
  );
}

// Modern Header Component
export function ModernHeader({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  transparent = false,
  gradient = false,
  theme = 'dark'
}: ModernHeaderProps) {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const HeaderContainer = gradient ? LinearGradient : View;
  const gradientProps = gradient ? {
    colors: theme === 'dark' 
      ? ['rgba(42, 42, 42, 0.95)', 'rgba(26, 26, 26, 0.8)']
      : ['rgba(248, 249, 250, 0.95)', 'rgba(233, 236, 239, 0.8)'],
    locations: [0, 1]
  } : {};

  return (
    <HeaderContainer
      {...(gradient ? gradientProps : {})}
      style={[
        styles.modernHeader,
        transparent && styles.transparentHeader,
        !gradient && {
          backgroundColor: theme === 'dark' 
            ? (transparent ? 'transparent' : '#2a2a2a')
            : (transparent ? 'transparent' : '#f8f9fa')
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.headerContent,
          { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
        ]}
      >
        {/* Left Action */}
        <View style={styles.headerLeft}>
          {leftIcon && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onLeftPress}
            >
              <Ionicons
                name={leftIcon as any}
                size={24}
                color={theme === 'dark' ? '#ffffff' : '#333333'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.headerCenter}>
          <Text style={[
            styles.headerTitle,
            { color: theme === 'dark' ? '#ffffff' : '#333333' }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[
              styles.headerSubtitle,
              { color: theme === 'dark' ? '#cccccc' : '#666666' }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Action */}
        <View style={styles.headerRight}>
          {rightIcon && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onRightPress}
            >
              <Ionicons
                name={rightIcon as any}
                size={24}
                color={theme === 'dark' ? '#ffffff' : '#333333'}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </HeaderContainer>
  );
}

// Floating Action Button
export function FloatingActionButton({
  icon,
  onPress,
  position,
  size = 'medium',
  color = '#007AFF',
  label,
  disabled = false
}: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 8,
      stiffness: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    if (disabled) return;

    // Animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small': return { width: 48, height: 48 };
      case 'large': return { width: 72, height: 72 };
      case 'medium':
      default: return { width: 56, height: 56 };
    }
  };

  const getPositionStyle = () => {
    const baseOffset = 20;
    switch (position) {
      case 'top-right':
        return { position: 'absolute', top: baseOffset + 50, right: baseOffset };
      case 'top-left':
        return { position: 'absolute', top: baseOffset + 50, left: baseOffset };
      case 'bottom-left':
        return { position: 'absolute', bottom: baseOffset, left: baseOffset };
      case 'center-bottom':
        return { position: 'absolute', bottom: baseOffset, alignSelf: 'center' };
      case 'bottom-right':
      default:
        return { position: 'absolute', bottom: baseOffset, right: baseOffset };
    }
  };

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        getPositionStyle(),
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : 1,
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.fab,
          getSizeStyle(),
          { backgroundColor: color },
          disabled && styles.fabDisabled
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon as any}
          size={size === 'large' ? 32 : size === 'small' ? 20 : 24}
          color="#ffffff"
        />
      </TouchableOpacity>
      
      {label && (
        <View style={styles.fabLabel}>
          <Text style={styles.fabLabelText}>{label}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Animated Card Component
export function AnimatedCard({
  children,
  style,
  onPress,
  animationType = 'scale',
  delay = 0,
  disabled = false,
  theme = 'dark'
}: AnimatedCardProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(animValue, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationStyle = () => {
    switch (animationType) {
      case 'slide':
        return {
          transform: [{
            translateX: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }],
          opacity: animValue,
        };
      case 'fade':
        return { opacity: animValue };
      case 'bounce':
        return {
          transform: [{
            scale: animValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 1.1, 1],
            })
          }],
          opacity: animValue,
        };
      case 'scale':
      default:
        return {
          transform: [{ scale: animValue }],
          opacity: animValue,
        };
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[getAnimationStyle()]}>
      <CardComponent
        style={[
          styles.animatedCard,
          {
            backgroundColor: theme === 'dark' ? '#333333' : '#ffffff',
            shadowColor: theme === 'dark' ? '#000000' : '#333333',
          },
          style,
          disabled && styles.disabledCard
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={onPress ? 0.8 : 1}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
}

// Gradient Background Component
export function GradientBackground({
  colors = ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
  locations = [0, 0.5, 1],
  angle = 135,
  animated = false,
  children
}: GradientBackgroundProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: false,
        })
      ).start();
    }
  }, [animated]);

  const animatedColors = animated
    ? colors.map((color, index) => 
        animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [color, colors[(index + 1) % colors.length], color],
        })
      )
    : colors;

  return (
    <LinearGradient
      colors={animatedColors as any}
      locations={locations}
      start={[0, 0]}
      end={[1, 1]}
      style={StyleSheet.absoluteFillObject}
    >
      {children}
    </LinearGradient>
  );
}

// Modern Button Component
export function ModernButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  theme = 'dark',
  style
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  theme?: 'dark' | 'light';
  style?: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    const baseStyle = {
      paddingVertical: size === 'large' ? 16 : size === 'small' ? 8 : 12,
      paddingHorizontal: size === 'large' ? 24 : size === 'small' ? 12 : 16,
      borderRadius: size === 'large' ? 16 : size === 'small' ? 8 : 12,
    };

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' ? '#333333' : '#e9ecef',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#007AFF' : '#0066CC',
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' ? '#007AFF' : '#0066CC',
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return theme === 'dark' ? '#ffffff' : '#333333';
      case 'outline':
      case 'ghost':
        return theme === 'dark' ? '#007AFF' : '#0066CC';
      case 'primary':
      default:
        return '#ffffff';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.modernButton,
          getButtonStyle(),
          (disabled || loading) && styles.disabledButton,
          style
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <Animated.View style={styles.loadingSpinner}>
            <Ionicons name="hourglass" size={16} color={getTextColor()} />
          </Animated.View>
        ) : (
          <View style={styles.buttonContent}>
            {icon && (
              <Ionicons
                name={icon as any}
                size={size === 'large' ? 20 : size === 'small' ? 14 : 16}
                color={getTextColor()}
                style={styles.buttonIcon}
              />
            )}
            <Text style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontSize: size === 'large' ? 16 : size === 'small' ? 12 : 14,
              }
            ]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  solidBackground: {
    flex: 1,
  },
  modernHeader: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  fabContainer: {
    zIndex: 1000,
  },
  fab: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  fabLabel: {
    position: 'absolute',
    right: 64,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fabLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  animatedCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledCard: {
    opacity: 0.5,
  },
  modernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  loadingSpinner: {
    transform: [{ rotate: '45deg' }],
  },
});