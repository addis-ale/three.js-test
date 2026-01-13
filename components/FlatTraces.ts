import * as THREE from 'three';
import { InstancedHoverShader } from '../shaders/InstancedHoverShader';

/**
 * Flat Traces System
 * 
 * Implements traces as flat manifold geometry with real width
 * Uses same shader as pads for consistent appearance
 */
export interface TraceData {
  id: string;
  points: THREE.Vector2[]; // 2D path points
  width: number; // Trace width in mm
  layer: 'top' | 'bottom';
  name?: string;
}

export interface TraceSegment {
  startPoint: THREE.Vector2;
  endPoint: THREE.Vector2;
  width: number;
  angle: number;
  length: number;
}

export class FlatTraces {
  public traces: Map<string, TraceData> = new Map();
  public traceMeshes: Map<string, THREE.Mesh> = new Map();
  public instancedMesh: THREE.InstancedMesh | null = null;
  public traceSegments: Map<string, TraceSegment[]> = new Map();
  
  private maxInstances: number;
  private instanceCount: number = 0;
  private scene: THREE.Scene;
  
  // Geometry cache for different trace widths
  private geometryCache: Map<number, THREE.BufferGeometry> = new Map();
  
  constructor(_copperLayerManager: unknown, scene: THREE.Scene, maxInstances: number = 1000) {
    this.scene = scene;
    this.maxInstances = maxInstances;
    
    this.createInstancedMesh();
  }

  /**
   * Create instanced mesh for traces
   */
  private createInstancedMesh(): void {
    // Create a base trace geometry (will be replaced per instance)
    const baseGeometry = this.createTraceSegmentGeometry(1.0, 1.0);
    
    // Use the same shader as pads for consistent appearance
    const material = InstancedHoverShader.createMaterial({
      baseColor: new THREE.Color(0xb87333), // Copper color
      edgeColor: new THREE.Color(0x000000), // Black edges
      edgeWidth: 1.5
    });
    
    this.instancedMesh = new THREE.InstancedMesh(
      baseGeometry,
      material,
      this.maxInstances
    );
    
    this.instancedMesh.name = 'flat_traces';
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    
    // Add to copper layer
    this.scene.add(this.instancedMesh);
  }

  /**
   * Create flat manifold geometry for a trace segment
   */
  private createTraceSegmentGeometry(length: number, width: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    // Create vertices for a flat rectangle
    const halfWidth = width / 2;
    const halfLength = length / 2;
    
    const vertices = new Float32Array([
      // Front face
      -halfLength, 0, -halfWidth,
       halfLength, 0, -halfWidth,
       halfLength, 0,  halfWidth,
      -halfLength, 0,  halfWidth,
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]);
    
    // Add barycentric coordinates for edge rendering
    const barycentrics = new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
      1, 0, 1,
    ]);
    
    // Add UV coordinates for potential texturing
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ]);
    
    // Add normals (all pointing up for flat traces)
    const normals = new Float32Array([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    return geometry;
  }

  /**
   * Break a trace path into segments
   */
  private breakTraceIntoSegments(points: THREE.Vector2[], width: number): TraceSegment[] {
    const segments: TraceSegment[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];
      
      // Calculate segment properties
      const dx = endPoint.x - startPoint.x;
      const dz = endPoint.y - startPoint.y;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      
      segments.push({
        startPoint,
        endPoint,
        width,
        angle,
        length
      });
    }
    
    return segments;
  }

  /**
   * Create or get cached geometry for specific dimensions
   */
  private getOrCreateGeometry(length: number, width: number): THREE.BufferGeometry {
    const cacheKey = Math.round(length * 100) * 10000 + Math.round(width * 100);
    
    if (!this.geometryCache.has(cacheKey)) {
      const geometry = this.createTraceSegmentGeometry(length, width);
      this.geometryCache.set(cacheKey, geometry);
    }
    
    return this.geometryCache.get(cacheKey)!;
  }

  /**
   * Add a trace to the system
   */
  public addTrace(traceData: TraceData): boolean {
    if (this.instanceCount >= this.maxInstances) {
      console.warn('Maximum trace instances reached');
      return false;
    }
    
    // Store trace data
    this.traces.set(traceData.id, traceData);
    
    // Break trace into segments
    const segments = this.breakTraceIntoSegments(traceData.points, traceData.width);
    this.traceSegments.set(traceData.id, segments);
    
    // Create mesh for each segment
    const segmentMeshes: THREE.Mesh[] = [];
    
    segments.forEach((segment, segmentIndex) => {
      // Create geometry for this segment
      const geometry = this.getOrCreateGeometry(segment.length, segment.width);
      
      // Create mesh with same material as pads
      const material = InstancedHoverShader.createMaterial({
        baseColor: new THREE.Color(0xb87333),
        edgeColor: new THREE.Color(0x000000),
        edgeWidth: 1.5
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `trace_${traceData.id}_segment_${segmentIndex}`;
      
      // Position and rotate the segment
      const centerX = (segment.startPoint.x + segment.endPoint.x) / 2;
      const centerZ = (segment.startPoint.y + segment.endPoint.y) / 2;
      
      mesh.position.set(centerX, 0, centerZ);
      mesh.rotation.y = -segment.angle;
      
      // Add to scene
      this.scene.add(mesh);
      this.traceMeshes.set(`${traceData.id}_${segmentIndex}`, mesh);
      
      segmentMeshes.push(mesh);
    });
    
    this.instanceCount += segments.length;
    
    console.log(`Added trace "${traceData.id}" with ${segments.length} segments`);
    return true;
  }

  /**
   * Remove a trace from the system
   */
  public removeTrace(traceId: string): boolean {
    if (!this.traces.has(traceId)) {
      return false;
    }
    
    // Remove segment meshes
    const segments = this.traceSegments.get(traceId) || [];
    segments.forEach((_, index) => {
      const meshKey = `${traceId}_${index}`;
      const mesh = this.traceMeshes.get(meshKey);
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
        this.traceMeshes.delete(meshKey);
      }
    });
    
    // Clean up data
    this.traces.delete(traceId);
    this.traceSegments.delete(traceId);
    this.instanceCount -= segments.length;
    
    console.log(`Removed trace "${traceId}"`);
    return true;
  }

  /**
   * Update trace path
   */
  public updateTrace(traceId: string, newPoints: THREE.Vector2[]): boolean {
    const traceData = this.traces.get(traceId);
    if (!traceData) {
      return false;
    }
    
    // Remove old segments
    this.removeTrace(traceId);
    
    // Add new segments with updated path
    traceData.points = newPoints;
    return this.addTrace(traceData);
  }

  /**
   * Update trace width
   */
  public updateTraceWidth(traceId: string, newWidth: number): boolean {
    const traceData = this.traces.get(traceId);
    if (!traceData) {
      return false;
    }
    
    // Remove old segments
    this.removeTrace(traceId);
    
    // Add new segments with updated width
    traceData.width = newWidth;
    return this.addTrace(traceData);
  }

  /**
   * Get trace data
   */
  public getTrace(traceId: string): TraceData | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get all traces
   */
  public getAllTraces(): TraceData[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get traces by layer
   */
  public getTracesByLayer(layer: 'top' | 'bottom'): TraceData[] {
    return Array.from(this.traces.values()).filter(trace => trace.layer === layer);
  }

  /**
   * Set hover state for a trace
   */
  public setTraceHovered(traceId: string, hovered: boolean): boolean {
    const segments = this.traceSegments.get(traceId);
    if (!segments) {
      return false;
    }
    
    // Update all segment meshes
    segments.forEach((_, index) => {
      const meshKey = `${traceId}_${index}`;
      const mesh = this.traceMeshes.get(meshKey);
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        InstancedHoverShader.setHovered(mesh.material, hovered);
      }
    });
    
    return true;
  }

  /**
   * Set selection state for a trace
   */
  public setTraceSelected(traceId: string, selected: boolean): boolean {
    const segments = this.traceSegments.get(traceId);
    if (!segments) {
      return false;
    }
    
    // Update all segment meshes
    segments.forEach((_, index) => {
      const meshKey = `${traceId}_${index}`;
      const mesh = this.traceMeshes.get(meshKey);
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        InstancedHoverShader.setSelected(mesh.material, selected);
      }
    });
    
    return true;
  }

  /**
   * Clear all traces
   */
  public clear(): void {
    // Remove all meshes
    this.traceMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    
    // Clear all data
    this.traces.clear();
    this.traceMeshes.clear();
    this.traceSegments.clear();
    this.instanceCount = 0;
    
    console.log('Cleared all traces');
  }

  /**
   * Get performance statistics
   */
  public getStats(): {
    totalTraces: number;
    totalSegments: number;
    maxInstances: number;
    cachedGeometries: number;
    topLayerTraces: number;
    bottomLayerTraces: number;
  } {
    const traces = this.getAllTraces();
    const totalSegments = Array.from(this.traceSegments.values())
      .reduce((sum, segments) => sum + segments.length, 0);
    
    return {
      totalTraces: this.traces.size,
      totalSegments,
      maxInstances: this.maxInstances,
      cachedGeometries: this.geometryCache.size,
      topLayerTraces: traces.filter(t => t.layer === 'top').length,
      bottomLayerTraces: traces.filter(t => t.layer === 'bottom').length
    };
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clear();
    
    // Dispose cached geometries
    this.geometryCache.forEach(geometry => {
      geometry.dispose();
    });
    this.geometryCache.clear();
    
    // Dispose instanced mesh
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (this.instancedMesh.material instanceof THREE.Material) {
        this.instancedMesh.material.dispose();
      }
    }
  }

  /**
   * Create sample traces for demonstration
   */
  public createSampleTraces(): void {
    // Sample trace 1: L-shaped trace
    const trace1: TraceData = {
      id: 'sample_trace_1',
      points: [
        new THREE.Vector2(-20, -10),
        new THREE.Vector2(0, -10),
        new THREE.Vector2(0, 10)
      ],
      width: 0.5,
      layer: 'top',
      name: 'L-shaped trace'
    };
    
    // Sample trace 2: Curved trace (approximated with segments)
    const trace2: TraceData = {
      id: 'sample_trace_2',
      points: [
        new THREE.Vector2(10, -10),
        new THREE.Vector2(15, -8),
        new THREE.Vector2(18, -5),
        new THREE.Vector2(20, 0),
        new THREE.Vector2(18, 5),
        new THREE.Vector2(15, 8),
        new THREE.Vector2(10, 10)
      ],
      width: 0.8,
      layer: 'top',
      name: 'Curved trace'
    };
    
    // Sample trace 3: Straight trace
    const trace3: TraceData = {
      id: 'sample_trace_3',
      points: [
        new THREE.Vector2(-30, 0),
        new THREE.Vector2(-10, 0)
      ],
      width: 1.0,
      layer: 'bottom',
      name: 'Straight trace'
    };
    
    this.addTrace(trace1);
    this.addTrace(trace2);
    this.addTrace(trace3);
    
    console.log('Created sample traces');
  }
}
