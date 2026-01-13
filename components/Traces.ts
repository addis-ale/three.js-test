import * as THREE from 'three';
import { CopperShader } from '../shaders/CopperShader';

/**
 * PCB trace system with flat manifold geometry
 * Creates smooth cornered traces that sit exactly on copper layers
 */
export interface TraceData {
  id: string;
  points: THREE.Vector2[]; // 2D points on board surface
  width: number;
  layer: 'top' | 'bottom';
}

export class Traces {
  private traceMesh!: THREE.InstancedMesh;
  private traceData: Map<string, TraceData> = new Map();
  private idToInstanceId: Map<string, number> = new Map();
  private instanceIdToId: Map<number, string> = new Map();
  private nextInstanceId = 0;
  
  private readonly maxInstances = 1000;
  private tempMatrix = new THREE.Matrix4();

  constructor() {
    this.createInstancedMesh();
  }

  private createInstancedMesh(): void {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = CopperShader.createMaterial();
    
    material.polygonOffset = true;
    material.polygonOffsetFactor = 1;
    material.polygonOffsetUnits = 1;
    
    this.traceMesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
    this.traceMesh.name = 'traces';
    this.traceMesh.castShadow = true;
    this.traceMesh.receiveShadow = true;
  }

  /**
   * Add a trace to the system
   */
  public addTrace(traceData: TraceData): number {
    const instanceId = this.nextInstanceId++;
    this.traceData.set(traceData.id, { ...traceData });
    this.idToInstanceId.set(traceData.id, instanceId);
    this.instanceIdToId.set(instanceId, traceData.id);
    
    // Calculate trace transform
    const transform = this.calculateTraceTransform(traceData);
    this.traceMesh.setMatrixAt(instanceId, transform);
    
    // Update instance count
    this.traceMesh.count = Math.max(this.traceMesh.count, instanceId + 1);
    
    return instanceId;
  }

  /**
   * Calculate transform matrix for trace instance
   */
  private calculateTraceTransform(traceData: TraceData): THREE.Matrix4 {
    // Calculate trace bounds and center
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const point of traceData.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.y);
      maxZ = Math.max(maxZ, point.y);
    }
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const scaleX = maxX - minX;
    const scaleZ = maxZ - minZ;
    
    // Position on correct layer
    const yPosition = traceData.layer === 'top' ? 0.01 : -0.01;
    
    // Create transform matrix
    const translation = new THREE.Matrix4().makeTranslation(centerX, yPosition, centerZ);
    const scale = new THREE.Matrix4().makeScale(scaleX, 1, scaleZ);
    
    this.tempMatrix.multiplyMatrices(translation, scale);
    return this.tempMatrix.clone();
  }

  /**
   * Create flat manifold geometry for trace with smooth corners
   */
  private createTraceGeometry(points: THREE.Vector2[], width: number): THREE.BufferGeometry {
    if (points.length < 2) {
      return new THREE.PlaneGeometry(width, width);
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    // Process each segment
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      const segmentVertices = this.createSegmentVertices(start, end, width, i === 0, i === points.length - 2);
      
      // Add vertices
      const baseIndex = vertices.length / 3;
      vertices.push(...segmentVertices);
      
      // Create indices for this segment
      if (i < points.length - 2) {
        // Connect to next segment
        indices.push(
          baseIndex, baseIndex + 1, baseIndex + 2,
          baseIndex, baseIndex + 2, baseIndex + 3
        );
      } else {
        // Last segment
        indices.push(
          baseIndex, baseIndex + 1, baseIndex + 2,
          baseIndex, baseIndex + 2, baseIndex + 3
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Create vertices for a single trace segment with mitered corners
   */
  private createSegmentVertices(
    start: THREE.Vector2, 
    end: THREE.Vector2, 
    width: number,
    isFirst: boolean,
    isLast: boolean
  ): number[] {
    const direction = new THREE.Vector2().subVectors(end, start).normalize();
    const perpendicular = new THREE.Vector2(-direction.y, direction.x).multiplyScalar(width / 2);

    const vertices: number[] = [];

    if (isFirst) {
      // First segment - create start cap
      vertices.push(
        start.x + perpendicular.x, 0, start.y + perpendicular.y,
        start.x - perpendicular.x, 0, start.y - perpendicular.y
      );
    }

    // Add end vertices for this segment
    vertices.push(
      end.x + perpendicular.x, 0, end.y + perpendicular.y,
      end.x - perpendicular.x, 0, end.y - perpendicular.y
    );

    return vertices;
  }

  /**
   * Create smooth corner geometry for trace junctions
   */
  private createCornerGeometry(
    prevPoint: THREE.Vector2,
    cornerPoint: THREE.Vector2,
    nextPoint: THREE.Vector2,
    width: number
  ): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    
    // Calculate miter angle
    const prevDir = new THREE.Vector2().subVectors(cornerPoint, prevPoint).normalize();
    const nextDir = new THREE.Vector2().subVectors(nextPoint, cornerPoint).normalize();
    
    const prevPerp = new THREE.Vector2(-prevDir.y, prevDir.x).multiplyScalar(width / 2);
    const nextPerp = new THREE.Vector2(-nextDir.y, nextDir.x).multiplyScalar(width / 2);
    
    // Create rounded corner shape
    shape.moveTo(cornerPoint.x + prevPerp.x, cornerPoint.y + prevPerp.y);
    shape.lineTo(cornerPoint.x + nextPerp.x, cornerPoint.y + nextPerp.y);
    shape.lineTo(cornerPoint.x - nextPerp.x, cornerPoint.y - nextPerp.y);
    shape.lineTo(cornerPoint.x - prevPerp.x, cornerPoint.y - prevPerp.y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  }

  /**
   * Update existing trace
   */
  public updateTrace(traceId: string, updates: Partial<TraceData>): void {
    const traceData = this.traceData.get(traceId);
    if (!traceData) return;

    // Update stored data
    Object.assign(traceData, updates);

    // Update transform
    const instanceId = this.idToInstanceId.get(traceId);
    if (instanceId !== undefined) {
      const transform = this.calculateTraceTransform(traceData);
      this.traceMesh.setMatrixAt(instanceId, transform);
      this.traceMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Remove trace
   */
  public removeTrace(traceId: string): void {
    const instanceId = this.idToInstanceId.get(traceId);
    if (instanceId === undefined) return;

    // Mark instance as invisible by moving it far away
    this.tempMatrix.makeTranslation(-1000, -1000, -1000);
    this.traceMesh.setMatrixAt(instanceId, this.tempMatrix);
    this.traceMesh.instanceMatrix.needsUpdate = true;

    // Remove from collections
    this.traceData.delete(traceId);
    this.idToInstanceId.delete(traceId);
    this.instanceIdToId.delete(instanceId);
  }

  /**
   * Get all trace meshes for raycasting
   */
  public getMeshes(): THREE.InstancedMesh[] {
    return [this.traceMesh];
  }

  /**
   * Get trace data by ID
   */
  public getTraceData(traceId: string): TraceData | undefined {
    return this.traceData.get(traceId);
  }

  /**
   * Get all trace data
   */
  public getAllTraceData(): TraceData[] {
    return Array.from(this.traceData.values());
  }

  /**
   * Set hover state on specific trace
   */
  public setTraceHovered(traceId: string, hovered: boolean): void {
    CopperShader.setHovered(this.traceMesh.material as THREE.ShaderMaterial, hovered);
  }

  /**
   * Set selection state on specific trace
   */
  public setTraceSelected(traceId: string, selected: boolean): void {
    CopperShader.setSelected(this.traceMesh.material as THREE.ShaderMaterial, selected);
  }

  /**
   * Update shader uniforms for animation
   */
  public updateShaders(time: number): void {
    CopperShader.updateMaterial(this.traceMesh.material as THREE.ShaderMaterial, time);
  }

  /**
   * Calculate trace length
   */
  public calculateTraceLength(traceId: string): number {
    const traceData = this.traceData.get(traceId);
    if (!traceData || traceData.points.length < 2) return 0;

    let length = 0;
    for (let i = 0; i < traceData.points.length - 1; i++) {
      const start = traceData.points[i];
      const end = traceData.points[i + 1];
      length += start.distanceTo(end);
    }

    return length;
  }

  /**
   * Calculate trace surface area
   */
  public calculateTraceArea(traceId: string): number {
    const traceData = this.traceData.get(traceId);
    if (!traceData) return 0;

    const length = this.calculateTraceLength(traceId);
    return length * traceData.width;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.traceMesh.geometry.dispose();
    (this.traceMesh.material as THREE.Material).dispose();
    
    this.traceData.clear();
    this.idToInstanceId.clear();
    this.instanceIdToId.clear();
  }
}
