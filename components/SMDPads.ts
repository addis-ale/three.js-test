import * as THREE from 'three';
import { CopperLayerManager } from '../engine/CopperLayerManager';
import { ShaderManager } from '../shaders/ShaderManager';
import { BarycentricShader } from '../shaders/BarycentricShader';
import { BarycentricGeometry } from '../utils/BarycentricGeometry';
import { InstancedHoverShader } from '../shaders/InstancedHoverShader';

/**
 * SMD Pad System using InstancedMesh
 * 
 * High-performance rendering of surface mount device pads
 * Uses single geometry/material with per-instance transforms
 */

export interface SMDDPadData {
  id: string;
  type: 'rect' | 'circle';
  position: THREE.Vector3;
  size: THREE.Vector2;
  rotation: number; // Rotation in radians
  layer: 'top' | 'bottom';
}

export class SMDPads {
  public instancedMesh: THREE.InstancedMesh;
  public edgeMesh: THREE.InstancedMesh; // NEW: Edge rendering mesh
  public padData: Map<string, SMDDPadData>;
  
  private copperLayerManager: CopperLayerManager;
  private maxInstances: number;
  private instanceCount: number = 0;
  private matrix: THREE.Matrix4;
  private tempVector: THREE.Vector3;
  private tempQuaternion: THREE.Quaternion;
  private tempEuler: THREE.Euler;
  private shaderManager: ShaderManager;

  // Geometry cache for different pad types
  private rectangularGeometry!: THREE.PlaneGeometry;
  private circularGeometry!: THREE.CircleGeometry;
  
  // Edge geometries with barycentric coordinates
  private rectangularEdgeGeometry!: THREE.PlaneGeometry;
  private circularEdgeGeometry!: THREE.CircleGeometry;

  constructor(copperLayerManager: CopperLayerManager, maxInstances: number = 1000) {
    this.copperLayerManager = copperLayerManager;
    this.maxInstances = maxInstances;
    this.padData = new Map();
    
    // Initialize shader manager for reusable copper materials
    this.shaderManager = ShaderManager.getInstance();
    
    // Initialize transformation helpers
    this.matrix = new THREE.Matrix4();
    this.tempVector = new THREE.Vector3();
    this.tempQuaternion = new THREE.Quaternion();
    this.tempEuler = new THREE.Euler();
    
    // Create geometries
    this.createGeometries();
    
    // Create instanced mesh with custom copper shader material
    this.instancedMesh = new THREE.InstancedMesh(
      this.rectangularGeometry,
      InstancedHoverShader.createMaterial({
        baseColor: new THREE.Color(0xb87333), // Copper color
        edgeColor: new THREE.Color(0x000000), // Black edges
        edgeWidth: 1.5
      }),
      this.maxInstances
    );
    
    this.instancedMesh.name = 'smd_pads';
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    
    // Create edge mesh with barycentric shader (NEW)
    this.edgeMesh = new THREE.InstancedMesh(
      this.rectangularEdgeGeometry,
      BarycentricShader.createMaterial({
        edgeColor: new THREE.Color(0x000000), // Black edges
        edgeWidth: 1.5,
        opacity: 0.8
      }),
      this.maxInstances
    );
    
    this.edgeMesh.name = 'smd_pad_edges';
    this.edgeMesh.castShadow = false;
    this.edgeMesh.receiveShadow = false;
  }

  /**
   * Create base geometries for pad types
   */
  private createGeometries(): void {
    // Rectangular pad geometry (1x1 unit, will be scaled per instance)
    this.rectangularGeometry = new THREE.PlaneGeometry(1, 1);
    
    // Circular pad geometry (1 unit diameter, will be scaled per instance)
    this.circularGeometry = new THREE.CircleGeometry(0.5, 32);
    
    // Edge geometries with barycentric coordinates (NEW)
    this.rectangularEdgeGeometry = BarycentricGeometry.createBarycentricPlane(1, 1);
    this.circularEdgeGeometry = BarycentricGeometry.createBarycentricCircle(0.5, 32);
  }

  /**
   * Add a single SMD pad to the instanced mesh
   */
  public addPad(padData: SMDDPadData): boolean {
    if (this.instanceCount >= this.maxInstances) {
      console.warn(`Maximum pad instances (${this.maxInstances}) reached`);
      return false;
    }

    // Store pad data
    this.padData.set(padData.id, padData);

    // Calculate instance matrix
    this.updateInstanceMatrix(padData, this.instanceCount);

    // Update instance count
    this.instanceCount++;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.count = this.instanceCount;
    
    // Update edge mesh with same transform (NEW)
    this.edgeMesh.setMatrixAt(this.instanceCount - 1, this.matrix.clone());
    this.edgeMesh.instanceMatrix.needsUpdate = true;
    this.edgeMesh.count = this.instanceCount;

    return true;
  }

  /**
   * Update instance matrix for a specific pad
   */
  private updateInstanceMatrix(padData: SMDDPadData, instanceId: number): void {
    // Get Z position based on layer
    const targetZ = padData.layer === 'top' 
      ? this.copperLayerManager.getTopCopperZ()
      : this.copperLayerManager.getBottomCopperZ();

    // Set position
    this.tempVector.set(padData.position.x, targetZ, padData.position.z);

    // Set rotation (only Y-axis rotation for pads)
    this.tempEuler.set(0, padData.rotation, 0);
    this.tempQuaternion.setFromEuler(this.tempEuler);

    // Set scale based on pad size
    const scale = new THREE.Vector3(padData.size.x, 1, padData.size.y);

    // Compose transformation matrix
    this.matrix.compose(this.tempVector, this.tempQuaternion, scale);

    // Apply to instanced mesh
    this.instancedMesh.setMatrixAt(instanceId, this.matrix);
  }

  /**
   * Add multiple pads efficiently
   */
  public addPads(padsArray: SMDDPadData[]): number {
    let addedCount = 0;
    
    padsArray.forEach(padData => {
      if (this.addPad(padData)) {
        addedCount++;
      }
    });

    return addedCount;
  }

  /**
   * Remove a pad by ID (requires rebuilding instances)
   */
  public removePad(padId: string): boolean {
    if (!this.padData.has(padId)) {
      return false;
    }

    // Remove from data map
    this.padData.delete(padId);

    // Rebuild instances (required for InstancedMesh removal)
    this.rebuildInstances();

    return true;
  }

  /**
   * Rebuild all instances after removal
   */
  private rebuildInstances(): void {
    // Reset instance count
    this.instanceCount = 0;
    this.instancedMesh.count = 0;
    this.edgeMesh.count = 0;

    // Re-add all remaining pads
    const remainingPads = Array.from(this.padData.values());
    this.padData.clear();
    
    remainingPads.forEach(padData => {
      this.addPad(padData);
    });
  }

  /**
   * Get pad data by ID
   */
  public getPad(padId: string): SMDDPadData | undefined {
    return this.padData.get(padId);
  }

  /**
   * Get all pad data
   */
  public getAllPads(): SMDDPadData[] {
    return Array.from(this.padData.values());
  }

  /**
   * Get pads by layer
   */
  public getPadsByLayer(layer: 'top' | 'bottom'): SMDDPadData[] {
    return Array.from(this.padData.values()).filter(pad => pad.layer === layer);
  }

  /**
   * Get pads by type
   */
  public getPadsByType(type: 'rect' | 'circle'): SMDDPadData[] {
    return Array.from(this.padData.values()).filter(pad => pad.type === type);
  }

  /**
   * Update pad position
   */
  public updatePadPosition(padId: string, newPosition: THREE.Vector3): boolean {
    const padData = this.padData.get(padId);
    if (!padData) return false;

    padData.position.copy(newPosition);

    // Find instance ID and update matrix
    const instanceId = this.getInstanceId(padId);
    if (instanceId !== -1) {
      this.updateInstanceMatrix(padData, instanceId);
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      return true;
    }

    return false;
  }

  /**
   * Get instance ID for a pad
   */
  private getInstanceId(padId: string): number {
    const pads = Array.from(this.padData.keys());
    return pads.indexOf(padId);
  }

  /**
   * Update pad size
   */
  public updatePadSize(padId: string, newSize: THREE.Vector2): boolean {
    const padData = this.padData.get(padId);
    if (!padData) return false;

    padData.size.copy(newSize);

    // Find instance ID and update matrix
    const instanceId = this.getInstanceId(padId);
    if (instanceId !== -1) {
      this.updateInstanceMatrix(padData, instanceId);
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      return true;
    }

    return false;
  }

  /**
   * Clear all pads
   */
  public clear(): void {
    this.padData.clear();
    this.instanceCount = 0;
    this.instancedMesh.count = 0;
    this.edgeMesh.count = 0;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.edgeMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Get performance statistics
   */
  public getStats(): {
    totalInstances: number;
    maxInstances: number;
    rectangularPads: number;
    circularPads: number;
    topLayerPads: number;
    bottomLayerPads: number;
  } {
    const pads = this.getAllPads();
    
    return {
      totalInstances: this.instanceCount,
      maxInstances: this.maxInstances,
      rectangularPads: pads.filter(p => p.type === 'rect').length,
      circularPads: pads.filter(p => p.type === 'circle').length,
      topLayerPads: pads.filter(p => p.layer === 'top').length,
      bottomLayerPads: pads.filter(p => p.layer === 'bottom').length
    };
  }

  /**
   * Set hover state for a specific pad instance
   */
  public setPadHovered(padId: string, hovered: boolean): boolean {
    const padData = this.padData.get(padId);
    if (!padData) return false;

    // Find the instance ID for this pad
    const instanceId = this.getInstanceId(padId);
    if (instanceId === -1) return false;

    // Update shader uniform for specific instance
    const material = this.instancedMesh.material as THREE.ShaderMaterial;
    if (hovered) {
      InstancedHoverShader.setHovered(material, true);
      InstancedHoverShader.setHoveredInstanceId(material, instanceId);
    } else {
      InstancedHoverShader.clearHover(material);
    }
    
    return true;
  }

  /**
   * Set hover state directly by instance ID (more efficient)
   */
  public setInstanceHovered(instanceId: number, hovered: boolean): boolean {
    if (instanceId < 0 || instanceId >= this.instanceCount) return false;

    const material = this.instancedMesh.material as THREE.ShaderMaterial;
    if (hovered) {
      InstancedHoverShader.setHovered(material, true);
      InstancedHoverShader.setHoveredInstanceId(material, instanceId);
    } else {
      InstancedHoverShader.clearHover(material);
    }
    
    return true;
  }

  /**
   * Set selection state for a specific pad
   */
  public setPadSelected(padId: string, selected: boolean): boolean {
    const padData = this.padData.get(padId);
    if (!padData) return false;

    // Update shader uniform
    const material = this.instancedMesh.material as THREE.ShaderMaterial;
    InstancedHoverShader.setSelected(material, selected);
    
    return true;
  }

  /**
   * Clear all interaction states (hover and selection) for all pads
   */
  public clearInteractionStates(): void {
    const material = this.instancedMesh.material as THREE.ShaderMaterial;
    InstancedHoverShader.clearHover(material);
    InstancedHoverShader.setSelected(material, false);
  }

  /**
   * Get the shader material for advanced operations
   */
  public getShaderMaterial(): THREE.ShaderMaterial {
    return this.instancedMesh.material as THREE.ShaderMaterial;
  }

  /**
   * Get the edge shader material for edge operations (NEW)
   */
  public getEdgeMaterial(): THREE.ShaderMaterial {
    return this.edgeMesh.material as THREE.ShaderMaterial;
  }

  /**
   * Set edge visibility (NEW)
   */
  public setEdgeVisible(visible: boolean): void {
    this.edgeMesh.visible = visible;
  }

  /**
   * Set edge color (NEW)
   */
  public setEdgeColor(color: THREE.Color): void {
    BarycentricShader.setEdgeColor(this.edgeMesh.material as THREE.ShaderMaterial, color);
  }

  /**
   * Set edge width (NEW)
   */
  public setEdgeWidth(width: number): void {
    BarycentricShader.setEdgeWidth(this.edgeMesh.material as THREE.ShaderMaterial, width);
  }

  /**
   * Set edge opacity (NEW)
   */
  public setEdgeOpacity(opacity: number): void {
    BarycentricShader.setOpacity(this.edgeMesh.material as THREE.ShaderMaterial, opacity);
  }

  /**
   * Update edge animation (NEW)
   */
  public updateEdgeAnimation(time: number): void {
    BarycentricShader.updateMaterial(this.edgeMesh.material as THREE.ShaderMaterial, time);
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Dispose geometries
    this.rectangularGeometry.dispose();
    this.circularGeometry.dispose();
    this.rectangularEdgeGeometry.dispose();
    this.circularEdgeGeometry.dispose();
    
    // Dispose materials
    if (this.instancedMesh.material instanceof THREE.Material) {
      this.instancedMesh.material.dispose();
    }
    if (this.edgeMesh.material instanceof THREE.Material) {
      this.edgeMesh.material.dispose();
    }
    
    // Clear data
    this.padData.clear();
  }
}
