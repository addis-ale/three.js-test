import * as THREE from 'three';
import { Renderer } from './Renderer';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { Interaction } from './Interaction';

/**
 * Main 3D engine orchestrator for PCB Viewer & Editor
 * Manages renderer, scene, camera, and animation loop
 */
export class Engine {
  public renderer: Renderer;
  public scene: Scene;
  public camera: Camera;
  public interaction: Interaction;
  public clock: THREE.Clock;
  
  private animationId: number | null = null;
  private isRunning = false;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize core components in dependency order
    this.renderer = new Renderer(canvas);
    this.scene = new Scene();
    this.camera = new Camera(canvas);
    this.interaction = new Interaction(this.camera.camera, canvas, this.scene.scene);
    this.clock = new THREE.Clock();

    this.setupResizeHandling();
  }

  private setupResizeHandling(): void {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      this.renderer.resize(width, height);
      this.camera.resize(width, height);
    };

    window.addEventListener('resize', handleResize);
  }

  /**
   * Single requestAnimationFrame loop - critical performance requirement
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.clock.getDelta(); // Keep clock running for consistent timing
    
    // Update camera controls
    this.camera.update();
    
    // Render frame
    this.renderer.render(this.scene.scene, this.camera.camera);
    
    // Continue animation loop
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Critical memory cleanup - must return renderer.info.memory to baseline
   */
  public dispose(): void {
    this.stop();
    
    // Dispose in reverse order of creation
    this.interaction.dispose();
    this.camera.dispose();
    this.scene.dispose();
    this.renderer.dispose();
    
    // Verify cleanup
    const memoryInfo = this.renderer.getMemoryInfo();
    console.log('Final memory state:', memoryInfo);
  }

  /**
   * Get current performance metrics
   */
  public getMemoryInfo(): { geometries: number; textures: number } {
    return this.renderer.getMemoryInfo();
  }

  /**
   * Reset engine state for new board loading
   */
  public reset(): void {
    // Clear scene but keep core components
    this.scene.dispose();
    this.scene = new Scene();
    
    // Reset interaction state
    this.interaction.deselectObject();
    this.interaction.clearHoverState();
  }
}
