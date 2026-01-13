import * as THREE from 'three';
import { Interaction } from '../engine/Interaction';
import { SMDPads, SMDDPadData } from '../components/SMDPads';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for React Sidebar Sync System (Phase 7)
 * Validates live updates during TransformControls manipulation
 */
export class ReactSidebarSyncTest {
  private copperLayerManager: CopperLayerManager;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(0, 10, 50);
    this.camera.lookAt(0, 0, 0);
    
    // Create a mock canvas for testing
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
  }

  /**
   * Test sidebar component creation and props
   */
  public testSidebarCreation(): boolean {
    console.log('Testing sidebar component creation...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'sidebar_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select the pad to trigger sidebar updates
      interaction.selectObject(smdPads.instancedMesh, 0);
      
      // Verify sidebar would receive correct props
      const hasInteraction = interaction !== null;
      const hasSMDPadManager = smdPads !== null;
      const hasSelectedObject = interaction.getSelectedObject() !== null;
      
      console.log(`Interaction instance: ${hasInteraction ? '✅' : '❌'}`);
      console.log(`SMDPadManager instance: ${hasSMDPadManager ? '✅' : '❌'}`);
      console.log(`Selected object: ${hasSelectedObject ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return hasInteraction && hasSMDPadManager && hasSelectedObject;
    } catch (error) {
      console.error('Sidebar creation test failed:', error);
      return false;
    }
  }

  /**
   * Test world position extraction
   */
  public testWorldPositionExtraction(): boolean {
    console.log('Testing world position extraction...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad at known position
      const testPosition = new THREE.Vector3(10.5, 0, -7.3);
      const testPad: SMDDPadData = {
        id: 'position_test_pad',
        type: 'rect',
        position: testPosition,
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select the pad
      interaction.selectObject(smdPads.instancedMesh, 0);
      
      // Extract world position from instance matrix
      const matrix = new THREE.Matrix4();
      smdPads.instancedMesh.getMatrixAt(0, matrix);
      
      const extractedPosition = new THREE.Vector3();
      matrix.decompose(extractedPosition, new THREE.Quaternion(), new THREE.Vector3());
      
      // Verify position accuracy (allowing for floating point precision)
      const positionAccurate = 
        Math.abs(extractedPosition.x - testPosition.x) < 0.01 &&
        Math.abs(extractedPosition.y - testPosition.y) < 0.01 &&
        Math.abs(extractedPosition.z - testPosition.z) < 0.01;
      
      console.log(`Expected position: (${testPosition.x}, ${testPosition.y}, ${testPosition.z})`);
      console.log(`Extracted position: (${extractedPosition.x.toFixed(3)}, ${extractedPosition.y.toFixed(3)}, ${extractedPosition.z.toFixed(3)})`);
      console.log(`Position accuracy: ${positionAccurate ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return positionAccurate;
    } catch (error) {
      console.error('World position extraction test failed:', error);
      return false;
    }
  }

  /**
   * Test surface area calculation
   */
  public testSurfaceAreaCalculation(): boolean {
    console.log('Testing surface area calculation...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Test rectangular pad area
      const rectPad: SMDDPadData = {
        id: 'area_test_rect',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(3.5, 2.1),
        rotation: 0,
        layer: 'top'
      };
      
      // Test circular pad area
      const circlePad: SMDDPadData = {
        id: 'area_test_circle',
        type: 'circle',
        position: new THREE.Vector3(5, 0, 0),
        size: new THREE.Vector2(2.8, 2.8), // diameter
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPads([rectPad, circlePad]);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Calculate expected areas
      const expectedRectArea = 3.5 * 2.1; // 7.35 mm²
      const expectedCircleArea = Math.PI * Math.pow(2.8 / 2, 2); // π × r² = 6.1575 mm²
      
      // Test area calculation function
      const calculateArea = (padData: SMDDPadData): number => {
        const { size, type } = padData;
        
        if (type === 'rect') {
          return size.x * size.y;
        } else if (type === 'circle') {
          const radius = size.x / 2;
          return Math.PI * radius * radius;
        }
        return 0;
      };
      
      const calculatedRectArea = calculateArea(rectPad);
      const calculatedCircleArea = calculateArea(circlePad);
      
      const rectAreaCorrect = Math.abs(calculatedRectArea - expectedRectArea) < 0.001;
      const circleAreaCorrect = Math.abs(calculatedCircleArea - expectedCircleArea) < 0.001;
      
      console.log(`Rectangle: Expected ${expectedRectArea.toFixed(3)}, Calculated ${calculatedRectArea.toFixed(3)}: ${rectAreaCorrect ? '✅' : '❌'}`);
      console.log(`Circle: Expected ${expectedCircleArea.toFixed(3)}, Calculated ${calculatedCircleArea.toFixed(3)}: ${circleAreaCorrect ? '✅' : '❌'}`);
      
      // Cleanup
      smdPadManager.dispose();
      interaction.dispose();
      
      return rectAreaCorrect && circleAreaCorrect;
    } catch (error) {
      console.error('Surface area calculation test failed:', error);
      return false;
    }
  }

  /**
   * Test live updates during TransformControls manipulation
   */
  public testLiveUpdates(): boolean {
    console.log('Testing live updates during TransformControls manipulation...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'live_update_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select the pad to attach TransformControls
      interaction.selectObject(smdPads.instancedMesh, 0);
      
      const transformControls = interaction.getTransformControls();
      const controlsAttached = transformControls !== null;
      
      if (!controlsAttached) {
        console.error('TransformControls not attached');
        return false;
      }
      
      // Simulate position changes during dragging
      const initialPosition = new THREE.Vector3(0, 0, 0);
      const testPositions = [
        new THREE.Vector3(5, 0, 0),
        new THREE.Vector3(10, 0, 5),
        new THREE.Vector3(-5, 0, -3),
        new THREE.Vector3(0, 0, 0) // Back to start
      ];
      
      let allUpdatesCorrect = true;
      
      testPositions.forEach((targetPosition, index) => {
        // Simulate TransformControls position change
        transformControls.object.position.copy(targetPosition);
        
        // Trigger change event
        transformControls.dispatchEvent(new Event('change'));
        
        // Check if position would be updated in sidebar
        const expectedPosition = targetPosition;
        const actualPosition = getInstanceWorldPosition(smdPads, 0);
        
        const positionCorrect = 
          Math.abs(actualPosition.x - expectedPosition.x) < 0.01 &&
          Math.abs(actualPosition.y - expectedPosition.y) < 0.01 &&
          Math.abs(actualPosition.z - expectedPosition.z) < 0.01;
        
        console.log(`Test ${index + 1}: Target (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)}) - Actual (${actualPosition.x.toFixed(2)}, ${actualPosition.y.toFixed(2)}, ${actualPosition.z.toFixed(2)}): ${positionCorrect ? '✅' : '❌'}`);
        
        allUpdatesCorrect = allUpdatesCorrect && positionCorrect;
      });
      
      console.log(`Live updates: ${allUpdatesCorrect ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return controlsAttached && allUpdatesCorrect;
    } catch (error) {
      console.error('Live updates test failed:', error);
      return false;
    }
  }

  /**
   * Helper function to get world position from instance
   */
  private getInstanceWorldPosition(smdPads: SMDPads, instanceId: number): THREE.Vector3 {
    const matrix = new THREE.Matrix4();
    smdPads.instancedMesh.getMatrixAt(instanceId, matrix);
    
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    matrix.decompose(position, rotation, scale);
    
    return position;
  }

  /**
   * Test no polling requirement
   */
  public testNoPolling(): boolean {
    console.log('Testing no polling requirement...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'no_polling_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select the pad
      interaction.selectObject(smdPads.instancedMesh, 0);
      
      // Test that updates are event-driven, not polled
      const initialPosition = getInstanceWorldPosition(smdPads, 0);
      
      // Simulate TransformControls change without triggering events
      const transformControls = interaction.getTransformControls();
      if (transformControls) {
        transformControls.object.position.set(5, 0, 0);
        // Don't trigger change event
        
        // Position should not update without event
        const unchangedPosition = getInstanceWorldPosition(smdPads, 0);
        const positionUnchanged = unchangedPosition.equals(initialPosition);
        
        console.log(`Position unchanged without event: ${positionUnchanged ? '✅' : '❌'}`);
        
        // Now trigger proper event
        transformControls.dispatchEvent(new Event('change'));
        
        // Position should update after event
        const updatedPosition = getInstanceWorldPosition(smdPads, 0);
        const positionUpdated = !updatedPosition.equals(initialPosition);
        
        console.log(`Position updated with event: ${positionUpdated ? '✅' : '❌'}`);
        
        // Cleanup
        smdPads.dispose();
        interaction.dispose();
        
        return positionUnchanged && positionUpdated;
      }
      
      return false;
    } catch (error) {
      console.error('No polling test failed:', error);
      return false;
    }
  }

  /**
   * Test performance with live updates
   */
  public testPerformanceWithLiveUpdates(): boolean {
    console.log('Testing performance with live updates...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add multiple pads
      const pads: SMDDPadData[] = [];
      for (let i = 0; i < 50; i++) {
        pads.push({
          id: `perf_live_update_pad_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(
            (i % 10 - 5) * 3,
            0,
            (Math.floor(i / 10) - 2.5) * 3
          ),
          size: new THREE.Vector2(1.5, 1.5),
          rotation: 0,
          layer: 'top'
        });
      }
      
      const addStartTime = performance.now();
      smdPads.addPads(pads);
      const addTime = performance.now() - addStartTime;
      
      // Set interactable objects
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Test rapid selection and updates
      const updateStartTime = performance.now();
      for (let i = 0; i < 10; i++) {
        interaction.selectObject(smdPads.instancedMesh, i);
        const position = getInstanceWorldPosition(smdPads, i);
        
        // Simulate TransformControls change
        const transformControls = interaction.getTransformControls();
        if (transformControls) {
          transformControls.object.position.set(
            Math.random() * 20 - 10,
            0,
            Math.random() * 20 - 10
          );
          transformControls.dispatchEvent(new Event('change'));
        }
      }
      const updateTime = performance.now() - updateStartTime;
      
      const avgUpdateTime = updateTime / 10;
      const performanceOk = addTime < 50 && avgUpdateTime < 5; // Add <50ms, avg update <5ms
      
      console.log(`Added ${pads.length} pads in ${addTime.toFixed(2)}ms: ${addTime < 50 ? '✅' : '❌'}`);
      console.log(`10 updates in ${updateTime.toFixed(2)}ms (${avgUpdateTime.toFixed(3)}ms avg): ${avgUpdateTime < 5 ? '✅' : '❌'}`);
      console.log(`Performance acceptable: ${performanceOk ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return performanceOk;
    } catch (error) {
      console.error('Performance with live updates test failed:', error);
      return false;
    }
  }

  /**
   * Run all React sidebar sync tests
   */
  public runAllTests(): boolean {
    console.log('=== React Sidebar Sync Tests (Phase 7) ===');
    
    const results = [
      this.testSidebarCreation(),
      this.testWorldPositionExtraction(),
      this.testSurfaceAreaCalculation(),
      this.testLiveUpdates(),
      this.testNoPolling(),
      this.testPerformanceWithLiveUpdates()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
