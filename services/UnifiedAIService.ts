/**
 * Unified AI Service
 * Combines all AI services into a single interface
 * Provides high-level AI features for video editing
 */

import { AdvancedSpeechToText, TranscriptionResult, SpeechToTextOptions } from './AdvancedSpeechToText';
import { AdvancedBackgroundRemoval, BackgroundRemovalOptions, SegmentationResult } from './AdvancedBackgroundRemoval';
import { AdvancedMotionTracking, TrackingOptions, TrackingResult } from './AdvancedMotionTracking';
import { WebGLVisualEffects, EffectOptions } from './WebGLVisualEffects';
import { HuggingFaceIntegration, HuggingFaceOptions } from './HuggingFaceIntegration';

export interface AIFeatureConfig {
  speechToText: {
    enabled: boolean;
    model: 'web-speech' | 'tensorflow' | 'huggingface';
    language: string;
  };
  backgroundRemoval: {
    enabled: boolean;
    model: 'general' | 'portrait' | 'landscape' | 'precise';
    realTime: boolean;
  };
  motionTracking: {
    enabled: boolean;
    type: 'object' | 'face' | 'hand' | 'pose' | 'general';
    stabilization: boolean;
  };
  visualEffects: {
    enabled: boolean;
    webglAcceleration: boolean;
  };
  huggingFace: {
    enabled: boolean;
    apiKey?: string;
  };
}

export interface ProcessingResult {
  success: boolean;
  result?: any;
  error?: string;
  metadata: {
    processingTime: number;
    service: string;
    model?: string;
  };
}

export interface VideoFrameAIAnalysis {
  objects?: TrackingResult;
  backgroundMask?: SegmentationResult;
  captions?: TranscriptionResult;
  visualEffects?: ImageData;
  sentiment?: { label: string; score: number };
  summary?: string;
}

export class UnifiedAIService {
  private speechService: AdvancedSpeechToText;
  private backgroundService: AdvancedBackgroundRemoval;
  private trackingService: AdvancedMotionTracking;
  private effectsService: WebGLVisualEffects;
  private huggingFaceService: HuggingFaceIntegration;
  
  private isInitialized: boolean = false;
  private config: AIFeatureConfig;

  constructor(config: Partial<AIFeatureConfig> = {}) {
    this.config = {
      speechToText: {
        enabled: true,
        model: 'web-speech',
        language: 'en-US',
        ...config.speechToText
      },
      backgroundRemoval: {
        enabled: true,
        model: 'general',
        realTime: true,
        ...config.backgroundRemoval
      },
      motionTracking: {
        enabled: true,
        type: 'general',
        stabilization: true,
        ...config.motionTracking
      },
      visualEffects: {
        enabled: true,
        webglAcceleration: true,
        ...config.visualEffects
      },
      huggingFace: {
        enabled: true,
        ...config.huggingFace
      }
    };

    // Initialize services
    this.speechService = new AdvancedSpeechToText();
    this.backgroundService = new AdvancedBackgroundRemoval();
    this.trackingService = new AdvancedMotionTracking();
    this.effectsService = new WebGLVisualEffects();
    this.huggingFaceService = new HuggingFaceIntegration(this.config.huggingFace.apiKey);
  }

  /**
   * Initialize all AI services
   */
  async initialize(): Promise<void> {
    try {
      // console.log('Initializing Unified AI Service...'); // Removed for production
      
      const initPromises: Promise<void>[] = [];

      if (this.config.speechToText.enabled) {
        initPromises.push(this.speechService.initialize());
      }

      if (this.config.backgroundRemoval.enabled) {
        initPromises.push(this.backgroundService.initialize(this.config.backgroundRemoval.model));
      }

      if (this.config.motionTracking.enabled) {
        initPromises.push(this.trackingService.initialize({
          trackingType: this.config.motionTracking.type,
          maxObjects: 10,
          confidenceThreshold: 0.5,
          enableStabilization: this.config.motionTracking.stabilization,
          enableMotionBlur: false,
          trackingPersistence: 5
        }));
      }

      if (this.config.visualEffects.enabled) {
        initPromises.push(this.effectsService.initialize());
      }

      if (this.config.huggingFace.enabled) {
        initPromises.push(this.huggingFaceService.initialize());
      }

      await Promise.allSettled(initPromises);
      
      this.isInitialized = true;
      // console.log('Unified AI Service initialized successfully'); // Removed for production
    } catch (error) {
      console.error('Failed to initialize Unified AI Service:', error);
      throw error;
    }
  }

  /**
   * Process video frame with all AI features
   */
  async processVideoFrame(
    frame: ImageData,
    audioData?: Float32Array,
    previousFrame?: ImageData
  ): Promise<VideoFrameAIAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results: VideoFrameAIAnalysis = {};
    const processingPromises: Promise<void>[] = [];

    // Object tracking and motion analysis
    if (this.config.motionTracking.enabled) {
      processingPromises.push(
        this.trackingService.trackFrame(frame, {
          trackingType: this.config.motionTracking.type,
          maxObjects: 10,
          confidenceThreshold: 0.5,
          enableStabilization: this.config.motionTracking.stabilization,
          enableMotionBlur: false,
          trackingPersistence: 5
        }).then(result => {
          results.objects = result;
        }).catch(error => {
          console.warn('Motion tracking failed:', error);
        })
      );
    }

    // Background removal
    if (this.config.backgroundRemoval.enabled) {
      processingPromises.push(
        this.backgroundService.removeBackground(frame, {
          model: this.config.backgroundRemoval.model,
          edgeRefinement: !this.config.backgroundRemoval.realTime,
          smoothing: 0.3,
          feathering: 0.2,
          backgroundType: 'transparent'
        }).then(result => {
          results.backgroundMask = result;
        }).catch(error => {
          console.warn('Background removal failed:', error);
        })
      );
    }

    // Audio processing for captions
    if (this.config.speechToText.enabled && audioData) {
      processingPromises.push(
        this.processAudioForCaptions(audioData).then(result => {
          results.captions = result;
        }).catch(error => {
          console.warn('Speech-to-text failed:', error);
        })
      );
    }

    await Promise.allSettled(processingPromises);
    
    return results;
  }

  /**
   * Generate automatic captions from audio
   */
  async generateAutoCaptions(
    audioBuffer: ArrayBuffer,
    options: Partial<SpeechToTextOptions> = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.speechToText.enabled) {
        throw new Error('Speech-to-text is disabled');
      }

      let result: TranscriptionResult;

      switch (this.config.speechToText.model) {
        case 'huggingface':
          const hfResult = await this.huggingFaceService.speechToText(audioBuffer, {
            model: 'facebook/wav2vec2-base-960h'
          });
          result = {
            text: hfResult.text,
            confidence: hfResult.confidence,
            timestamps: [],
            language: options.language || 'en-US'
          };
          break;

        case 'tensorflow':
        case 'web-speech':
        default:
          result = await this.speechService.processAudioFile(audioBuffer, {
            language: options.language || this.config.speechToText.language,
            continuous: true,
            interimResults: false,
            maxAlternatives: 1,
            enablePunctuation: true,
            ...options
          });
          break;
      }

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'speech-to-text',
          model: this.config.speechToText.model
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'speech-to-text'
        }
      };
    }
  }

  /**
   * Remove background from image
   */
  async removeBackground(
    image: ImageData,
    options: Partial<BackgroundRemovalOptions> = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.backgroundRemoval.enabled) {
        throw new Error('Background removal is disabled');
      }

      const result = await this.backgroundService.removeBackground(image, {
        model: this.config.backgroundRemoval.model,
        edgeRefinement: true,
        smoothing: 0.5,
        feathering: 0.3,
        backgroundType: 'transparent',
        ...options
      });

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'background-removal',
          model: this.config.backgroundRemoval.model
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'background-removal'
        }
      };
    }
  }

  /**
   * Track objects in video
   */
  async trackObjects(
    frame: ImageData,
    options: Partial<TrackingOptions> = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.motionTracking.enabled) {
        throw new Error('Motion tracking is disabled');
      }

      const result = await this.trackingService.trackFrame(frame, {
        trackingType: this.config.motionTracking.type,
        maxObjects: 10,
        confidenceThreshold: 0.5,
        enableStabilization: this.config.motionTracking.stabilization,
        enableMotionBlur: false,
        trackingPersistence: 5,
        ...options
      });

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'motion-tracking',
          model: this.config.motionTracking.type
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'motion-tracking'
        }
      };
    }
  }

  /**
   * Apply visual effects
   */
  async applyVisualEffect(
    image: ImageData,
    effectName: string,
    options: EffectOptions
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.visualEffects.enabled) {
        throw new Error('Visual effects are disabled');
      }

      const result = await this.effectsService.applyEffect(image, effectName, options);

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'visual-effects',
          model: effectName
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'visual-effects'
        }
      };
    }
  }

  /**
   * Generate image from text using AI
   */
  async generateImageFromText(
    prompt: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.huggingFace.enabled) {
        throw new Error('Hugging Face integration is disabled');
      }

      const result = await this.huggingFaceService.generateImageFromText(prompt, options);

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face',
          model: options.model || 'stable-diffusion'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face'
        }
      };
    }
  }

  /**
   * Generate image caption
   */
  async generateImageCaption(
    image: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.huggingFace.enabled) {
        throw new Error('Hugging Face integration is disabled');
      }

      const result = await this.huggingFaceService.generateImageCaption(image, options);

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face',
          model: options.model || 'blip'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face'
        }
      };
    }
  }

  /**
   * Translate text
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.huggingFace.enabled) {
        throw new Error('Hugging Face integration is disabled');
      }

      const result = await this.huggingFaceService.translateText(
        text,
        sourceLanguage,
        targetLanguage
      );

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face',
          model: 'translation'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face'
        }
      };
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.huggingFace.enabled) {
        throw new Error('Hugging Face integration is disabled');
      }

      const result = await this.huggingFaceService.analyzeSentiment(text);

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face',
          model: 'sentiment-analysis'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face'
        }
      };
    }
  }

  /**
   * Summarize text
   */
  async summarizeText(text: string): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.config.huggingFace.enabled) {
        throw new Error('Hugging Face integration is disabled');
      }

      const result = await this.huggingFaceService.summarizeText(text);

      return {
        success: true,
        result,
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face',
          model: 'summarization'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: performance.now() - startTime,
          service: 'hugging-face'
        }
      };
    }
  }

  /**
   * Process audio for captions (internal helper)
   */
  private async processAudioForCaptions(audioData: Float32Array): Promise<TranscriptionResult> {
    // Convert Float32Array to ArrayBuffer
    const buffer = audioData.buffer.slice(
      audioData.byteOffset,
      audioData.byteOffset + audioData.byteLength
    );

    const result = await this.generateAutoCaptions(buffer);
    
    if (result.success) {
      return result.result as TranscriptionResult;
    } else {
      throw new Error(result.error || 'Caption generation failed');
    }
  }

  /**
   * Get available AI features
   */
  getAvailableFeatures(): { [key: string]: boolean } {
    return {
      speechToText: this.config.speechToText.enabled,
      backgroundRemoval: this.config.backgroundRemoval.enabled,
      motionTracking: this.config.motionTracking.enabled,
      visualEffects: this.config.visualEffects.enabled,
      huggingFace: this.config.huggingFace.enabled,
      textGeneration: this.config.huggingFace.enabled,
      imageGeneration: this.config.huggingFace.enabled,
      translation: this.config.huggingFace.enabled,
      sentimentAnalysis: this.config.huggingFace.enabled,
      summarization: this.config.huggingFace.enabled,
      imageClassification: this.config.huggingFace.enabled,
      objectDetection: this.config.motionTracking.enabled || this.config.huggingFace.enabled
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): { [service: string]: any } {
    return {
      speechToText: {
        isInitialized: this.speechService.isInitialized,
        supportedLanguages: this.speechService.getSupportedLanguages()
      },
      backgroundRemoval: {
        isInitialized: this.backgroundService['isInitialized']
      },
      motionTracking: {
        isInitialized: this.trackingService['isInitialized'],
        activeTrackers: this.trackingService['activeTrackers']?.size || 0
      },
      visualEffects: {
        isInitialized: this.effectsService['isInitialized'],
        availableEffects: this.effectsService.getAvailableEffects()
      },
      huggingFace: {
        availableModels: this.huggingFaceService.getAvailableModels()
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AIFeatureConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Reset all tracking state
   */
  resetState(): void {
    this.trackingService.reset();
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.speechService.cleanup();
    this.backgroundService.cleanup();
    this.trackingService.cleanup();
    this.effectsService.cleanup();
    
    this.isInitialized = false;
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ [service: string]: boolean }> {
    const checks: { [service: string]: Promise<boolean> } = {};

    if (this.config.speechToText.enabled) {
      checks.speechToText = Promise.resolve(this.speechService.isInitialized);
    }

    if (this.config.backgroundRemoval.enabled) {
      checks.backgroundRemoval = Promise.resolve(this.backgroundService['isInitialized']);
    }

    if (this.config.motionTracking.enabled) {
      checks.motionTracking = Promise.resolve(this.trackingService['isInitialized']);
    }

    if (this.config.visualEffects.enabled) {
      checks.visualEffects = Promise.resolve(this.effectsService['isInitialized']);
    }

    if (this.config.huggingFace.enabled) {
      checks.huggingFace = this.huggingFaceService.checkModelAvailability('gpt2');
    }

    const results = await Promise.allSettled(
      Object.entries(checks).map(async ([service, check]) => [service, await check])
    );

    const healthStatus: { [service: string]: boolean } = {};
    
    results.forEach((result, index) => {
      const [service] = Object.keys(checks)[index];
      healthStatus[service] = result.status === 'fulfilled' && result.value[1];
    });

    return healthStatus;
  }
}