import * as THREE from 'three';
import { FlatTraces, TraceData } from './FlatTraces';
import { InstancedHoverShader } from '../shaders/InstancedHoverShader';

/**
 * Trace Manager
 * 
 * High-level management for flat traces system
 * Handles trace creation, manipulation, and interaction
 */
export class TraceManager {
  private flatTraces: FlatTraces;
  private scene: THREE.Scene;
  private copperLayerManager: any;
  
  constructor(scene: THREE.Scene, copperLayerManager: any) {
    this.scene = scene;
    this.copperLayerManager = copperLayerManager;
    this.flatTraces = new FlatTraces(copperLayerManager, scene, 1000);
  }

  /**
   * Add a single trace
   */
  public addTrace(traceData: TraceData): boolean {
    return this.flatTraces.addTrace(traceData);
  }

  /**
   * Add multiple traces
   */
  public addTraces(traceDataArray: TraceData[]): number {
    let addedCount = 0;
    
    traceDataArray.forEach(traceData => {
      if (this.flatTraces.addTrace(traceData)) {
        addedCount++;
      }
    });
    
    console.log(`Added ${addedCount}/${traceDataArray.length} traces`);
    return addedCount;
  }

  /**
   * Remove a trace
   */
  public removeTrace(traceId: string): boolean {
    return this.flatTraces.removeTrace(traceId);
  }

  /**
   * Update trace path
   */
  public updateTracePath(traceId: string, newPoints: THREE.Vector2[]): boolean {
    return this.flatTraces.updateTrace(traceId, newPoints);
  }

  /**
   * Update trace width
   */
  public updateTraceWidth(traceId: string, newWidth: number): boolean {
    return this.flatTraces.updateTraceWidth(traceId, newWidth);
  }

  /**
   * Get trace data
   */
  public getTrace(traceId: string): TraceData | undefined {
    return this.flatTraces.getTrace(traceId);
  }

  /**
   * Get all traces
   */
  public getAllTraces(): TraceData[] {
    return this.flatTraces.getAllTraces();
  }

  /**
   * Get traces by layer
   */
  public getTracesByLayer(layer: 'top' | 'bottom'): TraceData[] {
    return this.flatTraces.getTracesByLayer(layer);
  }

  /**
   * Set hover state for a trace
   */
  public setTraceHovered(traceId: string, hovered: boolean): boolean {
    return this.flatTraces.setTraceHovered(traceId, hovered);
  }

  /**
   * Set selection state for a trace
   */
  public setTraceSelected(traceId: string, selected: boolean): boolean {
    return this.flatTraces.setTraceSelected(traceId, selected);
  }

  /**
   * Clear all traces
   */
  public clearAll(): void {
    this.flatTraces.clear();
  }

  /**
   * Get statistics
   */
  public getStatistics(): any {
    return this.flatTraces.getStats();
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.flatTraces.dispose();
  }

  /**
   * Get trace meshes for raycasting
   */
  public getTraceMeshes(): THREE.Mesh[] {
    return Array.from(this.flatTraces.traceMeshes.values());
  }

  /**
   * Initialize with sample traces
   */
  public initializeDemo(): void {
    this.flatTraces.createSampleTraces();
  }

  /**
   * Create trace from points with automatic width calculation
   */
  public createTraceFromPoints(
    points: THREE.Vector2[], 
    width: number = 0.5, 
    layer: 'top' | 'bottom' = 'top',
    name?: string
  ): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const traceData: TraceData = {
      id: traceId,
      points,
      width,
      layer,
      name: name || `Trace ${traceId}`
    };
    
    if (this.addTrace(traceData)) {
      return traceId;
    }
    
    return '';
  }

  /**
   * Create rectangular trace loop
   */
  public createRectangularTrace(
    center: THREE.Vector2,
    size: THREE.Vector2,
    width: number = 0.5,
    layer: 'top' | 'bottom' = 'top'
  ): string {
    const halfWidth = size.x / 2;
    const halfHeight = size.y / 2;
    
    const points = [
      new THREE.Vector2(center.x - halfWidth, center.y - halfHeight),
      new THREE.Vector2(center.x + halfWidth, center.y - halfHeight),
      new THREE.Vector2(center.x + halfWidth, center.y + halfHeight),
      new THREE.Vector2(center.x - halfWidth, center.y + halfHeight),
      new THREE.Vector2(center.x - halfWidth, center.y - halfHeight) // Close the loop
    ];
    
    return this.createTraceFromPoints(points, width, layer, 'Rectangular Trace');
  }

  /**
   * Create circular trace
   */
  public createCircularTrace(
    center: THREE.Vector2,
    radius: number,
    width: number = 0.5,
    segments: number = 16,
    layer: 'top' | 'bottom' = 'top'
  ): string {
    const points: THREE.Vector2[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      points.push(new THREE.Vector2(x, y));
    }
    
    return this.createTraceFromPoints(points, width, layer, 'Circular Trace');
  }

  /**
   * Create zigzag trace
   */
  public createZigzagTrace(
    start: THREE.Vector2,
    end: THREE.Vector2,
    amplitude: number,
    frequency: number,
    width: number = 0.5,
    layer: 'top' | 'bottom' = 'top'
  ): string {
    const points: THREE.Vector2[] = [];
    const distance = start.distanceTo(end);
    const steps = Math.floor(distance * frequency);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      
      // Add zigzag perpendicular offset
      const perpAngle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
      const offset = Math.sin(t * Math.PI * 2 * frequency) * amplitude;
      
      const finalX = x + Math.cos(perpAngle) * offset;
      const finalY = y + Math.sin(perpAngle) * offset;
      
      points.push(new THREE.Vector2(finalX, finalY));
    }
    
    return this.createTraceFromPoints(points, width, layer, 'Zigzag Trace');
  }

  /**
   * Batch create traces from array of specifications
   */
  public batchCreateTraces(specifications: Array<{
    type: 'straight' | 'rectangular' | 'circular' | 'zigzag';
    params: any;
  }>): string[] {
    const createdIds: string[] = [];
    
    specifications.forEach(spec => {
      let traceId = '';
      
      switch (spec.type) {
        case 'straight':
          traceId = this.createTraceFromPoints(
            spec.params.points,
            spec.params.width,
            spec.params.layer
          );
          break;
          
        case 'rectangular':
          traceId = this.createRectangularTrace(
            spec.params.center,
            spec.params.size,
            spec.params.width,
            spec.params.layer
          );
          break;
          
        case 'circular':
          traceId = this.createCircularTrace(
            spec.params.center,
            spec.params.radius,
            spec.params.width,
            spec.params.segments,
            spec.params.layer
          );
          break;
          
        case 'zigzag':
          traceId = this.createZigzagTrace(
            spec.params.start,
            spec.params.end,
            spec.params.amplitude,
            spec.params.frequency,
            spec.params.width,
            spec.params.layer
          );
          break;
      }
      
      if (traceId) {
        createdIds.push(traceId);
      }
    });
    
    console.log(`Batch created ${createdIds.length}/${specifications.length} traces`);
    return createdIds;
  }

  /**
   * Get trace by mesh (for raycasting interaction)
   */
  public getTraceByMesh(mesh: THREE.Mesh): TraceData | null {
    if (!mesh.name || !mesh.name.startsWith('trace_')) {
      return null;
    }
    
    // Extract trace ID from mesh name (format: trace_{traceId}_segment_{index})
    const parts = mesh.name.split('_');
    if (parts.length >= 2) {
      const traceId = parts[1];
      const trace = this.getTrace(traceId);
      return trace || null;
    }
    
    return null;
  }

  /**
   * Update all traces with new shader parameters
   */
  public updateAllTracesShader(params: {
    baseColor?: THREE.Color;
    edgeColor?: THREE.Color;
    edgeWidth?: number;
  }): void {
    const traces = this.getAllTraces();
    
    traces.forEach(trace => {
      // Update each segment of the trace
      const segments = this.flatTraces.traceSegments.get(trace.id) || [];
      segments.forEach((_, index) => {
        const meshKey = `${trace.id}_${index}`;
        const mesh = this.flatTraces.traceMeshes.get(meshKey);
        
        if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
          if (params.baseColor) {
            InstancedHoverShader.setBaseColor(mesh.material, params.baseColor);
          }
          if (params.edgeColor) {
            InstancedHoverShader.setEdgeColor(mesh.material, params.edgeColor);
          }
          if (params.edgeWidth) {
            InstancedHoverShader.setEdgeWidth(mesh.material, params.edgeWidth);
          }
        }
      });
    });
  }

  /**
   * Animate all traces
   */
  public animateTraces(time: number): void {
    const traces = this.getAllTraces();
    
    traces.forEach(trace => {
      const segments = this.flatTraces.traceSegments.get(trace.id) || [];
      segments.forEach((_, index) => {
        const meshKey = `${trace.id}_${index}`;
        const mesh = this.flatTraces.traceMeshes.get(meshKey);
        
        if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
          InstancedHoverShader.updateMaterial(mesh.material, time);
        }
      });
    });
  }
}
