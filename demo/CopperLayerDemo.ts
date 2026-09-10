import * as THREE from 'three';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Demonstration of Copper Layer System
 * Shows proper Z-positioning and Z-fighting prevention
 */
export class CopperLayerDemo {
  private copperLayerManager: CopperLayerManager;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, boardThickness: number = 1.6) {
    this.copperLayerManager = new CopperLayerManager(boardThickness);
    this.scene = scene;
  }

  /**
   * Demonstrate copper layer positioning with visual markers
   */
  public demonstrateCopperLayers(): void {
    console.log('=== Copper Layer System Demo ===');
    
    // Show layer information
    const layerInfo = this.copperLayerManager.getLayerInfo();
    console.log('Layer Configuration:', layerInfo);
    
    // Create visual markers for copper layers
    this.createLayerMarkers();
    
    // Create sample copper traces
    this.createSampleCopperTraces();
    
    console.log('✅ Copper layer system initialized successfully');
    console.log(`📍 Top Copper Z: ${this.copperLayerManager.getTopCopperZ()}`);
    console.log(`📍 Bottom Copper Z: ${this.copperLayerManager.getBottomCopperZ()}`);
    console.log(`🛡️  Z-fighting prevention: ${layerInfo.zSeparationValid ? 'ACTIVE' : 'INACTIVE'}`);
  }

  /**
   * Create visual markers showing copper layer positions
   */
  private createLayerMarkers(): void {
    // Top copper layer marker (green)
    const topMarker = new THREE.Mesh(
      new THREE.SphereGeometry(2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    topMarker.position.set(0, this.copperLayerManager.getTopCopperZ(), 0);
    topMarker.name = 'top_copper_marker';
    this.scene.add(topMarker);

    // Bottom copper layer marker (red)
    const bottomMarker = new THREE.Mesh(
      new THREE.SphereGeometry(2),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    bottomMarker.position.set(0, this.copperLayerManager.getBottomCopperZ(), 0);
    bottomMarker.name = 'bottom_copper_marker';
    this.scene.add(bottomMarker);

    // Board surface markers (blue)
    const boardThickness = this.copperLayerManager.getBoardThickness();
    const topBoardMarker = new THREE.Mesh(
      new THREE.SphereGeometry(1.5),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    topBoardMarker.position.set(10, boardThickness / 2, 0);
    topBoardMarker.name = 'top_board_marker';
    this.scene.add(topBoardMarker);

    const bottomBoardMarker = new THREE.Mesh(
      new THREE.SphereGeometry(1.5),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    bottomBoardMarker.position.set(10, -boardThickness / 2, 0);
    bottomBoardMarker.name = 'bottom_board_marker';
    this.scene.add(bottomBoardMarker);
  }

  /**
   * Create sample copper traces to demonstrate positioning
   */
  private createSampleCopperTraces(): void {
    // Top layer copper trace
    const topTrace = this.copperLayerManager.createCopperPlane(
      20, 2, -10, 0, 'top'
    );
    topTrace.name = 'sample_top_trace';
    this.scene.add(topTrace);

    // Bottom layer copper trace
    const bottomTrace = this.copperLayerManager.createCopperPlane(
      20, 2, 10, 0, 'bottom'
    );
    bottomTrace.name = 'sample_bottom_trace';
    this.scene.add(bottomTrace);

    // Create copper pads
    const topPad = this.copperLayerManager.createCopperGeometry(
      new THREE.CylinderGeometry(2, 2, 0.1),
      'top'
    );
    topPad.position.set(-10, 0, 0);
    topPad.name = 'sample_top_pad';
    this.scene.add(topPad);

    const bottomPad = this.copperLayerManager.createCopperGeometry(
      new THREE.CylinderGeometry(2, 2, 0.1),
      'bottom'
    );
    bottomPad.position.set(10, 0, 0);
    bottomPad.name = 'sample_bottom_pad';
    this.scene.add(bottomPad);
  }

  /**
   * Clean up demo objects
   */
  public cleanup(): void {
    const objectsToRemove = [
      'top_copper_marker',
      'bottom_copper_marker',
      'top_board_marker',
      'bottom_board_marker',
      'sample_top_trace',
      'sample_bottom_trace',
      'sample_top_pad',
      'sample_bottom_pad'
    ];

    objectsToRemove.forEach(name => {
      const object = this.scene.getObjectByName(name);
      if (object) {
        this.scene.remove(object);
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      }
    });
  }

  /**
   * Get helper functions for external use
   */
  public getHelperFunctions(): {
    getTopCopperZ: () => number;
    getBottomCopperZ: () => number;
    validateZSeparation: () => boolean;
  } {
    return {
      getTopCopperZ: () => this.copperLayerManager.getTopCopperZ(),
      getBottomCopperZ: () => this.copperLayerManager.getBottomCopperZ(),
      validateZSeparation: () => this.copperLayerManager.validateZSeparation()
    };
  }
}
