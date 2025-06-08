/**
 * AI Services Index
 * Exports all AI services for easy importing
 */

export { AdvancedSpeechToText } from './AdvancedSpeechToText';
export type { TranscriptionResult, SpeechToTextOptions } from './AdvancedSpeechToText';

export { AdvancedBackgroundRemoval } from './AdvancedBackgroundRemoval';
export type { BackgroundRemovalOptions, SegmentationResult } from './AdvancedBackgroundRemoval';

export { AdvancedMotionTracking } from './AdvancedMotionTracking';
export type { 
  TrackingOptions, 
  TrackingResult, 
  BoundingBox, 
  TrackingPoint, 
  MotionVector 
} from './AdvancedMotionTracking';

export { WebGLVisualEffects } from './WebGLVisualEffects';
export type { ShaderEffect, EffectOptions, TransitionOptions } from './WebGLVisualEffects';

export { HuggingFaceIntegration } from './HuggingFaceIntegration';
export type { 
  HuggingFaceOptions,
  ImageToTextResult,
  TextToImageResult,
  TranslationResult,
  SummarizationResult,
  SentimentResult,
  AudioClassificationResult
} from './HuggingFaceIntegration';

export { UnifiedAIService } from './UnifiedAIService';
export type { 
  AIFeatureConfig, 
  ProcessingResult, 
  VideoFrameAIAnalysis 
} from './UnifiedAIService';

// Existing services
export { VideoProcessingEngine } from './VideoProcessingEngine';
export { AIProcessingService } from './AIProcessingService';
export { AssetsLibraryManager } from './AssetsLibraryManager';
export { EffectsLibraryManager } from './EffectsLibraryManager';
export { FrameProcessingService } from './FrameProcessingService';
export { PerformanceOptimizer } from './PerformanceOptimizer';
export { ProcessingManager } from './ProcessingManager';
export { UnifiedLibraryIntegration } from './UnifiedLibraryIntegration';
export { AIEffectsIntegration } from './AIEffectsIntegration';