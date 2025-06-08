import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tool } from '../types/video';

interface ToolPanelProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  disabled?: boolean;
}

interface ToolItem {
  id: Tool;
  name: string;
  icon: string;
  color: string;
}

const tools: ToolItem[] = [
  {
    id: Tool.SELECT,
    name: 'تحديد',
    icon: 'hand-left-outline',
    color: '#007AFF'
  },
  {
    id: Tool.TRIM,
    name: 'قص',
    icon: 'cut-outline',
    color: '#FF9500'
  },
  {
    id: Tool.SPLIT,
    name: 'تقسيم',
    icon: 'git-branch-outline',
    color: '#34C759'
  },
  {
    id: Tool.TEXT,
    name: 'نص',
    icon: 'text-outline',
    color: '#AF52DE'
  },
  {
    id: Tool.FILTER,
    name: 'فلاتر',
    icon: 'color-filter-outline',
    color: '#FF2D92'
  },
  {
    id: Tool.TRANSITION,
    name: 'انتقالات',
    icon: 'swap-horizontal-outline',
    color: '#FF3B30'
  },
  {
    id: Tool.AUDIO,
    name: 'صوت',
    icon: 'musical-notes-outline',
    color: '#30D158'
  }
];

export default function ToolPanel({ selectedTool, onToolSelect, disabled = false }: ToolPanelProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              selectedTool === tool.id && styles.selectedTool,
              disabled && styles.disabledTool
            ]}
            onPress={() => !disabled && onToolSelect(tool.id)}
            disabled={disabled}
          >
            <View style={[
              styles.toolIconContainer,
              selectedTool === tool.id && { backgroundColor: tool.color }
            ]}>
              <Ionicons
                name={tool.icon as any}
                size={24}
                color={selectedTool === tool.id ? '#fff' : (disabled ? '#666' : tool.color)}
              />
            </View>
            
            <Text style={[
              styles.toolLabel,
              selectedTool === tool.id && styles.selectedToolLabel,
              disabled && styles.disabledToolLabel
            ]}>
              {tool.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.quickActionButton, disabled && styles.disabledTool]}
          disabled={disabled}
        >
          <Ionicons name="play-skip-back" size={20} color={disabled ? '#666' : '#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, disabled && styles.disabledTool]}
          disabled={disabled}
        >
          <Ionicons name="play-skip-forward" size={20} color={disabled ? '#666' : '#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, disabled && styles.disabledTool]}
          disabled={disabled}
        >
          <Ionicons name="copy-outline" size={20} color={disabled ? '#666' : '#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, disabled && styles.disabledTool]}
          disabled={disabled}
        >
          <Ionicons name="trash-outline" size={20} color={disabled ? '#666' : '#FF3B30'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  toolButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  selectedTool: {
    // يمكن إضافة تأثيرات إضافية هنا
  },
  disabledTool: {
    opacity: 0.5,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  toolLabel: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedToolLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledToolLabel: {
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
});