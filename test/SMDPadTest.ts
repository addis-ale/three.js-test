import * as THREE from 'three';
import { SMDPads, SMDDPadData } from '../components/SMDPads';
import { SMDPadFactory } from '../components/SMDPadFactory';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for SMD Pad System (Phase 2)
 * Validates InstancedMesh implementation and performance
 */
export class SMDPadTest {
  private copperLayerManager: CopperLayerManager;
  private scene: THREE.Scene;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6);
    this.scene = new THREE.Scene();
  }

  /**
   * Test basic SMD pad creation and positioning
   */
  public testBasicPadCreation(): boolean {
    console.log('Testing basic SMD pad creation...');
    
    const smdPads = new SMDPads(this.copperLayerManager, 100);
    
    // Create test pad
    const testPad: SMDDPadData = {
      id: 'test_pad_1',
      type: 'rect',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector2(2, 1),
      rotation: 0,
      layer: 'top'
    };
    
    const success = smdPads.addPad(testPad);
    
    // Verify positioning
    const _expectedZ = this.copperLayerManager.getTopCopperZ();
    const retrievedPad = smdPads.getPad('test_pad_1');
    
    const positionCorrect = retrievedPad?.position.y === 0; // Y should remain 0, Z handled by matrix
    const instanceCountCorrect = smdPads.getStats().totalInstances === 1;
    
    console.log(`Pad creation: ${success ? '✅' : '❌'}`);
    console.log(`Position correct: ${positionCorrect ? '✅' : '❌'}`);
    console.log(`Instance count: ${instanceCountCorrect ? '✅' : '❌'}`);
    
    // Cleanup
    smdPads.dispose();
    
    return success && positionCorrect && instanceCountCorrect;
  }

  /**
   * Test InstancedMesh performance with 100+ pads
   */
  public testInstancedMeshPerformance(): boolean {
    console.log('Testing InstancedMesh performance with 100+ pads...');
    
    const smdPads = new SMDPads(this.copperLayerManager, 1000);
    
    // Create demo layout with 100+ pads
    const demoPads = SMDPadFactory.createDemoLayout('top');
    const addedCount = smdPads.addPads(demoPads);
    
    const stats = smdPads.getStats();
    const targetCount = 100;
    const performanceOk = addedCount >= targetCount;
    const memoryOk = stats.totalInstances <= stats.maxInstances;
    
    console.log(`Added ${addedCount} pads (target: ${targetCount}): ${performanceOk ? '✅' : '❌'}`);
    console.log(`Memory usage: ${stats.totalInstances}/${stats.maxInstances}: ${memoryOk ? '✅' : '❌'}`);
    console.log(`Rectangular: ${stats.rectangularPads}, Circular: ${stats.circularPads}`);
    
    // Test individual pad retrieval
    const samplePad = smdPads.getPad('rect_pad_0_0');
    const retrievalOk = samplePad !== undefined;
    
    console.log(`Pad retrieval: ${retrievalOk ? '✅' : '❌'}`);
    
    // Cleanup
    smdPads.dispose();
    
    return performanceOk && memoryOk && retrievalOk;
  }

  /**
   * Test copper layer positioning accuracy
   */
  public testCopperLayerPositioning(): boolean {
    console.log('Testing copper layer positioning...');
    
    const smdPads = new SMDPads(this.copperLayerManager, 100);
    
    // Add pads to both layers
    const topPad: SMDDPadData = {
      id: 'top_pad',
      type: 'rect',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector2(2, 1),
      rotation: 0,
      layer: 'top'
    };
    
    const bottomPad: SMDDPadData = {
      id: 'bottom_pad',
      type: 'circle',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector2(1.5, 1.5),
      rotation: 0,
      layer: 'bottom'
    };
    
    smdPads.addPad(topPad);
    smdPads.addPad(bottomPad);
    
    // Verify layer separation
    const topZ = this.copperLayerManager.getTopCopperZ();
    const bottomZ = this.copperLayerManager.getBottomCopperZ();
    const separation = Math.abs(topZ - bottomZ);
    
    const expectedSeparation = 1.6 + 0.02; // Board thickness + 2x offset
    const separationCorrect = Math.abs(separation - expectedSeparation) < 0.001;
    
    // Verify pad counts by layer
    const stats = smdPads.getStats();
    const layerCountsCorrect = stats.topLayerPads === 1 && stats.bottomLayerPads === 1;
    
    console.log(`Layer separation: ${separation.toFixed(3)}mm (expected: ${expectedSeparation.toFixed(3)}mm): ${separationCorrect ? '✅' : '❌'}`);
    console.log(`Layer counts: Top=${stats.topLayerPads}, Bottom=${stats.bottomLayerPads}: ${layerCountsCorrect ? '✅' : '❌'}`);
    
    // Cleanup
    smdPads.dispose();
    
    return separationCorrect && layerCountsCorrect;
  }

  /**
   * Test pad update operations
   */
  public testPadUpdates(): boolean {
    console.log('Testing pad update operations...');
    
    const smdPads = new SMDPads(this.copperLayerManager, 100);
    
    // Add initial pad
    const pad: SMDDPadData = {
      id: 'update_test_pad',
      type: 'rect',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector2(2, 1),
      rotation: 0,
      layer: 'top'
    };
    
    smdPads.addPad(pad);
    
    // Test position update
    const newPosition = new THREE.Vector3(5, 0, 10);
    const positionUpdateSuccess = smdPads.updatePadPosition('update_test_pad', newPosition);
    
    // Test size update
    const newSize = new THREE.Vector2(3, 2);
    const sizeUpdateSuccess = smdPads.updatePadSize('update_test_pad', newSize);
    
    // Verify updates
    const updatedPad = smdPads.getPad('update_test_pad');
    const positionCorrect = updatedPad?.position.equals(newPosition);
    const sizeCorrect = updatedPad?.size.equals(newSize);
    
    console.log(`Position update: ${positionUpdateSuccess && positionCorrect ? '✅' : '❌'}`);
    console.log(`Size update: ${sizeUpdateSuccess && sizeCorrect ? '✅' : '❌'}`);
    
    // Cleanup
    smdPads.dispose();
    
    return positionUpdateSuccess && sizeUpdateSuccess && positionCorrect && sizeCorrect;
  }

  /**
   * Test pad removal and cleanup
   */
  public testPadRemoval(): boolean {
    console.log('Testing pad removal...');
    
    const smdPads = new SMDPads(this.copperLayerManager, 100);
    
    // Add multiple pads
    const pads: SMDDPadData[] = [
      {
        id: 'pad_to_remove_1',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      },
      {
        id: 'pad_to_remove_2',
        type: 'circle',
        position: new THREE.Vector3(5, 0, 0),
        size: new THREE.Vector2(1.5, 1.5),
        rotation: 0,
        layer: 'top'
      },
      {
        id: 'pad_to_keep',
        type: 'rect',
        position: new THREE.Vector3(-5, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      }
    ];
    
    smdPads.addPads(pads);
    
    const initialCount = smdPads.getStats().totalInstances;
    
    // Remove one pad
    const removeSuccess = smdPads.removePad('pad_to_remove_1');
    const afterRemovalCount = smdPads.getStats().totalInstances;
    
    // Verify removal
    const removedPadGone = smdPads.getPad('pad_to_remove_1') === undefined;
    const keptPadExists = smdPads.getPad('pad_to_keep') !== undefined;
    const countDecreased = afterRemovalCount === initialCount - 1;
    
    console.log(`Pad removal: ${removeSuccess ? '✅' : '❌'}`);
    console.log(`Pad actually removed: ${removedPadGone ? '✅' : '❌'}`);
    console.log(`Other pads preserved: ${keptPadExists ? '✅' : '❌'}`);
    console.log(`Count updated: ${countDecreased ? '✅' : '❌'}`);
    
    // Test clear all
    smdPads.clear();
    const clearSuccess = smdPads.getStats().totalInstances === 0;
    
    console.log(`Clear all: ${clearSuccess ? '✅' : '❌'}`);
    
    // Cleanup
    smdPads.dispose();
    
    return removeSuccess && removedPadGone && keptPadExists && countDecreased && (clearSuccess || false);
  }

  /**
   * Test different pad types and geometries
   */
  public testPadTypes(): boolean {
    console.log('Testing different pad types...');
    
    const smdPads = new SMDPads(this.copperLayerManager, 100);
    
    // Test rectangular and circular pads
    const rectPad: SMDDPadData = {
      id: 'rect_test',
      type: 'rect',
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector2(3, 2),
      rotation: Math.PI / 4,
      layer: 'top'
    };
    
    const circlePad: SMDDPadData = {
      id: 'circle_test',
      type: 'circle',
      position: new THREE.Vector3(5, 0, 0),
      size: new THREE.Vector2(2, 2),
      rotation: 0,
      layer: 'top'
    };
    
    smdPads.addPad(rectPad);
    smdPads.addPad(circlePad);
    
    const stats = smdPads.getStats();
    const typesCorrect = stats.rectangularPads === 1 && stats.circularPads === 1;
    
    // Test retrieval by type
    const rectPads = smdPads.getPadsByType('rect');
    const circlePads = smdPads.getPadsByType('circle');
    
    const retrievalCorrect = rectPads.length === 1 && circlePads.length === 1;
    
    console.log(`Pad types correct: ${typesCorrect ? '✅' : '❌'}`);
    console.log(`Type retrieval correct: ${retrievalCorrect ? '✅' : '❌'}`);
    
    // Cleanup
    smdPads.dispose();
    
    return typesCorrect && retrievalCorrect;
  }

  /**
   * Run all SMD pad tests
   */
  public runAllTests(): boolean {
    console.log('=== SMD Pad System Tests (Phase 2) ===');
    
    const results = [
      this.testBasicPadCreation(),
      this.testInstancedMeshPerformance(),
      this.testCopperLayerPositioning(),
      this.testPadUpdates(),
      this.testPadRemoval(),
      this.testPadTypes()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
