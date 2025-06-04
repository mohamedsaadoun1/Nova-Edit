/**
 * أدوات الجدول الزمني - Nova Edit Mobile
 * وظائف مساعدة للتعامل مع الجدول الزمني المتقدم
 */

import { Timeline, VideoClip, Track } from '../types/video';
import { Keyframe, KeyframeProperty, TimelineSelection } from '../components/AdvancedVideoTimeline';

export interface SnapPoint {
  time: number;
  type: 'clip-start' | 'clip-end' | 'keyframe' | 'marker' | 'grid';
  clipId?: string;
  keyframeId?: string;
}

export interface ClipOverlap {
  clip1: VideoClip;
  clip2: VideoClip;
  overlapStart: number;
  overlapEnd: number;
  overlapDuration: number;
}

export interface TimelineAnalysis {
  totalDuration: number;
  activeTracks: number;
  totalClips: number;
  overlaps: ClipOverlap[];
  gaps: Array<{ start: number; end: number; duration: number }>;
  keyframeCount: number;
  estimatedFileSize: number;
}

// أدوات حساب الوقت والموضع
export class TimelineCalculator {
  private pixelsPerSecond: number;
  private snapThreshold: number;

  constructor(pixelsPerSecond: number = 20, snapThreshold: number = 10) {
    this.pixelsPerSecond = pixelsPerSecond;
    this.snapThreshold = snapThreshold;
  }

  // تحويل الوقت إلى موضع بكسل
  timeToPixel(time: number): number {
    return time * this.pixelsPerSecond;
  }

  // تحويل موضع البكسل إلى وقت
  pixelToTime(pixel: number): number {
    return pixel / this.pixelsPerSecond;
  }

  // حساب موضع المقطع
  getClipPosition(clip: VideoClip): { left: number; width: number } {
    return {
      left: this.timeToPixel(clip.position),
      width: this.timeToPixel(clip.duration)
    };
  }

  // حساب موضع الإطار المفتاحي
  getKeyframePosition(keyframe: Keyframe): number {
    return this.timeToPixel(keyframe.time);
  }

  // تطبيق الـ snapping
  snapToTime(time: number, snapPoints: SnapPoint[]): number {
    const threshold = this.pixelToTime(this.snapThreshold);
    
    let closestPoint = null;
    let closestDistance = threshold;

    for (const point of snapPoints) {
      const distance = Math.abs(point.time - time);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    }

    return closestPoint ? closestPoint.time : time;
  }
}

// مدير نقاط الجذب
export class SnapManager {
  // إنشاء نقاط الجذب للجدول الزمني
  static generateSnapPoints(
    timeline: Timeline,
    keyframes: Keyframe[],
    gridInterval: number = 1
  ): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];

    // نقاط الشبكة
    for (let i = 0; i <= timeline.duration; i += gridInterval) {
      snapPoints.push({
        time: i,
        type: 'grid'
      });
    }

    // نقاط المقاطع
    timeline.tracks.forEach(track => {
      track.clips.forEach(clip => {
        snapPoints.push({
          time: clip.position,
          type: 'clip-start',
          clipId: clip.id
        });
        snapPoints.push({
          time: clip.position + clip.duration,
          type: 'clip-end',
          clipId: clip.id
        });
      });
    });

    // نقاط الإطارات المفتاحية
    keyframes.forEach(keyframe => {
      snapPoints.push({
        time: keyframe.time,
        type: 'keyframe',
        keyframeId: keyframe.id
      });
    });

    return snapPoints.sort((a, b) => a.time - b.time);
  }

  // العثور على أقرب نقطة جذب
  static findClosestSnapPoint(
    time: number,
    snapPoints: SnapPoint[],
    threshold: number
  ): SnapPoint | null {
    let closest: SnapPoint | null = null;
    let closestDistance = threshold;

    for (const point of snapPoints) {
      const distance = Math.abs(point.time - time);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = point;
      }
    }

    return closest;
  }
}

// محلل التداخل والفجوات
export class TimelineAnalyzer {
  // تحليل التداخلات بين المقاطع
  static analyzeOverlaps(track: Track): ClipOverlap[] {
    const overlaps: ClipOverlap[] = [];
    const sortedClips = [...track.clips].sort((a, b) => a.position - b.position);

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const clip1 = sortedClips[i];
      const clip2 = sortedClips[i + 1];

      const clip1End = clip1.position + clip1.duration;
      const clip2Start = clip2.position;

      if (clip1End > clip2Start) {
        const overlapStart = clip2Start;
        const overlapEnd = Math.min(clip1End, clip2.position + clip2.duration);
        
        overlaps.push({
          clip1,
          clip2,
          overlapStart,
          overlapEnd,
          overlapDuration: overlapEnd - overlapStart
        });
      }
    }

    return overlaps;
  }

  // تحليل الفجوات في المسار
  static analyzeGaps(track: Track): Array<{ start: number; end: number; duration: number }> {
    const gaps: Array<{ start: number; end: number; duration: number }> = [];
    const sortedClips = [...track.clips].sort((a, b) => a.position - b.position);

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const clip1 = sortedClips[i];
      const clip2 = sortedClips[i + 1];

      const clip1End = clip1.position + clip1.duration;
      const clip2Start = clip2.position;

      if (clip2Start > clip1End) {
        gaps.push({
          start: clip1End,
          end: clip2Start,
          duration: clip2Start - clip1End
        });
      }
    }

    return gaps;
  }

  // تحليل شامل للجدول الزمني
  static analyzeTimeline(timeline: Timeline, keyframes: Keyframe[]): TimelineAnalysis {
    let totalDuration = 0;
    let totalClips = 0;
    let activeTracks = 0;
    const allOverlaps: ClipOverlap[] = [];
    const allGaps: Array<{ start: number; end: number; duration: number }> = [];

    timeline.tracks.forEach(track => {
      if (track.clips.length > 0) {
        activeTracks++;
        totalClips += track.clips.length;

        // حساب المدة الإجمالية
        const trackEnd = Math.max(
          ...track.clips.map(clip => clip.position + clip.duration)
        );
        totalDuration = Math.max(totalDuration, trackEnd);

        // تحليل التداخلات والفجوات
        allOverlaps.push(...this.analyzeOverlaps(track));
        allGaps.push(...this.analyzeGaps(track));
      }
    });

    // تقدير حجم الملف
    const estimatedFileSize = this.estimateFileSize(timeline, totalDuration);

    return {
      totalDuration,
      activeTracks,
      totalClips,
      overlaps: allOverlaps,
      gaps: allGaps,
      keyframeCount: keyframes.length,
      estimatedFileSize
    };
  }

  // تقدير حجم الملف
  private static estimateFileSize(timeline: Timeline, duration: number): number {
    // تقدير بسيط بناءً على المدة ونوع المسارات
    const videoTracks = timeline.tracks.filter(t => t.type === 'video').length;
    const audioTracks = timeline.tracks.filter(t => t.type === 'audio').length;

    // تقدير بمعدل بت متوسط (بايت في الثانية)
    const videoBitrate = videoTracks * 2000000; // 2 Mbps per video track
    const audioBitrate = audioTracks * 128000;  // 128 kbps per audio track

    return ((videoBitrate + audioBitrate) * duration) / 8; // Convert bits to bytes
  }
}

// مدير التحديد المتقدم
export class SelectionManager {
  // تحديد المقاطع في نطاق زمني
  static selectClipsInRange(
    timeline: Timeline,
    startTime: number,
    endTime: number
  ): string[] {
    const selectedClips: string[] = [];

    timeline.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipStart = clip.position;
        const clipEnd = clip.position + clip.duration;

        // تحقق من التداخل مع النطاق المحدد
        if (clipStart < endTime && clipEnd > startTime) {
          selectedClips.push(clip.id);
        }
      });
    });

    return selectedClips;
  }

  // تحديد الإطارات المفتاحية في نطاق زمني
  static selectKeyframesInRange(
    keyframes: Keyframe[],
    startTime: number,
    endTime: number
  ): string[] {
    return keyframes
      .filter(kf => kf.time >= startTime && kf.time <= endTime)
      .map(kf => kf.id);
  }

  // توسيع التحديد للمقاطع المجاورة
  static expandSelection(
    timeline: Timeline,
    currentSelection: string[]
  ): string[] {
    const expandedSelection = new Set(currentSelection);

    currentSelection.forEach(clipId => {
      const clip = this.findClipById(timeline, clipId);
      if (!clip) return;

      const track = this.findTrackByClipId(timeline, clipId);
      if (!track) return;

      // البحث عن المقاطع المجاورة
      track.clips.forEach(otherClip => {
        if (otherClip.id === clipId) return;

        const isAdjacent = 
          Math.abs(otherClip.position - (clip.position + clip.duration)) < 0.1 ||
          Math.abs((otherClip.position + otherClip.duration) - clip.position) < 0.1;

        if (isAdjacent) {
          expandedSelection.add(otherClip.id);
        }
      });
    });

    return Array.from(expandedSelection);
  }

  // العثور على مقطع بالمعرف
  private static findClipById(timeline: Timeline, clipId: string): VideoClip | null {
    for (const track of timeline.tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }

  // العثور على المسار الذي يحتوي على المقطع
  private static findTrackByClipId(timeline: Timeline, clipId: string): Track | null {
    return timeline.tracks.find(track => 
      track.clips.some(clip => clip.id === clipId)
    ) || null;
  }
}

// أدوات التحرير المتقدمة
export class TimelineEditor {
  // تقسيم مقطع في وقت محدد
  static splitClip(
    timeline: Timeline,
    clipId: string,
    splitTime: number
  ): { newClip: VideoClip; updatedClip: VideoClip } | null {
    const track = timeline.tracks.find(t => 
      t.clips.some(c => c.id === clipId)
    );
    
    if (!track) return null;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return null;

    // التحقق من صحة موضع التقسيم
    if (splitTime <= clip.position || splitTime >= clip.position + clip.duration) {
      return null;
    }

    const splitOffset = splitTime - clip.position;
    
    // المقطع الأول (المحدث)
    const updatedClip: VideoClip = {
      ...clip,
      duration: splitOffset,
      endTime: clip.startTime + splitOffset
    };

    // المقطع الثاني (الجديد)
    const newClip: VideoClip = {
      ...clip,
      id: `${clip.id}_split_${Date.now()}`,
      position: splitTime,
      duration: clip.duration - splitOffset,
      startTime: clip.startTime + splitOffset
    };

    return { newClip, updatedClip };
  }

  // دمج مقاطع متجاورة
  static mergeAdjacentClips(
    timeline: Timeline,
    clipIds: string[]
  ): VideoClip | null {
    if (clipIds.length < 2) return null;

    const clips = clipIds
      .map(id => this.findClipById(timeline, id))
      .filter(Boolean) as VideoClip[];

    if (clips.length !== clipIds.length) return null;

    // التحقق من أن المقاطع من نفس الملف ومتجاورة
    const sortedClips = clips.sort((a, b) => a.position - b.position);
    
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const clip1 = sortedClips[i];
      const clip2 = sortedClips[i + 1];
      
      if (clip1.videoFileId !== clip2.videoFileId) return null;
      
      const gap = clip2.position - (clip1.position + clip1.duration);
      if (Math.abs(gap) > 0.1) return null; // ليست متجاورة
    }

    // إنشاء المقطع المدموج
    const firstClip = sortedClips[0];
    const lastClip = sortedClips[sortedClips.length - 1];
    
    const mergedClip: VideoClip = {
      ...firstClip,
      id: `merged_${Date.now()}`,
      duration: (lastClip.position + lastClip.duration) - firstClip.position,
      endTime: lastClip.endTime
    };

    return mergedClip;
  }

  // إزاحة الإطارات المفتاحية
  static offsetKeyframes(
    keyframes: Keyframe[],
    clipId: string,
    timeOffset: number
  ): Keyframe[] {
    return keyframes.map(kf => {
      if (kf.clipId === clipId) {
        return {
          ...kf,
          time: Math.max(0, kf.time + timeOffset)
        };
      }
      return kf;
    });
  }

  // نسخ الإطارات المفتاحية
  static copyKeyframes(
    keyframes: Keyframe[],
    fromClipId: string,
    toClipId: string,
    timeOffset: number = 0
  ): Keyframe[] {
    const clipKeyframes = keyframes.filter(kf => kf.clipId === fromClipId);
    
    return clipKeyframes.map(kf => ({
      ...kf,
      id: `${kf.id}_copy_${Date.now()}`,
      clipId: toClipId,
      time: kf.time + timeOffset
    }));
  }

  // العثور على مقطع بالمعرف
  private static findClipById(timeline: Timeline, clipId: string): VideoClip | null {
    for (const track of timeline.tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }
}

// أدوات الأداء والتحسين
export class TimelineOptimizer {
  // تحسين ترتيب المقاطع للأداء الأفضل
  static optimizeClipOrder(track: Track): VideoClip[] {
    // ترتيب المقاطع حسب الموضع الزمني
    return [...track.clips].sort((a, b) => a.position - b.position);
  }

  // تحسين الإطارات المفتاحية
  static optimizeKeyframes(keyframes: Keyframe[]): Keyframe[] {
    // إزالة الإطارات المفتاحية المتكررة
    const uniqueKeyframes = keyframes.filter((kf, index, arr) => {
      return !arr.some((other, otherIndex) => 
        otherIndex < index &&
        other.clipId === kf.clipId &&
        other.property === kf.property &&
        Math.abs(other.time - kf.time) < 0.01
      );
    });

    // ترتيب حسب الوقت
    return uniqueKeyframes.sort((a, b) => a.time - b.time);
  }

  // حساب مستوى التعقيد للجدول الزمني
  static calculateComplexity(timeline: Timeline, keyframes: Keyframe[]): number {
    let complexity = 0;

    // تعقيد المقاطع
    timeline.tracks.forEach(track => {
      complexity += track.clips.length;
      
      // تعقيد إضافي للتداخلات
      const overlaps = TimelineAnalyzer.analyzeOverlaps(track);
      complexity += overlaps.length * 2;
    });

    // تعقيد الإطارات المفتاحية
    complexity += keyframes.length * 0.5;

    // تعقيد المسارات المتعددة
    const activeTracks = timeline.tracks.filter(t => t.clips.length > 0).length;
    complexity += activeTracks * 1.5;

    return complexity;
  }
}

// تصدير الوظائف المساعدة
export {
  TimelineCalculator as Calculator,
  SnapManager as Snap,
  TimelineAnalyzer as Analyzer,
  SelectionManager as Selection,
  TimelineEditor as Editor,
  TimelineOptimizer as Optimizer
};

// وظائف مساعدة عامة
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export default {
  Calculator: TimelineCalculator,
  Snap: SnapManager,
  Analyzer: TimelineAnalyzer,
  Selection: SelectionManager,
  Editor: TimelineEditor,
  Optimizer: TimelineOptimizer,
  formatTime,
  formatFileSize,
  generateId,
  clamp,
  lerp,
  easeInOut
};