import { AIProcessingService } from '../../services/AIProcessingService';
import * as tf from '@tensorflow/tfjs';

// Mock TensorFlow
jest.mock('@tensorflow/tfjs');
jest.mock('@tensorflow-models/body-segmentation');
jest.mock('@tensorflow-models/face-landmarks-detection');

describe('AIProcessingService', () => {
  let aiService: AIProcessingService;
  const mockTf = tf as jest.Mocked<typeof tf>;

  beforeEach(async () => {
    aiService = new AIProcessingService();
    jest.clearAllMocks();
    
    // Mock TensorFlow setup
    mockTf.ready.mockResolvedValue();
    await aiService.initialize();
  });

  describe('Initialization', () => {
    it('should initialize TensorFlow models correctly', async () => {
      expect(mockTf.ready).toHaveBeenCalled();
      expect(aiService.isInitialized).toBe(true);
    });

    it('should handle initialization failure', async () => {
      mockTf.ready.mockRejectedValue(new Error('TF initialization failed'));
      
      const newService = new AIProcessingService();
      await expect(newService.initialize()).rejects.toThrow('TF initialization failed');
    });
  });

  describe('Background Removal', () => {
    it('should remove background from image', async () => {
      const mockImageData = new ImageData(640, 480);
      const mockMask = new Uint8Array(640 * 480);
      
      // Mock body segmentation
      const mockSegmentation = {
        segmentPeople: jest.fn().mockResolvedValue([{
          mask: { data: mockMask }
        }])
      };

      jest.doMock('@tensorflow-models/body-segmentation', () => ({
        createSegmenter: jest.fn().mockResolvedValue(mockSegmentation)
      }));

      const result = await aiService.removeBackground(mockImageData);

      expect(result).toBeInstanceOf(ImageData);
      expect(mockSegmentation.segmentPeople).toHaveBeenCalledWith(mockImageData);
    });

    it('should handle background removal errors', async () => {
      const mockImageData = new ImageData(640, 480);
      
      const mockSegmentation = {
        segmentPeople: jest.fn().mockRejectedValue(new Error('Segmentation failed'))
      };

      jest.doMock('@tensorflow-models/body-segmentation', () => ({
        createSegmenter: jest.fn().mockResolvedValue(mockSegmentation)
      }));

      await expect(aiService.removeBackground(mockImageData))
        .rejects.toThrow('Segmentation failed');
    });
  });

  describe('Face Enhancement', () => {
    it('should detect and enhance faces', async () => {
      const mockImageData = new ImageData(640, 480);
      const mockFaceData = {
        faceInViewConfidence: 0.9,
        keypoints: [
          { x: 320, y: 240, name: 'noseTip' },
          { x: 300, y: 220, name: 'leftEye' },
          { x: 340, y: 220, name: 'rightEye' },
        ]
      };

      const mockDetector = {
        estimateFaces: jest.fn().mockResolvedValue([mockFaceData])
      };

      jest.doMock('@tensorflow-models/face-landmarks-detection', () => ({
        createDetector: jest.fn().mockResolvedValue(mockDetector)
      }));

      const result = await aiService.enhanceFaces(mockImageData, {
        smoothing: 0.5,
        brightening: 0.3,
        sharpen: 0.4
      });

      expect(result).toBeInstanceOf(ImageData);
      expect(mockDetector.estimateFaces).toHaveBeenCalledWith(mockImageData);
    });

    it('should handle no faces detected', async () => {
      const mockImageData = new ImageData(640, 480);

      const mockDetector = {
        estimateFaces: jest.fn().mockResolvedValue([])
      };

      jest.doMock('@tensorflow-models/face-landmarks-detection', () => ({
        createDetector: jest.fn().mockResolvedValue(mockDetector)
      }));

      const result = await aiService.enhanceFaces(mockImageData, {
        smoothing: 0.5,
        brightening: 0.3,
        sharpen: 0.4
      });

      // Should return original image if no faces detected
      expect(result).toEqual(mockImageData);
    });
  });

  describe('Object Tracking', () => {
    it('should track objects across frames', async () => {
      const mockFrames = [
        new ImageData(640, 480),
        new ImageData(640, 480),
        new ImageData(640, 480),
      ];

      const mockBoundingBox = { x: 100, y: 100, width: 200, height: 200 };

      const trackingResult = await aiService.trackObject(mockFrames, mockBoundingBox);

      expect(trackingResult).toHaveLength(mockFrames.length);
      expect(trackingResult[0]).toEqual(mockBoundingBox);
    });

    it('should handle tracking failure', async () => {
      const mockFrames = [new ImageData(640, 480)];
      const mockBoundingBox = { x: 100, y: 100, width: 200, height: 200 };

      // Mock tracking failure by providing invalid frames
      const invalidFrames: any[] = [null];

      await expect(aiService.trackObject(invalidFrames, mockBoundingBox))
        .rejects.toThrow();
    });
  });

  describe('Style Transfer', () => {
    it('should apply style transfer to image', async () => {
      const mockImageData = new ImageData(640, 480);
      const mockStyleImage = new ImageData(256, 256);

      // Mock style transfer model
      const mockModel = {
        predict: jest.fn().mockReturnValue({
          dataSync: jest.fn().mockReturnValue(new Float32Array(640 * 480 * 4))
        })
      };

      mockTf.loadLayersModel.mockResolvedValue(mockModel as any);

      const result = await aiService.applyStyleTransfer(
        mockImageData,
        mockStyleImage,
        { strength: 0.8 }
      );

      expect(result).toBeInstanceOf(ImageData);
      expect(mockModel.predict).toHaveBeenCalled();
    });

    it('should handle style transfer with different strength levels', async () => {
      const mockImageData = new ImageData(640, 480);
      const mockStyleImage = new ImageData(256, 256);

      const mockModel = {
        predict: jest.fn().mockReturnValue({
          dataSync: jest.fn().mockReturnValue(new Float32Array(640 * 480 * 4))
        })
      };

      mockTf.loadLayersModel.mockResolvedValue(mockModel as any);

      // Test with low strength
      await aiService.applyStyleTransfer(
        mockImageData,
        mockStyleImage,
        { strength: 0.2 }
      );

      // Test with high strength
      await aiService.applyStyleTransfer(
        mockImageData,
        mockStyleImage,
        { strength: 1.0 }
      );

      expect(mockModel.predict).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto Captioning', () => {
    it('should generate captions for audio', async () => {
      const mockAudioData = new Float32Array(44100); // 1 second of audio at 44.1kHz
      
      const mockResult = {
        text: 'Hello world, this is a test caption.',
        confidence: 0.95,
        timestamps: [
          { start: 0, end: 500, word: 'Hello' },
          { start: 500, end: 1000, word: 'world' },
        ]
      };

      // Mock speech recognition
      const speechRecognitionSpy = jest.spyOn(aiService, 'speechToText')
        .mockResolvedValue(mockResult);

      const result = await aiService.generateCaptions(mockAudioData, {
        language: 'en',
        format: 'srt'
      });

      expect(result.text).toBe(mockResult.text);
      expect(result.timestamps).toHaveLength(2);
      expect(speechRecognitionSpy).toHaveBeenCalledWith(mockAudioData, 'en');
    });

    it('should handle different languages', async () => {
      const mockAudioData = new Float32Array(44100);
      
      const mockResult = {
        text: 'مرحبا بالعالم',
        confidence: 0.9,
        timestamps: []
      };

      jest.spyOn(aiService, 'speechToText').mockResolvedValue(mockResult);

      const result = await aiService.generateCaptions(mockAudioData, {
        language: 'ar',
        format: 'vtt'
      });

      expect(result.text).toBe('مرحبا بالعالم');
    });
  });

  describe('Motion Stabilization', () => {
    it('should stabilize shaky video frames', async () => {
      const mockFrames = [
        new ImageData(640, 480),
        new ImageData(640, 480),
        new ImageData(640, 480),
      ];

      const stabilizedFrames = await aiService.stabilizeMotion(mockFrames, {
        strength: 0.7,
        cropFactor: 0.1
      });

      expect(stabilizedFrames).toHaveLength(mockFrames.length);
      expect(stabilizedFrames[0]).toBeInstanceOf(ImageData);
    });

    it('should handle stabilization with different parameters', async () => {
      const mockFrames = [new ImageData(640, 480), new ImageData(640, 480)];

      // Test with high stabilization
      const highStabilization = await aiService.stabilizeMotion(mockFrames, {
        strength: 1.0,
        cropFactor: 0.2
      });

      // Test with low stabilization
      const lowStabilization = await aiService.stabilizeMotion(mockFrames, {
        strength: 0.3,
        cropFactor: 0.05
      });

      expect(highStabilization).toHaveLength(2);
      expect(lowStabilization).toHaveLength(2);
    });
  });

  describe('Performance Optimization', () => {
    it('should process images in batches', async () => {
      const mockImages = Array(10).fill(null).map(() => new ImageData(320, 240));
      
      const batchProcessor = jest.spyOn(aiService, 'processBatch');
      
      await aiService.processBatch(mockImages, async (img) => {
        return aiService.removeBackground(img);
      }, { batchSize: 3 });

      expect(batchProcessor).toHaveBeenCalled();
    });

    it('should handle memory cleanup', async () => {
      const mockTensors = [
        { dispose: jest.fn() },
        { dispose: jest.fn() },
      ];

      aiService.cleanup(mockTensors as any);

      mockTensors.forEach(tensor => {
        expect(tensor.dispose).toHaveBeenCalled();
      });
    });
  });
});