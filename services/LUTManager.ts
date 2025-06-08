/**
 * LUT (Lookup Table) Manager
 * Comprehensive LUT management system for professional color grading
 * Supports 1D and 3D LUTs in multiple formats (.cube, .3dl, .lut, etc.)
 */

export interface LUTMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  category: 'cinematic' | 'portrait' | 'landscape' | 'vintage' | 'creative' | 'technical';
  format: 'cube' | '3dl' | 'lut' | 'csp' | 'vlt';
  dimension: '1D' | '3D';
  size: number; // 17, 33, 65, etc.
  inputColorSpace: string;
  outputColorSpace: string;
  created: Date;
  fileSize: number;
  thumbnail?: string; // Base64 encoded preview
}

export interface LUTData {
  metadata: LUTMetadata;
  data: Float32Array;
  domainMin: number[];
  domainMax: number[];
  title?: string;
  comments?: string[];
}

export interface LUTLibraryItem {
  id: string;
  metadata: LUTMetadata;
  installed: boolean;
  favorite: boolean;
  lastUsed?: Date;
  usageCount: number;
  rating?: number; // 1-5 stars
  tags: string[];
}

export interface LUTApplication {
  lutId: string;
  strength: number; // 0-100
  blendMode: 'normal' | 'luminosity' | 'color' | 'multiply' | 'screen';
  maskRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
    feather: number;
  };
}

export class LUTManager {
  private luts: Map<string, LUTData> = new Map();
  private library: LUTLibraryItem[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Built-in LUT library from free sources
  private readonly builtInLUTs = [
    {
      name: 'Rec709 to sRGB',
      category: 'technical' as const,
      description: 'Standard Rec.709 to sRGB conversion'
    },
    {
      name: 'Cinematic Orange Teal',
      category: 'cinematic' as const,
      description: 'Popular orange and teal color scheme'
    },
    {
      name: 'Vintage Film',
      category: 'vintage' as const,
      description: 'Classic film emulation with warm tones'
    },
    {
      name: 'Portrait Enhancer',
      category: 'portrait' as const,
      description: 'Enhances skin tones and warmth'
    },
    {
      name: 'Landscape Vivid',
      category: 'landscape' as const,
      description: 'Enhanced saturation for nature shots'
    }
  ];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.initializeBuiltInLUTs();
  }

  /**
   * Initialize with built-in LUTs
   */
  private async initializeBuiltInLUTs(): Promise<void> {
    for (const lutInfo of this.builtInLUTs) {
      const lut = await this.generateBuiltInLUT(lutInfo);
      this.addLUT(lut);
    }
  }

  /**
   * Load LUT from file
   */
  async loadLUTFromFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);

    let lutData: LUTData;

    switch (extension) {
      case 'cube':
        lutData = this.parseCubeLUT(text, file.name);
        break;
      case '3dl':
        lutData = this.parse3dlLUT(text, file.name);
        break;
      case 'lut':
        lutData = this.parseLutLUT(text, file.name);
        break;
      case 'csp':
        lutData = this.parseCspLUT(text, file.name);
        break;
      case 'vlt':
        lutData = this.parseVltLUT(text, file.name);
        break;
      default:
        throw new Error(`Unsupported LUT format: ${extension}`);
    }

    // Generate metadata
    lutData.metadata = {
      ...lutData.metadata,
      id: this.generateId(),
      created: new Date(),
      fileSize: arrayBuffer.byteLength
    };

    // Generate thumbnail
    lutData.metadata.thumbnail = await this.generateLUTThumbnail(lutData);

    return this.addLUT(lutData);
  }

  /**
   * Parse .cube LUT format
   */
  private parseCubeLUT(content: string, filename: string): LUTData {
    const lines = content.split('\n').map(line => line.trim());
    let size = 33; // Default size
    let title = '';
    let domainMin = [0, 0, 0];
    let domainMax = [1, 1, 1];
    const comments: string[] = [];
    const lutValues: number[] = [];

    for (const line of lines) {
      if (line.startsWith('TITLE')) {
        title = line.substring(5).trim().replace(/"/g, '');
      } else if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(' ')[1]);
      } else if (line.startsWith('DOMAIN_MIN')) {
        domainMin = line.split(' ').slice(1).map(Number);
      } else if (line.startsWith('DOMAIN_MAX')) {
        domainMax = line.split(' ').slice(1).map(Number);
      } else if (line.startsWith('#')) {
        comments.push(line.substring(1).trim());
      } else if (line.match(/^[\d\.\-\s]+$/)) {
        const values = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (values.length === 3) {
          lutValues.push(...values);
        }
      }
    }

    const expectedSize = size * size * size * 3;
    if (lutValues.length !== expectedSize) {
      throw new Error(`Invalid LUT data size. Expected ${expectedSize}, got ${lutValues.length}`);
    }

    return {
      metadata: {
        id: '',
        name: title || filename.replace(/\.[^/.]+$/, ''),
        format: 'cube',
        dimension: '3D',
        size,
        inputColorSpace: 'unknown',
        outputColorSpace: 'unknown',
        category: 'creative',
        created: new Date(),
        fileSize: 0
      },
      data: new Float32Array(lutValues),
      domainMin,
      domainMax,
      title,
      comments
    };
  }

  /**
   * Parse .3dl LUT format
   */
  private parse3dlLUT(content: string, filename: string): LUTData {
    const lines = content.split('\n').map(line => line.trim());
    const lutValues: number[] = [];
    let mesh = false;

    for (const line of lines) {
      if (line === 'Mesh') {
        mesh = true;
        continue;
      }
      
      if (mesh && line.match(/^[\d\.\s]+$/)) {
        const values = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (values.length === 3) {
          lutValues.push(...values);
        }
      }
    }

    // 3DL files are typically 33x33x33
    const size = Math.round(Math.cbrt(lutValues.length / 3));

    return {
      metadata: {
        id: '',
        name: filename.replace(/\.[^/.]+$/, ''),
        format: '3dl',
        dimension: '3D',
        size,
        inputColorSpace: 'unknown',
        outputColorSpace: 'unknown',
        category: 'creative',
        created: new Date(),
        fileSize: 0
      },
      data: new Float32Array(lutValues),
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1]
    };
  }

  /**
   * Parse .lut LUT format (Autodesk)
   */
  private parseLutLUT(content: string, filename: string): LUTData {
    const lines = content.split('\n').map(line => line.trim());
    const lutValues: number[] = [];
    let dataStarted = false;

    for (const line of lines) {
      if (line.includes('3D')) {
        dataStarted = true;
        continue;
      }
      
      if (dataStarted && line.match(/^[\d\.\s]+$/)) {
        const values = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (values.length >= 3) {
          lutValues.push(values[0], values[1], values[2]);
        }
      }
    }

    const size = Math.round(Math.cbrt(lutValues.length / 3));

    return {
      metadata: {
        id: '',
        name: filename.replace(/\.[^/.]+$/, ''),
        format: 'lut',
        dimension: '3D',
        size,
        inputColorSpace: 'unknown',
        outputColorSpace: 'unknown',
        category: 'creative',
        created: new Date(),
        fileSize: 0
      },
      data: new Float32Array(lutValues),
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1]
    };
  }

  /**
   * Parse .csp LUT format (Rising Sun Research)
   */
  private parseCspLUT(content: string, filename: string): LUTData {
    // CSP format parsing implementation
    const lines = content.split('\n').map(line => line.trim());
    const lutValues: number[] = [];

    // Simplified CSP parsing - would need more comprehensive implementation
    for (const line of lines) {
      if (line.match(/^[\d\.\s]+$/)) {
        const values = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (values.length === 3) {
          lutValues.push(...values);
        }
      }
    }

    const size = Math.round(Math.cbrt(lutValues.length / 3));

    return {
      metadata: {
        id: '',
        name: filename.replace(/\.[^/.]+$/, ''),
        format: 'csp',
        dimension: '3D',
        size,
        inputColorSpace: 'unknown',
        outputColorSpace: 'unknown',
        category: 'creative',
        created: new Date(),
        fileSize: 0
      },
      data: new Float32Array(lutValues),
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1]
    };
  }

  /**
   * Parse .vlt LUT format (Panasonic VariCam)
   */
  private parseVltLUT(content: string, filename: string): LUTData {
    // VLT format parsing implementation
    const lines = content.split('\n').map(line => line.trim());
    const lutValues: number[] = [];

    // Simplified VLT parsing
    for (const line of lines) {
      if (line.match(/^[\d\.\s]+$/)) {
        const values = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (values.length === 3) {
          lutValues.push(...values);
        }
      }
    }

    const size = Math.round(Math.cbrt(lutValues.length / 3));

    return {
      metadata: {
        id: '',
        name: filename.replace(/\.[^/.]+$/, ''),
        format: 'vlt',
        dimension: '3D',
        size,
        inputColorSpace: 'V-Log',
        outputColorSpace: 'Rec.709',
        category: 'technical',
        created: new Date(),
        fileSize: 0
      },
      data: new Float32Array(lutValues),
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1]
    };
  }

  /**
   * Generate built-in LUT
   */
  private async generateBuiltInLUT(lutInfo: any): Promise<LUTData> {
    const size = 33;
    const totalSize = size * size * size * 3;
    const data = new Float32Array(totalSize);

    let index = 0;
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          const rNorm = r / (size - 1);
          const gNorm = g / (size - 1);
          const bNorm = b / (size - 1);

          // Apply different transformations based on LUT type
          let [rOut, gOut, bOut] = this.applyBuiltInTransform(
            rNorm, gNorm, bNorm, lutInfo.name
          );

          data[index++] = rOut;
          data[index++] = gOut;
          data[index++] = bOut;
        }
      }
    }

    return {
      metadata: {
        id: this.generateId(),
        name: lutInfo.name,
        description: lutInfo.description,
        category: lutInfo.category,
        format: 'cube',
        dimension: '3D',
        size,
        inputColorSpace: 'sRGB',
        outputColorSpace: 'sRGB',
        created: new Date(),
        fileSize: data.byteLength
      },
      data,
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1]
    };
  }

  /**
   * Apply built-in LUT transformations
   */
  private applyBuiltInTransform(
    r: number,
    g: number,
    b: number,
    lutName: string
  ): [number, number, number] {
    switch (lutName) {
      case 'Rec709 to sRGB':
        // Simple gamma correction
        return [
          Math.pow(r, 1/2.4),
          Math.pow(g, 1/2.4),
          Math.pow(b, 1/2.4)
        ];

      case 'Cinematic Orange Teal':
        // Orange and teal color grading
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const orangeFactor = Math.max(0, r + g - b);
        const tealFactor = Math.max(0, g + b - r);
        
        return [
          Math.min(1, r + orangeFactor * 0.2),
          g,
          Math.min(1, b + tealFactor * 0.3)
        ];

      case 'Vintage Film':
        // Warm vintage look
        return [
          Math.min(1, r * 1.1 + 0.05),
          Math.min(1, g * 1.05 + 0.03),
          Math.min(1, b * 0.9)
        ];

      case 'Portrait Enhancer':
        // Skin tone enhancement
        const skinTone = (r > 0.4 && g > 0.3 && b > 0.2) ? 1.1 : 1.0;
        return [
          Math.min(1, r * skinTone),
          Math.min(1, g * skinTone * 0.95),
          Math.min(1, b * skinTone * 0.9)
        ];

      case 'Landscape Vivid':
        // Enhanced saturation for landscapes
        const saturation = 1.3;
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        return [
          Math.min(1, gray + (r - gray) * saturation),
          Math.min(1, gray + (g - gray) * saturation),
          Math.min(1, gray + (b - gray) * saturation)
        ];

      default:
        return [r, g, b];
    }
  }

  /**
   * Apply LUT to image
   */
  async applyLUT(
    imageData: ImageData,
    lutId: string,
    application: Partial<LUTApplication> = {}
  ): Promise<ImageData> {
    const lut = this.luts.get(lutId);
    if (!lut) {
      throw new Error(`LUT not found: ${lutId}`);
    }

    const strength = application.strength ?? 100;
    const blendMode = application.blendMode ?? 'normal';
    
    // Setup canvas
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    
    // Apply LUT transformation
    const transformedData = this.transformImageWithLUT(imageData, lut, strength);
    
    // Apply blend mode if not normal
    if (blendMode !== 'normal') {
      return this.blendImages(imageData, transformedData, blendMode);
    }
    
    return transformedData;
  }

  /**
   * Transform image using LUT
   */
  private transformImageWithLUT(
    imageData: ImageData,
    lut: LUTData,
    strength: number
  ): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const lutData = lut.data;
    const size = lut.metadata.size;

    for (let i = 0; i < data.length; i += 4) {
      // Normalize RGB values
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const a = data[i + 3];

      // Apply LUT transformation
      const transformed = this.interpolate3D(r, g, b, lutData, size);
      
      // Blend with original based on strength
      const factor = strength / 100;
      const invFactor = 1 - factor;
      
      resultData[i] = Math.round((transformed.r * factor + r * invFactor) * 255);
      resultData[i + 1] = Math.round((transformed.g * factor + g * invFactor) * 255);
      resultData[i + 2] = Math.round((transformed.b * factor + b * invFactor) * 255);
      resultData[i + 3] = a;
    }

    return result;
  }

  /**
   * 3D trilinear interpolation for LUT
   */
  private interpolate3D(
    r: number,
    g: number,
    b: number,
    lutData: Float32Array,
    size: number
  ): { r: number; g: number; b: number } {
    // Scale to LUT coordinates
    const rScaled = r * (size - 1);
    const gScaled = g * (size - 1);
    const bScaled = b * (size - 1);

    // Get integer coordinates
    const r0 = Math.floor(rScaled);
    const g0 = Math.floor(gScaled);
    const b0 = Math.floor(bScaled);
    
    const r1 = Math.min(r0 + 1, size - 1);
    const g1 = Math.min(g0 + 1, size - 1);
    const b1 = Math.min(b0 + 1, size - 1);

    // Get fractional parts
    const rFrac = rScaled - r0;
    const gFrac = gScaled - g0;
    const bFrac = bScaled - b0;

    // Get 8 corner values
    const c000 = this.getLUTValue(lutData, r0, g0, b0, size);
    const c001 = this.getLUTValue(lutData, r0, g0, b1, size);
    const c010 = this.getLUTValue(lutData, r0, g1, b0, size);
    const c011 = this.getLUTValue(lutData, r0, g1, b1, size);
    const c100 = this.getLUTValue(lutData, r1, g0, b0, size);
    const c101 = this.getLUTValue(lutData, r1, g0, b1, size);
    const c110 = this.getLUTValue(lutData, r1, g1, b0, size);
    const c111 = this.getLUTValue(lutData, r1, g1, b1, size);

    // Trilinear interpolation
    const c00 = this.lerpColor(c000, c001, bFrac);
    const c01 = this.lerpColor(c010, c011, bFrac);
    const c10 = this.lerpColor(c100, c101, bFrac);
    const c11 = this.lerpColor(c110, c111, bFrac);

    const c0 = this.lerpColor(c00, c01, gFrac);
    const c1 = this.lerpColor(c10, c11, gFrac);

    return this.lerpColor(c0, c1, rFrac);
  }

  /**
   * Get LUT value at specific coordinates
   */
  private getLUTValue(
    lutData: Float32Array,
    r: number,
    g: number,
    b: number,
    size: number
  ): { r: number; g: number; b: number } {
    const index = (b * size * size + g * size + r) * 3;
    return {
      r: lutData[index],
      g: lutData[index + 1],
      b: lutData[index + 2]
    };
  }

  /**
   * Linear interpolation between two colors
   */
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

  /**
   * Blend two images with different blend modes
   */
  private blendImages(
    base: ImageData,
    overlay: ImageData,
    blendMode: string
  ): ImageData {
    const result = new ImageData(base.width, base.height);
    const baseData = base.data;
    const overlayData = overlay.data;
    const resultData = result.data;

    for (let i = 0; i < baseData.length; i += 4) {
      const baseR = baseData[i] / 255;
      const baseG = baseData[i + 1] / 255;
      const baseB = baseData[i + 2] / 255;
      
      const overlayR = overlayData[i] / 255;
      const overlayG = overlayData[i + 1] / 255;
      const overlayB = overlayData[i + 2] / 255;

      let resultR, resultG, resultB;

      switch (blendMode) {
        case 'multiply':
          resultR = baseR * overlayR;
          resultG = baseG * overlayG;
          resultB = baseB * overlayB;
          break;
        
        case 'screen':
          resultR = 1 - (1 - baseR) * (1 - overlayR);
          resultG = 1 - (1 - baseG) * (1 - overlayG);
          resultB = 1 - (1 - baseB) * (1 - overlayB);
          break;
        
        case 'luminosity':
          // Use overlay luminance with base color
          const overlayLum = 0.299 * overlayR + 0.587 * overlayG + 0.114 * overlayB;
          const baseLum = 0.299 * baseR + 0.587 * baseG + 0.114 * baseB;
          const factor = baseLum > 0 ? overlayLum / baseLum : 1;
          
          resultR = Math.min(1, baseR * factor);
          resultG = Math.min(1, baseG * factor);
          resultB = Math.min(1, baseB * factor);
          break;
        
        case 'color':
          // Use overlay color with base luminance
          const baseLuminance = 0.299 * baseR + 0.587 * baseG + 0.114 * baseB;
          const overlayLuminance = 0.299 * overlayR + 0.587 * overlayG + 0.114 * overlayB;
          const colorFactor = overlayLuminance > 0 ? baseLuminance / overlayLuminance : 1;
          
          resultR = Math.min(1, overlayR * colorFactor);
          resultG = Math.min(1, overlayG * colorFactor);
          resultB = Math.min(1, overlayB * colorFactor);
          break;
        
        default:
          resultR = overlayR;
          resultG = overlayG;
          resultB = overlayB;
      }

      resultData[i] = Math.round(resultR * 255);
      resultData[i + 1] = Math.round(resultG * 255);
      resultData[i + 2] = Math.round(resultB * 255);
      resultData[i + 3] = baseData[i + 3];
    }

    return result;
  }

  /**
   * Generate LUT thumbnail
   */
  private async generateLUTThumbnail(lut: LUTData): Promise<string> {
    // Create gradient test image
    const size = 64;
    const testImage = new ImageData(size, size);
    const data = testImage.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = (y * size + x) * 4;
        data[index] = Math.round((x / size) * 255);     // R gradient
        data[index + 1] = Math.round((y / size) * 255); // G gradient
        data[index + 2] = 128;                          // B constant
        data[index + 3] = 255;                          // A
      }
    }

    // Apply LUT to test image
    const transformedImage = this.transformImageWithLUT(testImage, lut, 100);

    // Create canvas and draw thumbnail
    const thumbCanvas = document.createElement('canvas');
    const thumbCtx = thumbCanvas.getContext('2d')!;
    thumbCanvas.width = size;
    thumbCanvas.height = size;
    
    thumbCtx.putImageData(transformedImage, 0, 0);
    
    return thumbCanvas.toDataURL('image/png');
  }

  /**
   * Add LUT to collection
   */
  addLUT(lut: LUTData): string {
    this.luts.set(lut.metadata.id, lut);
    
    const libraryItem: LUTLibraryItem = {
      id: lut.metadata.id,
      metadata: lut.metadata,
      installed: true,
      favorite: false,
      usageCount: 0,
      tags: []
    };
    
    this.library.push(libraryItem);
    return lut.metadata.id;
  }

  /**
   * Get all LUTs in library
   */
  getAllLUTs(): LUTLibraryItem[] {
    return [...this.library];
  }

  /**
   * Get LUTs by category
   */
  getLUTsByCategory(category: string): LUTLibraryItem[] {
    return this.library.filter(item => item.metadata.category === category);
  }

  /**
   * Search LUTs
   */
  searchLUTs(query: string): LUTLibraryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.library.filter(item =>
      item.metadata.name.toLowerCase().includes(lowerQuery) ||
      item.metadata.description?.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(lutId: string): void {
    const item = this.library.find(item => item.id === lutId);
    if (item) {
      item.favorite = !item.favorite;
    }
  }

  /**
   * Add tags to LUT
   */
  addTags(lutId: string, tags: string[]): void {
    const item = this.library.find(item => item.id === lutId);
    if (item) {
      item.tags = [...new Set([...item.tags, ...tags])];
    }
  }

  /**
   * Rate LUT
   */
  rateLUT(lutId: string, rating: number): void {
    const item = this.library.find(item => item.id === lutId);
    if (item) {
      item.rating = Math.max(1, Math.min(5, rating));
    }
  }

  /**
   * Export LUT to file
   */
  async exportLUT(lutId: string, format: 'cube' | '3dl' = 'cube'): Promise<Blob> {
    const lut = this.luts.get(lutId);
    if (!lut) {
      throw new Error(`LUT not found: ${lutId}`);
    }

    let content: string;

    if (format === 'cube') {
      content = this.exportToCube(lut);
    } else {
      content = this.exportTo3dl(lut);
    }

    return new Blob([content], { type: 'text/plain' });
  }

  /**
   * Export to .cube format
   */
  private exportToCube(lut: LUTData): string {
    const lines: string[] = [];
    
    if (lut.title) {
      lines.push(`TITLE "${lut.title}"`);
    }
    
    lines.push(`LUT_3D_SIZE ${lut.metadata.size}`);
    lines.push(`DOMAIN_MIN ${lut.domainMin.join(' ')}`);
    lines.push(`DOMAIN_MAX ${lut.domainMax.join(' ')}`);
    
    if (lut.comments) {
      lut.comments.forEach(comment => lines.push(`# ${comment}`));
    }
    
    // Add data
    const size = lut.metadata.size;
    const data = lut.data;
    
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i].toFixed(6);
      const g = data[i + 1].toFixed(6);
      const b = data[i + 2].toFixed(6);
      lines.push(`${r} ${g} ${b}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Export to .3dl format
   */
  private exportTo3dl(lut: LUTData): string {
    const lines: string[] = [];
    const size = lut.metadata.size;
    
    lines.push(`${size} ${size} ${size}`);
    lines.push('Mesh');
    
    const data = lut.data;
    for (let i = 0; i < data.length; i += 3) {
      const r = Math.round(data[i] * 4095);
      const g = Math.round(data[i + 1] * 4095);
      const b = Math.round(data[i + 2] * 4095);
      lines.push(`${r} ${g} ${b}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Create custom LUT from color adjustments
   */
  createCustomLUT(
    name: string,
    adjustments: {
      exposure?: number;
      contrast?: number;
      saturation?: number;
      temperature?: number;
      tint?: number;
    },
    size: number = 33
  ): string {
    const totalSize = size * size * size * 3;
    const data = new Float32Array(totalSize);

    let index = 0;
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          let rNorm = r / (size - 1);
          let gNorm = g / (size - 1);
          let bNorm = b / (size - 1);

          // Apply adjustments
          if (adjustments.exposure) {
            const mult = Math.pow(2, adjustments.exposure);
            rNorm *= mult;
            gNorm *= mult;
            bNorm *= mult;
          }

          if (adjustments.contrast) {
            const factor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
            rNorm = factor * (rNorm - 0.5) + 0.5;
            gNorm = factor * (gNorm - 0.5) + 0.5;
            bNorm = factor * (bNorm - 0.5) + 0.5;
          }

          if (adjustments.saturation) {
            const gray = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm;
            const satFactor = 1 + adjustments.saturation / 100;
            rNorm = gray + (rNorm - gray) * satFactor;
            gNorm = gray + (gNorm - gray) * satFactor;
            bNorm = gray + (bNorm - gray) * satFactor;
          }

          // Clamp values
          data[index++] = Math.max(0, Math.min(1, rNorm));
          data[index++] = Math.max(0, Math.min(1, gNorm));
          data[index++] = Math.max(0, Math.min(1, bNorm));
        }
      }
    }

    const lut: LUTData = {
      metadata: {
        id: this.generateId(),
        name,
        description: 'Custom LUT created from color adjustments',
        category: 'creative',
        format: 'cube',
        dimension: '3D',
        size,
        inputColorSpace: 'sRGB',
        outputColorSpace: 'sRGB',
        created: new Date(),
        fileSize: data.byteLength
      },
      data,
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1]
    };

    return this.addLUT(lut);
  }

  /**
   * Delete LUT
   */
  deleteLUT(lutId: string): void {
    this.luts.delete(lutId);
    this.library = this.library.filter(item => item.id !== lutId);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `lut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.luts.clear();
    this.library = [];
  }
}