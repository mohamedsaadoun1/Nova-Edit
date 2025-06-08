/**
 * Advanced Masking System
 * Professional masking and compositing tools using Canvas API
 * Supports vector masks, luminance masks, and complex blending modes
 */

export interface MaskPoint {
  x: number;
  y: number;
  type: 'move' | 'line' | 'curve';
  controlPoint1?: { x: number; y: number };
  controlPoint2?: { x: number; y: number };
}

export interface VectorMask {
  id: string;
  name: string;
  points: MaskPoint[];
  feather: number;
  opacity: number;
  inverted: boolean;
  blendMode: BlendMode;
  closed: boolean;
}

export interface LuminanceMask {
  id: string;
  name: string;
  luminanceRange: {
    min: number; // 0-255
    max: number; // 0-255
    softness: number; // 0-100
  };
  opacity: number;
  inverted: boolean;
}

export interface ColorMask {
  id: string;
  name: string;
  targetColor: { r: number; g: number; b: number };
  tolerance: number; // 0-100
  softness: number; // 0-100
  opacity: number;
  inverted: boolean;
}

export interface GradientMask {
  id: string;
  name: string;
  type: 'linear' | 'radial' | 'angular';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  opacity: number;
  inverted: boolean;
  stops: Array<{ position: number; alpha: number }>;
}

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' 
  | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' 
  | 'lighten' | 'difference' | 'exclusion';

export interface MaskLayer {
  id: string;
  name: string;
  type: 'vector' | 'luminance' | 'color' | 'gradient';
  mask: VectorMask | LuminanceMask | ColorMask | GradientMask;
  visible: boolean;
  locked: boolean;
}

export interface CompositingResult {
  maskedImage: ImageData;
  maskData: ImageData;
  appliedMasks: MaskLayer[];
  processingTime: number;
}

export class AdvancedMaskingSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private workingCanvas: HTMLCanvasElement;
  private workingCtx: CanvasRenderingContext2D;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  
  private masks: MaskLayer[] = [];
  private selectedMask: string | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    
    this.workingCanvas = document.createElement('canvas');
    this.workingCtx = this.workingCanvas.getContext('2d', { willReadFrequently: true })!;
    
    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Create a new vector mask
   */
  createVectorMask(
    name: string,
    points: MaskPoint[],
    options: Partial<Omit<VectorMask, 'id' | 'name' | 'points'>> = {}
  ): string {
    const mask: VectorMask = {
      id: this.generateId(),
      name,
      points,
      feather: options.feather || 0,
      opacity: options.opacity || 100,
      inverted: options.inverted || false,
      blendMode: options.blendMode || 'normal',
      closed: options.closed !== false
    };

    const layer: MaskLayer = {
      id: mask.id,
      name,
      type: 'vector',
      mask,
      visible: true,
      locked: false
    };

    this.masks.push(layer);
    return mask.id;
  }

  /**
   * Create a luminance mask
   */
  createLuminanceMask(
    name: string,
    luminanceRange: { min: number; max: number; softness: number },
    options: Partial<Omit<LuminanceMask, 'id' | 'name' | 'luminanceRange'>> = {}
  ): string {
    const mask: LuminanceMask = {
      id: this.generateId(),
      name,
      luminanceRange,
      opacity: options.opacity || 100,
      inverted: options.inverted || false
    };

    const layer: MaskLayer = {
      id: mask.id,
      name,
      type: 'luminance',
      mask,
      visible: true,
      locked: false
    };

    this.masks.push(layer);
    return mask.id;
  }

  /**
   * Create a color mask
   */
  createColorMask(
    name: string,
    targetColor: { r: number; g: number; b: number },
    tolerance: number,
    options: Partial<Omit<ColorMask, 'id' | 'name' | 'targetColor' | 'tolerance'>> = {}
  ): string {
    const mask: ColorMask = {
      id: this.generateId(),
      name,
      targetColor,
      tolerance,
      softness: options.softness || 0,
      opacity: options.opacity || 100,
      inverted: options.inverted || false
    };

    const layer: MaskLayer = {
      id: mask.id,
      name,
      type: 'color',
      mask,
      visible: true,
      locked: false
    };

    this.masks.push(layer);
    return mask.id;
  }

  /**
   * Create a gradient mask
   */
  createGradientMask(
    name: string,
    type: 'linear' | 'radial' | 'angular',
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    options: Partial<Omit<GradientMask, 'id' | 'name' | 'type' | 'startPoint' | 'endPoint'>> = {}
  ): string {
    const mask: GradientMask = {
      id: this.generateId(),
      name,
      type,
      startPoint,
      endPoint,
      opacity: options.opacity || 100,
      inverted: options.inverted || false,
      stops: options.stops || [
        { position: 0, alpha: 1 },
        { position: 1, alpha: 0 }
      ]
    };

    const layer: MaskLayer = {
      id: mask.id,
      name,
      type: 'gradient',
      mask,
      visible: true,
      locked: false
    };

    this.masks.push(layer);
    return mask.id;
  }

  /**
   * Apply all masks to an image
   */
  async applyMasks(
    sourceImage: ImageData,
    targetImage?: ImageData
  ): Promise<CompositingResult> {
    const startTime = performance.now();

    // Setup canvases
    this.setupCanvases(sourceImage.width, sourceImage.height);

    // Put source image on canvas
    this.ctx.putImageData(sourceImage, 0, 0);

    // Generate combined mask
    const combinedMask = await this.generateCombinedMask(sourceImage);

    // Apply mask to create final composite
    let finalImage: ImageData;
    if (targetImage) {
      finalImage = await this.compositeWithTarget(sourceImage, targetImage, combinedMask);
    } else {
      finalImage = await this.applyMaskToImage(sourceImage, combinedMask);
    }

    const processingTime = performance.now() - startTime;

    return {
      maskedImage: finalImage,
      maskData: combinedMask,
      appliedMasks: this.masks.filter(m => m.visible),
      processingTime
    };
  }

  /**
   * Generate combined mask from all active masks
   */
  private async generateCombinedMask(sourceImage: ImageData): Promise<ImageData> {
    // Clear mask canvas
    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    
    // Start with white (full opacity)
    this.maskCtx.fillStyle = 'white';
    this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);

    // Apply each visible mask
    for (const layer of this.masks) {
      if (!layer.visible) continue;

      const maskData = await this.generateSingleMask(layer, sourceImage);
      await this.blendMask(maskData, layer.mask.opacity || 100);
    }

    return this.maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
  }

  /**
   * Generate a single mask
   */
  private async generateSingleMask(layer: MaskLayer, sourceImage: ImageData): Promise<ImageData> {
    // Create temporary canvas for this mask
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = sourceImage.width;
    tempCanvas.height = sourceImage.height;

    switch (layer.type) {
      case 'vector':
        return this.generateVectorMask(layer.mask as VectorMask, tempCtx);
      case 'luminance':
        return this.generateLuminanceMask(layer.mask as LuminanceMask, sourceImage, tempCtx);
      case 'color':
        return this.generateColorMask(layer.mask as ColorMask, sourceImage, tempCtx);
      case 'gradient':
        return this.generateGradientMask(layer.mask as GradientMask, tempCtx);
      default:
        throw new Error(`Unknown mask type: ${layer.type}`);
    }
  }

  /**
   * Generate vector mask
   */
  private generateVectorMask(mask: VectorMask, ctx: CanvasRenderingContext2D): ImageData {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Create path from points
    ctx.beginPath();
    
    for (let i = 0; i < mask.points.length; i++) {
      const point = mask.points[i];
      
      if (point.type === 'move' || i === 0) {
        ctx.moveTo(point.x, point.y);
      } else if (point.type === 'line') {
        ctx.lineTo(point.x, point.y);
      } else if (point.type === 'curve' && point.controlPoint1 && point.controlPoint2) {
        ctx.bezierCurveTo(
          point.controlPoint1.x, point.controlPoint1.y,
          point.controlPoint2.x, point.controlPoint2.y,
          point.x, point.y
        );
      }
    }
    
    if (mask.closed) {
      ctx.closePath();
    }

    // Fill the path
    ctx.fillStyle = mask.inverted ? 'black' : 'white';
    ctx.fill();

    // Apply feathering if needed
    let maskData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (mask.feather > 0) {
      maskData = this.applyFeathering(maskData, mask.feather);
    }

    return maskData;
  }

  /**
   * Generate luminance mask
   */
  private generateLuminanceMask(
    mask: LuminanceMask,
    sourceImage: ImageData,
    ctx: CanvasRenderingContext2D
  ): ImageData {
    const width = sourceImage.width;
    const height = sourceImage.height;
    const sourceData = sourceImage.data;
    const maskData = ctx.createImageData(width, height);
    const data = maskData.data;

    const { min, max, softness } = mask.luminanceRange;
    const range = max - min;
    const softRange = range * (softness / 100);

    for (let i = 0; i < sourceData.length; i += 4) {
      // Calculate luminance
      const r = sourceData[i];
      const g = sourceData[i + 1];
      const b = sourceData[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      let alpha = 0;

      if (luminance >= min && luminance <= max) {
        // Within range
        if (softness > 0) {
          // Apply soft edges
          const distFromMin = luminance - min;
          const distFromMax = max - luminance;
          const minSoft = Math.min(distFromMin, distFromMax);
          
          if (minSoft < softRange) {
            alpha = minSoft / softRange;
          } else {
            alpha = 1;
          }
        } else {
          alpha = 1;
        }
      }

      if (mask.inverted) {
        alpha = 1 - alpha;
      }

      const pixelIndex = i;
      data[pixelIndex] = alpha * 255;     // R
      data[pixelIndex + 1] = alpha * 255; // G
      data[pixelIndex + 2] = alpha * 255; // B
      data[pixelIndex + 3] = 255;         // A
    }

    return maskData;
  }

  /**
   * Generate color mask
   */
  private generateColorMask(
    mask: ColorMask,
    sourceImage: ImageData,
    ctx: CanvasRenderingContext2D
  ): ImageData {
    const width = sourceImage.width;
    const height = sourceImage.height;
    const sourceData = sourceImage.data;
    const maskData = ctx.createImageData(width, height);
    const data = maskData.data;

    const { targetColor, tolerance, softness } = mask;
    const toleranceRange = (tolerance / 100) * 441.67; // Max distance in RGB space
    const softRange = toleranceRange * (softness / 100);

    for (let i = 0; i < sourceData.length; i += 4) {
      const r = sourceData[i];
      const g = sourceData[i + 1];
      const b = sourceData[i + 2];

      // Calculate color distance
      const dr = r - targetColor.r;
      const dg = g - targetColor.g;
      const db = b - targetColor.b;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);

      let alpha = 0;

      if (distance <= toleranceRange) {
        if (softness > 0 && distance > toleranceRange - softRange) {
          // Soft edge
          const edgeDistance = toleranceRange - distance;
          alpha = edgeDistance / softRange;
        } else {
          alpha = 1;
        }
      }

      if (mask.inverted) {
        alpha = 1 - alpha;
      }

      const pixelIndex = i;
      data[pixelIndex] = alpha * 255;     // R
      data[pixelIndex + 1] = alpha * 255; // G
      data[pixelIndex + 2] = alpha * 255; // B
      data[pixelIndex + 3] = 255;         // A
    }

    return maskData;
  }

  /**
   * Generate gradient mask
   */
  private generateGradientMask(
    mask: GradientMask,
    ctx: CanvasRenderingContext2D
  ): ImageData {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    let gradient: CanvasGradient;

    if (mask.type === 'linear') {
      gradient = ctx.createLinearGradient(
        mask.startPoint.x, mask.startPoint.y,
        mask.endPoint.x, mask.endPoint.y
      );
    } else if (mask.type === 'radial') {
      const distance = Math.sqrt(
        Math.pow(mask.endPoint.x - mask.startPoint.x, 2) +
        Math.pow(mask.endPoint.y - mask.startPoint.y, 2)
      );
      gradient = ctx.createRadialGradient(
        mask.startPoint.x, mask.startPoint.y, 0,
        mask.startPoint.x, mask.startPoint.y, distance
      );
    } else {
      // Angular gradient (not directly supported, create approximation)
      gradient = ctx.createLinearGradient(
        mask.startPoint.x, mask.startPoint.y,
        mask.endPoint.x, mask.endPoint.y
      );
    }

    // Add gradient stops
    for (const stop of mask.stops) {
      const alpha = mask.inverted ? 1 - stop.alpha : stop.alpha;
      gradient.addColorStop(stop.position, `rgba(${alpha * 255}, ${alpha * 255}, ${alpha * 255}, 1)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  /**
   * Apply feathering to mask
   */
  private applyFeathering(maskData: ImageData, featherRadius: number): ImageData {
    if (featherRadius <= 0) return maskData;

    // Create Gaussian blur kernel
    const kernel = this.createGaussianKernel(featherRadius);
    const kernelSize = Math.floor(featherRadius * 2) + 1;
    const halfKernel = Math.floor(kernelSize / 2);

    const width = maskData.width;
    const height = maskData.height;
    const data = maskData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    // Apply Gaussian blur to alpha channel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));

            const sourceIndex = (py * width + px) * 4;
            const kernelIndex = (ky + halfKernel) * kernelSize + (kx + halfKernel);
            const weight = kernel[kernelIndex];

            sum += data[sourceIndex] * weight; // Use R channel as alpha
            weightSum += weight;
          }
        }

        const resultIndex = (y * width + x) * 4;
        const alpha = sum / weightSum;
        resultData[resultIndex] = alpha;     // R
        resultData[resultIndex + 1] = alpha; // G
        resultData[resultIndex + 2] = alpha; // B
        resultData[resultIndex + 3] = 255;   // A
      }
    }

    return result;
  }

  /**
   * Blend mask with existing mask
   */
  private async blendMask(maskData: ImageData, opacity: number): Promise<void> {
    // Put mask data on temporary canvas
    this.workingCtx.putImageData(maskData, 0, 0);

    // Set blend mode and opacity
    this.maskCtx.globalAlpha = opacity / 100;
    this.maskCtx.globalCompositeOperation = 'multiply'; // Intersection blend

    // Draw onto mask canvas
    this.maskCtx.drawImage(this.workingCanvas, 0, 0);

    // Reset blend settings
    this.maskCtx.globalAlpha = 1;
    this.maskCtx.globalCompositeOperation = 'source-over';
  }

  /**
   * Apply mask to image
   */
  private async applyMaskToImage(
    sourceImage: ImageData,
    maskData: ImageData
  ): Promise<ImageData> {
    const result = new ImageData(sourceImage.width, sourceImage.height);
    const resultData = result.data;
    const sourceData = sourceImage.data;
    const maskPixels = maskData.data;

    for (let i = 0; i < sourceData.length; i += 4) {
      const alpha = maskPixels[i] / 255; // Use R channel as mask

      resultData[i] = sourceData[i];     // R
      resultData[i + 1] = sourceData[i + 1]; // G
      resultData[i + 2] = sourceData[i + 2]; // B
      resultData[i + 3] = Math.round(sourceData[i + 3] * alpha); // A
    }

    return result;
  }

  /**
   * Composite source with target using mask
   */
  private async compositeWithTarget(
    sourceImage: ImageData,
    targetImage: ImageData,
    maskData: ImageData
  ): Promise<ImageData> {
    const result = new ImageData(sourceImage.width, sourceImage.height);
    const resultData = result.data;
    const sourceData = sourceImage.data;
    const targetData = targetImage.data;
    const maskPixels = maskData.data;

    for (let i = 0; i < sourceData.length; i += 4) {
      const alpha = maskPixels[i] / 255; // Use R channel as mask
      const invAlpha = 1 - alpha;

      // Blend source and target based on mask
      resultData[i] = Math.round(sourceData[i] * alpha + targetData[i] * invAlpha);
      resultData[i + 1] = Math.round(sourceData[i + 1] * alpha + targetData[i + 1] * invAlpha);
      resultData[i + 2] = Math.round(sourceData[i + 2] * alpha + targetData[i + 2] * invAlpha);
      resultData[i + 3] = 255; // Full opacity for result
    }

    return result;
  }

  /**
   * Update vector mask points
   */
  updateVectorMask(maskId: string, points: MaskPoint[]): void {
    const layer = this.masks.find(m => m.id === maskId);
    if (layer && layer.type === 'vector') {
      (layer.mask as VectorMask).points = points;
    }
  }

  /**
   * Update mask opacity
   */
  updateMaskOpacity(maskId: string, opacity: number): void {
    const layer = this.masks.find(m => m.id === maskId);
    if (layer) {
      (layer.mask as any).opacity = Math.max(0, Math.min(100, opacity));
    }
  }

  /**
   * Toggle mask inversion
   */
  toggleMaskInversion(maskId: string): void {
    const layer = this.masks.find(m => m.id === maskId);
    if (layer) {
      (layer.mask as any).inverted = !(layer.mask as any).inverted;
    }
  }

  /**
   * Toggle mask visibility
   */
  toggleMaskVisibility(maskId: string): void {
    const layer = this.masks.find(m => m.id === maskId);
    if (layer) {
      layer.visible = !layer.visible;
    }
  }

  /**
   * Delete mask
   */
  deleteMask(maskId: string): void {
    this.masks = this.masks.filter(m => m.id !== maskId);
    if (this.selectedMask === maskId) {
      this.selectedMask = null;
    }
  }

  /**
   * Get all masks
   */
  getAllMasks(): MaskLayer[] {
    return [...this.masks];
  }

  /**
   * Get mask by ID
   */
  getMask(maskId: string): MaskLayer | undefined {
    return this.masks.find(m => m.id === maskId);
  }

  /**
   * Select mask
   */
  selectMask(maskId: string): void {
    if (this.masks.find(m => m.id === maskId)) {
      this.selectedMask = maskId;
    }
  }

  /**
   * Get selected mask
   */
  getSelectedMask(): MaskLayer | undefined {
    return this.selectedMask ? this.getMask(this.selectedMask) : undefined;
  }

  /**
   * Duplicate mask
   */
  duplicateMask(maskId: string): string | null {
    const originalLayer = this.masks.find(m => m.id === maskId);
    if (!originalLayer) return null;

    const newMask = {
      ...originalLayer.mask,
      id: this.generateId(),
      name: `${originalLayer.name} Copy`
    };

    const newLayer: MaskLayer = {
      id: newMask.id,
      name: newMask.name,
      type: originalLayer.type,
      mask: newMask,
      visible: true,
      locked: false
    };

    this.masks.push(newLayer);
    return newMask.id;
  }

  /**
   * Reorder masks
   */
  reorderMasks(fromIndex: number, toIndex: number): void {
    if (fromIndex >= 0 && fromIndex < this.masks.length &&
        toIndex >= 0 && toIndex < this.masks.length) {
      const [movedMask] = this.masks.splice(fromIndex, 1);
      this.masks.splice(toIndex, 0, movedMask);
    }
  }

  /**
   * Convert mask to selection (returns ImageData mask)
   */
  async maskToSelection(maskId: string, sourceImage: ImageData): Promise<ImageData> {
    const layer = this.masks.find(m => m.id === maskId);
    if (!layer) {
      throw new Error('Mask not found');
    }

    return this.generateSingleMask(layer, sourceImage);
  }

  /**
   * Create mask from selection (luminance-based)
   */
  createMaskFromSelection(
    name: string,
    selectionData: ImageData,
    threshold: number = 128
  ): string {
    // Convert selection to mask points (simplified approach)
    // In a real implementation, this would use edge detection algorithms

    const points: MaskPoint[] = [];
    // This is a simplified conversion - in practice, you'd use marching squares
    // or similar algorithms to convert a bitmap selection to vector paths

    return this.createVectorMask(name, points);
  }

  // Utility methods
  private setupCanvases(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.workingCanvas.width = width;
    this.workingCanvas.height = height;
    this.maskCanvas.width = width;
    this.maskCanvas.height = height;
  }

  private generateId(): string {
    return `mask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createGaussianKernel(radius: number): number[] {
    const size = Math.floor(radius * 2) + 1;
    const kernel = new Array(size * size);
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const value = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquare);
        kernel[y * size + x] = value;
        sum += value;
      }
    }

    // Normalize kernel
    return kernel.map(value => value / sum);
  }

  /**
   * Export mask as PNG
   */
  async exportMask(maskId: string, sourceImage: ImageData): Promise<Blob> {
    const maskData = await this.maskToSelection(maskId, sourceImage);
    
    // Create canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d')!;
    exportCanvas.width = maskData.width;
    exportCanvas.height = maskData.height;
    
    exportCtx.putImageData(maskData, 0, 0);
    
    return new Promise(resolve => {
      exportCanvas.toBlob(blob => resolve(blob!), 'image/png');
    });
  }

  /**
   * Import mask from image
   */
  async importMask(name: string, imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Convert image to mask data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // Create luminance mask from imported image
        const maskId = this.createLuminanceMask(name, {
          min: 0,
          max: 255,
          softness: 10
        });
        
        resolve(maskId);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.masks = [];
    this.selectedMask = null;
  }
}