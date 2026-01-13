import * as THREE from 'three';
import { Interaction } from '../engine/Interaction';
import { SMDPads, SMDDPadData } from '../components/SMDPads';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for Raycasting & Hover System (Phase 5)
 * Validates single raycaster, instance detection, and hover states
 */
export class RaycastingTest {
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
   * Test single raycaster creation and setup
   */
  public testRaycasterCreation(): boolean {
    console.log('Testing raycaster creation...');
    
    try {
      const interaction = new Interaction(this.camera, this.canvas);
      
      // Verify raycaster exists
      const hasRaycaster = interaction.raycaster !== undefined;
      const isRaycaster = interaction.raycaster instanceof THREE.Raycaster;
      
      // Verify mouse vector exists
      const hasMouse = interaction.mouse !== undefined;
      const isVector2 = interaction.mouse instanceof THREE.Vector2;
      
      console.log(`Raycaster exists: ${hasRaycaster ? '✅' : '❌'}`);
      console.log(`Raycaster type: ${isRaycaster ? '✅' : '❌'}`);
      console.log(`Mouse vector exists: ${hasMouse ? '✅' : '❌'}`);
      console.log(`Mouse vector type: ${isVector2 ? '✅' : '❌'}`);
      
      // Cleanup
      interaction.dispose();
      
      return hasRaycaster && isRaycaster && hasMouse && isVector2;
    } catch (error) {
      console.error('Raycaster creation failed:', error);
      return false;
    }
  }

  /**
   * Test pad instance detection
   */
  public testPadInstanceDetection(): boolean {
    console.log('Testing pad instance detection...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas);
      
      // Add test pads
      const testPads: SMDDPadData[] = [
        {
          id: 'test_pad_1',
          type: 'rect',
          position: new THREE.Vector3(-10, 0, 0),
          size: new THREE.Vector2(2, 1),
          rotation: 0,
          layer: 'top'
        },
        {
          id: 'test_pad_2',
          type: 'rect',
          position: new THREE.Vector3(10, 0, 0),
          size: new THREE.Vector2(2, 1),
          rotation: 0,
          layer: 'top'
        }
      ];
      
      smdPads.addPads(testPads);
      
      // Set interactable objects
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Test raycasting at different positions
      const testPositions = [
        { x: 0, y: 0, expected: true },  // Center - should hit
        { x: -10, y: 0, expected: true }, // First pad - should hit
        { x: 10, y: 0, expected: true },  // Second pad - should hit
        { x: 50, y: 0, expected: false }  // Far away - should miss
      ];
      
      let allTestsPassed = true;
      
      testPositions.forEach((test, index) => {
        // Set mouse position
        interaction.mouse.x = test.x;
        interaction.mouse.y = test.y;
        
        // Perform raycast
        const intersects = interaction.performRaycast();
        const hitDetected = intersects.length > 0;
        const expectedHit = test.expected;
        
        const testPassed = hitDetected === expectedHit;
        allTestsPassed = allTestsPassed && testPassed;
        
        console.log(`Test ${index + 1}: (${test.x}, ${test.y}) - Hit: ${hitDetected}, Expected: ${expectedHit} - ${testPassed ? '✅' : '❌'}`);
        
        if (hitDetected) {
          const intersection = intersects[0];
          console.log(`  - Object: ${intersection.object.name}`);
          console.log(`  - Instance ID: ${intersection.instanceId}`);
          console.log(`  - Distance: ${intersection.distance.toFixed(2)}`);
        }
      });
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      console.log(`Instance detection: ${allTestsPassed ? '✅' : '❌'}`);
      
      return allTestsPassed;
    } catch (error) {
      console.error('Pad instance detection test failed:', error);
      return false;
    }
  }

  /**
   * Test hover state management
   */
  public testHoverStateManagement(): boolean {
    console.log('Testing hover state management...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'hover_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Test hover state changes
      const initialHoverInfo = interaction.getHoverInfo();
      const initiallyNotHovering = !interaction.isHovering();
      const initialObjectNull = initialHoverInfo.object === null;
      const initialInstanceIdNull = initialHoverInfo.instanceId === null;
      
      // Simulate hover
      interaction.mouse.x = 0;
      interaction.mouse.y = 0;
      interaction.updateCursor();
      
      const afterHoverInfo = interaction.getHoverInfo();
      const nowHovering = interaction.isHovering();
      const objectNotNull = afterHoverInfo.object !== null;
      const instanceIdValid = afterHoverInfo.instanceId !== null;
      
      // Clear hover
      interaction.clearHoverState();
      const afterClearInfo = interaction.getHoverInfo();
      const clearedNotHovering = !interaction.isHovering();
      
      console.log(`Initial state: ${initiallyNotHovering && initialObjectNull && initialInstanceIdNull ? '✅' : '❌'}`);
      console.log(`Hover state: ${nowHovering && objectNotNull && instanceIdValid ? '✅' : '❌'}`);
      console.log(`Clear state: ${clearedNotHovering ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return initiallyNotHovering && initialObjectNull && initialInstanceIdNull &&
             nowHovering && objectNotNull && instanceIdValid &&
             clearedNotHovering;
    } catch (error) {
      console.error('Hover state management test failed:', error);
      return false;
    }
  }

  /**
   * Test cursor changes on hover
   */
  public testCursorChanges(): boolean {
    console.log('Testing cursor changes on hover...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'cursor_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Test cursor when not hovering
      interaction.mouse.x = 50; // Far from pad
      interaction.mouse.y = 50;
      interaction.updateCursor();
      const defaultCursor = this.canvas.style.cursor === 'default';
      
      // Test cursor when hovering
      interaction.mouse.x = 0; // Over pad
      interaction.mouse.y = 0;
      interaction.updateCursor();
      const pointerCursor = this.canvas.style.cursor === 'pointer';
      
      // Test cursor when cleared
      interaction.mouse.x = 50; // Far from pad again
      interaction.mouse.y = 50;
      interaction.updateCursor();
      const backToDefault = this.canvas.style.cursor === 'default';
      
      console.log(`Default cursor: ${defaultCursor ? '✅' : '❌'}`);
      console.log(`Pointer cursor: ${pointerCursor ? '✅' : '❌'}`);
      console.log(`Back to default: ${backToDefault ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return defaultCursor && pointerCursor && backToDefault;
    } catch (error) {
      console.error('Cursor changes test failed:', error);
      return false;
    }
  }

  /**
   * Test performance with many pads
   */
  public testPerformanceWithManyPads(): boolean {
    console.log('Testing performance with many pads...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 1000);
      const interaction = new Interaction(this.camera, this.canvas);
      
      // Add many pads
      const pads: SMDDPadData[] = [];
      for (let i = 0; i < 500; i++) {
        pads.push({
          id: `perf_pad_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(
            (i % 20 - 10) * 3,
            0,
            (Math.floor(i / 20) - 12) * 3
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
      
      // Test multiple raycasts
      const raycastStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        interaction.mouse.x = x;
        interaction.mouse.y = y;
        interaction.performRaycast();
      }
      const raycastTime = performance.now() - raycastStartTime;
      
      const avgRaycastTime = raycastTime / 100;
      const performanceOk = addTime < 100 && avgRaycastTime < 1; // Add <100ms, avg raycast <1ms
      
      console.log(`Added ${pads.length} pads in ${addTime.toFixed(2)}ms: ${addTime < 100 ? '✅' : '❌'}`);
      console.log(`100 raycasts in ${raycastTime.toFixed(2)}ms (${avgRaycastTime.toFixed(3)}ms avg): ${avgRaycastTime < 1 ? '✅' : '❌'}`);
      console.log(`Performance acceptable: ${performanceOk ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return performanceOk;
    } catch (error) {
      console.error('Performance test failed:', error);
      return false;
    }
  }

  /**
   * Test no flickering or missed hits
   */
  public testNoFlickering(): boolean {
    console.log('Testing for flickering and missed hits...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'flicker_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Position mouse over pad
      interaction.mouse.x = 0;
      interaction.mouse.y = 0;
      
      // Test multiple rapid updates
      const hoverStates: boolean[] = [];
      for (let i = 0; i < 50; i++) {
        interaction.updateCursor();
        hoverStates.push(interaction.isHovering());
      }
      
      // Check for consistent hover state
      const allHovering = hoverStates.every(state => state === true);
      const noFlickering = allHovering;
      
      // Test rapid mouse movement
      let consistentDetection = true;
      for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 0.1; // Small random movement around pad
        const y = (Math.random() - 0.5) * 0.1;
        interaction.mouse.x = x;
        interaction.mouse.y = y;
        interaction.updateCursor();
        
        // Should still be hovering (pad is large enough)
        if (!interaction.isHovering()) {
          consistentDetection = false;
          break;
        }
      }
      
      console.log(`No flickering: ${noFlickering ? '✅' : '❌'}`);
      console.log(`Consistent detection: ${consistentDetection ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return noFlickering && consistentDetection;
    } catch (error) {
      console.error('Flickering test failed:', error);
      return false;
    }
  }

  /**
   * Run all raycasting tests
   */
  public runAllTests(): boolean {
    console.log('=== Raycasting & Hover Tests (Phase 5) ===');
    
    const results = [
      this.testRaycasterCreation(),
      this.testPadInstanceDetection(),
      this.testHoverStateManagement(),
      this.testCursorChanges(),
      this.testPerformanceWithManyPads(),
      this.testNoFlickering()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
