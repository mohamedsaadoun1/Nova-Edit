/**
 * Responsive Container Component
 * مكون متجاوب للتعامل مع أحجام الشاشات المختلفة
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileConfigManager } from '../config/MobileConfig';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: any;
  enableKeyboardAware?: boolean;
  enableOrientationChange?: boolean;
  enableAccessibility?: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  isLandscape: boolean;
  isTablet: boolean;
  isSmallScreen: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export default function ResponsiveContainer({
  children,
  style,
  enableKeyboardAware = true,
  enableOrientationChange = true,
  enableAccessibility = true
}: ResponsiveContainerProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return {
      width,
      height,
      scale,
      fontScale,
      isLandscape: width > height,
      isTablet: Math.min(width, height) >= 768,
      isSmallScreen: Math.min(width, height) < 480,
      safeAreaInsets: {
        top: safeAreaInsets.top,
        bottom: safeAreaInsets.bottom,
        left: safeAreaInsets.left,
        right: safeAreaInsets.right
      }
    };
  });

  // مدير إعدادات الموبايل
  const mobileConfig = MobileConfigManager.getInstance();

  // معالج تغيير أبعاد الشاشة
  const handleDimensionsChange = useCallback(({ window }) => {
    const { width, height, scale, fontScale } = window;
    const newScreenInfo: ScreenInfo = {
      width,
      height,
      scale,
      fontScale,
      isLandscape: width > height,
      isTablet: Math.min(width, height) >= 768,
      isSmallScreen: Math.min(width, height) < 480,
      safeAreaInsets: {
        top: safeAreaInsets.top,
        bottom: safeAreaInsets.bottom,
        left: safeAreaInsets.left,
        right: safeAreaInsets.right
      }
    };

    setScreenInfo(newScreenInfo);

    // تحسين الإعدادات حسب حجم الشاشة الجديد
    if (enableOrientationChange) {
      mobileConfig.optimizeForScreenSize(width, height);
    }
  }, [safeAreaInsets, enableOrientationChange, mobileConfig]);

  // مراقبة تغييرات الشاشة
  useEffect(() => {
    if (enableOrientationChange) {
      const subscription = Dimensions.addEventListener('change', handleDimensionsChange);
      
      return () => {
        subscription?.remove();
      };
    }
  }, [enableOrientationChange, handleDimensionsChange]);

  // تحسين إمكانية الوصول
  useEffect(() => {
    if (enableAccessibility) {
      const config = mobileConfig.getConfig();
      
      // تطبيق تكبير النص إذا كان مفعلاً
      if (config.accessibility.textScaling.respectSystemSettings && screenInfo.fontScale > 1.2) {
        mobileConfig.enableAccessibilityMode();
      }
      
      // تحسين للأجهزة الضعيفة
      if (screenInfo.scale < 2 && screenInfo.isSmallScreen) {
        mobileConfig.optimizeForLowEndDevice();
      }
    }
  }, [screenInfo, enableAccessibility, mobileConfig]);

  // حساب الأبعاد المتجاوبة
  const getResponsiveDimensions = () => {
    const config = mobileConfig.getConfig();
    const { width, height, isLandscape, isTablet, isSmallScreen } = screenInfo;

    // تحديد نوع التخطيط
    let layout = 'mobile-portrait';
    if (isTablet) {
      layout = isLandscape ? 'tablet-landscape' : 'tablet-portrait';
    } else if (isLandscape) {
      layout = 'mobile-landscape';
    }

    // حساب الأبعاد
    const headerHeight = isSmallScreen ? 
      config.ui.layout.headerHeight - 10 : 
      config.ui.layout.headerHeight;

    const tabBarHeight = isSmallScreen ? 
      config.ui.layout.tabBarHeight - 10 : 
      config.ui.layout.tabBarHeight;

    const contentHeight = height - headerHeight - tabBarHeight - 
      screenInfo.safeAreaInsets.top - screenInfo.safeAreaInsets.bottom;

    const marginHorizontal = isTablet ? 
      config.ui.layout.marginHorizontal * 2 : 
      config.ui.layout.marginHorizontal;

    return {
      layout,
      headerHeight,
      tabBarHeight,
      contentHeight,
      marginHorizontal,
      availableWidth: width - (marginHorizontal * 2),
      availableHeight: contentHeight,
      isCompact: isSmallScreen || (isLandscape && !isTablet)
    };
  };

  const dimensions = getResponsiveDimensions();
  const config = mobileConfig.getConfig();

  // أنماط متجاوبة
  const responsiveStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: config.ui.colors.background,
      paddingTop: screenInfo.safeAreaInsets.top,
      paddingBottom: screenInfo.safeAreaInsets.bottom,
      paddingLeft: screenInfo.safeAreaInsets.left,
      paddingRight: screenInfo.safeAreaInsets.right,
    },
    content: {
      flex: 1,
      marginHorizontal: dimensions.marginHorizontal,
    },
    // تخطيط خاص بالموبايل العمودي
    mobilePortrait: {
      flexDirection: 'column',
    },
    // تخطيط خاص بالموبايل الأفقي
    mobileLandscape: {
      flexDirection: 'row',
    },
    // تخطيط خاص بالتابلت
    tabletPortrait: {
      flexDirection: 'column',
      maxWidth: 768,
      alignSelf: 'center',
    },
    tabletLandscape: {
      flexDirection: 'row',
      paddingHorizontal: 40,
    },
    // تحسينات إمكانية الوصول
    accessibilityEnhanced: {
      minHeight: config.accessibility.motor.enableLargerTouchTargets ? 
        config.ui.touchTargets.recommended : 
        config.ui.touchTargets.minimum,
    }
  });

  // تحديد النمط المناسب للتخطيط
  const getLayoutStyle = () => {
    switch (dimensions.layout) {
      case 'mobile-landscape':
        return responsiveStyles.mobileLandscape;
      case 'tablet-portrait':
        return responsiveStyles.tabletPortrait;
      case 'tablet-landscape':
        return responsiveStyles.tabletLandscape;
      default:
        return responsiveStyles.mobilePortrait;
    }
  };

  return (
    <View style={[responsiveStyles.container, style]}>
      {/* شريط الحالة */}
      <StatusBar
        barStyle={config.ui.colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'}
        backgroundColor={config.ui.colors.background}
        translucent={Platform.OS === 'android'}
      />

      {/* المحتوى الرئيسي */}
      <View style={[
        responsiveStyles.content,
        getLayoutStyle(),
        enableAccessibility && responsiveStyles.accessibilityEnhanced
      ]}>
        {/* تمرير معلومات الشاشة للمكونات الفرعية */}
        {React.Children.map(children, child => 
          React.isValidElement(child) ? 
            React.cloneElement(child, { 
              screenInfo, 
              dimensions, 
              mobileConfig: config 
            } as any) : 
            child
        )}
      </View>
    </View>
  );
}

// Hook مخصص للحصول على معلومات الشاشة
export function useScreenInfo() {
  const [screenInfo, setScreenInfo] = useState(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return {
      width,
      height,
      scale,
      fontScale,
      isLandscape: width > height,
      isTablet: Math.min(width, height) >= 768,
      isSmallScreen: Math.min(width, height) < 480,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height, scale, fontScale } = window;
      setScreenInfo({
        width,
        height,
        scale,
        fontScale,
        isLandscape: width > height,
        isTablet: Math.min(width, height) >= 768,
        isSmallScreen: Math.min(width, height) < 480,
      });
    });

    return () => subscription?.remove();
  }, []);

  return screenInfo;
}

// Hook للحصول على أبعاد متجاوبة
export function useResponsiveDimensions() {
  const screenInfo = useScreenInfo();
  const mobileConfig = MobileConfigManager.getInstance();
  const config = mobileConfig.getConfig();

  return {
    ...screenInfo,
    touchTarget: screenInfo.isSmallScreen ? 
      config.ui.touchTargets.minimum : 
      config.ui.touchTargets.recommended,
    spacing: config.ui.layout.marginHorizontal,
    fontSize: config.ui.typography.baseFontSize * screenInfo.fontScale,
    headerHeight: config.ui.layout.headerHeight,
    tabBarHeight: config.ui.layout.tabBarHeight,
  };
}

// أنماط مشتركة للمكونات المتجاوبة
export const ResponsiveStyles = StyleSheet.create({
  // أزرار متجاوبة
  responsiveButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // نص متجاوب
  responsiveText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right', // للعربية
  },
  
  // بطاقات متجاوبة
  responsiveCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // قوائم متجاوبة
  responsiveList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  // مدخلات متجاوبة
  responsiveInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#1a1a1a',
  },
});

export { ResponsiveContainer };