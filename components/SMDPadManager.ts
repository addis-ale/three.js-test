import * as THREE from 'three';
import { SMDPads, SMDDPadData } from './SMDPads';
import { SMDPadFactory } from './SMDPadFactory';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * SMD Pad Manager
 * 
 * High-level interface for managing SMD pads in the PCB editor
 * Integrates with existing scene and copper layer system
 */
export class SMDPadManager {
  private smdPads: SMDPads;
  private copperLayerManager: CopperLayerManager;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, copperLayerManager: CopperLayerManager) {
    this.scene = scene;
    this.copperLayerManager = copperLayerManager;
    
    // Initialize SMD pads system
    this.smdPads = new SMDPads(copperLayerManager, 1000);
    
    // Add instanced mesh to scene
    this.scene.add(this.smdPads.instancedMesh);
    
    // Add edge mesh to scene (NEW)
    this.scene.add(this.smdPads.edgeMesh);
  }

  /**
   * Initialize with demo pads (100+ pads as required)
   */
  public initializeDemo(): void {
    console.log('Initializing SMD pad system with demo layout...');
    
    // Create mixed demo layout with 100+ pads
    const demoPads = SMDPadFactory.createDemoLayout('top');
    
    // Add pads to system
    const addedCount = this.smdPads.addPads(demoPads);
    
    console.log(`✅ Added ${addedCount} SMD pads to the scene`);
    
    // Log statistics
    const stats = this.getStatistics();
    console.log('📊 SMD Pad Statistics:', stats);
  }

  /**
   * Add a single pad
   */
  public addPad(padData: SMDDPadData): boolean {
    return this.smdPads.addPad(padData);
  }

  /**
   * Add multiple pads
   */
  public addPads(padsArray: SMDDPadData[]): number {
    return this.smdPads.addPads(padsArray);
  }

  /**
   * Add predefined test patterns
   */
  public addTestPattern(patternName: 'basic' | 'grid' | 'ic' | 'mixed'): number {
    const patterns = SMDPadFactory.createTestPatterns();
    const pads = patterns[patternName];
    
    return this.smdPads.addPads(pads);
  }

  /**
   * Remove a pad by ID
   */
  public removePad(padId: string): boolean {
    return this.smdPads.removePad(padId);
  }

  /**
   * Clear all pads
   */
  public clearAll(): void {
    this.smdPads.clear();
    console.log('🧹 Cleared all SMD pads');
  }

  /**
   * Get pad by ID
   */
  public getPad(padId: string): SMDDPadData | undefined {
    return this.smdPads.getPad(padId);
  }

  /**
   * Get all pads
   */
  public getAllPads(): SMDDPadData[] {
    return this.smdPads.getAllPads();
  }

  /**
   * Get pads by layer
   */
  public getPadsByLayer(layer: 'top' | 'bottom'): SMDDPadData[] {
    return this.smdPads.getPadsByLayer(layer);
  }

  /**
   * Get pads by type
   */
  public getPadsByType(type: 'rect' | 'circle'): SMDDPadData[] {
    return this.smdPads.getPadsByType(type);
  }

  /**
   * Update pad position
   */
  public updatePadPosition(padId: string, newPosition: THREE.Vector3): boolean {
    return this.smdPads.updatePadPosition(padId, newPosition);
  }

  /**
   * Update pad size
   */
  public updatePadSize(padId: string, newSize: THREE.Vector2): boolean {
    return this.smdPads.updatePadSize(padId, newSize);
  }

  /**
   * Get performance statistics
   */
  public getStatistics(): {
    totalInstances: number;
    maxInstances: number;
    rectangularPads: number;
    circularPads: number;
    topLayerPads: number;
    bottomLayerPads: number;
  } {
    return this.smdPads.getStats();
  }

  /**
   * Validate pad positioning on copper layers
   */
  public validateCopperLayerPositioning(): {
    valid: boolean;
    topLayerZ: number;
    bottomLayerZ: number;
    padsOnTop: number;
    padsOnBottom: number;
  } {
    const topZ = this.copperLayerManager.getTopCopperZ();
    const bottomZ = this.copperLayerManager.getBottomCopperZ();
    const topPads = this.getPadsByLayer('top');
    const bottomPads = this.getPadsByLayer('bottom');
    
    return {
      valid: this.copperLayerManager.validateZSeparation(),
      topLayerZ: topZ,
      bottomLayerZ: bottomZ,
      padsOnTop: topPads.length,
      padsOnBottom: bottomPads.length
    };
  }

  /**
   * Create visual markers for copper layer validation
   */
  public createCopperLayerMarkers(): void {
    // Remove existing markers
    this.removeCopperLayerMarkers();
    
    // Top copper layer marker (green)
    const topMarker = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.7, transparent: true })
    );
    topMarker.position.set(0, this.copperLayerManager.getTopCopperZ(), 0);
    topMarker.name = 'copper_layer_marker_top';
    this.scene.add(topMarker);

    // Bottom copper layer marker (red)
    const bottomMarker = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true })
    );
    bottomMarker.position.set(0, this.copperLayerManager.getBottomCopperZ(), 0);
    bottomMarker.name = 'copper_layer_marker_bottom';
    this.scene.add(bottomMarker);
  }

  /**
   * Remove copper layer markers
   */
  private removeCopperLayerMarkers(): void {
    const topMarker = this.scene.getObjectByName('copper_layer_marker_top');
    const bottomMarker = this.scene.getObjectByName('copper_layer_marker_bottom');
    
    if (topMarker) {
      this.scene.remove(topMarker);
      if (topMarker instanceof THREE.Mesh) {
        topMarker.geometry.dispose();
        if (topMarker.material instanceof THREE.Material) {
          topMarker.material.dispose();
        }
      }
    }
    
    if (bottomMarker) {
      this.scene.remove(bottomMarker);
      if (bottomMarker instanceof THREE.Mesh) {
        bottomMarker.geometry.dispose();
        if (bottomMarker.material instanceof THREE.Material) {
          bottomMarker.material.dispose();
        }
      }
    }
  }

  /**
   * Set hover state for a specific pad
   */
  public setPadHovered(padId: string, hovered: boolean): boolean {
    return this.smdPads.setPadHovered(padId, hovered);
  }

  /**
   * Set hover state directly by instance ID (more efficient)
   */
  public setInstanceHovered(instanceId: number, hovered: boolean): boolean {
    return this.smdPads.setInstanceHovered(instanceId, hovered);
  }

  /**
   * Set selection state for a specific pad
   */
  public setPadSelected(padId: string, selected: boolean): boolean {
    return this.smdPads.setPadSelected(padId, selected);
  }

  /**
   * Clear all interaction states
   */
  public clearInteractionStates(): void {
    this.smdPads.clearInteractionStates();
  }

  /**
   * Get the shader material for advanced operations
   */
  public getShaderMaterial(): THREE.ShaderMaterial {
    return this.smdPads.getShaderMaterial();
  }

  /**
   * Get the instanced mesh for advanced operations
   */
  public getInstancedMesh(): THREE.InstancedMesh {
    return this.smdPads.instancedMesh;
  }

  /**
   * Get the edge mesh for edge operations (NEW)
   */
  public getEdgeMesh(): THREE.InstancedMesh {
    return this.smdPads.edgeMesh;
  }

  /**
   * Set edge visibility (NEW)
   */
  public setEdgeVisible(visible: boolean): void {
    this.smdPads.setEdgeVisible(visible);
  }

  /**
   * Set edge color (NEW)
   */
  public setEdgeColor(color: THREE.Color): void {
    this.smdPads.setEdgeColor(color);
  }

  /**
   * Set edge width (NEW)
   */
  public setEdgeWidth(width: number): void {
    this.smdPads.setEdgeWidth(width);
  }

  /**
   * Set edge opacity (NEW)
   */
  public setEdgeOpacity(opacity: number): void {
    this.smdPads.setEdgeOpacity(opacity);
  }

  /**
   * Update edge animation (NEW)
   */
  public updateEdgeAnimation(time: number): void {
    this.smdPads.updateEdgeAnimation(time);
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.removeCopperLayerMarkers();
    
    // Remove from scene
    this.scene.remove(this.smdPads.instancedMesh);
    this.scene.remove(this.smdPads.edgeMesh); // NEW: Remove edge mesh
    
    // Dispose SMD pads
    this.smdPads.dispose();
    
    console.log('🗑️ SMD Pad Manager disposed');
  }
}
