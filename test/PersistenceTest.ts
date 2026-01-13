import * as THREE from 'three';
import { Board } from '../components/Board';
import { Pads, PadData } from '../components/Pads';
import { Traces, TraceData } from '../components/Traces';
import { SMDPadManager } from '../components/SMDPadManager';
import { TraceManager } from '../components/TraceManager';
import { CopperLayerManager } from '../engine/CopperLayerManager';
import { Serialization } from '../utils/Serialization';

/**
 * Test suite for Persistence System (Phase 9)
 * Validates export/import, scene reconstruction, and memory leak prevention
 */
export class PersistenceTest {
  private copperLayerManager: CopperLayerManager;
  private scene: THREE.Scene;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6);
    this.scene = new THREE.Scene();
  }

  /**
   * Test board export functionality
   */
  public testBoardExport(): boolean {
    console.log('Testing board export functionality...');
    
    try {
      // Create test components
      const board = new Board(100, 80, 1.6);
      const pads = new Pads();
      const traces = new Traces();
      const smdPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
      const traceManager = new TraceManager(this.scene, this.copperLayerManager);
      
      // Add test data
      this.addTestData(board, pads, traces, smdPadManager, traceManager);
      
      // Export board
      const exportedData = Serialization.exportBoard(board, pads, traces, smdPadManager, traceManager);
      
      // Validate exported data structure
      const hasBoard = exportedData.board && 
                       typeof exportedData.board.width === 'number' && 
                       typeof exportedData.board.height === 'number' && 
                       typeof exportedData.board.thickness === 'number';
      
      const hasComponents = Array.isArray(exportedData.components) && exportedData.components.length > 0;
      const hasMetadata = exportedData.metadata && 
                         typeof exportedData.metadata.version === 'string' && 
                         typeof exportedData.metadata.created === 'string';
      
      // Validate component types
      const hasPads = exportedData.components.some(c => c.type.startsWith('smd_'));
      const hasTraces = exportedData.components.some(c => c.type === 'path');
      
      console.log(`Board data: ${hasBoard ? '✅' : '❌'}`);
      console.log(`Components: ${hasComponents ? '✅' : '❌'}`);
      console.log(`Metadata: ${hasMetadata ? '✅' : '❌'}`);
      console.log(`Has pads: ${hasPads ? '✅' : '❌'}`);
      console.log(`Has traces: ${hasTraces ? '✅' : '❌'}`);
      
      // Cleanup
      this.cleanup(board, pads, traces, smdPadManager, traceManager);
      
      return hasBoard && hasComponents && hasMetadata && hasPads && hasTraces;
    } catch (error) {
      console.error('Board export test failed:', error);
      return false;
    }
  }

  /**
   * Test board import functionality
   */
  public testBoardImport(): boolean {
    console.log('Testing board import functionality...');
    
    try {
      // Create original board
      const originalBoard = new Board(100, 80, 1.6);
      const originalPads = new Pads();
      const originalTraces = new Traces();
      const originalSMDPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
      const originalTraceManager = new TraceManager(this.scene, this.copperLayerManager);
      
      // Add test data to original
      this.addTestData(originalBoard, originalPads, originalTraces, originalSMDPadManager, originalTraceManager);
      
      // Export original board
      const exportedData = Serialization.exportBoard(
        originalBoard, originalPads, originalTraces, originalSMDPadManager, originalTraceManager
      );
      
      // Create new board for import
      const newBoard = new Board(50, 40, 1.0); // Different dimensions
      const newPads = new Pads();
      const newTraces = new Traces();
      const newSMDPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
      const newTraceManager = new TraceManager(this.scene, this.copperLayerManager);
      
      // Import data to new board
      Serialization.importBoard(exportedData, newBoard, newPads, newTraces, newSMDPadManager, newTraceManager);
      
      // Validate reconstruction
      const boardReconstructed = 
        newBoard.getDimensions().width === originalBoard.getDimensions().width &&
        newBoard.getDimensions().height === originalBoard.getDimensions().height &&
        newBoard.getDimensions().thickness === originalBoard.getDimensions().thickness;
      
      const padsReconstructed = newPads.getAllPadData().length === originalPads.getAllPadData().length;
      const tracesReconstructed = newTraces.getAllTraceData().length === originalTraces.getAllTraceData().length;
      const smdPadsReconstructed = newSMDPadManager.getAllPads().length === originalSMDPadManager.getAllPads().length;
      const flatTracesReconstructed = newTraceManager.getAllTraces().length === originalTraceManager.getAllTraces().length;
      
      console.log(`Board reconstructed: ${boardReconstructed ? '✅' : '❌'}`);
      console.log(`Legacy pads: ${padsReconstructed ? '✅' : '❌'} (${newPads.getAllPadData().length}/${originalPads.getAllPadData().length})`);
      console.log(`Legacy traces: ${tracesReconstructed ? '✅' : '❌'} (${newTraces.getAllTraceData().length}/${originalTraces.getAllTraceData().length})`);
      console.log(`SMD pads: ${smdPadsReconstructed ? '✅' : '❌'} (${newSMDPadManager.getAllPads().length}/${originalSMDPadManager.getAllPads().length})`);
      console.log(`Flat traces: ${flatTracesReconstructed ? '✅' : '❌'} (${newTraceManager.getAllTraces().length}/${originalTraceManager.getAllTraces().length})`);
      
      // Cleanup
      this.cleanup(originalBoard, originalPads, originalTraces, originalSMDPadManager, originalTraceManager);
      this.cleanup(newBoard, newPads, newTraces, newSMDPadManager, newTraceManager);
      
      return boardReconstructed && padsReconstructed && tracesReconstructed && smdPadsReconstructed && flatTracesReconstructed;
    } catch (error) {
      console.error('Board import test failed:', error);
      return false;
    }
  }

  /**
   * Test perfect scene reconstruction
   */
  public testPerfectReconstruction(): boolean {
    console.log('Testing perfect scene reconstruction...');
    
    try {
      // Create original scene
      const originalBoard = new Board(120, 90, 1.6);
      const originalPads = new Pads();
      const originalTraces = new Traces();
      const originalSMDPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
      const originalTraceManager = new TraceManager(this.scene, this.copperLayerManager);
      
      // Add comprehensive test data
      this.addComprehensiveTestData(originalBoard, originalPads, originalTraces, originalSMDPadManager, originalTraceManager);
      
      // Export original scene
      const exportedData = Serialization.exportBoard(
        originalBoard, originalPads, originalTraces, originalSMDPadManager, originalTraceManager
      );
      
      // Create new scene
      const newBoard = new Board(50, 50, 1.0);
      const newPads = new Pads();
      const newTraces = new Traces();
      const newSMDPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
      const newTraceManager = new TraceManager(this.scene, this.copperLayerManager);
      
      // Import to new scene
      Serialization.importBoard(exportedData, newBoard, newPads, newTraces, newSMDPadManager, newTraceManager);
      
      // Verify perfect reconstruction
      let reconstructionPerfect = true;
      
      // Check board dimensions
      const originalDims = originalBoard.getDimensions();
      const newDims = newBoard.getDimensions();
      if (originalDims.width !== newDims.width || originalDims.height !== newDims.height || originalDims.thickness !== newDims.thickness) {
        reconstructionPerfect = false;
        console.log('Board dimensions mismatch');
      }
      
      // Check component counts
      const originalCounts = {
        legacyPads: originalPads.getAllPadData().length,
        legacyTraces: originalTraces.getAllTraceData().length,
        smdPads: originalSMDPadManager.getAllPads().length,
        flatTraces: originalTraceManager.getAllTraces().length
      };
      
      const newCounts = {
        legacyPads: newPads.getAllPadData().length,
        legacyTraces: newTraces.getAllTraceData().length,
        smdPads: newSMDPadManager.getAllPads().length,
        flatTraces: newTraceManager.getAllTraces().length
      };
      
      Object.keys(originalCounts).forEach(key => {
        if (originalCounts[key as keyof typeof originalCounts] !== newCounts[key as keyof typeof newCounts]) {
          reconstructionPerfect = false;
          console.log(`${key} count mismatch: ${originalCounts[key as keyof typeof originalCounts]} vs ${newCounts[key as keyof typeof newCounts]}`);
        }
      });
      
      // Check specific component properties
      const originalSMDPads = originalSMDPadManager.getAllPads();
      const newSMDPads = newSMDPadManager.getAllPads();
      
      for (let i = 0; i < originalSMDPads.length; i++) {
        const originalPad = originalSMDPads[i];
        const newPad = newSMDPads[i];
        
        if (!newPad || newPad.id !== originalPad.id || 
            !newPad.position.equals(originalPad.position) ||
            !newPad.size.equals(originalPad.size) ||
            newPad.layer !== originalPad.layer ||
            newPad.type !== originalPad.type) {
          reconstructionPerfect = false;
          console.log(`SMD pad ${i} properties mismatch`);
          break;
        }
      }
      
      console.log(`Perfect reconstruction: ${reconstructionPerfect ? '✅' : '❌'}`);
      console.log(`Component counts: ${JSON.stringify(newCounts)}`);
      
      // Cleanup
      this.cleanup(originalBoard, originalPads, originalTraces, originalSMDPadManager, originalTraceManager);
      this.cleanup(newBoard, newPads, newTraces, newSMDPadManager, newTraceManager);
      
      return reconstructionPerfect;
    } catch (error) {
      console.error('Perfect reconstruction test failed:', error);
      return false;
    }
  }

  /**
   * Test resource tracking and disposal
   */
  public testResourceTracking(): boolean {
    console.log('Testing resource tracking and disposal...');
    
    try {
      // Create components
      const board = new Board(100, 80, 1.6);
      const pads = new Pads();
      const traces = new Traces();
      const smdPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
      const traceManager = new TraceManager(this.scene, this.copperLayerManager);
      
      // Add test data to create resources
      this.addTestData(board, pads, traces, smdPadManager, traceManager);
      
      // Get initial resource stats
      const initialStats = Serialization.getResourceStats();
      
      // Clear board to track resources
      Serialization.importBoard(
        { board: { width: 50, height: 50, thickness: 1.0 }, components: [] },
        board, pads, traces, smdPadManager, traceManager
      );
      
      // Get stats after clearing
      const _afterClearStats = Serialization.getResourceStats();
      
      // Dispose resources
      Serialization.disposeResources();
      
      // Get final stats
      const finalStats = Serialization.getResourceStats();
      
      // Verify resource tracking
      const resourcesTracked = initialStats.geometries > 0 || initialStats.materials > 0 || initialStats.meshes > 0;
      const resourcesDisposed = finalStats.geometries === 0 && finalStats.materials === 0 && finalStats.meshes === 0;
      
      console.log(`Resources tracked: ${resourcesTracked ? '✅' : '❌'}`);
      console.log(`Resources disposed: ${resourcesDisposed ? '✅' : '❌'}`);
      console.log(`Initial stats: ${JSON.stringify(initialStats)}`);
      console.log(`Final stats: ${JSON.stringify(finalStats)}`);
      
      // Cleanup
      this.cleanup(board, pads, traces, smdPadManager, traceManager);
      
      return resourcesTracked && resourcesDisposed;
    } catch (error) {
      console.error('Resource tracking test failed:', error);
      return false;
    }
  }

  /**
   * Test memory leak prevention
   */
  public testMemoryLeakPrevention(): boolean {
    console.log('Testing memory leak prevention...');
    
    try {
      // Track initial memory usage (approximate)
      const _initialResourceCount = Serialization.getResourceStats();
      
      // Create and destroy multiple boards
      for (let i = 0; i < 10; i++) {
        const board = new Board(100, 80, 1.6);
        const pads = new Pads();
        const traces = new Traces();
        const smdPadManager = new SMDPadManager(this.scene, this.copperLayerManager);
        const traceManager = new TraceManager(this.scene, this.copperLayerManager);
        
        // Add test data
        this.addTestData(board, pads, traces, smdPadManager, traceManager);
        
        // Export and import to simulate usage
        const exportedData = Serialization.exportBoard(board, pads, traces, smdPadManager, traceManager);
        Serialization.importBoard(exportedData, board, pads, traces, smdPadManager, traceManager);
        
        // Clear and dispose
        Serialization.importBoard(
          { board: { width: 50, height: 50, thickness: 1.0 }, components: [] },
          board, pads, traces, smdPadManager, traceManager
        );
        
        // Cleanup individual components
        this.cleanup(board, pads, traces, smdPadManager, traceManager);
      }
      
      // Dispose all tracked resources
      Serialization.disposeResources();
      
      // Check final resource count
      const finalResourceCount = Serialization.getResourceStats();
      
      const noResourceLeaks = finalResourceCount.geometries === 0 && 
                            finalResourceCount.materials === 0 && 
                            finalResourceCount.meshes === 0;
      
      console.log(`No resource leaks: ${noResourceLeaks ? '✅' : '❌'}`);
      console.log(`Final resource count: ${JSON.stringify(finalResourceCount)}`);
      
      return noResourceLeaks;
    } catch (error) {
      console.error('Memory leak prevention test failed:', error);
      return false;
    }
  }

  /**
   * Test data validation
   */
  public testDataValidation(): boolean {
    console.log('Testing data validation...');
    
    try {
      // Test valid data
      const validData = {
        board: { width: 100, height: 80, thickness: 1.6 },
        components: [
          {
            id: 'test_pad',
            type: 'smd_rect',
            pos: [10, 20, 30],
            size: [5, 3],
            layer: 'top'
          },
          {
            id: 'test_trace',
            type: 'path',
            pos: [0, 0, 0],
            points: [[0, 0], [10, 10]],
            width: 0.5,
            layer: 'bottom'
          }
        ],
        metadata: {
          version: '2.0',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      };
      
      const validDataPasses = Serialization.validateBoardData(validData);
      
      // Test invalid data
      const invalidData = {
        board: { width: 'invalid', height: 80, thickness: 1.6 },
        components: [
          {
            id: 'test_pad',
            type: 'smd_rect',
            pos: [10, 20], // Missing z coordinate
            size: [5, 3],
            layer: 'top'
          }
        ]
      };
      
      const invalidDataFails = !Serialization.validateBoardData(invalidData);
      
      // Test missing required fields
      const missingFieldsData = {
        // Missing board
        components: []
      };
      
      const missingFieldsFails = !Serialization.validateBoardData(missingFieldsData);
      
      console.log(`Valid data passes: ${validDataPasses ? '✅' : '❌'}`);
      console.log(`Invalid data fails: ${invalidDataFails ? '✅' : '❌'}`);
      console.log(`Missing fields fails: ${missingFieldsFails ? '✅' : '❌'}`);
      
      return validDataPasses && invalidDataFails && missingFieldsFails;
    } catch (error) {
      console.error('Data validation test failed:', error);
      return false;
    }
  }

  /**
   * Add test data to components
   */
  private addTestData(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    // Add test pads
    const testPads: PadData[] = [
      {
        id: 'test_pad_1',
        type: 'rect',
        position: new THREE.Vector3(-10, 0, -5),
        size: new THREE.Vector2(2, 1),
        layer: 'top'
      },
      {
        id: 'test_pad_2',
        type: 'circle',
        position: new THREE.Vector3(10, 0, 5),
        size: new THREE.Vector2(1.5, 1.5),
        layer: 'bottom'
      }
    ];
    
    testPads.forEach(pad => {
      pads.addPad(pad);
      smdPadManager.addPad({
        ...pad,
        id: `smd_${pad.id}`
      });
    });
    
    // Add test traces
    const testTraces: TraceData[] = [
      {
        id: 'test_trace_1',
        points: [
          new THREE.Vector2(-20, -10),
          new THREE.Vector2(0, -10),
          new THREE.Vector2(0, 10)
        ],
        width: 0.5,
        layer: 'top'
      },
      {
        id: 'test_trace_2',
        points: [
          new THREE.Vector2(5, -5),
          new THREE.Vector2(15, -5),
          new THREE.Vector2(15, 5)
        ],
        width: 0.8,
        layer: 'bottom'
      }
    ];
    
    testTraces.forEach(trace => {
      traces.addTrace(trace);
      traceManager.addTrace({
        ...trace,
        id: `flat_${trace.id}`
      });
    });
  }

  /**
   * Add comprehensive test data
   */
  private addComprehensiveTestData(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    // Add more test data for comprehensive testing
    for (let i = 0; i < 20; i++) {
      const pad: PadData = {
        id: `comprehensive_pad_${i}`,
        type: i % 2 === 0 ? 'rect' : 'circle',
        position: new THREE.Vector3(
          (i % 10 - 5) * 5,
          0,
          (Math.floor(i / 10) - 1) * 10
        ),
        size: new THREE.Vector2(2, 2),
        layer: i % 2 === 0 ? 'top' : 'bottom'
      };
      
      pads.addPad(pad);
      smdPadManager.addPad({
        ...pad,
        id: `smd_${pad.id}`
      });
    }
    
    for (let i = 0; i < 15; i++) {
      const trace: TraceData = {
        id: `comprehensive_trace_${i}`,
        points: [
          new THREE.Vector2(i * 3, 0),
          new THREE.Vector2(i * 3 + 3, 0),
          new THREE.Vector2(i * 3 + 3, 3)
        ],
        width: 0.5 + (i % 3) * 0.2,
        layer: i % 2 === 0 ? 'top' : 'bottom'
      };
      
      traces.addTrace(trace);
      traceManager.addTrace({
        ...trace,
        id: `flat_${trace.id}`
      });
    }
  }

  /**
   * Cleanup components
   */
  private cleanup(
    board: Board,
    pads: Pads,
    traces: Traces,
    smdPadManager: SMDPadManager,
    traceManager: TraceManager
  ): void {
    try {
      // Clear all components
      pads.getAllPadData().forEach(pad => pads.removePad(pad.id));
      traces.getAllTraceData().forEach(trace => traces.removeTrace(trace.id));
      smdPadManager.clearAll();
      traceManager.clearAll();
      
      // Dispose resources
      Serialization.disposeResources();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Run all persistence tests
   */
  public runAllTests(): boolean {
    console.log('=== Persistence Tests (Phase 9) ===');
    
    const results = [
      this.testBoardExport(),
      this.testBoardImport(),
      this.testPerfectReconstruction(),
      this.testResourceTracking(),
      this.testMemoryLeakPrevention(),
      this.testDataValidation()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
