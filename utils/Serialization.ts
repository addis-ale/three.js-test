import * as THREE from 'three';
import { Board } from '../components/Board';
import { Pads, PadData } from '../components/Pads';
import { Traces, TraceData } from '../components/Traces';
import { SMDPadManager } from '../components/SMDPadManager';
import { TraceManager } from '../components/TraceManager';

/**
 * Enhanced Serialization interface for PCB board data
 */
export interface PCBBoardData {
  board: {
    width: number;
    height: number;
    thickness: number;
  };
  components: PCBComponentData[];
  metadata?: {
    version: string;
    created: string;
    modified: string;
    description?: string;
  };
}

export interface PCBComponentData {
  id: string;
  type: 'smd_rect' | 'smd_circle' | 'path';
  pos: [number, number, number];
  size?: [number, number];
  points?: [number, number][];
  width?: number;
  layer: 'top' | 'bottom';
  rotation?: number;
}

/**
 * Resource tracking for memory leak prevention
 */
interface ResourceTracker {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
  meshes: Set<THREE.Mesh>;
  textures: Set<THREE.Texture>;
}

/**
 * Enhanced Serialization system for PCB boards
 * Handles export/import with full resource management and memory leak prevention
 */
export class Serialization {
  private static resourceTracker: ResourceTracker = {
    geometries: new Set(),
    materials: new Set(),
    meshes: new Set(),
    textures: new Set()
  };

  /**
   * Export complete board to JSON with enhanced component support
   */
  public static exportBoard(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): PCBBoardData {
    const boardDimensions = board.getDimensions();
    
    // Export legacy pads
    const legacyPadComponents = pads.getAllPadData().map(pad => ({
      id: pad.id,
      type: `smd_${pad.type}` as PCBComponentData['type'],
      pos: [pad.position.x, pad.position.y, pad.position.z] as [number, number, number],
      size: [pad.size.x, pad.size.y] as [number, number],
      layer: pad.layer,
      rotation: pad.rotation || 0
    }));

    // Export SMD pads
    const smdPadComponents = smdPadManager.getAllPads().map(pad => ({
      id: pad.id,
      type: `smd_${pad.type}` as PCBComponentData['type'],
      pos: [pad.position.x, pad.position.y, pad.position.z] as [number, number, number],
      size: [pad.size.x, pad.size.y] as [number, number],
      layer: pad.layer,
      rotation: pad.rotation || 0
    }));

    // Export legacy traces
    const legacyTraceComponents = traces.getAllTraceData().map(trace => ({
      id: trace.id,
      type: 'path' as const,
      pos: [0, trace.layer === 'top' ? 0.01 : -0.01, 0] as [number, number, number],
      points: trace.points.map(p => [p.x, p.y] as [number, number]),
      width: trace.width,
      layer: trace.layer
    }));

    // Export flat traces
    const flatTraceComponents = traceManager.getAllTraces().map(trace => ({
      id: trace.id,
      type: 'path' as const,
      pos: [0, trace.layer === 'top' ? 0.01 : -0.01, 0] as [number, number, number],
      points: trace.points.map(p => [p.x, p.y] as [number, number]),
      width: trace.width,
      layer: trace.layer
    }));

    return {
      board: boardDimensions,
      components: [...legacyPadComponents, ...smdPadComponents, ...legacyTraceComponents, ...flatTraceComponents],
      metadata: {
        version: '2.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        description: 'PCB board with SMD pads and flat traces'
      }
    };
  }

  /**
   * Import board from JSON data with proper resource management
   */
  public static importBoard(
    data: PCBBoardData,
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    // Clear existing board and track resources for disposal
    this.clearBoard(board, pads, traces, smdPadManager, traceManager);

    // Update board dimensions
    board.updateDimensions(data.board.width, data.board.height, data.board.thickness);

    // Import components with type-specific handling
    data.components.forEach(component => {
      if (component.type.startsWith('smd_')) {
        this.importSMDPad(component, smdPadManager);
      } else if (component.type === 'path') {
        this.importFlatTrace(component, traceManager);
      } else if (component.type === 'smd_rect' || component.type === 'smd_circle') {
        this.importLegacyPad(component, pads);
      }
    });
  }

  /**
   * Import SMD pad with enhanced features
   */
  private static importSMDPad(data: PCBComponentData, smdPadManager: SMDPadManager): void {
    if (!data.type.startsWith('smd_') || !data.size) return;

    const padType = data.type.replace('smd_', '') as 'rect' | 'circle';
    const padData = {
      id: data.id,
      type: padType,
      position: new THREE.Vector3(...data.pos),
      size: new THREE.Vector2(...data.size),
      layer: data.layer,
      rotation: data.rotation || 0
    };

    smdPadManager.addPad(padData);
  }

  /**
   * Import flat trace with enhanced features
   */
  private static importFlatTrace(data: PCBComponentData, traceManager: TraceManager): void {
    if (data.type !== 'path' || !data.points || !data.width) return;

    const traceData: TraceData = {
      id: data.id,
      points: data.points.map(p => new THREE.Vector2(...p)),
      width: data.width,
      layer: data.layer
    };

    traceManager.addTrace(traceData);
  }

  /**
   * Import legacy pad for backward compatibility
   */
  private static importLegacyPad(data: PCBComponentData, pads: Pads): void {
    if (data.type !== 'smd_rect' && data.type !== 'smd_circle') return;
    if (!data.size) return;

    const padType = data.type.replace('smd_', '') as 'rect' | 'circle';
    const padData: PadData = {
      id: data.id,
      type: padType,
      position: new THREE.Vector3(...data.pos),
      size: new THREE.Vector2(...data.size),
      layer: data.layer,
      rotation: data.rotation || 0
    };

    pads.addPad(padData);
  }

  /**
   * Import legacy trace for backward compatibility
   */
  private static importLegacyTrace(data: PCBComponentData, traces: Traces): void {
    if (data.type !== 'path' || !data.points || !data.width) return;

    const traceData: TraceData = {
      id: data.id,
      points: data.points.map(p => new THREE.Vector2(...p)),
      width: data.width,
      layer: data.layer
    };

    traces.addTrace(traceData);
  }

  /**
   * Clear all components and track resources for disposal
   */
  private static clearBoard(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    // Track resources before clearing
    this.trackResources(pads);
    this.trackResources(traces);
    this.trackResources(smdPadManager);
    this.trackResources(traceManager);

    // Clear all legacy pads
    const allPads = pads.getAllPadData();
    allPads.forEach(pad => {
      pads.removePad(pad.id);
    });

    // Clear all legacy traces
    const allTraces = traces.getAllTraceData();
    allTraces.forEach(trace => {
      traces.removeTrace(trace.id);
    });

    // Clear SMD pads
    smdPadManager.clearAll();

    // Clear flat traces
    traceManager.clearAll();
  }

  /**
   * Track resources for memory leak prevention
   */
  private static trackResources(component: any): void {
    if (!component) return;

    // Track meshes
    if (component.instancedMesh) {
      this.resourceTracker.meshes.add(component.instancedMesh);
    }
    
    // Track edge mesh if exists
    if (component.edgeMesh) {
      this.resourceTracker.meshes.add(component.edgeMesh);
    }

    // Track geometries
    if (component.rectangularGeometry) {
      this.resourceTracker.geometries.add(component.rectangularGeometry);
    }
    if (component.circularGeometry) {
      this.resourceTracker.geometries.add(component.circularGeometry);
    }
    if (component.rectangularEdgeGeometry) {
      this.resourceTracker.geometries.add(component.rectangularEdgeGeometry);
    }
    if (component.circularEdgeGeometry) {
      this.resourceTracker.geometries.add(component.circularEdgeGeometry);
    }

    // Track materials
    if (component.instancedMesh?.material) {
      this.resourceTracker.materials.add(component.instancedMesh.material);
    }
    if (component.edgeMesh?.material) {
      this.resourceTracker.materials.add(component.edgeMesh.material);
    }

    // For TraceManager, track all trace meshes
    if (component.traceMeshes) {
      component.traceMeshes.forEach((mesh: THREE.Mesh) => {
        this.resourceTracker.meshes.add(mesh);
        if (mesh.geometry) {
          this.resourceTracker.geometries.add(mesh.geometry);
        }
        if (mesh.material) {
          const material = mesh.material;
          if (Array.isArray(material)) {
            material.forEach(m => this.resourceTracker.materials.add(m));
          } else {
            this.resourceTracker.materials.add(material);
          }
        }
      });
    }

    // Track cached geometries
    if (component.geometryCache) {
      component.geometryCache.forEach((geometry: THREE.BufferGeometry) => {
        this.resourceTracker.geometries.add(geometry);
      });
    }
  }

  /**
   * Dispose of all tracked resources to prevent memory leaks
   */
  public static disposeResources(): void {
    // Dispose geometries
    this.resourceTracker.geometries.forEach(geometry => {
      geometry.dispose();
    });
    this.resourceTracker.geometries.clear();

    // Dispose materials
    this.resourceTracker.materials.forEach(material => {
      material.dispose();
    });
    this.resourceTracker.materials.clear();

    // Dispose meshes
    this.resourceTracker.meshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (mesh.material) {
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        } else {
          material.dispose();
        }
      }
    });
    this.resourceTracker.meshes.clear();

    // Dispose textures
    this.resourceTracker.textures.forEach(texture => {
      texture.dispose();
    });
    this.resourceTracker.textures.clear();

    console.log('Disposed all tracked resources');
  }

  /**
   * Get resource tracking statistics
   */
  public static getResourceStats(): {
    geometries: number;
    materials: number;
    meshes: number;
    textures: number;
  } {
    return {
      geometries: this.resourceTracker.geometries.size,
      materials: this.resourceTracker.materials.size,
      meshes: this.resourceTracker.meshes.size,
      textures: this.resourceTracker.textures.size
    };
  }

  /**
   * Validate board data structure with enhanced validation
   */
  public static validateBoardData(data: any): data is PCBBoardData {
    if (!data || typeof data !== 'object') return false;
    
    // Check board structure
    if (!data.board || typeof data.board !== 'object') return false;
    if (typeof data.board.width !== 'number' || 
        typeof data.board.height !== 'number' || 
        typeof data.board.thickness !== 'number') return false;
    
    // Check components array
    if (!Array.isArray(data.components)) return false;
    
    // Validate each component
    for (const component of data.components) {
      if (!this.validateComponentData(component)) return false;
    }
    
    // Validate metadata if present
    if (data.metadata) {
      if (typeof data.metadata !== 'object') return false;
      if (data.metadata.version && typeof data.metadata.version !== 'string') return false;
    }
    
    return true;
  }

  /**
   * Validate individual component data with enhanced validation
   */
  private static validateComponentData(data: any): data is PCBComponentData {
    if (!data || typeof data !== 'object') return false;
    
    // Required fields
    if (typeof data.id !== 'string' || 
        typeof data.type !== 'string' || 
        !Array.isArray(data.pos) || 
        data.pos.length !== 3 ||
        typeof data.layer !== 'string') return false;
    
    // Validate position
    if (!data.pos.every((p: any) => typeof p === 'number')) return false;
    
    // Validate layer
    if (data.layer !== 'top' && data.layer !== 'bottom') return false;
    
    // Type-specific validation
    if (data.type.startsWith('smd_')) {
      if (!Array.isArray(data.size) || data.size.length !== 2) return false;
      if (!data.size.every((s: any) => typeof s === 'number')) return false;
    } else if (data.type === 'path') {
      if (typeof data.width !== 'number') return false;
      if (!Array.isArray(data.points) || data.points.length < 2) return false;
      if (!data.points.every((p: any) => Array.isArray(p) && p.length === 2)) return false;
    } else {
      return false; // Invalid type
    }
    
    return true;
  }

  /**
   * Download board data as JSON file with enhanced metadata
   */
  public static downloadBoardData(data: PCBBoardData, filename: string = 'pcb_board.json'): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Load board data from file with validation
   */
  public static loadBoardFromFile(file: File): Promise<PCBBoardData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (!this.validateBoardData(data)) {
            reject(new Error('Invalid board data structure'));
            return;
          }
          
          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Create backup of current board state with resource tracking
   */
  public static createBackup(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): string {
    const data = this.exportBoard(board, pads, traces, smdPadManager, traceManager);
    return JSON.stringify(data);
  }

  /**
   * Restore board from backup string with proper cleanup
   */
  public static restoreFromBackup(
    backup: string,
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    try {
      const data = JSON.parse(backup);
      
      if (!this.validateBoardData(data)) {
        throw new Error('Invalid backup data');
      }
      
      this.importBoard(data, board, pads, traces, smdPadManager, traceManager);
    } catch (error) {
      throw new Error('Failed to restore from backup');
    }
  }

  /**
   * Export board to JSON string
   */
  public static exportToString(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): string {
    const data = this.exportBoard(board, pads, traces, smdPadManager, traceManager);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import board from JSON string
   */
  public static importFromString(
    jsonString: string,
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    try {
      const data = JSON.parse(jsonString);
      
      if (!this.validateBoardData(data)) {
        throw new Error('Invalid JSON data structure');
      }
      
      this.importBoard(data, board, pads, traces, smdPadManager, traceManager);
    } catch (error) {
      throw new Error('Failed to import from JSON string');
    }
  }
}
