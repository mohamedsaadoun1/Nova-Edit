/**
 * Advanced Color Grading Service
 * Professional color correction and grading tools using Color.js
 * Supports LUTs, color wheels, curves, and advanced color manipulation
 */

// Note: In a real implementation, you would install color.js via npm
// For this demo, we'll implement the core functionality

export interface ColorGradingOptions {
  exposure: number; // -3 to +3
  contrast: number; // -100 to +100
  highlights: number; // -100 to +100
  shadows: number; // -100 to +100
  whites: number; // -100 to +100
  blacks: number; // -100 to +100
  clarity: number; // -100 to +100
  vibrance: number; // -100 to +100
  saturation: number; // -100 to +100
  temperature: number; // 2000K to 11000K
  tint: number; // -100 to +100 (green to magenta)
  hue: number; // -180 to +180
}

export interface ColorWheelAdjustment {
  shadows: { lift: number; gamma: number; gain: number };
  midtones: { lift: number; gamma: number; gain: number };
  highlights: { lift: number; gamma: number; gain: number };
  master: { lift: number; gamma: number; gain: number };
}

export interface HSLCurve {
  hue: number[];
  saturation: number[];
  luminance: number[];
}

export interface RGBCurve {
  red: number[];
  green: number[];
  blue: number[];
  master: number[];
}

export interface LUTData {
  name: string;
  data: Float32Array;
  size: number; // Usually 33x33x33 or 65x65x65
  format: '3D' | '1D';
}

export interface ColorGradingResult {
  processedImage: ImageData;
  appliedAdjustments: ColorGradingOptions;
  processingTime: number;
  histogram: {
    red: number[];
    green: number[];
    blue: number[];
    luminance: number[];
  };
}

export class AdvancedColorGrading {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private workingColorSpace: string = 'rec2020'; // Professional color space
  private lutCache: Map<string, LUTData> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', {
      colorSpace: 'rec2020',
      alpha: true
    })!;
  }

  /**
   * Apply comprehensive color grading to image
   */
  async applyColorGrading(
    inputImage: ImageData,
    options: Partial<ColorGradingOptions>
  ): Promise<ColorGradingResult> {
    const startTime = performance.now();
    
    // Setup canvas
    this.setupCanvas(inputImage.width, inputImage.height);
    
    // Create working copy
    const workingImage = new ImageData(
      new Uint8ClampedArray(inputImage.data),
      inputImage.width,
      inputImage.height
    );

    // Apply adjustments in professional order
    this.applyExposure(workingImage, options.exposure || 0);
    this.applyContrast(workingImage, options.contrast || 0);
    this.applyHighlightsShadows(workingImage, options.highlights || 0, options.shadows || 0);
    this.applyWhitesBlacks(workingImage, options.whites || 0, options.blacks || 0);
    this.applyTemperatureTint(workingImage, options.temperature || 6500, options.tint || 0);
    this.applyClarity(workingImage, options.clarity || 0);
    this.applyVibranceSaturation(workingImage, options.vibrance || 0, options.saturation || 0);
    this.applyHueShift(workingImage, options.hue || 0);

    // Generate histogram
    const histogram = this.generateHistogram(workingImage);

    const processingTime = performance.now() - startTime;

    return {
      processedImage: workingImage,
      appliedAdjustments: options as ColorGradingOptions,
      processingTime,
      histogram
    };
  }

  /**
   * Apply exposure adjustment (similar to camera exposure)
   */
  private applyExposure(imageData: ImageData, exposure: number): void {
    const data = imageData.data;
    const multiplier = Math.pow(2, exposure); // Exposure in stops
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert to linear space, apply exposure, convert back
      const r = this.sRGBToLinear(data[i] / 255) * multiplier;
      const g = this.sRGBToLinear(data[i + 1] / 255) * multiplier;
      const b = this.sRGBToLinear(data[i + 2] / 255) * multiplier;
      
      data[i] = Math.round(this.linearToSRGB(r) * 255);
      data[i + 1] = Math.round(this.linearToSRGB(g) * 255);
      data[i + 2] = Math.round(this.linearToSRGB(b) * 255);
    }
  }

  /**
   * Apply contrast adjustment
   */
  private applyContrast(imageData: ImageData, contrast: number): void {
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
  }

  /**
   * Apply highlights and shadows adjustment
   */
  private applyHighlightsShadows(
    imageData: ImageData,
    highlights: number,
    shadows: number
  ): void {
    const data = imageData.data;
    const highlightFactor = 1 - highlights / 100;
    const shadowFactor = 1 + shadows / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Calculate luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply highlight/shadow masks
      const highlightMask = this.smoothStep(0.5, 1.0, lum);
      const shadowMask = this.smoothStep(0.0, 0.5, 1 - lum);
      
      const highlightAdjust = 1 + (highlightFactor - 1) * highlightMask;
      const shadowAdjust = 1 + (shadowFactor - 1) * shadowMask;
      
      data[i] = Math.max(0, Math.min(255, data[i] * highlightAdjust * shadowAdjust));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * highlightAdjust * shadowAdjust));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * highlightAdjust * shadowAdjust));
    }
  }

  /**
   * Apply whites and blacks adjustment
   */
  private applyWhitesBlacks(imageData: ImageData, whites: number, blacks: number): void {
    const data = imageData.data;
    const whitePoint = 255 + (whites * 2.55);
    const blackPoint = blacks * 2.55;
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply white point adjustment
      data[i] = Math.max(0, Math.min(255, (data[i] / 255) * (whitePoint / 255) * 255));
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] / 255) * (whitePoint / 255) * 255));
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] / 255) * (whitePoint / 255) * 255));
      
      // Apply black point adjustment
      data[i] = Math.max(blackPoint, data[i]);
      data[i + 1] = Math.max(blackPoint, data[i + 1]);
      data[i + 2] = Math.max(blackPoint, data[i + 2]);
    }
  }

  /**
   * Apply temperature and tint adjustment
   */
  private applyTemperatureTint(imageData: ImageData, temperature: number, tint: number): void {
    const data = imageData.data;
    
    // Convert temperature to RGB multipliers
    const tempRGB = this.temperatureToRGB(temperature);
    
    // Convert tint to green/magenta adjustment
    const tintFactor = tint / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply temperature
      data[i] = Math.max(0, Math.min(255, data[i] * tempRGB.r));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * tempRGB.g));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * tempRGB.b));
      
      // Apply tint (green/magenta)
      if (tintFactor > 0) {
        // Add magenta (reduce green)
        data[i + 1] = Math.max(0, data[i + 1] * (1 - tintFactor * 0.3));
      } else {
        // Add green (reduce red and blue)
        data[i] = Math.max(0, data[i] * (1 + tintFactor * 0.3));
        data[i + 2] = Math.max(0, data[i + 2] * (1 + tintFactor * 0.3));
      }
    }
  }

  /**
   * Apply clarity adjustment (local contrast enhancement)
   */
  private applyClarity(imageData: ImageData, clarity: number): void {
    if (clarity === 0) return;
    
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const factor = clarity / 100;
    
    // Create luminance channel
    const luminance = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      luminance[idx] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    }
    
    // Apply unsharp mask for clarity
    const blurred = this.gaussianBlur(luminance, width, height, 5);
    
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      const original = luminance[idx];
      const blur = blurred[idx];
      const diff = original - blur;
      const enhanced = original + diff * factor;
      
      // Apply enhancement proportionally to RGB
      const enhancementFactor = enhanced / original;
      data[i] = Math.max(0, Math.min(255, data[i] * enhancementFactor));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * enhancementFactor));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * enhancementFactor));
    }
  }

  /**
   * Apply vibrance and saturation
   */
  private applyVibranceSaturation(
    imageData: ImageData,
    vibrance: number,
    saturation: number
  ): void {
    const data = imageData.data;
    const vibranceFactor = vibrance / 100;
    const saturationFactor = 1 + saturation / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Convert to HSL
      const hsl = this.rgbToHsl(r, g, b);
      
      // Apply saturation
      hsl.s *= saturationFactor;
      
      // Apply vibrance (affects less saturated colors more)
      const vibranceAmount = vibranceFactor * (1 - hsl.s);
      hsl.s += vibranceAmount;
      
      // Clamp saturation
      hsl.s = Math.max(0, Math.min(1, hsl.s));
      
      // Convert back to RGB
      const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
      
      data[i] = Math.round(rgb.r * 255);
      data[i + 1] = Math.round(rgb.g * 255);
      data[i + 2] = Math.round(rgb.b * 255);
    }
  }

  /**
   * Apply hue shift
   */
  private applyHueShift(imageData: ImageData, hueShift: number): void {
    if (hueShift === 0) return;
    
    const data = imageData.data;
    const shift = hueShift / 360; // Convert to 0-1 range
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const hsl = this.rgbToHsl(r, g, b);
      hsl.h = (hsl.h + shift) % 1;
      if (hsl.h < 0) hsl.h += 1;
      
      const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
      
      data[i] = Math.round(rgb.r * 255);
      data[i + 1] = Math.round(rgb.g * 255);
      data[i + 2] = Math.round(rgb.b * 255);
    }
  }

  /**
   * Apply color wheel adjustments (lift, gamma, gain)
   */
  applyColorWheels(
    imageData: ImageData,
    adjustments: ColorWheelAdjustment
  ): ImageData {
    const data = imageData.data;
    const result = new ImageData(
      new Uint8ClampedArray(data),
      imageData.width,
      imageData.height
    );
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Calculate luminance for range masks
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Create range masks
      const shadowMask = this.smoothStep(0.0, 0.33, 1 - lum);
      const midtoneMask = 1 - Math.abs(lum - 0.5) * 2;
      const highlightMask = this.smoothStep(0.66, 1.0, lum);
      
      // Apply adjustments for each range
      let adjR = r, adjG = g, adjB = b;
      
      // Shadows
      adjR = this.applyLiftGammaGain(adjR, adjustments.shadows) * shadowMask + adjR * (1 - shadowMask);
      adjG = this.applyLiftGammaGain(adjG, adjustments.shadows) * shadowMask + adjG * (1 - shadowMask);
      adjB = this.applyLiftGammaGain(adjB, adjustments.shadows) * shadowMask + adjB * (1 - shadowMask);
      
      // Midtones
      adjR = this.applyLiftGammaGain(adjR, adjustments.midtones) * midtoneMask + adjR * (1 - midtoneMask);
      adjG = this.applyLiftGammaGain(adjG, adjustments.midtones) * midtoneMask + adjG * (1 - midtoneMask);
      adjB = this.applyLiftGammaGain(adjB, adjustments.midtones) * midtoneMask + adjB * (1 - midtoneMask);
      
      // Highlights
      adjR = this.applyLiftGammaGain(adjR, adjustments.highlights) * highlightMask + adjR * (1 - highlightMask);
      adjG = this.applyLiftGammaGain(adjG, adjustments.highlights) * highlightMask + adjG * (1 - highlightMask);
      adjB = this.applyLiftGammaGain(adjB, adjustments.highlights) * highlightMask + adjB * (1 - highlightMask);
      
      // Master
      adjR = this.applyLiftGammaGain(adjR, adjustments.master);
      adjG = this.applyLiftGammaGain(adjG, adjustments.master);
      adjB = this.applyLiftGammaGain(adjB, adjustments.master);
      
      resultData[i] = Math.max(0, Math.min(255, adjR * 255));
      resultData[i + 1] = Math.max(0, Math.min(255, adjG * 255));
      resultData[i + 2] = Math.max(0, Math.min(255, adjB * 255));
    }
    
    return result;
  }

  /**
   * Apply RGB curves
   */
  applyRGBCurves(imageData: ImageData, curves: Partial<RGBCurve>): ImageData {
    const data = imageData.data;
    const result = new ImageData(
      new Uint8ClampedArray(data),
      imageData.width,
      imageData.height
    );
    const resultData = result.data;
    
    // Create lookup tables for each channel
    const redLUT = this.createCurveLUT(curves.red || this.createLinearCurve());
    const greenLUT = this.createCurveLUT(curves.green || this.createLinearCurve());
    const blueLUT = this.createCurveLUT(curves.blue || this.createLinearCurve());
    const masterLUT = this.createCurveLUT(curves.master || this.createLinearCurve());
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply curves
      let r = redLUT[data[i]];
      let g = greenLUT[data[i + 1]];
      let b = blueLUT[data[i + 2]];
      
      // Apply master curve to luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const adjustedLum = masterLUT[Math.round(lum)];
      const lumFactor = adjustedLum / lum;
      
      r *= lumFactor;
      g *= lumFactor;
      b *= lumFactor;
      
      resultData[i] = Math.max(0, Math.min(255, r));
      resultData[i + 1] = Math.max(0, Math.min(255, g));
      resultData[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    return result;
  }

  /**
   * Apply 3D LUT
   */
  async apply3DLUT(imageData: ImageData, lut: LUTData): Promise<ImageData> {
    const data = imageData.data;
    const result = new ImageData(
      new Uint8ClampedArray(data),
      imageData.width,
      imageData.height
    );
    const resultData = result.data;
    
    if (lut.format !== '3D') {
      throw new Error('Only 3D LUTs are supported');
    }
    
    const lutSize = lut.size;
    const lutData = lut.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Trilinear interpolation in LUT
      const lutCoords = this.interpolate3DLUT(r, g, b, lutData, lutSize);
      
      resultData[i] = Math.round(lutCoords.r * 255);
      resultData[i + 1] = Math.round(lutCoords.g * 255);
      resultData[i + 2] = Math.round(lutCoords.b * 255);
    }
    
    return result;
  }

  /**
   * Load LUT from file
   */
  async loadLUT(file: File): Promise<LUTData> {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Detect LUT format
    if (lines[0].includes('LUT_3D_SIZE')) {
      return this.parseCubeLUT(lines);
    } else if (lines[0].includes('TITLE')) {
      return this.parse3dlLUT(lines);
    } else {
      throw new Error('Unsupported LUT format');
    }
  }

  /**
   * Generate histogram data
   */
  private generateHistogram(imageData: ImageData): {
    red: number[];
    green: number[];
    blue: number[];
    luminance: number[];
  } {
    const data = imageData.data;
    const red = new Array(256).fill(0);
    const green = new Array(256).fill(0);
    const blue = new Array(256).fill(0);
    const luminance = new Array(256).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
      red[data[i]]++;
      green[data[i + 1]]++;
      blue[data[i + 2]]++;
      
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      luminance[lum]++;
    }
    
    return { red, green, blue, luminance };
  }

  // Utility methods
  private setupCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private sRGBToLinear(value: number): number {
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }

  private linearToSRGB(value: number): number {
    return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }

  private smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  private temperatureToRGB(temperature: number): { r: number; g: number; b: number } {
    // Simplified temperature to RGB conversion
    const temp = temperature / 100;
    let r = 255, g = 255, b = 255;
    
    if (temp <= 66) {
      r = 255;
      g = temp <= 19 ? 0 : 99.4708025861 * Math.log(temp - 10) - 161.1195681661;
      b = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    } else {
      r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
      b = 255;
    }
    
    return {
      r: Math.max(0, Math.min(255, r)) / 255,
      g: Math.max(0, Math.min(255, g)) / 255,
      b: Math.max(0, Math.min(255, b)) / 255
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;
    
    let h = 0, s = 0;
    
    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add);
      
      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }
    
    return { h, s, l };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return { r, g, b };
  }

  private gaussianBlur(data: Float32Array, width: number, height: number, radius: number): Float32Array {
    const result = new Float32Array(data.length);
    // Simplified Gaussian blur implementation
    // In production, use separable convolution for efficiency
    
    const kernel = this.createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const halfKernel = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            
            const dataIndex = py * width + px;
            const kernelIndex = (ky + halfKernel) * kernelSize + (kx + halfKernel);
            const weight = kernel[kernelIndex];
            
            sum += data[dataIndex] * weight;
            weightSum += weight;
          }
        }
        
        result[y * width + x] = sum / weightSum;
      }
    }
    
    return result;
  }

  private createGaussianKernel(radius: number): number[] {
    const size = radius * 2 + 1;
    const kernel = new Array(size * size);
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    let sum = 0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const value = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquare);
        kernel[y * size + x] = value;
        sum += value;
      }
    }

    // Normalize
    return kernel.map(value => value / sum);
  }

  private applyLiftGammaGain(
    value: number,
    adjustments: { lift: number; gamma: number; gain: number }
  ): number {
    // Lift (shadows)
    value = value + adjustments.lift * (1 - value);
    
    // Gamma (midtones)
    if (adjustments.gamma !== 1) {
      value = Math.pow(value, 1 / adjustments.gamma);
    }
    
    // Gain (highlights)
    value = value * adjustments.gain;
    
    return Math.max(0, Math.min(1, value));
  }

  private createLinearCurve(): number[] {
    return Array.from({ length: 256 }, (_, i) => i);
  }

  private createCurveLUT(curvePoints: number[]): number[] {
    const lut = new Array(256);
    
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      const index = t * (curvePoints.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const fraction = index - lower;
      
      if (upper >= curvePoints.length) {
        lut[i] = curvePoints[curvePoints.length - 1];
      } else if (lower === upper) {
        lut[i] = curvePoints[lower];
      } else {
        lut[i] = curvePoints[lower] * (1 - fraction) + curvePoints[upper] * fraction;
      }
    }
    
    return lut;
  }

  private interpolate3DLUT(
    r: number,
    g: number,
    b: number,
    lutData: Float32Array,
    lutSize: number
  ): { r: number; g: number; b: number } {
    // Scale to LUT coordinates
    const lutR = r * (lutSize - 1);
    const lutG = g * (lutSize - 1);
    const lutB = b * (lutSize - 1);
    
    // Get integer and fractional parts
    const r0 = Math.floor(lutR);
    const g0 = Math.floor(lutG);
    const b0 = Math.floor(lutB);
    
    const r1 = Math.min(r0 + 1, lutSize - 1);
    const g1 = Math.min(g0 + 1, lutSize - 1);
    const b1 = Math.min(b0 + 1, lutSize - 1);
    
    const fr = lutR - r0;
    const fg = lutG - g0;
    const fb = lutB - b0;
    
    // Trilinear interpolation
    const c000 = this.getLUTValue(lutData, r0, g0, b0, lutSize);
    const c001 = this.getLUTValue(lutData, r0, g0, b1, lutSize);
    const c010 = this.getLUTValue(lutData, r0, g1, b0, lutSize);
    const c011 = this.getLUTValue(lutData, r0, g1, b1, lutSize);
    const c100 = this.getLUTValue(lutData, r1, g0, b0, lutSize);
    const c101 = this.getLUTValue(lutData, r1, g0, b1, lutSize);
    const c110 = this.getLUTValue(lutData, r1, g1, b0, lutSize);
    const c111 = this.getLUTValue(lutData, r1, g1, b1, lutSize);
    
    // Interpolate along each axis
    const c00 = this.lerpColor(c000, c001, fb);
    const c01 = this.lerpColor(c010, c011, fb);
    const c10 = this.lerpColor(c100, c101, fb);
    const c11 = this.lerpColor(c110, c111, fb);
    
    const c0 = this.lerpColor(c00, c01, fg);
    const c1 = this.lerpColor(c10, c11, fg);
    
    return this.lerpColor(c0, c1, fr);
  }

  private getLUTValue(
    lutData: Float32Array,
    r: number,
    g: number,
    b: number,
    lutSize: number
  ): { r: number; g: number; b: number } {
    const index = (b * lutSize * lutSize + g * lutSize + r) * 3;
    return {
      r: lutData[index],
      g: lutData[index + 1],
      b: lutData[index + 2]
    };
  }

  private lerpColor(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number },
    t: number
  ): { r: number; g: number; b: number } {
    return {
      r: c1.r + (c2.r - c1.r) * t,
      g: c1.g + (c2.g - c1.g) * t,
      b: c1.b + (c2.b - c1.b) * t
    };
  }

  private parseCubeLUT(lines: string[]): LUTData {
    let size = 33; // Default size
    const data: number[] = [];
    
    for (const line of lines) {
      if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(' ')[1]);
      } else if (line.match(/^[\d\.\s]+$/)) {
        const values = line.split(/\s+/).map(Number);
        if (values.length === 3) {
          data.push(...values);
        }
      }
    }
    
    return {
      name: 'Cube LUT',
      data: new Float32Array(data),
      size,
      format: '3D'
    };
  }

  private parse3dlLUT(lines: string[]): LUTData {
    // Implementation for .3dl format
    // This is a simplified version
    return {
      name: '3DL LUT',
      data: new Float32Array(),
      size: 33,
      format: '3D'
    };
  }

  /**
   * Export current grading as LUT
   */
  exportAsLUT(size: number = 33): LUTData {
    const data = new Float32Array(size * size * size * 3);
    let index = 0;
    
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          // Normalize to 0-1 range
          const rNorm = r / (size - 1);
          const gNorm = g / (size - 1);
          const bNorm = b / (size - 1);
          
          // Create test image data
          const testImage = new ImageData(1, 1);
          testImage.data[0] = Math.round(rNorm * 255);
          testImage.data[1] = Math.round(gNorm * 255);
          testImage.data[2] = Math.round(bNorm * 255);
          testImage.data[3] = 255;
          
          // Apply current grading (would need to store current settings)
          // For now, just pass through
          data[index++] = rNorm;
          data[index++] = gNorm;
          data[index++] = bNorm;
        }
      }
    }
    
    return {
      name: 'Exported LUT',
      data,
      size,
      format: '3D'
    };
  }
}