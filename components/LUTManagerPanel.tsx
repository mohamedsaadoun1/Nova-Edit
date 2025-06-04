/**
 * LUT Manager Panel Component
 * Professional LUT management and application interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LUTManager, LUTMetadata, LUTLibraryItem } from '../services/LUTManager';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  videoElement?: HTMLVideoElement;
  onLUTApplied: (lutId: string, strength: number) => void;
}

export const LUTManagerPanel: React.FC<Props> = ({
  visible,
  onClose,
  videoElement,
  onLUTApplied,
}) => {
  const [lutManager] = useState(() => new LUTManager());
  const [activeLUT, setActiveLUT] = useState<string | null>(null);
  const [lutStrength, setLutStrength] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'rating'>('name');
  const [isLoading, setIsLoading] = useState(false);
  
  // LUT library
  const [availableLUTs, setAvailableLUTs] = useState<LUTLibraryItem[]>([]);
  const [filteredLUTs, setFilteredLUTs] = useState<LUTLibraryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Categories
  const categories = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'cinematic', label: 'Cinematic', icon: 'film-outline' },
    { key: 'portrait', label: 'Portrait', icon: 'person-outline' },
    { key: 'landscape', label: 'Landscape', icon: 'image-outline' },
    { key: 'vintage', label: 'Vintage', icon: 'time-outline' },
    { key: 'creative', label: 'Creative', icon: 'color-palette-outline' },
    { key: 'technical', label: 'Technical', icon: 'settings-outline' },
    { key: 'favorites', label: 'Favorites', icon: 'heart' },
  ];

  // Load LUTs
  useEffect(() => {
    loadLUTs();
  }, []);

  // Filter LUTs based on search and category
  useEffect(() => {
    let filtered = availableLUTs;

    // Filter by category
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(lut => favorites.has(lut.id));
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(lut => lut.metadata.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lut => 
        lut.metadata.name.toLowerCase().includes(query) ||
        lut.metadata.description?.toLowerCase().includes(query) ||
        lut.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
        default:
          return a.metadata.name.localeCompare(b.metadata.name);
      }
    });

    setFilteredLUTs(filtered);
  }, [availableLUTs, searchQuery, selectedCategory, sortBy, favorites]);

  const loadLUTs = async () => {
    setIsLoading(true);
    try {
      const luts = await lutManager.getAvailableLUTs();
      setAvailableLUTs(luts);
      
      // Load favorites from storage
      const favoriteIds = await lutManager.getFavorites();
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.error('Failed to load LUTs:', error);
      Alert.alert('Error', 'Failed to load LUT library');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply LUT
  const applyLUT = useCallback(async (lutId: string) => {
    if (!videoElement) return;

    try {
      await lutManager.applyLUT(videoElement, lutId, lutStrength / 100);
      setActiveLUT(lutId);
      onLUTApplied(lutId, lutStrength);
      
      // Update usage statistics
      await lutManager.incrementUsageCount(lutId);
      
    } catch (error) {
      console.error('Failed to apply LUT:', error);
      Alert.alert('Error', 'Failed to apply LUT');
    }
  }, [lutManager, videoElement, lutStrength, onLUTApplied]);

  // Remove LUT
  const removeLUT = useCallback(async (lutId: string) => {
    if (activeLUT === lutId) {
      setActiveLUT(null);
      if (videoElement) {
        await lutManager.removeLUT(videoElement);
      }
    }
  }, [lutManager, videoElement, activeLUT]);

  // Import LUT
  const importLUT = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setIsLoading(true);
        
        try {
          await lutManager.importLUT(file.uri, file.name);
          await loadLUTs();
          Alert.alert('Success', 'LUT imported successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to import LUT. Please check the file format.');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to import LUT:', error);
      Alert.alert('Error', 'Failed to import LUT');
    }
  }, [lutManager]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (lutId: string) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(lutId)) {
      newFavorites.delete(lutId);
      await lutManager.removeFromFavorites(lutId);
    } else {
      newFavorites.add(lutId);
      await lutManager.addToFavorites(lutId);
    }
    setFavorites(newFavorites);
  }, [favorites, lutManager]);

  // Rate LUT
  const rateLUT = useCallback(async (lutId: string, rating: number) => {
    try {
      await lutManager.rateLUT(lutId, rating);
      await loadLUTs();
    } catch (error) {
      console.error('Failed to rate LUT:', error);
    }
  }, [lutManager]);

  // LUT Item Component
  const LUTItem: React.FC<{ item: LUTLibraryItem }> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.lutItem,
        activeLUT === item.id && styles.activeLUTItem,
      ]}
      onPress={() => applyLUT(item.id)}
    >
      {item.metadata.thumbnail && (
        <Image 
          source={{ uri: item.metadata.thumbnail }} 
          style={styles.lutThumbnail} 
        />
      )}
      
      <View style={styles.lutInfo}>
        <Text style={styles.lutName} numberOfLines={1}>
          {item.metadata.name}
        </Text>
        
        {item.metadata.description && (
          <Text style={styles.lutDescription} numberOfLines={2}>
            {item.metadata.description}
          </Text>
        )}
        
        <View style={styles.lutMeta}>
          <View style={styles.lutCategory}>
            <Text style={styles.lutCategoryText}>
              {item.metadata.category}
            </Text>
          </View>
          
          <View style={styles.lutStats}>
            {item.rating && (
              <View style={styles.ratingContainer}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < item.rating! ? 'star' : 'star-outline'}
                    size={12}
                    color="#FFD700"
                  />
                ))}
              </View>
            )}
            
            <Text style={styles.usageCount}>
              {item.usageCount} uses
            </Text>
          </View>
        </View>
        
        <View style={styles.lutTags}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.lutTag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
      
      <View style={styles.lutActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons
            name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
            size={16}
            color={favorites.has(item.id) ? '#FF3B30' : '#999'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Show rating modal
            Alert.alert(
              'Rate LUT',
              'How would you rate this LUT?',
              Array.from({ length: 5 }).map((_, i) => ({
                text: `${i + 1} Star${i > 0 ? 's' : ''}`,
                onPress: () => rateLUT(item.id, i + 1),
              })).concat([{ text: 'Cancel', style: 'cancel' }])
            );
          }}
        >
          <Ionicons name="star-outline" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>LUT Manager</Text>
          <TouchableOpacity onPress={importLUT} style={styles.importButton}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Strength Control */}
        <View style={styles.strengthContainer}>
          <Text style={styles.strengthLabel}>LUT Strength</Text>
          <Slider
            style={styles.strengthSlider}
            minimumValue={0}
            maximumValue={100}
            value={lutStrength}
            onValueChange={setLutStrength}
            onSlidingComplete={() => {
              if (activeLUT && videoElement) {
                applyLUT(activeLUT);
              }
            }}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.strengthValue}>{Math.round(lutStrength)}%</Text>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search LUTs..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortText, sortBy === 'name' && styles.activeSortText]}>
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'recent' && styles.activeSortButton]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={[styles.sortText, sortBy === 'recent' && styles.activeSortText]}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'rating' && styles.activeSortButton]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.sortText, sortBy === 'rating' && styles.activeSortText]}>
                Rating
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.activeCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.key ? '#007AFF' : '#999'}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.activeCategoryText,
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LUT List */}
        <View style={styles.lutListContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading LUTs...</Text>
            </View>
          ) : filteredLUTs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="color-filter-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No LUTs found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Import LUTs to get started'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredLUTs}
              renderItem={({ item }) => <LUTItem item={item} />}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.lutList}
            />
          )}
        </View>

        {/* Active LUT Info */}
        {activeLUT && (
          <View style={styles.activeLUTContainer}>
            <Text style={styles.activeLUTText}>
              Active: {availableLUTs.find(l => l.id === activeLUT)?.metadata.name}
            </Text>
            <TouchableOpacity
              style={styles.removeLUTButton}
              onPress={() => removeLUT(activeLUT)}
            >
              <Text style={styles.removeLUTText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
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
  importButton: {
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  strengthLabel: {
    color: '#FFF',
    fontSize: 14,
    width: 80,
  },
  strengthSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 15,
  },
  strengthValue: {
    color: '#999',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#222',
    borderRadius: 6,
  },
  activeSortButton: {
    backgroundColor: '#007AFF',
  },
  sortText: {
    color: '#999',
    fontSize: 12,
  },
  activeSortText: {
    color: '#FFF',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#222',
    borderRadius: 8,
    gap: 6,
  },
  activeCategoryButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  categoryText: {
    color: '#999',
    fontSize: 12,
  },
  activeCategoryText: {
    color: '#007AFF',
  },
  lutListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  lutList: {
    padding: 20,
  },
  lutItem: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  activeLUTItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  lutThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: '#333',
  },
  lutInfo: {
    flex: 1,
    padding: 12,
  },
  lutName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  lutDescription: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  lutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lutCategory: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lutCategoryText: {
    color: '#999',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  lutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  usageCount: {
    color: '#666',
    fontSize: 10,
  },
  lutTags: {
    flexDirection: 'row',
    gap: 4,
  },
  lutTag: {
    color: '#666',
    fontSize: 10,
    backgroundColor: '#222',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  lutActions: {
    padding: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    borderRadius: 6,
  },
  activeLUTContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  activeLUTText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  removeLUTButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  removeLUTText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LUTManagerPanel;