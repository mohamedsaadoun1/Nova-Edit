/**
 * Hook للمكتبة الموحدة - Nova Edit Mobile
 * إدارة مبسطة وموحدة لجميع مكتبات التأثيرات والأصول
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import UnifiedLibraryIntegration, {
  UnifiedSearchResult,
  LibraryType,
  LibraryRecommendation,
  UnifiedLibraryStats,
  ProjectAnalysis,
  UsageAnalytics,
  ProcessingSettings
} from '../services/UnifiedLibraryIntegration';
import { EffectAsset, EffectSearchFilter } from '../services/EffectsLibraryManager';
import { Asset, AssetSearchFilter, MusicTemplate } from '../services/AssetsLibraryManager';
import { AIEffect, ProcessingResult } from '../services/AIEffectsIntegration';
import { ProcessingFrame } from '../services/AIProcessingService';

export interface UseUnifiedLibraryOptions {
  autoInitialize?: boolean;
  enableRealTimePreview?: boolean;
  cacheResults?: boolean;
  maxCacheSize?: number;
}

export interface LibrarySearchOptions {
  query?: string;
  type?: LibraryType;
  includeAI?: boolean;
  includeTemplates?: boolean;
  filters?: {
    effects?: EffectSearchFilter;
    assets?: AssetSearchFilter;
  };
  limit?: number;
  offset?: number;
}

export interface DownloadProgress {
  itemId: string;
  type: LibraryType;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

export interface LibraryState {
  isInitialized: boolean;
  isLoading: boolean;
  searchResults: UnifiedSearchResult | null;
  recommendations: LibraryRecommendation[];
  stats: UnifiedLibraryStats | null;
  downloadQueue: DownloadProgress[];
  processingSettings: ProcessingSettings | null;
  error: string | null;
}

export function useUnifiedLibrary(options: UseUnifiedLibraryOptions = {}) {
  const {
    autoInitialize = true,
    enableRealTimePreview = false,
    cacheResults = true,
    maxCacheSize = 100
  } = options;

  // الحالة الأساسية
  const [state, setState] = useState<LibraryState>({
    isInitialized: false,
    isLoading: false,
    searchResults: null,
    recommendations: [],
    stats: null,
    downloadQueue: [],
    processingSettings: null,
    error: null
  });

  // التخزين المؤقت للنتائج
  const [searchCache] = useState<Map<string, UnifiedSearchResult>>(new Map());
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  // مدير المكتبة
  const libraryManager = useMemo(() => UnifiedLibraryIntegration.getInstance(), []);

  // تهيئة المكتبة
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await libraryManager.initialize();
      
      // تحميل البيانات الأولية
      const [stats, recommendations, processingSettings] = await Promise.all([
        libraryManager.getUnifiedStats(),
        libraryManager.getSmartRecommendations(),
        libraryManager.optimizeForDevice()
      ]);

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        stats,
        recommendations,
        processingSettings
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'فشل في التهيئة'
      }));
    }
  }, [state.isInitialized, state.isLoading, libraryManager]);

  // البحث الموحد
  const search = useCallback(async (searchOptions: LibrarySearchOptions) => {
    const {
      query = '',
      type,
      includeAI = true,
      includeTemplates = true,
      filters,
      limit = 50,
      offset = 0
    } = searchOptions;

    // إنشاء مفتاح التخزين المؤقت
    const cacheKey = JSON.stringify({ query, type, includeAI, includeTemplates, filters, limit, offset });
    
    // فحص التخزين المؤقت
    if (cacheResults && searchCache.has(cacheKey)) {
      const cachedResult = searchCache.get(cacheKey)!;
      setState(prev => ({ ...prev, searchResults: cachedResult }));
      return cachedResult;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = await libraryManager.unifiedSearch(query, {
        includeAI,
        includeTemplates,
        effects: filters?.effects,
        assets: filters?.assets
      }, limit);

      // تحديث التخزين المؤقت
      if (cacheResults) {
        // تنظيف التخزين المؤقت إذا وصل للحد الأقصى
        if (searchCache.size >= maxCacheSize) {
          const firstKey = searchCache.keys().next().value;
          searchCache.delete(firstKey);
        }
        searchCache.set(cacheKey, results);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        searchResults: results
      }));

      setLastSearchQuery(query);
      return results;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'فشل في البحث'
      }));
      return null;
    }
  }, [cacheResults, maxCacheSize, searchCache, libraryManager]);

  // البحث السريع (مع debounce)
  const quickSearch = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        search({ query });
      } else {
        setState(prev => ({ ...prev, searchResults: null }));
      }
    }, 300),
    [search]
  );

  // تحميل عنصر
  const downloadItem = useCallback(async (itemId: string, type: LibraryType) => {
    // إضافة للطابور
    const downloadProgress: DownloadProgress = {
      itemId,
      type,
      progress: 0,
      status: 'pending'
    };

    setState(prev => ({
      ...prev,
      downloadQueue: [...prev.downloadQueue, downloadProgress]
    }));

    try {
      // تحديث الحالة إلى "يتم التحميل"
      setState(prev => ({
        ...prev,
        downloadQueue: prev.downloadQueue.map(item =>
          item.itemId === itemId ? { ...item, status: 'downloading' as const } : item
        )
      }));

      // تنفيذ التحميل الفعلي
      let downloadPath: string;
      
      switch (type) {
        case LibraryType.EFFECTS:
          const effectsManager = (libraryManager as any).effectsManager;
          downloadPath = await effectsManager.downloadEffect(itemId);
          break;
          
        case LibraryType.ASSETS:
          const assetsManager = (libraryManager as any).assetsManager;
          downloadPath = await assetsManager.downloadAsset(itemId);
          break;
          
        default:
          throw new Error(`Download not supported for type: ${type}`);
      }

      // تحديث الحالة إلى "مكتمل"
      setState(prev => ({
        ...prev,
        downloadQueue: prev.downloadQueue.map(item =>
          item.itemId === itemId 
            ? { ...item, status: 'completed' as const, progress: 100 }
            : item
        )
      }));

      // تحديث الإحصائيات
      const updatedStats = await libraryManager.getUnifiedStats();
      setState(prev => ({ ...prev, stats: updatedStats }));

      return downloadPath;

    } catch (error) {
      // تحديث الحالة إلى "خطأ"
      setState(prev => ({
        ...prev,
        downloadQueue: prev.downloadQueue.map(item =>
          item.itemId === itemId 
            ? { 
                ...item, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'فشل في التحميل'
              }
            : item
        )
      }));
      
      throw error;
    }
  }, [libraryManager]);

  // تطبيق تأثير أو أصل
  const applyItem = useCallback(async (
    itemId: string, 
    itemType: LibraryType, 
    frame: ProcessingFrame, 
    parameters?: any
  ): Promise<ProcessingResult> => {
    try {
      const result = await libraryManager.applyLibraryItem(itemId, itemType, frame, parameters);
      
      // تحديث الإحصائيات
      const updatedStats = await libraryManager.getUnifiedStats();
      setState(prev => ({ ...prev, stats: updatedStats }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في تطبيق العنصر'
      }));
      throw error;
    }
  }, [libraryManager]);

  // تحليل المشروع
  const analyzeProject = useCallback(async (projectData: any): Promise<ProjectAnalysis> => {
    try {
      const analysis = await libraryManager.analyzeProject(projectData);
      return analysis;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في تحليل المشروع'
      }));
      throw error;
    }
  }, [libraryManager]);

  // الحصول على توصيات ذكية
  const getRecommendations = useCallback(async (context?: any): Promise<LibraryRecommendation[]> => {
    try {
      const recommendations = await libraryManager.getSmartRecommendations(context);
      setState(prev => ({ ...prev, recommendations }));
      return recommendations;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في الحصول على التوصيات'
      }));
      return [];
    }
  }, [libraryManager]);

  // تنظيف التخزين المؤقت
  const clearCache = useCallback(async () => {
    try {
      await libraryManager.clearAllCaches();
      searchCache.clear();
      
      const updatedStats = await libraryManager.getUnifiedStats();
      setState(prev => ({ ...prev, stats: updatedStats }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في تنظيف التخزين المؤقت'
      }));
    }
  }, [libraryManager, searchCache]);

  // إزالة عنصر من طابور التحميل
  const removeFromDownloadQueue = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      downloadQueue: prev.downloadQueue.filter(item => item.itemId !== itemId)
    }));
  }, []);

  // الحصول على إحصائيات الاستخدام
  const getUsageAnalytics = useCallback(async (): Promise<UsageAnalytics | null> => {
    try {
      // هذه الدالة ستحتاج للتنفيذ في UnifiedLibraryIntegration
      return null; // مؤقتاً
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في الحصول على الإحصائيات'
      }));
      return null;
    }
  }, []);

  // تصدير/استيراد بيانات المستخدم
  const exportUserData = useCallback(async (): Promise<string> => {
    try {
      return await libraryManager.exportUserData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في تصدير البيانات'
      }));
      throw error;
    }
  }, [libraryManager]);

  const importUserData = useCallback(async (userData: string): Promise<void> => {
    try {
      await libraryManager.importUserData(userData);
      
      // إعادة تحميل البيانات
      const [stats, recommendations] = await Promise.all([
        libraryManager.getUnifiedStats(),
        libraryManager.getSmartRecommendations()
      ]);
      
      setState(prev => ({ ...prev, stats, recommendations }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في استيراد البيانات'
      }));
      throw error;
    }
  }, [libraryManager]);

  // مسح الخطأ
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // تحديث الإعدادات
  const updateProcessingSettings = useCallback(async (settings: Partial<ProcessingSettings>) => {
    try {
      const currentSettings = state.processingSettings || await libraryManager.optimizeForDevice();
      const newSettings = { ...currentSettings, ...settings };
      
      // حفظ الإعدادات (سيتم تنفيذ هذا في UnifiedLibraryIntegration)
      setState(prev => ({ ...prev, processingSettings: newSettings }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'فشل في تحديث الإعدادات'
      }));
    }
  }, [state.processingSettings, libraryManager]);

  // التهيئة التلقائية
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, state.isLoading, initialize]);

  // واجهة الإرجاع
  return {
    // الحالة
    ...state,
    
    // الدوال الأساسية
    initialize,
    search,
    quickSearch,
    downloadItem,
    applyItem,
    
    // التحليل والتوصيات
    analyzeProject,
    getRecommendations,
    
    // إدارة التخزين المؤقت
    clearCache,
    
    // إدارة طابور التحميل
    removeFromDownloadQueue,
    
    // الإحصائيات والتحليلات
    getUsageAnalytics,
    
    // إدارة البيانات
    exportUserData,
    importUserData,
    
    // إدارة الإعدادات
    updateProcessingSettings,
    
    // مساعد
    clearError,
    
    // خصائص مفيدة
    hasSearchResults: !!state.searchResults && state.searchResults.total > 0,
    isDownloading: state.downloadQueue.some(item => item.status === 'downloading'),
    downloadProgress: state.downloadQueue.reduce((acc, item) => {
      if (item.status === 'downloading') {
        acc[item.itemId] = item.progress;
      }
      return acc;
    }, {} as { [key: string]: number }),
    
    // الإحصائيات المختصرة
    totalItems: state.stats?.totalItems || 0,
    downloadedItems: state.stats?.downloadedItems || 0,
    favoriteItems: state.stats?.favoriteItems || 0,
    cacheSize: state.stats?.totalCacheSize || 0
  };
}

// دالة مساعدة للتأخير (debounce)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default useUnifiedLibrary;