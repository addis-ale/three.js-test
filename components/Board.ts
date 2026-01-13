import * as THREE from 'three';
import { CopperShader } from '../shaders/CopperShader';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * PCB Board substrate with FR4 material and layer management
 * Implements Z-fighting prevention and realistic PCB appearance
 */
export class Board {
  public mesh!: THREE.Mesh;
  public topCopperLayer!: THREE.Object3D;
  public bottomCopperLayer!: THREE.Object3D;
  
  private width: number;
  private height: number;
  private thickness: number;
  private copperLayerManager: CopperLayerManager;

  constructor(width: number = 100, height: number = 80, thickness: number = 1.6) {
    this.width = width;
    this.height = height;
    this.thickness = thickness;
    
    // Initialize copper layer manager for precise Z positioning
    this.copperLayerManager = new CopperLayerManager(thickness);
    
    this.createBoardSubstrate();
    this.createCopperLayers();
  }

  private createBoardSubstrate(): void {
    // Create FR4 substrate geometry
    const geometry = new THREE.BoxGeometry(this.width, this.thickness, this.height);
    
    // FR4 material - dark green/brown PCB substrate
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x2d4a2b, // Dark green FR4
      roughness: 0.8,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.8,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'pcb_board';
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    
    // Center at world origin
    this.mesh.position.set(0, 0, 0);
  }

  private createCopperLayers(): void {
    // Create invisible container objects for copper layers
    this.topCopperLayer = new THREE.Object3D();
    this.topCopperLayer.name = 'top_copper_layer';
    
    this.bottomCopperLayer = new THREE.Object3D();
    this.bottomCopperLayer.name = 'bottom_copper_layer';

    // Use CopperLayerManager for precise Z positioning
    // This ensures no Z-fighting with explicit Z offsets
    this.topCopperLayer.position.y = this.copperLayerManager.getTopCopperZ();
    this.bottomCopperLayer.position.y = this.copperLayerManager.getBottomCopperZ();

    // Add copper layers as children of board mesh
    this.mesh.add(this.topCopperLayer);
    this.mesh.add(this.bottomCopperLayer);
  }

  /**
   * Add copper plane to specified layer with Z-fighting prevention
   * Uses CopperLayerManager for precise positioning
   */
  public addCopperPlane(layer: 'top' | 'bottom', width: number, height: number, x: number, z: number): THREE.Mesh {
    // Use CopperLayerManager to create properly positioned copper geometry
    const copperMesh = this.copperLayerManager.createCopperPlane(width, height, x, z, layer);
    
    // Apply shader material if available
    try {
      const shaderMaterial = CopperShader.createMaterial();
      // Enable polygon offset for additional Z-fighting prevention (backup to explicit Z offset)
      shaderMaterial.polygonOffset = true;
      shaderMaterial.polygonOffsetFactor = 1;
      shaderMaterial.polygonOffsetUnits = 1;
      copperMesh.material = shaderMaterial;
    } catch (error) {
      console.warn('CopperShader not available, using standard material');
    }
    
    const targetLayer = layer === 'top' ? this.topCopperLayer : this.bottomCopperLayer;
    targetLayer.add(copperMesh);
    
    return copperMesh;
  }

  /**
   * Create copper pour (ground plane) for entire layer
   */
  public createCopperPour(layer: 'top' | 'bottom'): THREE.Mesh {
    // Slightly smaller than board to show board edge
    const pourWidth = this.width - 2;
    const pourHeight = this.height - 2;
    
    return this.addCopperPlane(layer, pourWidth, pourHeight, 0, 0);
  }

  /**
   * Get board dimensions for serialization
   */
  public getDimensions(): { width: number; height: number; thickness: number } {
    return {
      width: this.width,
      height: this.height,
      thickness: this.thickness
    };
  }

  /**
   * Update board dimensions (for dynamic resizing)
   */
  public updateDimensions(width: number, height: number, thickness?: number): void {
    this.width = width;
    this.height = height;
    if (thickness !== undefined) {
      this.thickness = thickness;
      // Update copper layer manager with new thickness
      this.copperLayerManager.updateBoardThickness(thickness);
    }

    // Recreate geometry with new dimensions
    const newGeometry = new THREE.BoxGeometry(this.width, this.thickness, this.height);
    this.mesh.geometry.dispose();
    this.mesh.geometry = newGeometry;

    // Update copper layer positions using CopperLayerManager
    this.topCopperLayer.position.y = this.copperLayerManager.getTopCopperZ();
    this.bottomCopperLayer.position.y = this.copperLayerManager.getBottomCopperZ();
  }

  /**
   * Helper function: Get Z position for top copper layer
   * Exposes CopperLayerManager functionality
   */
  public getTopCopperZ(): number {
    return this.copperLayerManager.getTopCopperZ();
  }

  /**
   * Helper function: Get Z position for bottom copper layer
   * Exposes CopperLayerManager functionality
   */
  public getBottomCopperZ(): number {
    return this.copperLayerManager.getBottomCopperZ();
  }

  /**
   * Get copper layer manager for advanced operations
   */
  public getCopperLayerManager(): CopperLayerManager {
    return this.copperLayerManager;
  }

  /**
   * Get all copper elements from specified layer
   */
  public getCopperElements(layer: 'top' | 'bottom'): THREE.Mesh[] {
    const targetLayer = layer === 'top' ? this.topCopperLayer : this.bottomCopperLayer;
    const elements: THREE.Mesh[] = [];
    
    targetLayer.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        elements.push(child);
      }
    });
    
    return elements;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Dispose board geometry and material
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }

    // Dispose all copper elements
    this.disposeCopperLayer(this.topCopperLayer);
    this.disposeCopperLayer(this.bottomCopperLayer);
  }

  private disposeCopperLayer(layer: THREE.Object3D): void {
    layer.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    layer.clear();
  }
}
