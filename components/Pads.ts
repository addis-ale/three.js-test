import * as THREE from 'three';
import { CopperShader } from '../shaders/CopperShader';
import { EdgeShader } from '../shaders/EdgeShader';

/**
 * PCB pad system using InstancedMesh for high-performance rendering
 * Supports rectangular and circular SMD pads with 100+ instances
 */
export interface PadData {
  id: string;
  type: 'rect' | 'circle';
  position: THREE.Vector3;
  size: THREE.Vector2; // width, height for rect, diameter, diameter for circle
  layer: 'top' | 'bottom';
  rotation?: number;
}

export class Pads {
  private rectangularPads!: THREE.InstancedMesh;
  private circularPads!: THREE.InstancedMesh;
  private rectangularEdges!: THREE.InstancedMesh;
  private circularEdges!: THREE.InstancedMesh;
  private padData: Map<string, PadData> = new Map();
  private idToInstanceId: Map<string, number> = new Map();
  private instanceIdToId: Map<number, string> = new Map();
  private nextInstanceId = 0;
  
  // Performance: Pre-allocate for up to 1000 pads
  private readonly maxInstances = 1000;
  
  // Temporary matrices for instance updates (reused for performance)
  private tempMatrix = new THREE.Matrix4();
  private tempVector = new THREE.Vector3();
  private tempQuaternion = new THREE.Quaternion();
  private tempScale = new THREE.Vector3();
  private tempPosition = new THREE.Vector3();

  constructor() {
    this.createInstancedMeshes();
  }

  private createInstancedMeshes(): void {
    // Create rectangular pad geometry (2x2mm standard pad size)
    const rectGeometry = new THREE.PlaneGeometry(2, 2);
    const rectMaterial = CopperShader.createMaterial();
    
    // Enable polygon offset for Z-fighting prevention
    rectMaterial.polygonOffset = true;
    rectMaterial.polygonOffsetFactor = 2;
    rectMaterial.polygonOffsetUnits = 2;
    
    this.rectangularPads = new THREE.InstancedMesh(
      rectGeometry,
      rectMaterial,
      this.maxInstances
    );
    this.rectangularPads.name = 'rectangular_pads';
    this.rectangularPads.castShadow = true;
    this.rectangularPads.receiveShadow = true;

    // Create circular pad geometry (2mm diameter)
    const circleGeometry = new THREE.CircleGeometry(1, 32);
    const circleMaterial = CopperShader.createMaterial();
    
    circleMaterial.polygonOffset = true;
    circleMaterial.polygonOffsetFactor = 2;
    circleMaterial.polygonOffsetUnits = 2;
    
    this.circularPads = new THREE.InstancedMesh(
      circleGeometry,
      circleMaterial,
      this.maxInstances
    );
    this.circularPads.name = 'circular_pads';
    this.circularPads.castShadow = true;
    this.circularPads.receiveShadow = true;

    // Create edge meshes with EdgeShader
    this.createEdgeMeshes();
  }

  /**
   * Create edge meshes with edge shader for visible pad outlines
   */
  private createEdgeMeshes(): void {
    // Create rectangular edge mesh
    const rectEdgeGeometry = new THREE.PlaneGeometry(2, 2);
    const rectEdgeMaterial = EdgeShader.createMaterial();
    
    this.rectangularEdges = new THREE.InstancedMesh(
      rectEdgeGeometry,
      rectEdgeMaterial,
      this.maxInstances
    );
    this.rectangularEdges.name = 'rectangular_edges';
    this.rectangularEdges.castShadow = false;
    this.rectangularEdges.receiveShadow = false;

    // Create circular edge mesh
    const circleEdgeGeometry = new THREE.CircleGeometry(1, 32);
    const circleEdgeMaterial = EdgeShader.createMaterial();
    
    this.circularEdges = new THREE.InstancedMesh(
      circleEdgeGeometry,
      circleEdgeMaterial,
      this.maxInstances
    );
    this.circularEdges.name = 'circular_edges';
    this.circularEdges.castShadow = false;
    this.circularEdges.receiveShadow = false;
  }

  /**
   * Add a new pad to system
   */
  public addPad(padData: PadData): number {
    const instanceId = this.nextInstanceId++;
    this.padData.set(padData.id, { ...padData });
    this.idToInstanceId.set(padData.id, instanceId);
    this.instanceIdToId.set(instanceId, padData.id);
    
    const rectMesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    const edgeMesh = padData.type === 'rect' ? this.rectangularEdges : this.circularEdges;
    
    // Set instance transform for both pad and edge meshes
    this.updatePadTransform(instanceId, padData);
    this.updateEdgeTransform(instanceId, padData);
    
    // Set instances visible
    rectMesh.count = Math.max(rectMesh.count, instanceId + 1);
    edgeMesh.count = Math.max(edgeMesh.count, instanceId + 1);
    
    return instanceId;
  }

  /**
   * Update pad position and properties
   */
  public updatePad(padId: string, updates: Partial<PadData>): void {
    const padData = this.padData.get(padId);
    if (!padData) return;
    
    // Update stored data
    Object.assign(padData, updates);
    
    // Find and update instance
    const instanceId = this.findInstanceId(padId);
    if (instanceId !== -1) {
      this.updatePadTransform(instanceId, padData);
      this.updateEdgeTransform(instanceId, padData);
    }
  }

  /**
   * Remove a pad from the system
   */
  public removePad(padId: string): void {
    const padData = this.padData.get(padId);
    if (!padData) return;
    
    const instanceId = this.findInstanceId(padId);
    if (instanceId === -1) return;
    
    // Mark pad and edge instances as invisible by moving them far away
    this.tempMatrix.makeTranslation(-1000, -1000, -1000);
    const mesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    const edgeMesh = padData.type === 'rect' ? this.rectangularEdges : this.circularEdges;
    
    mesh.setMatrixAt(instanceId, this.tempMatrix);
    mesh.instanceMatrix.needsUpdate = true;
    
    edgeMesh.setMatrixAt(instanceId, this.tempMatrix);
    edgeMesh.instanceMatrix.needsUpdate = true;
    
    // Remove from data map
    this.padData.delete(padId);
  }

  /**
   * Update transform matrix for a specific pad instance
   */
  private updatePadTransform(instanceId: number, padData: PadData): void {
    const mesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    
    // Scale based on pad size
    this.tempVector.set(padData.size.x, padData.size.y, 1);
    const scaleMatrix = new THREE.Matrix4().makeScale(
      padData.size.x / 2, // Divide by 2 because base geometry is 2x2
      padData.size.y / 2,
      1
    );
    
    // Rotation around Y axis
    const rotation = padData.rotation || 0;
    const rotationMatrix = new THREE.Matrix4().makeRotationY(rotation);
    
    // Translation to position
    const translationMatrix = new THREE.Matrix4().makeTranslation(
      padData.position.x,
      padData.position.y,
      padData.position.z
    );
    
    // Combine transforms: Scale -> Rotate -> Translate
    this.tempMatrix.multiplyMatrices(translationMatrix, rotationMatrix);
    this.tempMatrix.multiply(scaleMatrix);
    
    mesh.setMatrixAt(instanceId, this.tempMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Update transform matrix for edge mesh instance
   */
  private updateEdgeTransform(instanceId: number, padData: PadData): void {
    const edgeMesh = padData.type === 'rect' ? this.rectangularEdges : this.circularEdges;
    
    // Use same transform as pad but with slight offset to avoid Z-fighting
    const offset = 0.001; // Small offset above pad surface
    
    // Scale based on pad size
    this.tempVector.set(padData.size.x, padData.size.y, 1);
    const scaleMatrix = new THREE.Matrix4().makeScale(
      padData.size.x / 2, // Divide by 2 because base geometry is 2x2
      padData.size.y / 2,
      1
    );
    
    // Rotation around Y axis
    const rotation = padData.rotation || 0;
    const rotationMatrix = new THREE.Matrix4().makeRotationY(rotation);
    
    // Translation to position with Z offset
    const translationMatrix = new THREE.Matrix4().makeTranslation(
      padData.position.x,
      padData.position.y,
      padData.position.z + offset
    );
    
    // Combine transforms: Scale -> Rotate -> Translate
    this.tempMatrix.multiplyMatrices(translationMatrix, rotationMatrix);
    this.tempMatrix.multiply(scaleMatrix);
    
    edgeMesh.setMatrixAt(instanceId, this.tempMatrix);
    edgeMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Find instance ID by pad ID using optimized lookup
   */
  private findInstanceId(padId: string): number {
    return this.idToInstanceId.get(padId) ?? -1;
  }

  /**
   * Get pad ID by instance ID
   */
  public getPadIdByInstanceId(instanceId: number): string | undefined {
    return this.instanceIdToId.get(instanceId);
  }

  /**
   * Update instance matrix directly for drag operations
   */
  public updateInstanceMatrix(instanceId: number, matrix: THREE.Matrix4): void {
    const padId = this.instanceIdToId.get(instanceId);
    if (!padId) return;

    const padData = this.padData.get(padId);
    if (!padData) return;

    // Update pad mesh
    const padMesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    padMesh.setMatrixAt(instanceId, matrix);
    padMesh.instanceMatrix.needsUpdate = true;

    // Update edge mesh with same matrix
    const edgeMesh = padData.type === 'rect' ? this.rectangularEdges : this.circularEdges;
    edgeMesh.setMatrixAt(instanceId, matrix);
    edgeMesh.instanceMatrix.needsUpdate = true;

    // Update stored position from matrix
    matrix.decompose(this.tempPosition, this.tempQuaternion, this.tempScale);
    padData.position.copy(this.tempPosition);
  }

  /**
   * Get instance matrix for specific pad
   */
  public getInstanceMatrix(instanceId: number): THREE.Matrix4 | null {
    const padId = this.instanceIdToId.get(instanceId);
    if (!padId) return null;

    const padData = this.padData.get(padId);
    if (!padData) return null;

    const mesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(instanceId, matrix);
    return matrix;
  }

  /**
   * Get all pads for raycasting
   */
  public getMeshes(): THREE.InstancedMesh[] {
    return [
      this.rectangularPads, 
      this.circularPads,
      this.rectangularEdges,
      this.circularEdges
    ];
  }

  /**
   * Get pad data by ID
   */
  public getPadData(padId: string): PadData | undefined {
    return this.padData.get(padId);
  }

  /**
   * Get all pad data
   */
  public getAllPadData(): PadData[] {
    return Array.from(this.padData.values());
  }

  /**
   * Set hover state on specific pad
   */
  public setPadHovered(padId: string, hovered: boolean): void {
    const padData = this.padData.get(padId);
    if (!padData) return;
    
    const instanceId = this.findInstanceId(padId);
    if (instanceId === -1) return;
    
    // Update pad mesh hover state
    const padMesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    CopperShader.setHovered(padMesh.material as THREE.ShaderMaterial, hovered);
    
    // Update edge mesh hover state
    const edgeMesh = padData.type === 'rect' ? this.rectangularEdges : this.circularEdges;
    EdgeShader.setHovered(edgeMesh.material as THREE.ShaderMaterial, hovered);
  }

  /**
   * Set selection state on specific pad
   */
  public setPadSelected(padId: string, selected: boolean): void {
    const padData = this.padData.get(padId);
    if (!padData) return;
    
    const instanceId = this.findInstanceId(padId);
    if (instanceId === -1) return;
    
    // Update pad mesh selection state
    const padMesh = padData.type === 'rect' ? this.rectangularPads : this.circularPads;
    CopperShader.setSelected(padMesh.material as THREE.ShaderMaterial, selected);
    
    // Update edge mesh selection state
    const edgeMesh = padData.type === 'rect' ? this.rectangularEdges : this.circularEdges;
    EdgeShader.setSelected(edgeMesh.material as THREE.ShaderMaterial, selected);
  }

  /**
   * Update shader uniforms for animation
   */
  public updateShaders(time: number): void {
    CopperShader.updateMaterial(this.rectangularPads.material as THREE.ShaderMaterial, time);
    CopperShader.updateMaterial(this.circularPads.material as THREE.ShaderMaterial, time);
    
    // Update edge shaders
    EdgeShader.updateMaterial(this.rectangularEdges.material as THREE.ShaderMaterial, time);
    EdgeShader.updateMaterial(this.circularEdges.material as THREE.ShaderMaterial, time);
  }

  /**
   * Calculate surface area of a pad
   */
  public calculatePadArea(padId: string): number {
    const padData = this.padData.get(padId);
    if (!padData) return 0;
    
    if (padData.type === 'rect') {
      return padData.size.x * padData.size.y;
    } else {
      const radius = padData.size.x / 2;
      return Math.PI * radius * radius;
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Dispose pad meshes
    this.rectangularPads.geometry.dispose();
    (this.rectangularPads.material as THREE.Material).dispose();
    
    this.circularPads.geometry.dispose();
    (this.circularPads.material as THREE.Material).dispose();
    
    // Dispose edge meshes
    this.rectangularEdges.geometry.dispose();
    (this.rectangularEdges.material as THREE.Material).dispose();
    
    this.circularEdges.geometry.dispose();
    (this.circularEdges.material as THREE.Material).dispose();
    
    this.padData.clear();
  }
}
