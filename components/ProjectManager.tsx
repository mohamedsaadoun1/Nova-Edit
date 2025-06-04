import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoStore } from '../store/videoStore';
import { Project } from '../types/video';

interface ProjectManagerProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ProjectManager({ visible, onClose }: ProjectManagerProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const {
    projects,
    currentProject,
    createProject,
    loadProject,
    deleteProject,
    saveProject
  } = useVideoStore();

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProject(false);
      onClose();
    } else {
      Alert.alert('خطأ', 'يرجى إدخال اسم المشروع');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'حذف المشروع',
      'هل أنت متأكد من حذف هذا المشروع؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => deleteProject(projectId)
        }
      ]
    );
  };

  const handleLoadProject = (projectId: string) => {
    if (currentProject && currentProject.id !== projectId) {
      Alert.alert(
        'تغيير المشروع',
        'هل تريد حفظ المشروع الحالي قبل فتح مشروع آخر؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: 'عدم الحفظ', 
            onPress: () => {
              loadProject(projectId);
              onClose();
            }
          },
          { 
            text: 'حفظ وفتح',
            onPress: () => {
              saveProject();
              loadProject(projectId);
              onClose();
            }
          }
        ]
      );
    } else {
      loadProject(projectId);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getProjectDuration = (project: Project) => {
    const duration = project.timeline.duration;
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderProjectCard = (project: Project) => {
    const isActive = currentProject?.id === project.id;
    
    return (
      <TouchableOpacity
        key={project.id}
        style={[
          styles.projectCard,
          isActive && styles.activeProject
        ]}
        onPress={() => handleLoadProject(project.id)}
      >
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={[
              styles.projectTitle,
              isActive && styles.activeProjectText
            ]}>
              {project.name}
            </Text>
            
            <Text style={styles.projectDate}>
              {formatDate(project.updatedAt)}
            </Text>
          </View>
          
          {isActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
          )}
        </View>

        <View style={styles.projectDetails}>
          <View style={styles.projectStat}>
            <Ionicons name="videocam-outline" size={16} color="#666" />
            <Text style={styles.projectStatText}>
              {project.videoFiles.length} فيديو
            </Text>
          </View>
          
          <View style={styles.projectStat}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.projectStatText}>
              {getProjectDuration(project)}
            </Text>
          </View>
          
          <View style={styles.projectStat}>
            <Ionicons name="layers-outline" size={16} color="#666" />
            <Text style={styles.projectStatText}>
              {project.timeline.tracks.length} مسار
            </Text>
          </View>
        </View>

        <View style={styles.projectActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLoadProject(project.id)}
          >
            <Ionicons name="folder-open-outline" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>فتح</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteProject(project.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>حذف</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>إغلاق</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>المشاريع</Text>
          
          <TouchableOpacity onPress={() => setShowNewProject(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Projects List */}
        <ScrollView style={styles.projectsList}>
          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={64} color="#666" />
              <Text style={styles.emptyStateTitle}>لا توجد مشاريع</Text>
              <Text style={styles.emptyStateText}>
                ابدأ مشروعك الأول لتحرير الفيديوهات
              </Text>
              <TouchableOpacity
                style={styles.createFirstProject}
                onPress={() => setShowNewProject(true)}
              >
                <Text style={styles.createFirstProjectText}>إنشاء مشروع جديد</Text>
              </TouchableOpacity>
            </View>
          ) : (
            projects.map(renderProjectCard)
          )}
        </ScrollView>

        {/* New Project Modal */}
        <Modal
          visible={showNewProject}
          animationType="fade"
          transparent
          onRequestClose={() => setShowNewProject(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.newProjectModal}>
              <Text style={styles.modalTitle}>مشروع جديد</Text>
              
              <TextInput
                style={styles.projectNameInput}
                placeholder="اسم المشروع"
                placeholderTextColor="#666"
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowNewProject(false);
                    setNewProjectName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateProject}
                >
                  <Text style={styles.createButtonText}>إنشاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  projectsList: {
    flex: 1,
    padding: 20,
  },
  projectCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeProject: {
    borderColor: '#34C759',
    backgroundColor: '#2a2a2a',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeProjectText: {
    color: '#34C759',
  },
  projectDate: {
    color: '#666',
    fontSize: 14,
  },
  activeIndicator: {
    marginLeft: 12,
  },
  projectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectStatText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 4,
  },
  projectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    marginBottom: 24,
  },
  createFirstProject: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstProjectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newProjectModal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    width: screenWidth - 40,
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  projectNameInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});