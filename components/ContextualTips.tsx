import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface ContextualTip {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'tip' | 'feature';
  trigger: 'immediate' | 'hover' | 'focus' | 'action';
  position: 'top' | 'bottom' | 'floating';
  duration?: number; // Auto dismiss duration in ms
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  priority: 'low' | 'medium' | 'high';
  showOnce?: boolean;
  conditions?: {
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    feature?: string;
    context?: string;
  };
}

interface ContextualTipsProps {
  tips: ContextualTip[];
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  currentContext?: string;
  onTipShown?: (tipId: string) => void;
  onTipDismissed?: (tipId: string) => void;
  theme?: 'dark' | 'light';
}

export default function ContextualTips({
  tips,
  userLevel = 'beginner',
  currentContext,
  onTipShown,
  onTipDismissed,
  theme = 'dark'
}: ContextualTipsProps) {
  const [activeTips, setActiveTips] = useState<ContextualTip[]>([]);
  const [shownTips, setShownTips] = useState<Set<string>>(new Set());
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());

  // Filter and prioritize tips based on conditions
  useEffect(() => {
    const eligibleTips = tips.filter(tip => {
      // Check if already shown and should show only once
      if (tip.showOnce && shownTips.has(tip.id)) {
        return false;
      }

      // Check user level condition
      if (tip.conditions?.userLevel && tip.conditions.userLevel !== userLevel) {
        return false;
      }

      // Check context condition
      if (tip.conditions?.context && tip.conditions.context !== currentContext) {
        return false;
      }

      return true;
    });

    // Sort by priority and limit to prevent overwhelming
    const prioritizedTips = eligibleTips
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 2); // Show max 2 tips at once

    setActiveTips(prioritizedTips);
  }, [tips, userLevel, currentContext, shownTips]);

  // Show tips with animation
  useEffect(() => {
    activeTips.forEach(tip => {
      if (!animationValues.current.has(tip.id)) {
        animationValues.current.set(tip.id, new Animated.Value(0));
      }

      const animation = animationValues.current.get(tip.id)!;
      
      // Animate in
      Animated.spring(animation, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }).start();

      // Mark as shown
      setShownTips(prev => new Set([...prev, tip.id]));
      onTipShown?.(tip.id);

      // Auto dismiss if duration is set
      if (tip.duration) {
        setTimeout(() => {
          dismissTip(tip.id);
        }, tip.duration);
      }
    });
  }, [activeTips]);

  const dismissTip = (tipId: string) => {
    const animation = animationValues.current.get(tipId);
    if (animation) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveTips(prev => prev.filter(t => t.id !== tipId));
        animationValues.current.delete(tipId);
        onTipDismissed?.(tipId);
      });
    }
  };

  const getIconForType = (type: ContextualTip['type']): string => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'tip': return 'bulb';
      case 'feature': return 'star';
      case 'info':
      default: return 'information-circle';
    }
  };

  const getColorForType = (type: ContextualTip['type']) => {
    const colors = {
      info: theme === 'dark' ? '#007AFF' : '#0066CC',
      success: '#28a745',
      warning: '#ffc107',
      tip: '#17a2b8',
      feature: '#e83e8c'
    };
    return colors[type];
  };

  const renderTip = (tip: ContextualTip, index: number) => {
    const animation = animationValues.current.get(tip.id);
    if (!animation) return null;

    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    const tipColor = getColorForType(tip.type);
    const iconName = tip.icon || getIconForType(tip.type);

    return (
      <Animated.View
        key={tip.id}
        style={[
          styles.tipContainer,
          tip.position === 'floating' && styles.floatingTip,
          tip.position === 'top' && styles.topTip,
          tip.position === 'bottom' && styles.bottomTip,
          {
            transform: [{ translateY }, { scale }],
            opacity: animation,
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
            borderLeftColor: tipColor,
            marginBottom: index > 0 ? 12 : 0,
          }
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: tipColor }]}>
          <Ionicons name={iconName as any} size={20} color="#ffffff" />
        </View>

        {/* Content */}
        <View style={styles.tipContent}>
          <Text style={[
            styles.tipTitle,
            { color: theme === 'dark' ? '#ffffff' : '#333333' }
          ]}>
            {tip.title}
          </Text>
          <Text style={[
            styles.tipMessage,
            { color: theme === 'dark' ? '#cccccc' : '#666666' }
          ]}>
            {tip.message}
          </Text>

          {/* Action button */}
          {tip.actionText && tip.onAction && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: tipColor }]}
              onPress={() => {
                tip.onAction?.();
                dismissTip(tip.id);
              }}
            >
              <Text style={[styles.actionButtonText, { color: tipColor }]}>
                {tip.actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => dismissTip(tip.id)}
        >
          <Ionicons
            name="close"
            size={18}
            color={theme === 'dark' ? '#999999' : '#666666'}
          />
        </TouchableOpacity>

        {/* Priority indicator */}
        {tip.priority === 'high' && (
          <View style={[styles.priorityIndicator, { backgroundColor: tipColor }]} />
        )}
      </Animated.View>
    );
  };

  if (activeTips.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {activeTips.map((tip, index) => renderTip(tip, index))}
    </View>
  );
}

// Pre-defined tips for common scenarios
export const defaultTips: ContextualTip[] = [
  {
    id: 'welcome_tip',
    title: 'مرحباً بك في Nova Edit! 👋',
    message: 'اضغط على + لاستيراد أول فيديو لك وابدأ رحلة التحرير',
    type: 'tip',
    trigger: 'immediate',
    position: 'floating',
    duration: 5000,
    priority: 'high',
    showOnce: true,
    conditions: { userLevel: 'beginner', context: 'empty_project' }
  },
  {
    id: 'timeline_tip',
    title: 'Timeline السحري 🎬',
    message: 'اسحب المقاطع لترتيبها، واضغط مطولاً للمزيد من الخيارات',
    type: 'feature',
    trigger: 'immediate',
    position: 'top',
    priority: 'medium',
    conditions: { userLevel: 'beginner', context: 'video_imported' }
  },
  {
    id: 'ai_features_tip',
    title: 'قوة الذكاء الاصطناعي ⚡',
    message: 'استخدم ميزات AI المجانية لتحسين فيديوهاتك تلقائياً',
    type: 'feature',
    trigger: 'immediate',
    position: 'floating',
    actionText: 'استكشف AI',
    priority: 'high',
    conditions: { userLevel: 'beginner', context: 'first_edit' }
  },
  {
    id: 'export_quality_tip',
    title: 'اختر جودة التصدير المناسبة 📹',
    message: 'للحصول على أفضل نتيجة، اختر جودة HD للمنصات الاجتماعية',
    type: 'tip',
    trigger: 'action',
    position: 'top',
    priority: 'medium',
    conditions: { context: 'export_screen' }
  },
  {
    id: 'performance_tip',
    title: 'نصيحة للأداء الأمثل 🚀',
    message: 'أغلق التطبيقات الأخرى للحصول على أداء أفضل أثناء التحرير',
    type: 'info',
    trigger: 'immediate',
    position: 'floating',
    priority: 'low',
    duration: 7000,
    conditions: { context: 'heavy_processing' }
  },
  {
    id: 'keyboard_shortcuts',
    title: 'اختصارات لوحة المفاتيح ⌨️',
    message: 'مسافة = تشغيل/إيقاف، I = بداية المقطع، O = نهاية المقطع',
    type: 'tip',
    trigger: 'immediate',
    position: 'bottom',
    priority: 'low',
    conditions: { userLevel: 'intermediate' }
  }
];

// Smart tips manager
export class SmartTipsManager {
  private static instance: SmartTipsManager;
  private userBehavior: Map<string, number> = new Map();
  private contextHistory: string[] = [];

  static getInstance(): SmartTipsManager {
    if (!SmartTipsManager.instance) {
      SmartTipsManager.instance = new SmartTipsManager();
    }
    return SmartTipsManager.instance;
  }

  trackUserAction(action: string) {
    const count = this.userBehavior.get(action) || 0;
    this.userBehavior.set(action, count + 1);
  }

  setContext(context: string) {
    this.contextHistory.push(context);
    if (this.contextHistory.length > 10) {
      this.contextHistory.shift();
    }
  }

  getSuggestedTips(currentContext: string, userLevel: 'beginner' | 'intermediate' | 'advanced'): ContextualTip[] {
    const baseTips = defaultTips.filter(tip => 
      tip.conditions?.context === currentContext && 
      (!tip.conditions?.userLevel || tip.conditions.userLevel === userLevel)
    );

    // Add dynamic tips based on user behavior
    const dynamicTips: ContextualTip[] = [];

    // If user has been in timeline for a while without making cuts
    if (currentContext === 'timeline' && this.userBehavior.get('timeline_hover') > 10 && this.userBehavior.get('cut_made') === 0) {
      dynamicTips.push({
        id: 'cut_suggestion',
        title: 'جرب قطع المقطع! ✂️',
        message: 'اضغط على المقطع ثم استخدم أداة القطع لتقسيمه',
        type: 'tip',
        trigger: 'immediate',
        position: 'floating',
        priority: 'medium'
      });
    }

    // If user exports frequently but doesn't use filters
    if (this.userBehavior.get('export') > 3 && !this.userBehavior.get('filter_applied')) {
      dynamicTips.push({
        id: 'filter_suggestion',
        title: 'اكتشف الفلاتر المذهلة! 🎨',
        message: 'أضف فلاتر احترافية لجعل فيديوهاتك أكثر جاذبية',
        type: 'feature',
        trigger: 'immediate',
        position: 'floating',
        actionText: 'تجربة الفلاتر',
        priority: 'high'
      });
    }

    return [...baseTips, ...dynamicTips];
  }

  getUserLevel(): 'beginner' | 'intermediate' | 'advanced' {
    const totalActions = Array.from(this.userBehavior.values()).reduce((sum, count) => sum + count, 0);
    
    if (totalActions < 20) return 'beginner';
    if (totalActions < 100) return 'intermediate';
    return 'advanced';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingTip: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
  },
  topTip: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  bottomTip: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});