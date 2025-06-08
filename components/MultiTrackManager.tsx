/**
 * مدير المسارات المتعددة - Nova Edit Mobile
 * إدارة متقدمة للمسارات مع دعم الترتيب والتجميع
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { 
  RenderItemParams,
  ScaleDecorator 
} from 'react-native-draggable-flatlist';
import { Track } from '../types/video';

interface TrackGroup {
  id: string;
  name: string;
  color: string;
  tracks: string[];
  collapsed: boolean;
  locked: boolean;
}

interface MultiTrackManagerProps {
  visible: boolean;
  tracks: Track[];
  trackGroups: TrackGroup[];
  onClose: () => void;
  onTrackAdd: (type: 'video' | 'audio' | 'text', groupId?: string) => void;
  onTrackDelete: (trackId: string) => void;
  onTrackDuplicate: (trackId: string) => void;
  onTrackReorder: (tracks: Track[]) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
  onGroupCreate: (name: string, trackIds: string[]) => void;
  onGroupUpdate: (groupId: string, updates: Partial<TrackGroup>) => void;
  onGroupDelete: (groupId: string) => void;
  onGroupToggle: (groupId: string) => void;
}

interface TrackSettings {
  volume: number;
  muted: boolean;
  visible: boolean;
  locked: boolean;
  color: string;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  opacity: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MultiTrackManager({
  visible,
  tracks,
  trackGroups,
  onClose,
  onTrackAdd,
  onTrackDelete,
  onTrackDuplicate,
  onTrackReorder,
  onTrackUpdate,
  onGroupCreate,
  onGroupUpdate,
  onGroupDelete,
  onGroupToggle
}: MultiTrackManagerProps) {
  
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [showTrackSettings, setShowTrackSettings] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedItemForMenu, setSelectedItemForMenu] = useState<string | null>(null);

  // تنظيم المسارات حسب المجموعات
  const organizedTracks = useMemo(() => {
    const result: { groups: TrackGroup[]; ungroupedTracks: Track[] } = {
      groups: [],
      ungroupedTracks: []
    };
    
    const trackMap = new Map(tracks.map(track => [track.id, track]));
    const groupedTrackIds = new Set();
    
    // معالجة المجموعات
    trackGroups.forEach(group => {
      const groupTracks = group.tracks
        .map(trackId => trackMap.get(trackId))
        .filter(Boolean) as Track[];
      
      if (groupTracks.length > 0) {
        result.groups.push({
          ...group,
          tracks: groupTracks.map(t => t.id)
        });
        
        groupTracks.forEach(track => groupedTrackIds.add(track.id));
      }
    });
    
    // المسارات غير المجمعة
    result.ungroupedTracks = tracks.filter(track => !groupedTrackIds.has(track.id));
    
    return result;
  }, [tracks, trackGroups]);

  // إحصائيات المسارات
  const trackStats = useMemo(() => {
    const stats = {
      total: tracks.length,
      video: tracks.filter(t => t.type === 'video').length,
      audio: tracks.filter(t => t.type === 'audio').length,
      text: tracks.filter(t => t.type === 'text').length,
      visible: tracks.filter(t => t.visible).length,
      locked: tracks.filter(t => t.locked).length,
      muted: tracks.filter(t => t.muted).length
    };
    
    return stats;
  }, [tracks]);

  // رسم عنصر مسار
  const renderTrackItem = ({ item: track, drag, isActive }: RenderItemParams<Track>) => {
    const isSelected = selectedTracks.includes(track.id);
    const isEditing = editingTrack === track.id;
    
    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            styles.trackItem,
            isSelected && styles.selectedTrackItem,
            isActive && styles.draggingTrackItem
          ]}
          onPress={() => handleTrackSelect(track.id)}
          onLongPress={() => handleTrackLongPress(track.id)}
          delayLongPress={200}
        >
          {/* أيقونة الترتيب */}
          <TouchableOpacity
            style={styles.dragHandle}
            onLongPress={drag}
            delayLongPress={0}
          >
            <Ionicons name="reorder-two" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* معلومات المسار */}
          <View style={styles.trackInfo}>
            <View style={styles.trackHeader}>
              <View style={[styles.trackTypeIndicator, { backgroundColor: getTrackColor(track.type) }]} />
              <Text style={styles.trackTitle}>{getTrackDisplayName(track)}</Text>
              <Text style={styles.trackSubtitle}>
                {track.clips.length} مقطع
              </Text>
            </View>
            
            <View style={styles.trackMeta}>
              <Text style={styles.trackDuration}>
                {formatDuration(getTrackDuration(track))}
              </Text>
              <Text style={styles.trackSize}>
                {getTrackSize(track)}
              </Text>
            </View>
          </View>
          
          {/* أدوات التحكم */}
          <View style={styles.trackControls}>
            <TouchableOpacity
              style={[styles.controlButton, track.visible ? styles.activeControl : styles.inactiveControl]}
              onPress={() => onTrackUpdate(track.id, { visible: !track.visible })}
            >
              <Ionicons 
                name={track.visible ? "eye" : "eye-off"} 
                size={16} 
                color={track.visible ? "#fff" : "#666"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, track.muted ? styles.inactiveControl : styles.activeControl]}
              onPress={() => onTrackUpdate(track.id, { muted: !track.muted })}
            >
              <Ionicons 
                name={track.muted ? "volume-mute" : "volume-medium"} 
                size={16} 
                color={track.muted ? "#666" : "#fff"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, track.locked ? styles.lockedControl : styles.activeControl]}
              onPress={() => onTrackUpdate(track.id, { locked: !track.locked })}
            >
              <Ionicons 
                name={track.locked ? "lock-closed" : "lock-open"} 
                size={14} 
                color={track.locked ? "#ff6b6b" : "#fff"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setEditingTrack(track.id)}
            >
              <Ionicons name="settings" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  // رسم مجموعة مسارات
  const renderTrackGroup = (group: TrackGroup) => {
    const groupTracks = group.tracks
      .map(trackId => tracks.find(t => t.id === trackId))
      .filter(Boolean) as Track[];
    
    return (
      <View key={group.id} style={styles.trackGroup}>
        {/* رأس المجموعة */}
        <TouchableOpacity
          style={[styles.groupHeader, { borderLeftColor: group.color }]}
          onPress={() => onGroupToggle(group.id)}
          onLongPress={() => handleGroupLongPress(group.id)}
        >
          <View style={styles.groupInfo}>
            <Ionicons 
              name={group.collapsed ? "chevron-forward" : "chevron-down"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.groupTitle}>{group.name}</Text>
            <Text style={styles.groupSubtitle}>
              {groupTracks.length} مسار
            </Text>
          </View>
          
          <View style={styles.groupControls}>
            <TouchableOpacity
              style={[styles.controlButton, group.locked ? styles.lockedControl : styles.activeControl]}
              onPress={() => onGroupUpdate(group.id, { locked: !group.locked })}
            >
              <Ionicons 
                name={group.locked ? "lock-closed" : "lock-open"} 
                size={14} 
                color={group.locked ? "#ff6b6b" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {/* مسارات المجموعة */}
        {!group.collapsed && (
          <View style={styles.groupTracks}>
            {groupTracks.map(track => (
              <View key={track.id} style={styles.groupTrackItem}>
                {renderTrackItem({ 
                  item: track, 
                  drag: () => {}, 
                  isActive: false 
                } as RenderItemParams<Track>)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // شريط الإحصائيات
  const renderStatsBar = () => {
    return (
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="layers" size={16} color="#666" />
          <Text style={styles.statText}>{trackStats.total}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="videocam" size={16} color="#007AFF" />
          <Text style={styles.statText}>{trackStats.video}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="musical-notes" size={16} color="#34C759" />
          <Text style={styles.statText}>{trackStats.audio}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="text" size={16} color="#FF9500" />
          <Text style={styles.statText}>{trackStats.text}</Text>
        </View>
        
        <View style={styles.statSeparator} />
        
        <View style={styles.statItem}>
          <Ionicons name="eye" size={16} color="#666" />
          <Text style={styles.statText}>{trackStats.visible}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="lock-closed" size={16} color="#ff6b6b" />
          <Text style={styles.statText}>{trackStats.locked}</Text>
        </View>
      </View>
    );
  };

  // أدوات التحكم العامة
  const renderGlobalControls = () => {
    return (
      <View style={styles.globalControls}>
        <TouchableOpacity
          style={styles.globalButton}
          onPress={() => handleSelectAll()}
        >
          <Ionicons name="checkbox" size={18} color="#fff" />
          <Text style={styles.globalButtonText}>تحديد الكل</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.globalButton}
          onPress={() => handleGroupSelected()}
          disabled={selectedTracks.length < 2}
        >
          <Ionicons name="file-tray-stacked" size={18} color="#fff" />
          <Text style={styles.globalButtonText}>تجميع</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.globalButton, { backgroundColor: '#FF3B30' }]}
          onPress={() => handleDeleteSelected()}
          disabled={selectedTracks.length === 0}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.globalButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // إعدادات المسار
  const renderTrackSettings = () => {
    const track = tracks.find(t => t.id === editingTrack);
    if (!track) return null;
    
    return (
      <Modal
        visible={showTrackSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTrackSettings(false)}
      >
        <View style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity onPress={() => setShowTrackSettings(false)}>
              <Text style={styles.closeButton}>إغلاق</Text>
            </TouchableOpacity>
            
            <Text style={styles.settingsTitle}>
              إعدادات {getTrackDisplayName(track)}
            </Text>
            
            <TouchableOpacity onPress={() => setShowTrackSettings(false)}>
              <Text style={styles.doneButton}>تم</Text>
            </TouchableOpacity>
          </View>
          
          {/* محتوى الإعدادات */}
          <ScrollView style={styles.settingsContent}>
            {/* إعدادات عامة */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>عام</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>اسم المسار</Text>
                <Text style={styles.settingValue}>{getTrackDisplayName(track)}</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>النوع</Text>
                <Text style={styles.settingValue}>{getTrackTypeDisplayName(track.type)}</Text>
              </View>
            </View>
            
            {/* إعدادات الرؤية والصوت */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>العرض والصوت</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>مرئي</Text>
                <TouchableOpacity
                  style={[styles.toggle, track.visible && styles.toggleActive]}
                  onPress={() => onTrackUpdate(track.id, { visible: !track.visible })}
                >
                  <View style={[styles.toggleThumb, track.visible && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>مكتوم</Text>
                <TouchableOpacity
                  style={[styles.toggle, track.muted && styles.toggleActive]}
                  onPress={() => onTrackUpdate(track.id, { muted: !track.muted })}
                >
                  <View style={[styles.toggleThumb, track.muted && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>مقفل</Text>
                <TouchableOpacity
                  style={[styles.toggle, track.locked && styles.toggleActive]}
                  onPress={() => onTrackUpdate(track.id, { locked: !track.locked })}
                >
                  <View style={[styles.toggleThumb, track.locked && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* إعدادات متقدمة */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>متقدم</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDuplicateTrack(track.id)}
              >
                <Ionicons name="copy" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>نسخ المسار</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => handleDeleteTrack(track.id)}
              >
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>حذف المسار</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // معالجات الأحداث
  const handleTrackSelect = (trackId: string) => {
    setSelectedTracks(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  const handleTrackLongPress = (trackId: string) => {
    setSelectedItemForMenu(trackId);
    setContextMenuVisible(true);
  };

  const handleGroupLongPress = (groupId: string) => {
    setSelectedItemForMenu(groupId);
    setContextMenuVisible(true);
  };

  const handleSelectAll = () => {
    if (selectedTracks.length === tracks.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks(tracks.map(t => t.id));
    }
  };

  const handleGroupSelected = () => {
    if (selectedTracks.length < 2) return;
    
    setShowGroupDialog(true);
  };

  const handleDeleteSelected = () => {
    if (selectedTracks.length === 0) return;
    
    Alert.alert(
      'حذف المسارات',
      `هل أنت متأكد من حذف ${selectedTracks.length} مسار؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            selectedTracks.forEach(trackId => onTrackDelete(trackId));
            setSelectedTracks([]);
          }
        }
      ]
    );
  };

  const handleDuplicateTrack = (trackId: string) => {
    onTrackDuplicate(trackId);
    setShowTrackSettings(false);
  };

  const handleDeleteTrack = (trackId: string) => {
    Alert.alert(
      'حذف المسار',
      'هل أنت متأكد من حذف هذا المسار؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            onTrackDelete(trackId);
            setShowTrackSettings(false);
            setEditingTrack(null);
          }
        }
      ]
    );
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedTracks.length > 0) {
      onGroupCreate(newGroupName.trim(), selectedTracks);
      setNewGroupName('');
      setSelectedTracks([]);
      setShowGroupDialog(false);
    }
  };

  // وظائف مساعدة
  const getTrackDisplayName = (track: Track): string => {
    return `مسار ${track.type} ${track.id.slice(-4)}`;
  };

  const getTrackTypeDisplayName = (type: string): string => {
    const names = {
      video: 'فيديو',
      audio: 'صوت',
      text: 'نص'
    };
    return names[type] || type;
  };

  const getTrackColor = (type: string): string => {
    const colors = {
      video: '#007AFF',
      audio: '#34C759',
      text: '#FF9500'
    };
    return colors[type] || '#666';
  };

  const getTrackDuration = (track: Track): number => {
    if (track.clips.length === 0) return 0;
    
    const lastClip = track.clips.reduce((latest, clip) => {
      const clipEnd = clip.position + clip.duration;
      const latestEnd = latest.position + latest.duration;
      return clipEnd > latestEnd ? clip : latest;
    });
    
    return lastClip.position + lastClip.duration;
  };

  const getTrackSize = (track: Track): string => {
    const totalSize = track.clips.reduce((sum, clip) => sum + (clip.fileSize || 0), 0);
    return formatFileSize(totalSize);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* الرأس */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>إغلاق</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>إدارة المسارات</Text>
          
          <TouchableOpacity onPress={() => onTrackAdd('video')}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* شريط الإحصائيات */}
        {renderStatsBar()}

        {/* أدوات التحكم العامة */}
        {renderGlobalControls()}

        {/* قائمة المسارات */}
        <ScrollView style={styles.tracksList}>
          {/* المجموعات */}
          {organizedTracks.groups.map(group => renderTrackGroup(group))}
          
          {/* المسارات غير المجمعة */}
          {organizedTracks.ungroupedTracks.length > 0 && (
            <View style={styles.ungroupedSection}>
              <Text style={styles.sectionHeader}>مسارات غير مجمعة</Text>
              <DraggableFlatList
                data={organizedTracks.ungroupedTracks}
                renderItem={renderTrackItem}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => onTrackReorder(data)}
              />
            </View>
          )}
        </ScrollView>

        {/* إعدادات المسار */}
        {editingTrack && renderTrackSettings()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  doneButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 4,
  },
  statSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#666',
    marginHorizontal: 8,
  },
  globalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  globalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  globalButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  tracksList: {
    flex: 1,
  },
  trackGroup: {
    marginVertical: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderLeftWidth: 4,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  groupSubtitle: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  groupControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTracks: {
    paddingLeft: 20,
  },
  groupTrackItem: {
    borderLeftWidth: 2,
    borderLeftColor: '#666',
    marginLeft: 10,
  },
  ungroupedSection: {
    margin: 20,
  },
  sectionHeader: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedTrackItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  draggingTrackItem: {
    backgroundColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  trackInfo: {
    flex: 1,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackTypeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  trackSubtitle: {
    color: '#666',
    fontSize: 12,
  },
  trackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackDuration: {
    color: '#ccc',
    fontSize: 11,
  },
  trackSize: {
    color: '#ccc',
    fontSize: 11,
  },
  trackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 4,
  },
  activeControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inactiveControl: {
    backgroundColor: 'rgba(102, 102, 102, 0.3)',
  },
  lockedControl: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsContent: {
    flex: 1,
    padding: 20,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  settingValue: {
    color: '#fff',
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#666',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default MultiTrackManager;