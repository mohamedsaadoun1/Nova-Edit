/**
 * Hugging Face Integration Service
 * Integrates with free Hugging Face APIs for advanced AI features
 * Includes image processing, NLP, audio processing, and multimodal capabilities
 */

export interface HuggingFaceOptions {
  apiKey?: string; // Optional, many models work without API key
  model: string;
  parameters?: { [key: string]: any };
}

export interface ImageToTextResult {
  generated_text: string;
  confidence: number;
}

export interface TextToImageResult {
  image: string; // Base64 encoded
  seed?: number;
}

export interface TranslationResult {
  translation_text: string;
  confidence: number;
}

export interface SummarizationResult {
  summary_text: string;
  confidence: number;
}

export interface SentimentResult {
  label: string;
  score: number;
}

export interface AudioClassificationResult {
  label: string;
  score: number;
}

export class HuggingFaceIntegration {
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // Test connection with a simple request
      await this.testConnection();
      console.log('Hugging Face Integration initialized successfully');
    } catch (error) {
      console.warn('Hugging Face API may have limited access without API key');
    }
  }

  /**
   * Test connection to Hugging Face API
   */
  private async testConnection(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/microsoft/DialoGPT-medium`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ inputs: 'test' })
    });

    if (!response.ok && response.status !== 503) { // 503 is model loading
      throw new Error(`API test failed: ${response.status}`);
    }
  }

  /**
   * Get request headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Make request to Hugging Face API
   */
  private async makeRequest(
    model: string,
    input: any,
    parameters?: any
  ): Promise<any> {
    const url = `${this.baseUrl}/${model}`;
    
    const requestBody: any = { inputs: input };
    if (parameters) {
      requestBody.parameters = parameters;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (response.status === 503) {
      // Model is loading, wait and retry
      await this.waitForModel(model);
      return this.makeRequest(model, input, parameters);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Wait for model to load
   */
  private async waitForModel(model: string): Promise<void> {
    console.log(`Model ${model} is loading, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
  }

  /**
   * Generate image captions using BLIP or similar models
   */
  async generateImageCaption(
    imageData: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<ImageToTextResult> {
    const model = options.model || 'Salesforce/blip-image-captioning-base';
    
    // Convert ImageData to base64
    const base64Image = this.imageDataToBase64(imageData);
    
    const result = await this.makeRequest(model, base64Image, options.parameters);
    
    return {
      generated_text: result[0]?.generated_text || result.generated_text || '',
      confidence: result[0]?.score || 0.9
    };
  }

  /**
   * Generate images from text using Stable Diffusion
   */
  async generateImageFromText(
    prompt: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<TextToImageResult> {
    const model = options.model || 'runwayml/stable-diffusion-v1-5';
    
    const parameters = {
      num_inference_steps: 30,
      guidance_scale: 7.5,
      ...options.parameters
    };

    const result = await this.makeRequest(model, prompt, parameters);
    
    // Result is typically a blob, convert to base64
    const imageBlob = result instanceof Blob ? result : new Blob([result]);
    const base64 = await this.blobToBase64(imageBlob);
    
    return {
      image: base64,
      seed: parameters.seed
    };
  }

  /**
   * Translate text between languages
   */
  async translateText(
    text: string,
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'en',
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<TranslationResult> {
    // Choose appropriate translation model
    let model = options.model;
    
    if (!model) {
      if (sourceLanguage === 'ar' || targetLanguage === 'ar') {
        model = 'Helsinki-NLP/opus-mt-ar-en';
      } else if (sourceLanguage === 'fr' || targetLanguage === 'fr') {
        model = 'Helsinki-NLP/opus-mt-fr-en';
      } else {
        model = 'Helsinki-NLP/opus-mt-en-fr'; // Default
      }
    }

    const result = await this.makeRequest(model, text, options.parameters);
    
    return {
      translation_text: result[0]?.translation_text || result.translation_text || '',
      confidence: result[0]?.score || 0.9
    };
  }

  /**
   * Summarize text content
   */
  async summarizeText(
    text: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<SummarizationResult> {
    const model = options.model || 'facebook/bart-large-cnn';
    
    const parameters = {
      max_length: 150,
      min_length: 30,
      do_sample: false,
      ...options.parameters
    };

    const result = await this.makeRequest(model, text, parameters);
    
    return {
      summary_text: result[0]?.summary_text || result.summary_text || '',
      confidence: result[0]?.score || 0.9
    };
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(
    text: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<SentimentResult> {
    const model = options.model || 'cardiffnlp/twitter-roberta-base-sentiment-latest';
    
    const result = await this.makeRequest(model, text, options.parameters);
    
    const sentiment = result[0] || result;
    return {
      label: sentiment.label || 'NEUTRAL',
      score: sentiment.score || 0.5
    };
  }

  /**
   * Classify audio content
   */
  async classifyAudio(
    audioData: ArrayBuffer,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<AudioClassificationResult[]> {
    const model = options.model || 'microsoft/speecht5_asr';
    
    // Convert audio data to base64
    const base64Audio = this.arrayBufferToBase64(audioData);
    
    const result = await this.makeRequest(model, base64Audio, options.parameters);
    
    return Array.isArray(result) ? result.map(item => ({
      label: item.label || 'unknown',
      score: item.score || 0
    })) : [{
      label: result.label || 'unknown',
      score: result.score || 0
    }];
  }

  /**
   * Detect objects in image
   */
  async detectObjects(
    imageData: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<Array<{
    label: string;
    score: number;
    box: { xmin: number; ymin: number; xmax: number; ymax: number };
  }>> {
    const model = options.model || 'facebook/detr-resnet-50';
    
    const base64Image = this.imageDataToBase64(imageData);
    const result = await this.makeRequest(model, base64Image, options.parameters);
    
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Generate text from prompt
   */
  async generateText(
    prompt: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<string> {
    const model = options.model || 'gpt2';
    
    const parameters = {
      max_length: 100,
      temperature: 0.7,
      top_p: 0.9,
      ...options.parameters
    };

    const result = await this.makeRequest(model, prompt, parameters);
    
    return result[0]?.generated_text || result.generated_text || '';
  }

  /**
   * Answer questions based on context
   */
  async answerQuestion(
    question: string,
    context: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<{ answer: string; score: number; start: number; end: number }> {
    const model = options.model || 'deepset/roberta-base-squad2';
    
    const input = {
      question,
      context
    };

    const result = await this.makeRequest(model, input, options.parameters);
    
    return {
      answer: result.answer || '',
      score: result.score || 0,
      start: result.start || 0,
      end: result.end || 0
    };
  }

  /**
   * Classify images
   */
  async classifyImage(
    imageData: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<Array<{ label: string; score: number }>> {
    const model = options.model || 'google/vit-base-patch16-224';
    
    const base64Image = this.imageDataToBase64(imageData);
    const result = await this.makeRequest(model, base64Image, options.parameters);
    
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Generate embeddings for text
   */
  async generateTextEmbeddings(
    text: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<number[]> {
    const model = options.model || 'sentence-transformers/all-MiniLM-L6-v2';
    
    const result = await this.makeRequest(model, text, options.parameters);
    
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Perform zero-shot classification
   */
  async zeroShotClassification(
    text: string,
    candidateLabels: string[],
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<Array<{ label: string; score: number }>> {
    const model = options.model || 'facebook/bart-large-mnli';
    
    const input = {
      inputs: text,
      parameters: {
        candidate_labels: candidateLabels,
        ...options.parameters
      }
    };

    const result = await this.makeRequest(model, input.inputs, input.parameters);
    
    const labels = result.labels || [];
    const scores = result.scores || [];
    
    return labels.map((label: string, index: number) => ({
      label,
      score: scores[index] || 0
    }));
  }

  /**
   * Extract features from image
   */
  async extractImageFeatures(
    imageData: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<number[]> {
    const model = options.model || 'google/vit-base-patch16-224-in21k';
    
    const base64Image = this.imageDataToBase64(imageData);
    const result = await this.makeRequest(model, base64Image, options.parameters);
    
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Speech-to-text conversion
   */
  async speechToText(
    audioData: ArrayBuffer,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<{ text: string; confidence: number }> {
    const model = options.model || 'facebook/wav2vec2-base-960h';
    
    const base64Audio = this.arrayBufferToBase64(audioData);
    const result = await this.makeRequest(model, base64Audio, options.parameters);
    
    return {
      text: result.text || '',
      confidence: result.confidence || 0.9
    };
  }

  /**
   * Text-to-speech conversion
   */
  async textToSpeech(
    text: string,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<ArrayBuffer> {
    const model = options.model || 'microsoft/speecht5_tts';
    
    const parameters = {
      voice: 'female',
      speed: 1.0,
      ...options.parameters
    };

    const result = await this.makeRequest(model, text, parameters);
    
    // Convert result to ArrayBuffer
    if (result instanceof ArrayBuffer) {
      return result;
    } else if (result instanceof Blob) {
      return await result.arrayBuffer();
    } else {
      // Assume base64 encoded audio
      return this.base64ToArrayBuffer(result);
    }
  }

  /**
   * Face detection in images
   */
  async detectFaces(
    imageData: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<Array<{
    box: { x: number; y: number; width: number; height: number };
    confidence: number;
    landmarks?: Array<{ x: number; y: number }>;
  }>> {
    const model = options.model || 'microsoft/DialoGPT-medium'; // Placeholder
    
    const base64Image = this.imageDataToBase64(imageData);
    const result = await this.makeRequest(model, base64Image, options.parameters);
    
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Style transfer for images
   */
  async transferStyle(
    contentImage: ImageData,
    styleImage: ImageData,
    options: Partial<HuggingFaceOptions> = {}
  ): Promise<string> {
    const model = options.model || 'arbitrary-style-transfer';
    
    const input = {
      content_image: this.imageDataToBase64(contentImage),
      style_image: this.imageDataToBase64(styleImage)
    };

    const result = await this.makeRequest(model, input, options.parameters);
    
    return result.image || result;
  }

  /**
   * Utility: Convert ImageData to base64
   */
  private imageDataToBase64(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL('image/png').split(',')[1];
  }

  /**
   * Utility: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Utility: Convert Blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get available models for specific tasks
   */
  getAvailableModels(): { [task: string]: string[] } {
    return {
      'image-captioning': [
        'Salesforce/blip-image-captioning-base',
        'nlpconnect/vit-gpt2-image-captioning'
      ],
      'text-to-image': [
        'runwayml/stable-diffusion-v1-5',
        'CompVis/stable-diffusion-v1-4'
      ],
      'translation': [
        'Helsinki-NLP/opus-mt-en-fr',
        'Helsinki-NLP/opus-mt-ar-en',
        'Helsinki-NLP/opus-mt-en-de'
      ],
      'summarization': [
        'facebook/bart-large-cnn',
        'google/pegasus-xsum'
      ],
      'sentiment-analysis': [
        'cardiffnlp/twitter-roberta-base-sentiment-latest',
        'nlptown/bert-base-multilingual-uncased-sentiment'
      ],
      'object-detection': [
        'facebook/detr-resnet-50',
        'microsoft/table-transformer-detection'
      ],
      'speech-to-text': [
        'facebook/wav2vec2-base-960h',
        'openai/whisper-small'
      ],
      'text-generation': [
        'gpt2',
        'microsoft/DialoGPT-medium'
      ],
      'question-answering': [
        'deepset/roberta-base-squad2',
        'distilbert-base-cased-distilled-squad'
      ]
    };
  }

  /**
   * Check model availability
   */
  async checkModelAvailability(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(model: string): Promise<any> {
    const response = await fetch(`https://huggingface.co/api/models/${model}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get model info: ${response.status}`);
    }
    
    return response.json();
  }
}