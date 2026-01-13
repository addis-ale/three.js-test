import * as THREE from 'three';

/**
 * Core WebGL renderer with optimized settings for PCB visualization
 * Handles renderer creation, configuration, and memory management
 */
export class Renderer {
  public renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    
    // Check if canvas is valid
    if (!canvas) {
      throw new Error('Canvas element is required for WebGL renderer');
    }
    
    // Ensure canvas is properly sized before creating renderer
    if (!canvas.width || !canvas.height) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        failIfMajorPerformanceCaveat: false
      });

      this.configure();
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      
      // Try fallback renderer
      try {
        console.log('Attempting fallback renderer...');
        this.renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: false,
          alpha: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false
        });
        this.configure();
        console.log('Fallback renderer created successfully');
      } catch (fallbackError) {
        console.error('Fallback renderer also failed:', fallbackError);
        throw new Error('WebGL initialization failed. Please check your browser and hardware support.');
      }
    }
  }

  private configure(): void {
    // Optimize for PCB precision rendering
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // PCB-specific color management
    this.renderer.setClearColor(0x1a1a1a);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Shadow and depth optimization
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Performance optimizations
    this.renderer.info.autoReset = false;
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  /**
   * Critical memory cleanup - must be called on unmount
   * Ensures renderer.info.memory returns to baseline
   */
  public dispose(): void {
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  public getMemoryInfo(): { geometries: number; textures: number } {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures
    };
  }
}
