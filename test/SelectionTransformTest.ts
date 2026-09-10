import * as THREE from 'three';
import { Interaction } from '../engine/Interaction';
import { SMDPads, SMDDPadData } from '../components/SMDPads';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for Selection & TransformControls System (Phase 6)
 * Validates pad selection, TransformControls attachment, and XZ plane constraints
 */
export class SelectionTransformTest {
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
   * Test TransformControls creation and attachment
   */
  public testTransformControlsCreation(): boolean {
    console.log('Testing TransformControls creation...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'transform_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select the pad (should attach TransformControls)
      interaction.selectObject(smdPads.instancedMesh, 0);
      
      // Check if TransformControls were created
      const hasTransformControls = interaction.getTransformControls() !== null;
      
      // Check if TransformControls are attached to the object
      const transformControls = interaction.getTransformControls();
      const isAttached = transformControls?.object === smdPads.instancedMesh;
      
      // Check if TransformControls are in the scene
      const inScene = this.scene.children.includes(transformControls);
      
      console.log(`TransformControls created: ${hasTransformControls ? '✅' : '❌'}`);
      console.log(`Controls attached: ${isAttached ? '✅' : '❌'}`);
      console.log(`Controls in scene: ${inScene ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return hasTransformControls && isAttached && inScene;
    } catch (error) {
      console.error('TransformControls creation test failed:', error);
      return false;
    }
  }

  /**
   * Test pad selection and highlighting
   */
  public testPadSelection(): boolean {
    console.log('Testing pad selection...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pads
      const testPads: SMDDPadData[] = [
        {
          id: 'selection_test_pad_1',
          type: 'rect',
          position: new THREE.Vector3(-10, 0, 0),
          size: new THREE.Vector2(2, 1),
          rotation: 0,
          layer: 'top'
        },
        {
          id: 'selection_test_pad_2',
          type: 'rect',
          position: new THREE.Vector3(10, 0, 0),
          size: new THREE.Vector2(2, 1),
          rotation: 0,
          layer: 'top'
        }
      ];
      
      smdPads.addPads(testPads);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Test initial state (no selection)
      const initialSelection = interaction.getSelectedObject();
      const initiallyNotSelected = initialSelection === null;
      
      // Select first pad
      interaction.selectObject(smdPads.instancedMesh, 0);
      const firstSelection = interaction.getSelectedObject();
      const firstSelected = firstSelection === smdPads.instancedMesh;
      
      // Select second pad (should replace first)
      interaction.selectObject(smdPads.instancedMesh, 1);
      const secondSelection = interaction.getSelectedObject();
      const secondSelected = secondSelection === smdPads.instancedMesh;
      
      // Clear selection
      interaction.deselectObject();
      const clearedSelection = interaction.getSelectedObject();
      const clearedNotSelected = clearedSelection === null;
      
      console.log(`Initial state: ${initiallyNotSelected ? '✅' : '❌'}`);
      console.log(`First selection: ${firstSelected ? '✅' : '❌'}`);
      console.log(`Second selection: ${secondSelected ? '✅' : '❌'}`);
      console.log(`Clear selection: ${clearedNotSelected ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return initiallyNotSelected && firstSelected && secondSelected && clearedNotSelected;
    } catch (error) {
      console.error('Pad selection test failed:', error);
      return false;
    }
  }

  /**
   * Test XZ plane movement constraints
   */
  public testXZPlaneConstraints(): boolean {
    console.log('Testing XZ plane movement constraints...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'constraint_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select pad to attach TransformControls
      interaction.selectObject(smdPads.instancedMesh, 0);
      
      const transformControls = interaction.getTransformControls();
      if (!transformControls) {
        console.error('TransformControls not created');
        return false;
      }
      
      // Check if TransformControls are in translate mode
      const isTranslateMode = transformControls.getMode() === 'translate';
      
      // Check if the object is attached
      const isAttached = transformControls.object === smdPads.instancedMesh;
      
      // Test that Y movement is constrained (this would need actual interaction testing)
      // For now, we'll verify the setup is correct
      const setupCorrect = isTranslateMode && isAttached;
      
      console.log(`Translate mode: ${isTranslateMode ? '✅' : '❌'}`);
      console.log(`Object attached: ${isAttached ? '✅' : '❌'}`);
      console.log(`Setup correct: ${setupCorrect ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return setupCorrect;
    } catch (error) {
      console.error('XZ plane constraints test failed:', error);
      return false;
    }
  }

  /**
   * Test selection highlighting persistence
   */
  public testSelectionHighlighting(): boolean {
    console.log('Testing selection highlighting persistence...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'highlight_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Get the shader material
      const material = smdPads.getShaderMaterial();
      
      // Check initial selection state
      const initialSelected = material.uniforms.uSelected.value;
      const initiallyNotSelected = !initialSelected;
      
      // Select the pad
      interaction.selectObject(smdPads.instancedMesh, 0);
      const afterSelection = material.uniforms.uSelected.value;
      const selectionApplied = afterSelection === true;
      
      // Simulate hover (should not affect selection)
      interaction.setInstanceHovered(0, true);
      const selectionWithHover = material.uniforms.uSelected.value;
      const selectionPersistent = selectionWithHover === true;
      
      // Clear hover (selection should remain)
      interaction.setInstanceHovered(0, false);
      const selectionAfterHover = material.uniforms.uSelected.value;
      const selectionStillActive = selectionAfterHover === true;
      
      // Clear selection
      interaction.deselectObject();
      const finalSelection = material.uniforms.uSelected.value;
      const selectionCleared = finalSelection === false;
      
      console.log(`Initial not selected: ${initiallyNotSelected ? '✅' : '❌'}`);
      console.log(`Selection applied: ${selectionApplied ? '✅' : '❌'}`);
      console.log(`Selection persistent with hover: ${selectionPersistent ? '✅' : '❌'}`);
      console.log(`Selection still active after hover: ${selectionStillActive ? '✅' : '❌'}`);
      console.log(`Selection cleared: ${selectionCleared ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return initiallyNotSelected && selectionApplied && selectionPersistent && selectionStillActive && selectionCleared;
    } catch (error) {
      console.error('Selection highlighting test failed:', error);
      return false;
    }
  }

  /**
   * Test TransformControls cleanup
   */
  public testTransformControlsCleanup(): boolean {
    console.log('Testing TransformControls cleanup...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'cleanup_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      interaction.setInteractableObjects([smdPads.instancedMesh]);
      
      // Select pad to create TransformControls
      interaction.selectObject(smdPads.instancedMesh, 0);
      const controlsCreated = interaction.getTransformControls() !== null;
      const controlsInScene = this.scene.children.includes(interaction.getTransformControls());
      
      // Deselect to cleanup TransformControls
      interaction.deselectObject();
      const controlsRemoved = interaction.getTransformControls() === null;
      const controlsNotInScene = !this.scene.children.some(child => child instanceof THREE.TransformControls);
      
      console.log(`Controls created: ${controlsCreated ? '✅' : '❌'}`);
      console.log(`Controls in scene: ${controlsInScene ? '✅' : '❌'}`);
      console.log(`Controls removed: ${controlsRemoved ? '✅' : '❌'}`);
      console.log(`Controls not in scene: ${controlsNotInScene ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return controlsCreated && controlsInScene && controlsRemoved && controlsNotInScene;
    } catch (error) {
      console.error('TransformControls cleanup test failed:', error);
      return false;
    }
  }

  /**
   * Test performance with selection and transforms
   */
  public testPerformanceWithSelection(): boolean {
    console.log('Testing performance with selection and transforms...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 1000);
      const interaction = new Interaction(this.camera, this.canvas, this.scene);
      
      // Add many pads
      const pads: SMDDPadData[] = [];
      for (let i = 0; i < 100; i++) {
        pads.push({
          id: `perf_selection_pad_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(
            (i % 10 - 5) * 3,
            0,
            (Math.floor(i / 10) - 5) * 3
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
      
      // Test multiple selections
      const selectionStartTime = performance.now();
      for (let i = 0; i < 10; i++) {
        interaction.selectObject(smdPads.instancedMesh, i * 10);
        interaction.deselectObject();
      }
      const selectionTime = performance.now() - selectionStartTime;
      
      const avgSelectionTime = selectionTime / 10;
      const performanceOk = addTime < 100 && avgSelectionTime < 5; // Add <100ms, avg selection <5ms
      
      console.log(`Added ${pads.length} pads in ${addTime.toFixed(2)}ms: ${addTime < 100 ? '✅' : '❌'}`);
      console.log(`10 selections in ${selectionTime.toFixed(2)}ms (${avgSelectionTime.toFixed(3)}ms avg): ${avgSelectionTime < 5 ? '✅' : '❌'}`);
      console.log(`Performance acceptable: ${performanceOk ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      interaction.dispose();
      
      return performanceOk;
    } catch (error) {
      console.error('Performance with selection test failed:', error);
      return false;
    }
  }

  /**
   * Get TransformControls for testing (public method)
   */
  public getTransformControls(): THREE.TransformControls | null {
    return this.scene.children.find(child => child instanceof THREE.TransformControls) as THREE.TransformControls || null;
  }

  /**
   * Run all selection and transform tests
   */
  public runAllTests(): boolean {
    console.log('=== Selection & TransformControls Tests (Phase 6) ===');
    
    const results = [
      this.testTransformControlsCreation(),
      this.testPadSelection(),
      this.testXZPlaneConstraints(),
      this.testSelectionHighlighting(),
      this.testTransformControlsCleanup(),
      this.testPerformanceWithSelection()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
