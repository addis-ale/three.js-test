import * as THREE from 'three';

/**
 * Copper Layer System Manager
 * 
 * Implements Z-fighting prevention and precise copper layer positioning
 * for PCB editor functionality.
 * 
 * DESIGN CHOICE: Using explicit Z offsets for guaranteed Z-fighting elimination
 * over polygonOffset, as explicit positioning provides deterministic results
 * across different GPUs and rendering conditions.
 */
export class CopperLayerManager {
  private boardThickness: number;
  
  // Constants for copper layer positioning
  private readonly COPPER_OFFSET_MM = 0.01; // 0.01mm offset from board surface
  
  constructor(boardThickness: number) {
    this.boardThickness = boardThickness;
  }

  /**
   * Get Z position for top copper layer
   * Formula: TOP_COPPER_Z = +board.thickness / 2 + 0.01
   */
  public getTopCopperZ(): number {
    return +(this.boardThickness / 2) + this.COPPER_OFFSET_MM;
  }

  /**
   * Get Z position for bottom copper layer  
   * Formula: BOTTOM_COPPER_Z = -board.thickness / 2 - 0.01
   */
  public getBottomCopperZ(): number {
    return -(this.boardThickness / 2) - this.COPPER_OFFSET_MM;
  }

  /**
   * Create copper geometry positioned at correct Z height
   * Uses explicit Z offset for Z-fighting prevention
   */
  public createCopperGeometry(
    geometry: THREE.BufferGeometry,
    layer: 'top' | 'bottom'
  ): THREE.Mesh {
    const material = new THREE.MeshStandardMaterial({
      color: 0xb87333, // Copper color
      roughness: 0.7,
      metalness: 0.9,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply explicit Z offset based on layer
    const targetZ = layer === 'top' ? this.getTopCopperZ() : this.getBottomCopperZ();
    mesh.position.y = targetZ;
    
    // Ensure copper elements are rendered correctly
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  /**
   * Create a copper plane at specified position
   */
  public createCopperPlane(
    width: number,
    height: number,
    x: number = 0,
    z: number = 0,
    layer: 'top' | 'bottom'
  ): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = this.createCopperGeometry(geometry, layer);
    
    mesh.position.set(x, mesh.position.y, z);
    mesh.rotation.x = -Math.PI / 2; // Lay flat on board surface
    
    return mesh;
  }

  /**
   * Update copper layer positions when board thickness changes
   */
  public updateBoardThickness(newThickness: number): void {
    this.boardThickness = newThickness;
  }

  /**
   * Get current board thickness
   */
  public getBoardThickness(): number {
    return this.boardThickness;
  }

  /**
   * Validate Z-fighting prevention
   * Returns true if copper layers are properly separated from board
   */
  public validateZSeparation(): boolean {
    const topZ = this.getTopCopperZ();
    const bottomZ = this.getBottomCopperZ();
    const boardTop = this.boardThickness / 2;
    const boardBottom = -this.boardThickness / 2;
    
    // Check that copper layers are offset from board surface
    const topSeparation = Math.abs(topZ - boardTop);
    const bottomSeparation = Math.abs(bottomZ - boardBottom);
    
    return topSeparation >= this.COPPER_OFFSET_MM && 
           bottomSeparation >= this.COPPER_OFFSET_MM;
  }

  /**
   * Get layer information for debugging
   */
  public getLayerInfo(): {
    boardThickness: number;
    topCopperZ: number;
    bottomCopperZ: number;
    copperOffset: number;
    zSeparationValid: boolean;
  } {
    return {
      boardThickness: this.boardThickness,
      topCopperZ: this.getTopCopperZ(),
      bottomCopperZ: this.getBottomCopperZ(),
      copperOffset: this.COPPER_OFFSET_MM,
      zSeparationValid: this.validateZSeparation()
    };
  }
}
