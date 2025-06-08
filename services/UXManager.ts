import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmartTipsManager, ContextualTip } from '../components/ContextualTips';

interface UserProfile {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  joinDate: Date;
  totalProjects: number;
  featuresUsed: string[];
  preferredTheme: 'dark' | 'light' | 'auto';
  language: 'ar' | 'en';
  helpInteractions: number;
  tutorialCompleted: boolean;
  onboardingCompleted: boolean;
  lastActiveDate: Date;
  usageStats: UserUsageStats;
}

interface UserUsageStats {
  totalVideoEditTime: number; // in minutes
  averageProjectDuration: number; // in minutes
  mostUsedFeatures: { [feature: string]: number };
  exportCount: number;
  aiFeatureUsage: number;
  helpRequestCount: number;
  crashCount: number;
  performanceIssues: number;
}

interface UIPersonalization {
  theme: 'dark' | 'light' | 'auto';
  accentColor: string;
  toolbarLayout: 'standard' | 'compact' | 'pro';
  enableAnimations: boolean;
  enableHaptics: boolean;
  autoShowTips: boolean;
  enableSmartSuggestions: boolean;
  tutorialMode: boolean;
}

interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  totalSteps: number;
  startedAt: Date;
  lastInteraction: Date;
}

interface AnalyticsEvent {
  id: string;
  type: 'feature_used' | 'error_occurred' | 'help_requested' | 'tutorial_step' | 'performance_issue';
  data: any;
  timestamp: Date;
  context?: string;
  userLevel?: string;
}

class UXManager {
  private static instance: UXManager;
  private userProfile: UserProfile | null = null;
  private uiPersonalization: UIPersonalization | null = null;
  private tutorialProgress: TutorialProgress | null = null;
  private smartTipsManager: SmartTipsManager;
  private analyticsQueue: AnalyticsEvent[] = [];
  private isInitialized = false;

  private constructor() {
    this.smartTipsManager = SmartTipsManager.getInstance();
  }

  static getInstance(): UXManager {
    if (!UXManager.instance) {
      UXManager.instance = new UXManager();
    }
    return UXManager.instance;
  }

  // Initialization
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        this.loadUserProfile(),
        this.loadUIPersonalization(),
        this.loadTutorialProgress(),
        this.loadAnalyticsQueue()
      ]);

      // Setup automatic save intervals
      this.setupAutoSave();
      
      // Track app start
      this.trackEvent('app_started', {
        userLevel: this.userProfile?.level,
        theme: this.uiPersonalization?.theme
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize UXManager:', error);
      // Create default profile if loading fails
      await this.createDefaultProfile();
      this.isInitialized = true;
    }
  }

  // User Profile Management
  async createDefaultProfile(): Promise<UserProfile> {
    const defaultProfile: UserProfile = {
      id: Date.now().toString(),
      level: 'beginner',
      joinDate: new Date(),
      totalProjects: 0,
      featuresUsed: [],
      preferredTheme: 'dark',
      language: 'ar',
      helpInteractions: 0,
      tutorialCompleted: false,
      onboardingCompleted: false,
      lastActiveDate: new Date(),
      usageStats: {
        totalVideoEditTime: 0,
        averageProjectDuration: 0,
        mostUsedFeatures: {},
        exportCount: 0,
        aiFeatureUsage: 0,
        helpRequestCount: 0,
        crashCount: 0,
        performanceIssues: 0
      }
    };

    this.userProfile = defaultProfile;
    await this.saveUserProfile();
    return defaultProfile;
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem('nova_edit_user_profile');
      if (stored) {
        this.userProfile = {
          ...JSON.parse(stored),
          joinDate: new Date(JSON.parse(stored).joinDate),
          lastActiveDate: new Date(JSON.parse(stored).lastActiveDate)
        };
        
        // Update last active date
        this.userProfile.lastActiveDate = new Date();
        await this.saveUserProfile();
        
        return this.userProfile;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
    return null;
  }

  async saveUserProfile(): Promise<void> {
    if (!this.userProfile) return;
    
    try {
      await AsyncStorage.setItem('nova_edit_user_profile', JSON.stringify(this.userProfile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  // UI Personalization
  async loadUIPersonalization(): Promise<UIPersonalization> {
    try {
      const stored = await AsyncStorage.getItem('nova_edit_ui_personalization');
      if (stored) {
        this.uiPersonalization = JSON.parse(stored);
        return this.uiPersonalization!;
      }
    } catch (error) {
      console.error('Failed to load UI personalization:', error);
    }

    // Create default personalization
    this.uiPersonalization = {
      theme: this.userProfile?.preferredTheme || 'dark',
      accentColor: '#007AFF',
      toolbarLayout: 'standard',
      enableAnimations: true,
      enableHaptics: true,
      autoShowTips: true,
      enableSmartSuggestions: true,
      tutorialMode: this.userProfile?.level === 'beginner'
    };

    await this.saveUIPersonalization();
    return this.uiPersonalization;
  }

  async saveUIPersonalization(): Promise<void> {
    if (!this.uiPersonalization) return;
    
    try {
      await AsyncStorage.setItem('nova_edit_ui_personalization', JSON.stringify(this.uiPersonalization));
    } catch (error) {
      console.error('Failed to save UI personalization:', error);
    }
  }

  async updateUIPersonalization(updates: Partial<UIPersonalization>): Promise<void> {
    if (!this.uiPersonalization) {
      await this.loadUIPersonalization();
    }

    this.uiPersonalization = { ...this.uiPersonalization!, ...updates };
    await this.saveUIPersonalization();

    this.trackEvent('ui_personalization_changed', updates);
  }

  // Tutorial Management
  async loadTutorialProgress(): Promise<TutorialProgress | null> {
    try {
      const stored = await AsyncStorage.getItem('nova_edit_tutorial_progress');
      if (stored) {
        this.tutorialProgress = {
          ...JSON.parse(stored),
          startedAt: new Date(JSON.parse(stored).startedAt),
          lastInteraction: new Date(JSON.parse(stored).lastInteraction)
        };
        return this.tutorialProgress;
      }
    } catch (error) {
      console.error('Failed to load tutorial progress:', error);
    }
    return null;
  }

  async saveTutorialProgress(): Promise<void> {
    if (!this.tutorialProgress) return;
    
    try {
      await AsyncStorage.setItem('nova_edit_tutorial_progress', JSON.stringify(this.tutorialProgress));
    } catch (error) {
      console.error('Failed to save tutorial progress:', error);
    }
  }

  async startTutorial(totalSteps: number): Promise<void> {
    this.tutorialProgress = {
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      totalSteps,
      startedAt: new Date(),
      lastInteraction: new Date()
    };

    await this.saveTutorialProgress();
    this.trackEvent('tutorial_started', { totalSteps });
  }

  async completeTutorialStep(stepId: string): Promise<void> {
    if (!this.tutorialProgress) return;

    this.tutorialProgress.completedSteps.push(stepId);
    this.tutorialProgress.currentStep++;
    this.tutorialProgress.lastInteraction = new Date();

    await this.saveTutorialProgress();
    this.trackEvent('tutorial_step_completed', { stepId, currentStep: this.tutorialProgress.currentStep });

    // Update user level based on tutorial progress
    if (this.tutorialProgress.currentStep >= this.tutorialProgress.totalSteps) {
      await this.updateUserLevel('intermediate');
      
      if (this.userProfile) {
        this.userProfile.tutorialCompleted = true;
        await this.saveUserProfile();
      }
    }
  }

  async skipTutorialStep(stepId: string): Promise<void> {
    if (!this.tutorialProgress) return;

    this.tutorialProgress.skippedSteps.push(stepId);
    this.tutorialProgress.currentStep++;
    this.tutorialProgress.lastInteraction = new Date();

    await this.saveTutorialProgress();
    this.trackEvent('tutorial_step_skipped', { stepId });
  }

  // Feature Usage Tracking
  async trackFeatureUsage(featureName: string, context?: string): Promise<void> {
    if (!this.userProfile) return;

    // Update user profile
    if (!this.userProfile.featuresUsed.includes(featureName)) {
      this.userProfile.featuresUsed.push(featureName);
    }

    // Update usage stats
    this.userProfile.usageStats.mostUsedFeatures[featureName] = 
      (this.userProfile.usageStats.mostUsedFeatures[featureName] || 0) + 1;

    // Track AI feature usage specifically
    if (featureName.includes('ai_') || featureName.includes('smart_')) {
      this.userProfile.usageStats.aiFeatureUsage++;
    }

    await this.saveUserProfile();

    // Track with smart tips manager
    this.smartTipsManager.trackUserAction(featureName);
    if (context) {
      this.smartTipsManager.setContext(context);
    }

    this.trackEvent('feature_used', { featureName, context });

    // Auto-level progression
    await this.checkLevelProgression();
  }

  // Smart Tips Integration
  getContextualTips(context: string): ContextualTip[] {
    if (!this.userProfile || !this.uiPersonalization?.enableSmartSuggestions) {
      return [];
    }

    return this.smartTipsManager.getSuggestedTips(context, this.userProfile.level);
  }

  // User Level Management
  async updateUserLevel(newLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<void> {
    if (!this.userProfile || this.userProfile.level === newLevel) return;

    const oldLevel = this.userProfile.level;
    this.userProfile.level = newLevel;
    
    await this.saveUserProfile();

    this.trackEvent('user_level_changed', { oldLevel, newLevel });

    // Update UI personalization based on new level
    if (this.uiPersonalization) {
      this.uiPersonalization.tutorialMode = newLevel === 'beginner';
      await this.saveUIPersonalization();
    }
  }

  private async checkLevelProgression(): Promise<void> {
    if (!this.userProfile) return;

    const { totalProjects, featuresUsed, usageStats } = this.userProfile;
    const uniqueFeaturesUsed = featuresUsed.length;
    const totalUsageTime = usageStats.totalVideoEditTime;

    // Level progression logic
    if (this.userProfile.level === 'beginner') {
      if (totalProjects >= 3 && uniqueFeaturesUsed >= 5 && totalUsageTime >= 30) {
        await this.updateUserLevel('intermediate');
      }
    } else if (this.userProfile.level === 'intermediate') {
      if (totalProjects >= 10 && uniqueFeaturesUsed >= 15 && usageStats.aiFeatureUsage >= 5) {
        await this.updateUserLevel('advanced');
      }
    }
  }

  // Analytics and Events
  trackEvent(type: AnalyticsEvent['type'], data: any, context?: string): void {
    const event: AnalyticsEvent = {
      id: Date.now().toString() + Math.random(),
      type,
      data,
      timestamp: new Date(),
      context,
      userLevel: this.userProfile?.level
    };

    this.analyticsQueue.push(event);

    // Keep queue size manageable
    if (this.analyticsQueue.length > 1000) {
      this.analyticsQueue = this.analyticsQueue.slice(-800);
    }

    // Auto-save analytics periodically
    if (this.analyticsQueue.length % 50 === 0) {
      this.saveAnalyticsQueue();
    }
  }

  async loadAnalyticsQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('nova_edit_analytics_queue');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.analyticsQueue = parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load analytics queue:', error);
      this.analyticsQueue = [];
    }
  }

  async saveAnalyticsQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('nova_edit_analytics_queue', JSON.stringify(this.analyticsQueue));
    } catch (error) {
      console.error('Failed to save analytics queue:', error);
    }
  }

  // Help System Integration
  async requestHelp(query: string, category?: string): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile.helpInteractions++;
    this.userProfile.usageStats.helpRequestCount++;
    
    await this.saveUserProfile();

    this.trackEvent('help_requested', { query, category });
  }

  // Performance Monitoring
  reportPerformanceIssue(type: 'crash' | 'slow_render' | 'memory_warning', details: any): void {
    if (!this.userProfile) return;

    if (type === 'crash') {
      this.userProfile.usageStats.crashCount++;
    } else {
      this.userProfile.usageStats.performanceIssues++;
    }

    this.saveUserProfile();
    this.trackEvent('performance_issue', { type, details });
  }

  // Export/Import Settings
  async exportUserData(): Promise<string> {
    const data = {
      userProfile: this.userProfile,
      uiPersonalization: this.uiPersonalization,
      tutorialProgress: this.tutorialProgress,
      analyticsQueue: this.analyticsQueue.slice(-100) // Last 100 events only
    };

    return JSON.stringify(data, null, 2);
  }

  async importUserData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userProfile) {
        this.userProfile = {
          ...data.userProfile,
          joinDate: new Date(data.userProfile.joinDate),
          lastActiveDate: new Date()
        };
        await this.saveUserProfile();
      }

      if (data.uiPersonalization) {
        this.uiPersonalization = data.uiPersonalization;
        await this.saveUIPersonalization();
      }

      if (data.tutorialProgress) {
        this.tutorialProgress = {
          ...data.tutorialProgress,
          startedAt: new Date(data.tutorialProgress.startedAt),
          lastInteraction: new Date(data.tutorialProgress.lastInteraction)
        };
        await this.saveTutorialProgress();
      }

      this.trackEvent('user_data_imported', { hasProfile: !!data.userProfile });
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  // Auto-save setup
  private setupAutoSave(): void {
    // Save data every 5 minutes
    setInterval(async () => {
      await Promise.all([
        this.saveUserProfile(),
        this.saveUIPersonalization(),
        this.saveTutorialProgress(),
        this.saveAnalyticsQueue()
      ]);
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Getters
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  getUIPersonalization(): UIPersonalization | null {
    return this.uiPersonalization;
  }

  getTutorialProgress(): TutorialProgress | null {
    return this.tutorialProgress;
  }

  getAnalytics(): AnalyticsEvent[] {
    return [...this.analyticsQueue];
  }

  // Reset methods (for testing/debugging)
  async resetUserData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem('nova_edit_user_profile'),
      AsyncStorage.removeItem('nova_edit_ui_personalization'),
      AsyncStorage.removeItem('nova_edit_tutorial_progress'),
      AsyncStorage.removeItem('nova_edit_analytics_queue')
    ]);

    this.userProfile = null;
    this.uiPersonalization = null;
    this.tutorialProgress = null;
    this.analyticsQueue = [];
    this.isInitialized = false;

    await this.initialize();
  }
}

export default UXManager;