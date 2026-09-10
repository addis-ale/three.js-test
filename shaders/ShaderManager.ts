import * as THREE from 'three';
import { CopperShader } from './CopperShader';

/**
 * Shader Manager for reusable copper materials
 * Manages shader instances and uniform updates for pads and traces
 */
export class ShaderManager {
  private static instance: ShaderManager;
  private copperMaterial: THREE.ShaderMaterial;
  private clock: THREE.Clock;
  private animationId: number | null = null;

  private constructor() {
    this.clock = new THREE.Clock();
    this.copperMaterial = CopperShader.createMaterial();
    this.startAnimation();
  }

  /**
   * Singleton pattern for global shader management
   */
  public static getInstance(): ShaderManager {
    if (!ShaderManager.instance) {
      ShaderManager.instance = new ShaderManager();
    }
    return ShaderManager.instance;
  }

  /**
   * Get copper shader material (reusable for pads and traces)
   */
  public getCopperMaterial(): THREE.ShaderMaterial {
    // Clone material for each use to maintain independent uniforms
    return this.copperMaterial.clone();
  }

  /**
   * Update hover state on a specific material
   */
  public setHovered(material: THREE.ShaderMaterial, hovered: boolean): void {
    CopperShader.setHovered(material, hovered);
  }

  /**
   * Update selection state on a specific material
   */
  public setSelected(material: THREE.ShaderMaterial, selected: boolean): void {
    CopperShader.setSelected(material, selected);
  }

  /**
   * Update base color on a specific material
   */
  public setBaseColor(material: THREE.ShaderMaterial, color: THREE.Color): void {
    CopperShader.setBaseColor(material, color);
  }

  /**
   * Start animation loop for time-based effects
   */
  private startAnimation(): void {
    const animate = () => {
      const time = this.clock.getElapsedTime();
      CopperShader.updateMaterial(this.copperMaterial, time);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop animation loop
   */
  public stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.stopAnimation();
    this.copperMaterial.dispose();
  }

  /**
   * Create copper material for specific use case
   */
  public createCopperMaterial(options?: {
    baseColor?: THREE.Color;
    initialHovered?: boolean;
    initialSelected?: boolean;
  }): THREE.ShaderMaterial {
    const material = this.getCopperMaterial();
    
    if (options?.baseColor) {
      this.setBaseColor(material, options.baseColor);
    }
    
    if (options?.initialHovered) {
      this.setHovered(material, options.initialHovered);
    }
    
    if (options?.initialSelected) {
      this.setSelected(material, options.initialSelected);
    }
    
    return material;
  }

  /**
   * Batch update multiple materials
   */
  public updateMaterials(materials: THREE.ShaderMaterial[], updates: {
    hovered?: boolean;
    selected?: boolean;
    baseColor?: THREE.Color;
  }): void {
    materials.forEach(material => {
      if (updates.hovered !== undefined) {
        this.setHovered(material, updates.hovered);
      }
      if (updates.selected !== undefined) {
        this.setSelected(material, updates.selected);
      }
      if (updates.baseColor) {
        this.setBaseColor(material, updates.baseColor);
      }
    });
  }
}
