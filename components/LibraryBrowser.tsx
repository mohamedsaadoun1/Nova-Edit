/**
 * Library Browser Component
 * مكون استعراض مكتبة المحتوى الإبداعي
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { 
  LibraryContent, 
  SearchFilters, 
  ContentSource, 
  LicenseType,
  CategoryTree,
  Collection,
  SortOption,
  VideoTemplate,
  MusicTrack,
  SoundEffect,
  Icon,
  Font
} from '../types/library';
import { LibraryManager } from '../services/LibraryManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LibraryBrowserProps {
  onContentSelect?: (content: LibraryContent) => void;
  initialType?: LibraryContent['type'];
  initialCategory?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export default function LibraryBrowser({
  onContentSelect,
  initialType,
  initialCategory,
  showHeader = true,
  compact = false
}: LibraryBrowserProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<LibraryContent['type'] | 'all'>(initialType || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.RELEVANCE);
  const [content, setContent] = useState<LibraryContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<LibraryContent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [playingAudio, setPlayingAudio] = useState<{ id: string; sound: Audio.Sound } | null>(null);

  // Services
  const libraryManager = LibraryManager.getInstance();

  // Initialize component
  useEffect(() => {
    initializeLibrary();
  }, []);

  // Load content when filters change
  useEffect(() => {
    loadContent(true);
  }, [searchQuery, selectedType, selectedCategory, sortBy]);

  const initializeLibrary = async () => {
    try {
      setLoading(true);
      await libraryManager.initialize();
      const [categoriesData, favoritesData] = await Promise.all([
        libraryManager.getCategories(),
        libraryManager.getFavorites()
      ]);
      setCategories(categoriesData);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Failed to initialize library:', error);
      Alert.alert('Error', 'Failed to load library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (reset = false) => {
    if (loading && !reset) return;
    
    try {
      const isNewSearch = reset;
      if (isNewSearch) {
        setLoading(true);
        setPage(0);
        setContent([]);
      }

      const filters: SearchFilters = {
        query: searchQuery || undefined,
        type: selectedType === 'all' ? undefined : [selectedType],
        category: selectedCategory ? [selectedCategory] : undefined,
        sortBy,
        limit: 20,
        offset: isNewSearch ? 0 : page * 20
      };

      const result = await libraryManager.search(filters);
      
      if (isNewSearch) {
        setContent(result.items);
      } else {
        setContent(prev => [...prev, ...result.items]);
      }
      
      setHasMore(result.hasMore);
      setPage(prev => isNewSearch ? 1 : prev + 1);

    } catch (error) {
      console.error('Failed to load content:', error);
      Alert.alert('Error', 'Failed to load content. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadContent(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadContent(false);
    }
  };

  const handleContentPress = (item: LibraryContent) => {
    if (onContentSelect) {
      onContentSelect(item);
    } else {
      setSelectedContent(item);
    }
  };

  const handlePreview = async (item: LibraryContent) => {
    if (item.type === 'music' || item.type === 'sound_effect') {
      await playAudio(item);
    } else {
      setSelectedContent(item);
    }
  };

  const playAudio = async (item: LibraryContent) => {
    try {
      // Stop current audio if playing
      if (playingAudio) {
        await playingAudio.sound.unloadAsync();
        setPlayingAudio(null);
      }

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.downloadUrl },
        { shouldPlay: true, isLooping: false }
      );

      setPlayingAudio({ id: item.id, sound });

      // Auto-stop after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(null);
        }
      });

    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play audio preview');
    }
  };

  const handleDownload = async (item: LibraryContent) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [item.id]: 0 }));

      const filePath = await libraryManager.downloadContent(item.id, 'high');
      
      setDownloadProgress(prev => ({ ...prev, [item.id]: 100 }));
      
      Alert.alert('Download Complete', `Downloaded to: ${filePath}`);
      
      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        });
      }, 2000);

    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Failed', error.message);
      setDownloadProgress(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    }
  };

  const handleFavorite = async (item: LibraryContent) => {
    try {
      const isFavorite = favorites.includes(item.id);
      
      if (isFavorite) {
        await libraryManager.removeFromFavorites(item.id);
        setFavorites(prev => prev.filter(id => id !== item.id));
      } else {
        await libraryManager.addToFavorites(item.id);
        setFavorites(prev => [...prev, item.id]);
      }
    } catch (error) {
      console.error('Failed to update favorites:', error);
    }
  };

  const renderContentItem = ({ item }: { item: LibraryContent }) => {
    const isFavorite = favorites.includes(item.id);
    const isPlaying = playingAudio?.id === item.id;
    const progress = downloadProgress[item.id];

    return (
      <TouchableOpacity
        style={[
          styles.contentItem,
          compact && styles.contentItemCompact
        ]}
        onPress={() => handleContentPress(item)}
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Ionicons
                name={getContentIcon(item.type)}
                size={compact ? 20 : 30}
                color="#666"
              />
            </View>
          )}
          
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {getContentTypeLabel(item.type)}
            </Text>
          </View>

          {/* Playing indicator */}
          {isPlaying && (
            <View style={styles.playingIndicator}>
              <Ionicons name="volume-high" size={16} color="#fff" />
            </View>
          )}
        </View>

        {/* Content info */}
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.contentAuthor} numberOfLines={1}>
            by {item.author || 'Unknown'}
          </Text>

          {/* Metadata */}
          <View style={styles.metadata}>
            {item.type === 'music' || item.type === 'sound_effect' ? (
              <Text style={styles.metadataText}>
                {formatDuration((item as MusicTrack | SoundEffect).duration)}
              </Text>
            ) : null}
            
            {item.type === 'video_template' ? (
              <Text style={styles.metadataText}>
                {(item as VideoTemplate).resolution.label}
              </Text>
            ) : null}

            <Text style={styles.metadataText}>
              {formatLicense(item.license)}
            </Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Favorite button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleFavorite(item)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#ff4444" : "#666"}
            />
          </TouchableOpacity>

          {/* Preview button */}
          {(item.type === 'music' || item.type === 'sound_effect') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePreview(item)}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}

          {/* Download button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDownload(item)}
            disabled={progress !== undefined}
          >
            {progress !== undefined ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="download" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={styles.header}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates, music, sounds..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {/* Type filters */}
          {[
            { key: 'all', label: 'All' },
            { key: 'video_template', label: 'Videos' },
            { key: 'music', label: 'Music' },
            { key: 'sound_effect', label: 'Sounds' },
            { key: 'icon', label: 'Icons' },
            { key: 'font', label: 'Fonts' }
          ].map(type => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.filterButton,
                selectedType === type.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType(type.key as any)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === type.key && styles.filterButtonTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort and additional filters */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={16} color="#666" />
            <Text style={styles.sortButtonText}>
              {getSortLabel(sortBy)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.resultCount}>
            {content.length} items
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={60} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No content found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  // Helper functions
  const getContentIcon = (type: LibraryContent['type']) => {
    const icons = {
      video_template: 'videocam',
      music: 'musical-notes',
      sound_effect: 'volume-high',
      icon: 'shapes',
      sticker: 'happy',
      font: 'text'
    };
    return icons[type] || 'document';
  };

  const getContentTypeLabel = (type: LibraryContent['type']) => {
    const labels = {
      video_template: 'Video',
      music: 'Music',
      sound_effect: 'Sound',
      icon: 'Icon',
      sticker: 'Sticker',
      font: 'Font'
    };
    return labels[type] || type;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLicense = (license: LicenseType) => {
    const labels = {
      [LicenseType.CC0]: 'CC0',
      [LicenseType.CC_BY]: 'CC BY',
      [LicenseType.CC_BY_SA]: 'CC BY-SA',
      [LicenseType.PIXABAY]: 'Pixabay',
      [LicenseType.PEXELS]: 'Pexels',
      [LicenseType.CUSTOM_FREE]: 'Free',
      [LicenseType.MIT]: 'MIT',
      [LicenseType.APACHE]: 'Apache'
    };
    return labels[license] || license;
  };

  const getSortLabel = (sort: SortOption) => {
    const labels = {
      [SortOption.RELEVANCE]: 'Relevance',
      [SortOption.NEWEST]: 'Newest',
      [SortOption.OLDEST]: 'Oldest',
      [SortOption.DOWNLOADS]: 'Popular',
      [SortOption.RATING]: 'Rating',
      [SortOption.TITLE]: 'Title',
      [SortOption.DURATION]: 'Duration',
      [SortOption.FILE_SIZE]: 'Size'
    };
    return labels[sort] || sort;
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {renderHeader()}
      
      <FlatList
        data={content}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        numColumns={compact ? 2 : 1}
        contentContainerStyle={styles.contentList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : null
        }
      />

      {/* Content Detail Modal */}
      <Modal
        visible={selectedContent !== null}
        animationType="slide"
        onRequestClose={() => setSelectedContent(null)}
      >
        {selectedContent && (
          <ContentDetailModal
            content={selectedContent}
            onClose={() => setSelectedContent(null)}
            onDownload={() => handleDownload(selectedContent)}
            onFavorite={() => handleFavorite(selectedContent)}
            isFavorite={favorites.includes(selectedContent.id)}
          />
        )}
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <FiltersModal
          categories={categories}
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortBy}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
    </View>
  );
}

// Additional modal components would be implemented separately
const ContentDetailModal = ({ content, onClose, onDownload, onFavorite, isFavorite }: any) => (
  <View style={styles.modalContainer}>
    <Text>Content Detail Modal - {content.title}</Text>
    <TouchableOpacity onPress={onClose}>
      <Text>Close</Text>
    </TouchableOpacity>
  </View>
);

const FiltersModal = ({ categories, selectedCategory, sortBy, onCategoryChange, onSortChange, onClose }: any) => (
  <View style={styles.modalContainer}>
    <Text>Filters Modal</Text>
    <TouchableOpacity onPress={onClose}>
      <Text>Close</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  containerCompact: {
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  filtersScroll: {
    marginBottom: 12
  },
  filtersContainer: {
    paddingRight: 16
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20
  },
  filterButtonActive: {
    backgroundColor: '#007AFF'
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666'
  },
  filterButtonTextActive: {
    color: '#fff'
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  sortButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666'
  },
  resultCount: {
    fontSize: 14,
    color: '#666'
  },
  contentList: {
    padding: 16
  },
  contentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  contentItemCompact: {
    flex: 1,
    margin: 6,
    flexDirection: 'column'
  },
  thumbnailContainer: {
    position: 'relative'
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0'
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  typeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold'
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 2
  },
  contentInfo: {
    flex: 1,
    marginLeft: 12
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  contentAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 8
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
    marginRight: 12
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2
  },
  tagText: {
    fontSize: 10,
    color: '#666'
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 40
  },
  actionButton: {
    padding: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  }
});