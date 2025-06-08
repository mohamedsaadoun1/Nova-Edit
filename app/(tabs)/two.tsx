import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useVideoStore } from '../../store/videoStore';
import { ExportSettings } from '../../types/video';

export default function ExportScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const {
    currentProject,
    timeline,
    videoFiles,
    exportVideo
  } = useVideoStore();

  interface ExtendedExportSettings extends ExportSettings {
  name: string;
  description: string;
}

const exportSettings: ExtendedExportSettings[] = [
    {
      quality: 'high',
      resolution: '1080p',
      format: 'mp4',
      fps: 30,
      name: 'جودة عالية (1080p)',
      description: 'مناسب للمشاركة على وسائل التواصل الاجتماعي'
    },
    {
      quality: 'ultra',
      resolution: '4K',
      format: 'mp4',
      fps: 60,
      name: 'جودة فائقة (4K)',
      description: 'أفضل جودة ممكنة للاستخدام المهني'
    },
    {
      quality: 'medium',
      resolution: '720p',
      format: 'mp4',
      fps: 30,
      name: 'جودة متوسطة (720p)',
      description: 'توازن بين الجودة وحجم الملف'
    },
    {
      quality: 'low',
      resolution: '720p',
      format: 'mp4',
      fps: 24,
      name: 'ضغط صغير',
      description: 'حجم ملف صغير للمشاركة السريعة'
    }
  ];

  const handleExport = async (settings: ExportSettings) => {
    if (!currentProject || videoFiles.length === 0) {
      Alert.alert('خطأ', 'لا يوجد مشروع أو فيديوهات للتصدير');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);

      // محاكاة تقدم التصدير
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const exportedVideoUri = await exportVideo(settings);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // حفظ في مكتبة الوسائط
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(exportedVideoUri);
      }

      setIsExporting(false);
      setExportProgress(0);

      Alert.alert(
        'تم التصدير بنجاح',
        'تم حفظ الفيديو في مكتبة الصور',
        [
          { text: 'موافق' },
          { 
            text: 'مشاركة',
            onPress: () => shareVideo(exportedVideoUri)
          }
        ]
      );

    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      Alert.alert('خطأ', 'حدث خطأ أثناء التصدير');
    }
  };

  const shareVideo = async (videoUri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(videoUri);
      } else {
        await Share.share({
          url: videoUri,
          message: 'فيديو تم إنشاؤه بتطبيق Nova Edit Mobile'
        });
      }
    } catch (error) {
      Alert.alert('خطأ', 'لم نتمكن من مشاركة الفيديو');
    }
  };

  const getEstimatedFileSize = (settings: ExportSettings) => {
    const duration = timeline.duration;
    let sizePerSecond = 1; // MB per second
    
    switch (settings.quality) {
      case 'ultra':
        sizePerSecond = 8;
        break;
      case 'high':
        sizePerSecond = 4;
        break;
      case 'medium':
        sizePerSecond = 2;
        break;
      case 'low':
        sizePerSecond = 1;
        break;
    }
    
    const estimatedSize = Math.round(duration * sizePerSecond);
    return estimatedSize < 1000 ? `${estimatedSize} MB` : `${(estimatedSize / 1000).toFixed(1)} GB`;
  };

  const renderExportOption = (settings: ExtendedExportSettings) => {
    return (
      <TouchableOpacity
        key={`${settings.quality}-${settings.resolution}`}
        style={styles.exportOption}
        onPress={() => handleExport(settings)}
        disabled={isExporting}
      >
        <View style={styles.exportOptionContent}>
          <View style={styles.exportOptionHeader}>
            <Text style={styles.exportOptionTitle}>{settings.name}</Text>
            <View style={styles.exportBadge}>
              <Text style={styles.exportBadgeText}>{settings.format.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.exportOptionDescription}>{settings.description}</Text>
          
          <View style={styles.exportOptionDetails}>
            <View style={styles.exportDetail}>
              <Ionicons name="videocam-outline" size={16} color="#666" />
              <Text style={styles.exportDetailText}>{settings.resolution}</Text>
            </View>
            
            <View style={styles.exportDetail}>
              <Ionicons name="speedometer-outline" size={16} color="#666" />
              <Text style={styles.exportDetailText}>{settings.fps} FPS</Text>
            </View>
            
            <View style={styles.exportDetail}>
              <Ionicons name="cloud-download-outline" size={16} color="#666" />
              <Text style={styles.exportDetailText}>{getEstimatedFileSize(settings)}</Text>
            </View>
          </View>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isExporting ? "#666" : "#007AFF"} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تصدير الفيديو</Text>
        
        {currentProject && (
          <Text style={styles.projectName}>{currentProject.name}</Text>
        )}
      </View>

      {/* Project Info */}
      {currentProject && (
        <View style={styles.projectInfo}>
          <View style={styles.projectStat}>
            <Ionicons name="videocam-outline" size={20} color="#007AFF" />
            <Text style={styles.projectStatText}>
              {videoFiles.length} فيديو
            </Text>
          </View>
          
          <View style={styles.projectStat}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.projectStatText}>
              {Math.floor(timeline.duration / 60)}:{Math.floor(timeline.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          
          <View style={styles.projectStat}>
            <Ionicons name="layers-outline" size={20} color="#007AFF" />
            <Text style={styles.projectStatText}>
              {timeline.tracks.length} مسار
            </Text>
          </View>
        </View>
      )}

      {/* Export Options */}
      <ScrollView style={styles.exportOptions}>
        <Text style={styles.sectionTitle}>اختر جودة التصدير</Text>
        
        {exportSettings.map(renderExportOption)}
        
        {/* Quick Share Options */}
        <Text style={styles.sectionTitle}>مشاركة سريعة</Text>
        
        <View style={styles.quickShareContainer}>
          <TouchableOpacity style={styles.quickShareButton}>
            <View style={[styles.quickShareIcon, { backgroundColor: '#1DA1F2' }]}>
              <Ionicons name="logo-twitter" size={24} color="#fff" />
            </View>
            <Text style={styles.quickShareText}>تويتر</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickShareButton}>
            <View style={[styles.quickShareIcon, { backgroundColor: '#E4405F' }]}>
              <Ionicons name="logo-instagram" size={24} color="#fff" />
            </View>
            <Text style={styles.quickShareText}>إنستغرام</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickShareButton}>
            <View style={[styles.quickShareIcon, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </View>
            <Text style={styles.quickShareText}>واتساب</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickShareButton}>
            <View style={[styles.quickShareIcon, { backgroundColor: '#FF0000' }]}>
              <Ionicons name="logo-youtube" size={24} color="#fff" />
            </View>
            <Text style={styles.quickShareText}>يوتيوب</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Export Progress */}
      {isExporting && (
        <View style={styles.exportProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>جاري التصدير...</Text>
            <Text style={styles.progressPercentage}>{Math.round(exportProgress)}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${exportProgress}%` }
              ]} 
            />
          </View>
          
          <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 8 }} />
        </View>
      )}

      {/* Empty State */}
      {!currentProject && (
        <View style={styles.emptyState}>
          <Ionicons name="download-outline" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>لا يوجد مشروع للتصدير</Text>
          <Text style={styles.emptyStateText}>
            ابدأ بإنشاء مشروع وإضافة فيديوهات للتصدير
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  projectName: {
    color: '#007AFF',
    fontSize: 16,
  },
  projectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  projectStat: {
    alignItems: 'center',
  },
  projectStatText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  exportOptions: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exportOptionContent: {
    flex: 1,
  },
  exportOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exportOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  exportBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exportBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exportOptionDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  exportOptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exportDetailText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  quickShareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickShareButton: {
    alignItems: 'center',
  },
  quickShareIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickShareText: {
    color: '#ccc',
    fontSize: 12,
  },
  exportProgress: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressPercentage: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});