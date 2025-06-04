/**
 * متصفح المكتبة الموحد - Nova Edit Mobile
 * واجهة موحدة لتصفح واستخدام جميع المكتبات
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  Dimensions,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import UnifiedLibraryIntegration, {
  UnifiedSearchResult,
  LibraryType,
  LibraryRecommendation,
  UnifiedLibraryStats
} from '../services/UnifiedLibraryIntegration';
import { EffectAsset } from '../services/EffectsLibraryManager';
import { Asset } from '../services/AssetsLibraryManager';
import { AIEffect } from '../services/AIEffectsIntegration';

const { width, height } = Dimensions.get('window');

interface UnifiedLibraryBrowserProps {
  onItemSelect?: (item: any, type: LibraryType) => void;
  onDownload?: (itemId: string, type: LibraryType) => Promise<void>;
  onPreview?: (item: any, type: LibraryType) => void;
  showOnlyDownloaded?: boolean;
  showOnlyFavorites?: boolean;
  selectedCategories?: string[];
}

interface TabItem {
  id: LibraryType | 'all' | 'recommendations';
  name: string;
  icon: string;
  count?: number;
}

export default function UnifiedLibraryBrowser({
  onItemSelect,
  onDownload,
  onPreview,
  showOnlyDownloaded = false,
  showOnlyFavorites = false,
  selectedCategories = []
}: UnifiedLibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult | null>(null);
  const [recommendations, setRecommendations] = useState<LibraryRecommendation[]>([]);
  const [stats, setStats] = useState<UnifiedLibraryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const libraryManager = useMemo(() => UnifiedLibraryIntegration.getInstance(), []);

  const tabs: TabItem[] = [
    { id: 'all', name: 'الكل', icon: 'apps-outline' },
    { id: 'recommendations', name: 'المقترح', icon: 'star-outline' },
    { id: LibraryType.EFFECTS, name: 'التأثيرات', icon: 'color-filter-outline', count: stats?.effects.total },
    { id: LibraryType.AI_EFFECTS, name: 'ذكاء اصطناعي', icon: 'brain-outline', count: stats?.aiEffects.total },
    { id: LibraryType.ASSETS, name: 'الأصول', icon: 'musical-notes-outline', count: stats?.assets.total },
    { id: LibraryType.TEMPLATES, name: 'القوالب', icon: 'layers-outline' }
  ];

  useEffect(() => {
    initializeLibrary();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, activeTab, showOnlyDownloaded, showOnlyFavorites]);

  const initializeLibrary = async () => {
    try {
      setLoading(true);
      await libraryManager.initialize();
      await Promise.all([
        loadStats(),
        loadRecommendations()
      ]);
    } catch (error) {
      console.error('Failed to initialize library:', error);
      Alert.alert('خطأ', 'فشل في تحميل المكتبة');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const libraryStats = await libraryManager.getUnifiedStats();
      setStats(libraryStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await libraryManager.getSmartRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await libraryManager.unifiedSearch(searchQuery, {
        includeAI: true,
        includeTemplates: true,
        effects: showOnlyDownloaded ? { downloadedOnly: true } : undefined,
        assets: showOnlyFavorites ? { favoritesOnly: true } : undefined
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('خطأ', 'فشل في البحث');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showOnlyDownloaded, showOnlyFavorites]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadStats(),
      loadRecommendations(),
      searchQuery ? performSearch() : Promise.resolve()
    ]);
    setRefreshing(false);
  }, [searchQuery, performSearch]);

  const handleItemPress = (item: any, type: LibraryType) => {
    setSelectedItem({ item, type });
    setPreviewModalVisible(true);
  };

  const handleDownload = async (itemId: string, type: LibraryType) => {
    try {
      setLoading(true);
      await onDownload?.(itemId, type);
      await loadStats(); // تحديث الإحصائيات
      Alert.alert('نجح', 'تم التحميل بنجاح');
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('خطأ', 'فشل في التحميل');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (item: any, type: LibraryType) => {
    onPreview?.(item, type);
  };

  const handleSelect = (item: any, type: LibraryType) => {
    onItemSelect?.(item, type);
    setPreviewModalVisible(false);
  };

  const getFilteredData = () => {
    if (activeTab === 'recommendations') {
      return recommendations;
    }

    if (!searchResults) {
      return [];
    }

    switch (activeTab) {
      case LibraryType.EFFECTS:
        return searchResults.effects;
      case LibraryType.AI_EFFECTS:
        return searchResults.aiEffects;
      case LibraryType.ASSETS:
        return searchResults.assets;
      case LibraryType.TEMPLATES:
        return searchResults.templates;
      default:
        return [
          ...searchResults.effects,
          ...searchResults.aiEffects,
          ...searchResults.assets,
          ...searchResults.templates
        ];
    }
  };

  const renderSearchHeader = () => (
    <View style={styles.searchHeader}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث في المكتبة..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="options-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={18}
            color={activeTab === tab.id ? '#fff' : '#666'}
          />
          <Text style={[
            styles.tabText,
            activeTab === tab.id && styles.activeTabText
          ]}>
            {tab.name}
          </Text>
          {tab.count !== undefined && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{tab.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>إحصائيات المكتبة</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>إجمالي العناصر</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.downloadedItems}</Text>
            <Text style={styles.statLabel}>محمل</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.favoriteItems}</Text>
            <Text style={styles.statLabel}>مفضل</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Math.round(stats.totalCacheSize / 1024 / 1024)}MB
            </Text>
            <Text style={styles.statLabel}>حجم التخزين</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLibraryItem = ({ item, index }: { item: any; index: number }) => {
    const isEffect = 'category' in item && 'type' in item;
    const isAsset = 'type' in item && 'format' in item;
    const isAIEffect = 'models' in item;
    const isRecommendation = 'reason' in item;

    let type: LibraryType;
    let displayItem = item;

    if (isRecommendation) {
      type = item.type;
      displayItem = item;
    } else if (isAIEffect) {
      type = LibraryType.AI_EFFECTS;
    } else if (isAsset) {
      type = LibraryType.ASSETS;
    } else {
      type = LibraryType.EFFECTS;
    }

    const itemData = isRecommendation ? item : displayItem;

    return (
      <TouchableOpacity
        style={[styles.libraryItem, { marginRight: index % 2 === 0 ? 8 : 0 }]}
        onPress={() => handleItemPress(itemData, type)}
      >
        <Image
          source={{ uri: itemData.thumbnail || 'https://via.placeholder.com/150x150/4ECDC4/FFF?text=📁' }}
          style={styles.itemThumbnail}
          defaultSource={{ uri: 'https://via.placeholder.com/150x150/95A5A6/FFF?text=⏳' }}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.itemOverlay}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {itemData.name}
            </Text>
            
            <View style={styles.itemMeta}>
              <View style={styles.typeTag}>
                <Text style={styles.typeText}>
                  {getTypeDisplayName(type)}
                </Text>
              </View>
              
              {itemData.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {itemData.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {itemData.isDownloaded && (
          <View style={styles.downloadedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}

        {itemData.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={16} color="#FF4757" />
          </View>
        )}

        {isRecommendation && (
          <View style={styles.recommendationBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'جرب البحث بكلمات مختلفة'
          : 'ابدأ البحث للعثور على التأثيرات والأصول'
        }
      </Text>
    </View>
  );

  const renderPreviewModal = () => {
    if (!selectedItem) return null;

    const { item, type } = selectedItem;

    return (
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setPreviewModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{item.name}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            <View style={styles.itemDetails}>
              <Text style={styles.itemDescription}>
                {item.description || 'لا يوجد وصف متاح'}
              </Text>

              <View style={styles.detailsGrid}>
                <DetailRow
                  icon="person-outline"
                  label="المؤلف"
                  value={item.author || 'غير محدد'}
                />
                <DetailRow
                  icon="document-outline"
                  label="الترخيص"
                  value={item.license || 'غير محدد'}
                />
                {item.size && (
                  <DetailRow
                    icon="archive-outline"
                    label="الحجم"
                    value={`${Math.round(item.size / 1024 / 1024 * 100) / 100} MB`}
                  />
                )}
                {item.duration && (
                  <DetailRow
                    icon="time-outline"
                    label="المدة"
                    value={`${Math.round(item.duration)} ثانية`}
                  />
                )}
              </View>

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.tagsTitle}>العلامات:</Text>
                  <View style={styles.tagsList}>
                    {item.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            {!item.isDownloaded && (
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={() => handleDownload(item.id, type)}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>تحميل</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.previewButton]}
              onPress={() => handlePreview(item, type)}
            >
              <Ionicons name="play-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>معاينة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.selectButton]}
              onPress={() => handleSelect(item, type)}
            >
              <Ionicons name="checkmark-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>اختيار</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const getTypeDisplayName = (type: LibraryType): string => {
    switch (type) {
      case LibraryType.EFFECTS: return 'تأثير';
      case LibraryType.AI_EFFECTS: return 'ذكاء اصطناعي';
      case LibraryType.ASSETS: return 'أصل';
      case LibraryType.TEMPLATES: return 'قالب';
      default: return 'عنصر';
    }
  };

  const data = getFilteredData();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchHeader()}
      {renderTabs()}
      
      <FlatList
        data={data}
        renderItem={renderLibraryItem}
        keyExtractor={(item, index) => `${item.id || index}`}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListHeaderComponent={activeTab === 'all' && !searchQuery ? renderStatsCard : null}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />

      {renderPreviewModal()}
    </SafeAreaView>
  );
}

const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon as any} size={18} color="#666" />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    textAlign: 'right'
  },
  clearButton: {
    marginLeft: 8
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5'
  },
  activeTab: {
    backgroundColor: '#007AFF'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6
  },
  activeTabText: {
    color: '#fff'
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  countText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  statsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  listContainer: {
    padding: 16
  },
  libraryItem: {
    flex: 0.5,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  itemThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end'
  },
  itemInfo: {
    padding: 12
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right'
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  typeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500'
  },
  downloadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    padding: 4
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    borderRadius: 12,
    padding: 4
  },
  recommendationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 212, 0, 0.9)',
    borderRadius: 12,
    padding: 4
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  placeholder: {
    width: 40
  },
  modalContent: {
    flex: 1
  },
  previewImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f5f5f5'
  },
  itemDetails: {
    padding: 20
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'right'
  },
  detailsGrid: {
    marginBottom: 20
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 'auto'
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  tagsContainer: {
    marginTop: 16
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right'
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },
  tag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    marginBottom: 8
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500'
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    backgroundColor: '#f8f9fa'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4
  },
  downloadButton: {
    backgroundColor: '#4CAF50'
  },
  previewButton: {
    backgroundColor: '#FF9800'
  },
  selectButton: {
    backgroundColor: '#007AFF'
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8
  }
});