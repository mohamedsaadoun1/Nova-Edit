/**
 * WebGL Visual Effects Service
 * Advanced GPU-accelerated visual effects using WebGL shaders
 * Provides real-time filters, transitions, and creative effects
 */

export interface ShaderEffect {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: { [key: string]: any };
  attributes: string[];
}

export interface EffectOptions {
  intensity: number; // 0-1
  parameters: { [key: string]: any };
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';
  opacity?: number;
}

export interface TransitionOptions {
  type: string;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  direction?: 'left' | 'right' | 'up' | 'down';
  parameters?: { [key: string]: any };
}

export class WebGLVisualEffects {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private programs: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private isInitialized: boolean = false;

  // Standard quad vertices for full-screen effects
  private quadVertices = new Float32Array([
    -1.0, -1.0, 0.0, 0.0,
    1.0, -1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 1.0, 1.0
  ]);

  private quadBuffer: WebGLBuffer | null = null;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || document.createElement('canvas');
  }

  /**
   * Initialize WebGL context and load shaders
   */
  async initialize(): Promise<void> {
    try {
      // Get WebGL context
      this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      // Enable required extensions
      this.enableExtensions();

      // Setup basic resources
      this.setupQuadBuffer();
      
      // Load built-in shaders
      await this.loadBuiltInShaders();

      this.isInitialized = true;
      console.log('WebGL Visual Effects initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebGL Visual Effects:', error);
      throw error;
    }
  }

  /**
   * Enable necessary WebGL extensions
   */
  private enableExtensions(): void {
    if (!this.gl) return;

    // Enable floating point textures for HDR effects
    this.gl.getExtension('OES_texture_float');
    this.gl.getExtension('OES_texture_float_linear');
    
    // Enable multiple render targets
    this.gl.getExtension('WEBGL_draw_buffers');
    
    // Enable anisotropic filtering
    this.gl.getExtension('EXT_texture_filter_anisotropic');
  }

  /**
   * Setup quad buffer for full-screen rendering
   */
  private setupQuadBuffer(): void {
    if (!this.gl) return;

    this.quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.quadVertices, this.gl.STATIC_DRAW);
  }

  /**
   * Load built-in shader effects
   */
  private async loadBuiltInShaders(): Promise<void> {
    const effects = [
      this.createBlurEffect(),
      this.createSharpenEffect(),
      this.createGlowEffect(),
      this.createDistortionEffect(),
      this.createColorGradingEffect(),
      this.createFilmGrainEffect(),
      this.createVignetteEffect(),
      this.createChromaticAberrationEffect(),
      this.createMotionBlurEffect(),
      this.createOldFilmEffect(),
      this.createHexagonalPixelateEffect(),
      this.createRippleEffect(),
      this.createKaleidoscopeEffect(),
      this.createOilPaintingEffect(),
      this.createEdgeDetectionEffect()
    ];

    for (const effect of effects) {
      const program = this.createShaderProgram(effect.vertexShader, effect.fragmentShader);
      if (program) {
        this.programs.set(effect.name, program);
      }
    }
  }

  /**
   * Create Gaussian blur effect
   */
  private createBlurEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec4 color = vec4(0.0);
        float kernel[9];
        
        // Gaussian kernel
        kernel[0] = 1.0/16.0; kernel[1] = 2.0/16.0; kernel[2] = 1.0/16.0;
        kernel[3] = 2.0/16.0; kernel[4] = 4.0/16.0; kernel[5] = 2.0/16.0;
        kernel[6] = 1.0/16.0; kernel[7] = 2.0/16.0; kernel[8] = 1.0/16.0;
        
        for(int i = -1; i <= 1; i++) {
          for(int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * texelSize * u_intensity;
            int index = (i + 1) * 3 + (j + 1);
            color += texture2D(u_texture, v_texCoord + offset) * kernel[index];
          }
        }
        
        gl_FragColor = color;
      }
    `;

    return {
      name: 'blur',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 1.0, u_resolution: [1920, 1080] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create sharpening effect
   */
  private createSharpenEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        
        vec4 center = texture2D(u_texture, v_texCoord);
        vec4 top = texture2D(u_texture, v_texCoord + vec2(0.0, texelSize.y));
        vec4 bottom = texture2D(u_texture, v_texCoord - vec2(0.0, texelSize.y));
        vec4 left = texture2D(u_texture, v_texCoord - vec2(texelSize.x, 0.0));
        vec4 right = texture2D(u_texture, v_texCoord + vec2(texelSize.x, 0.0));
        
        vec4 laplacian = 5.0 * center - top - bottom - left - right;
        vec4 sharpened = center + u_intensity * laplacian;
        
        gl_FragColor = clamp(sharpened, 0.0, 1.0);
      }
    `;

    return {
      name: 'sharpen',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 0.5, u_resolution: [1920, 1080] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create glow effect
   */
  private createGlowEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      uniform vec3 u_glowColor;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec4 original = texture2D(u_texture, v_texCoord);
        
        // Create glow by sampling surrounding pixels
        vec4 glow = vec4(0.0);
        float samples = 0.0;
        
        for(float x = -3.0; x <= 3.0; x += 1.0) {
          for(float y = -3.0; y <= 3.0; y += 1.0) {
            vec2 offset = vec2(x, y) * texelSize * u_intensity;
            vec4 sample = texture2D(u_texture, v_texCoord + offset);
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            glow += sample * weight;
            samples += weight;
          }
        }
        
        glow /= samples;
        vec4 glowTinted = vec4(glow.rgb * u_glowColor, glow.a);
        
        gl_FragColor = original + glowTinted * u_intensity;
      }
    `;

    return {
      name: 'glow',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 0.5, u_glowColor: [1.0, 1.0, 1.0], u_resolution: [1920, 1080] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create distortion effect
   */
  private createDistortionEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_intensity;
      uniform vec2 u_center;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 coord = v_texCoord - u_center;
        float distance = length(coord);
        
        // Create wave distortion
        float wave = sin(distance * 20.0 - u_time * 5.0) * u_intensity * 0.02;
        vec2 distortedCoord = v_texCoord + normalize(coord) * wave;
        
        gl_FragColor = texture2D(u_texture, distortedCoord);
      }
    `;

    return {
      name: 'distortion',
      vertexShader,
      fragmentShader,
      uniforms: { u_time: 0.0, u_intensity: 1.0, u_center: [0.5, 0.5] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create color grading effect
   */
  private createColorGradingEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_gamma;
      uniform vec3 u_shadows;
      uniform vec3 u_midtones;
      uniform vec3 u_highlights;
      varying vec2 v_texCoord;
      
      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        // Brightness and contrast
        color.rgb = (color.rgb - 0.5) * u_contrast + 0.5 + u_brightness;
        
        // Gamma correction
        color.rgb = pow(color.rgb, vec3(1.0 / u_gamma));
        
        // Saturation
        vec3 hsv = rgb2hsv(color.rgb);
        hsv.y *= u_saturation;
        color.rgb = hsv2rgb(hsv);
        
        // Shadow/Midtone/Highlight color grading
        float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 shadows = u_shadows * (1.0 - smoothstep(0.0, 0.333, luminance));
        vec3 midtones = u_midtones * (1.0 - smoothstep(0.333, 0.666, luminance)) * smoothstep(0.0, 0.333, luminance);
        vec3 highlights = u_highlights * smoothstep(0.666, 1.0, luminance);
        
        color.rgb += shadows + midtones + highlights;
        
        gl_FragColor = clamp(color, 0.0, 1.0);
      }
    `;

    return {
      name: 'colorGrading',
      vertexShader,
      fragmentShader,
      uniforms: {
        u_brightness: 0.0,
        u_contrast: 1.0,
        u_saturation: 1.0,
        u_gamma: 1.0,
        u_shadows: [0.0, 0.0, 0.0],
        u_midtones: [0.0, 0.0, 0.0],
        u_highlights: [0.0, 0.0, 0.0]
      },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create film grain effect
   */
  private createFilmGrainEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_intensity;
      uniform float u_grainSize;
      varying vec2 v_texCoord;
      
      float random(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        vec2 grainCoord = v_texCoord * u_grainSize;
        float noise = random(grainCoord + u_time) * 2.0 - 1.0;
        
        color.rgb += noise * u_intensity;
        
        gl_FragColor = clamp(color, 0.0, 1.0);
      }
    `;

    return {
      name: 'filmGrain',
      vertexShader,
      fragmentShader,
      uniforms: { u_time: 0.0, u_intensity: 0.1, u_grainSize: 100.0 },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create vignette effect
   */
  private createVignetteEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_intensity;
      uniform float u_softness;
      uniform vec2 u_center;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        float distance = length(v_texCoord - u_center);
        float vignette = smoothstep(u_intensity, u_intensity * u_softness, distance);
        
        color.rgb *= vignette;
        
        gl_FragColor = color;
      }
    `;

    return {
      name: 'vignette',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 0.8, u_softness: 0.5, u_center: [0.5, 0.5] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create chromatic aberration effect
   */
  private createChromaticAberrationEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_intensity;
      uniform vec2 u_center;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 direction = v_texCoord - u_center;
        
        float r = texture2D(u_texture, v_texCoord + direction * u_intensity * 0.01).r;
        float g = texture2D(u_texture, v_texCoord).g;
        float b = texture2D(u_texture, v_texCoord - direction * u_intensity * 0.01).b;
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    return {
      name: 'chromaticAberration',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 1.0, u_center: [0.5, 0.5] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create motion blur effect
   */
  private createMotionBlurEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_velocity;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 color = vec4(0.0);
        int samples = 8;
        
        for(int i = 0; i < 8; i++) {
          float t = float(i) / float(samples - 1);
          vec2 offset = u_velocity * u_intensity * (t - 0.5);
          color += texture2D(u_texture, v_texCoord + offset);
        }
        
        gl_FragColor = color / float(samples);
      }
    `;

    return {
      name: 'motionBlur',
      vertexShader,
      fragmentShader,
      uniforms: { u_velocity: [0.1, 0.0], u_intensity: 1.0 },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create old film effect
   */
  private createOldFilmEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      float random(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        // Convert to sepia
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = vec3(gray) * vec3(1.2, 1.0, 0.8);
        
        // Add scratches
        float scratch = random(vec2(v_texCoord.x + u_time, v_texCoord.y));
        if(scratch > 0.99) {
          color.rgb = vec3(1.0);
        }
        
        // Add dust
        float dust = random(v_texCoord + u_time * 0.1);
        if(dust > 0.98) {
          color.rgb *= 0.5;
        }
        
        // Add vignette
        float vignette = 1.0 - length(v_texCoord - vec2(0.5)) * 1.2;
        color.rgb *= vignette;
        
        gl_FragColor = mix(texture2D(u_texture, v_texCoord), color, u_intensity);
      }
    `;

    return {
      name: 'oldFilm',
      vertexShader,
      fragmentShader,
      uniforms: { u_time: 0.0, u_intensity: 1.0 },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create hexagonal pixelate effect
   */
  private createHexagonalPixelateEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_pixelSize;
      varying vec2 v_texCoord;
      
      vec2 hexagonalGrid(vec2 uv) {
        vec2 hexSize = vec2(u_pixelSize);
        vec2 c = floor(uv / hexSize);
        vec2 f = fract(uv / hexSize);
        
        // Hexagonal tiling
        float odd = mod(c.y, 2.0);
        c.x += odd * 0.5;
        
        return c * hexSize + hexSize * 0.5;
      }
      
      void main() {
        vec2 hexCoord = hexagonalGrid(v_texCoord);
        gl_FragColor = texture2D(u_texture, hexCoord);
      }
    `;

    return {
      name: 'hexPixelate',
      vertexShader,
      fragmentShader,
      uniforms: { u_pixelSize: 0.01 },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create ripple effect
   */
  private createRippleEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_intensity;
      uniform vec2 u_center;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 coord = v_texCoord - u_center;
        float distance = length(coord);
        
        float ripple = sin(distance * 50.0 - u_time * 10.0) * u_intensity * 0.02;
        vec2 rippleCoord = v_texCoord + normalize(coord) * ripple;
        
        gl_FragColor = texture2D(u_texture, rippleCoord);
      }
    `;

    return {
      name: 'ripple',
      vertexShader,
      fragmentShader,
      uniforms: { u_time: 0.0, u_intensity: 1.0, u_center: [0.5, 0.5] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create kaleidoscope effect
   */
  private createKaleidoscopeEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_segments;
      uniform vec2 u_center;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 coord = v_texCoord - u_center;
        float angle = atan(coord.y, coord.x);
        float radius = length(coord);
        
        float segmentAngle = 2.0 * 3.14159 / u_segments;
        angle = mod(angle, segmentAngle);
        
        if(mod(floor(atan(coord.y, coord.x) / segmentAngle), 2.0) == 1.0) {
          angle = segmentAngle - angle;
        }
        
        vec2 kaleidoCoord = vec2(cos(angle), sin(angle)) * radius + u_center;
        
        gl_FragColor = texture2D(u_texture, kaleidoCoord);
      }
    `;

    return {
      name: 'kaleidoscope',
      vertexShader,
      fragmentShader,
      uniforms: { u_segments: 6.0, u_center: [0.5, 0.5] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create oil painting effect
   */
  private createOilPaintingEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec3 color = vec3(0.0);
        float samples = 0.0;
        
        int radius = int(u_intensity * 3.0);
        
        for(int x = -3; x <= 3; x++) {
          for(int y = -3; y <= 3; y++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            vec3 sample = texture2D(u_texture, v_texCoord + offset).rgb;
            
            float weight = 1.0 / (1.0 + length(vec2(float(x), float(y))));
            color += sample * weight;
            samples += weight;
          }
        }
        
        color /= samples;
        
        // Quantize colors for oil painting effect
        color = floor(color * 8.0) / 8.0;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    return {
      name: 'oilPainting',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 1.0, u_resolution: [1920, 1080] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create edge detection effect
   */
  private createEdgeDetectionEffect(): ShaderEffect {
    const vertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        
        // Sobel edge detection
        mat3 sobelX = mat3(
          -1.0, -2.0, -1.0,
           0.0,  0.0,  0.0,
           1.0,  2.0,  1.0
        );
        
        mat3 sobelY = mat3(
          -1.0, 0.0, 1.0,
          -2.0, 0.0, 2.0,
          -1.0, 0.0, 1.0
        );
        
        float edgeX = 0.0;
        float edgeY = 0.0;
        
        for(int i = -1; i <= 1; i++) {
          for(int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * texelSize;
            float intensity = dot(texture2D(u_texture, v_texCoord + offset).rgb, vec3(0.299, 0.587, 0.114));
            
            edgeX += intensity * sobelX[i+1][j+1];
            edgeY += intensity * sobelY[i+1][j+1];
          }
        }
        
        float edge = sqrt(edgeX * edgeX + edgeY * edgeY) * u_intensity;
        
        gl_FragColor = vec4(vec3(edge), 1.0);
      }
    `;

    return {
      name: 'edgeDetection',
      vertexShader,
      fragmentShader,
      uniforms: { u_intensity: 1.0, u_resolution: [1920, 1080] },
      attributes: ['a_position', 'a_texCoord']
    };
  }

  /**
   * Create and compile shader program
   */
  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Shader program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  /**
   * Compile individual shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Apply effect to image
   */
  async applyEffect(
    inputImage: ImageData,
    effectName: string,
    options: EffectOptions
  ): Promise<ImageData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.gl) {
      throw new Error('WebGL not available');
    }

    const program = this.programs.get(effectName);
    if (!program) {
      throw new Error(`Effect '${effectName}' not found`);
    }

    // Setup canvas size
    this.canvas.width = inputImage.width;
    this.canvas.height = inputImage.height;
    this.gl.viewport(0, 0, inputImage.width, inputImage.height);

    // Create and bind texture
    const texture = this.createTextureFromImageData(inputImage);
    
    // Use shader program
    this.gl.useProgram(program);
    
    // Set uniforms
    this.setUniforms(program, options);
    
    // Render
    this.renderQuad(program);
    
    // Read pixels back
    const pixels = new Uint8Array(inputImage.width * inputImage.height * 4);
    this.gl.readPixels(0, 0, inputImage.width, inputImage.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    
    // Create result ImageData
    const result = new ImageData(new Uint8ClampedArray(pixels), inputImage.width, inputImage.height);
    
    // Cleanup
    this.gl.deleteTexture(texture);
    
    return result;
  }

  /**
   * Create texture from ImageData
   */
  private createTextureFromImageData(imageData: ImageData): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      imageData
    );
    
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    return texture;
  }

  /**
   * Set shader uniforms
   */
  private setUniforms(program: WebGLProgram, options: EffectOptions): void {
    if (!this.gl) return;

    // Set intensity
    const intensityLocation = this.gl.getUniformLocation(program, 'u_intensity');
    if (intensityLocation) {
      this.gl.uniform1f(intensityLocation, options.intensity);
    }

    // Set resolution
    const resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    if (resolutionLocation) {
      this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    }

    // Set custom parameters
    for (const [key, value] of Object.entries(options.parameters || {})) {
      const location = this.gl.getUniformLocation(program, `u_${key}`);
      if (location) {
        if (typeof value === 'number') {
          this.gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
          if (value.length === 2) {
            this.gl.uniform2f(location, value[0], value[1]);
          } else if (value.length === 3) {
            this.gl.uniform3f(location, value[0], value[1], value[2]);
          } else if (value.length === 4) {
            this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
          }
        }
      }
    }
  }

  /**
   * Render full-screen quad
   */
  private renderQuad(program: WebGLProgram): void {
    if (!this.gl || !this.quadBuffer) return;

    // Bind quad buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    
    // Setup attributes
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(program, 'a_texCoord');
    
    if (positionLocation >= 0) {
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
    }
    
    if (texCoordLocation >= 0) {
      this.gl.enableVertexAttribArray(texCoordLocation);
      this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);
    }
    
    // Draw quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Get available effects
   */
  getAvailableEffects(): string[] {
    return Array.from(this.programs.keys());
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (!this.gl) return;

    // Delete programs
    for (const program of this.programs.values()) {
      this.gl.deleteProgram(program);
    }
    this.programs.clear();

    // Delete textures
    for (const texture of this.textures.values()) {
      this.gl.deleteTexture(texture);
    }
    this.textures.clear();

    // Delete framebuffers
    for (const framebuffer of this.framebuffers.values()) {
      this.gl.deleteFramebuffer(framebuffer);
    }
    this.framebuffers.clear();

    // Delete buffers
    if (this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer);
    }
  }
}