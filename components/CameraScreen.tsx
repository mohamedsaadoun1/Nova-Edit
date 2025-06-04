import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useVideoStore } from '../store/videoStore';
import { VideoFile } from '../types/video';

interface CameraScreenProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen({ visible, onClose }: CameraScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.off);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const cameraRef = useRef<Camera>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { addVideoFile } = useVideoStore();

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && audioStatus.status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (isRecording) {
      // بدء الرسوم المتحركة للتسجيل
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();

      // بدء مؤقت التسجيل
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(1);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality['1080p'],
          maxDuration: 60, // حد أقصى دقيقة واحدة
          mute: false
        });

        setIsRecording(false);
        await saveVideo(video.uri);
      } catch (error) {
        setIsRecording(false);
        Alert.alert('خطأ', 'حدث خطأ أثناء التسجيل');
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const saveVideo = async (videoUri: string) => {
    try {
      // حفظ في مكتبة الوسائط
      const asset = await MediaLibrary.saveToLibraryAsync(videoUri);
      
      // إضافة إلى التطبيق
      const videoFile: VideoFile = {
        id: Date.now().toString(),
        name: `تسجيل_${new Date().toISOString().slice(0, 10)}.mp4`,
        uri: asset.uri,
        size: 0, // سيتم حساب الحجم لاحقاً
        duration: recordingDuration,
        width: 1920,
        height: 1080,
        format: 'video/mp4'
      };

      addVideoFile(videoFile);
      
      Alert.alert(
        'تم الحفظ',
        'تم حفظ الفيديو وإضافته إلى المشروع',
        [{ text: 'موافق', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('خطأ', 'لم نتمكن من حفظ الفيديو');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false
        });

        // يمكن إضافة معالجة الصور لاحقاً
        Alert.alert('تم', 'تم التقاط الصورة بنجاح');
      } catch (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء التقاط الصورة');
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) {
    return null;
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>جاري طلب الإذن...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionTitle}>إذن الكاميرا مطلوب</Text>
          <Text style={styles.permissionText}>
            نحتاج إلى إذن الوصول للكاميرا والميكروفون لتسجيل الفيديوهات
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
            <Text style={styles.permissionButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={styles.camera} 
        type={type}
        flashMode={flashMode}
        ref={cameraRef}
      >
        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setFlashMode(
              flashMode === FlashMode.off ? FlashMode.on : 
              flashMode === FlashMode.on ? FlashMode.auto : FlashMode.off
            )}
          >
            <Ionicons 
              name={
                flashMode === FlashMode.off ? "flash-off" :
                flashMode === FlashMode.on ? "flash" : "flash-auto"
              } 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setType(
              type === CameraType.back ? CameraType.front : CameraType.back
            )}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Recording Duration */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Animated.View style={[
              styles.recordingDot,
              { opacity: recordingAnimation }
            ]} />
            <Text style={styles.recordingText}>
              {formatTime(recordingDuration)}
            </Text>
          </View>
        )}

        {/* Camera Controls */}
        <View style={styles.cameraControls}>
          {/* Photo Button */}
          <TouchableOpacity
            style={styles.photoButton}
            onPress={takePicture}
            disabled={isRecording}
          >
            <Ionicons name="camera" size={24} color={isRecording ? "#666" : "#fff"} />
          </TouchableOpacity>

          {/* Record Button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={[
              styles.recordButtonInner,
              isRecording && styles.recordingButtonInner
            ]} />
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.galleryButton}
            disabled={isRecording}
          >
            <Ionicons name="images" size={24} color={isRecording ? "#666" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* Camera Modes */}
        <View style={styles.cameraModes}>
          <TouchableOpacity style={styles.modeButton}>
            <Text style={styles.modeText}>فيديو</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeButton}>
            <Text style={styles.modeText}>صورة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeButton}>
            <Text style={styles.modeText}>بطيء</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  photoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    borderColor: '#FF3B30',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
  },
  recordingButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraModes: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 10,
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});