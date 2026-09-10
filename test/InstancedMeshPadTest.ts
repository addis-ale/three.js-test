import * as THREE from 'three';
import { Pads, PadData } from '../components/Pads';

/**
 * Test suite for InstancedMesh Pad System (Step 1)
 * Validates 100-200 pad performance with one geometry, one material, and instanceId selection
 */
export class InstancedMeshPadTest {
  private pads: Pads;
  private scene: THREE.Scene;

  constructor() {
    this.pads = new Pads();
    this.scene = new THREE.Scene();
  }

  /**
   * Test 100-200 pad creation with InstancedMesh
   */
  public testLargePadCount(): boolean {
    console.log('Testing 100-200 pad creation with InstancedMesh...');
    
    try {
      // Create 150 pads (middle of 100-200 range)
      const padCount = 150;
      const createdPads: PadData[] = [];
      
      for (let i = 0; i < padCount; i++) {
        const padData: PadData = {
          id: `test_pad_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(
            (i % 10 - 5) * 5,  // Grid X position
            0,                      // Y position (always 0 for pads)
            (Math.floor(i / 10) - 7) * 5  // Grid Z position
          ),
          size: new THREE.Vector2(2, 2),  // 2x2mm pads
          layer: i % 3 === 0 ? 'bottom' : 'top',
          rotation: (i % 4) * Math.PI / 4  // Rotate some pads
        };
        
        createdPads.push(padData);
        this.pads.addPad(padData);
      }
      
      // Verify all pads were created
      const allPadData = this.pads.getAllPadData();
      const correctCount = allPadData.length === padCount;
      
      // Verify InstancedMesh structure
      const meshes = this.pads.getMeshes();
      const hasTwoMeshes = meshes.length === 2;
      
      // Verify mesh properties
      const rectMesh = meshes.find(m => m.name === 'rectangular_pads');
      const circleMesh = meshes.find(m => m.name === 'circular_pads');
      
      const rectMeshValid = rectMesh && 
                        rectMesh instanceof THREE.InstancedMesh &&
                        rectMesh.count >= padCount / 2; // Half are rectangular
                        
      const circleMeshValid = circleMesh && 
                          circleMesh instanceof THREE.InstancedMesh &&
                          circleMesh.count >= padCount / 2; // Half are circular
      
      console.log(`Pad count correct: ${correctCount ? '✅' : '❌'} (${allPadData.length}/${padCount})`);
      console.log(`Two InstancedMeshes: ${hasTwoMeshes ? '✅' : '❌'}`);
      console.log(`Rectangular mesh valid: ${rectMeshValid ? '✅' : '❌'}`);
      console.log(`Circular mesh valid: ${circleMeshValid ? '✅' : '❌'}`);
      
      return correctCount && hasTwoMeshes && rectMeshValid && circleMeshValid;
    } catch (error) {
      console.error('Large pad count test failed:', error);
      return false;
    }
  }

  /**
   * Test one geometry and one material per pad type
   */
  public testSingleGeometryMaterial(): boolean {
    console.log('Testing single geometry and material per pad type...');
    
    try {
      const meshes = this.pads.getMeshes();
      
      // Check rectangular pads
      const rectMesh = meshes.find(m => m.name === 'rectangular_pads');
      if (!rectMesh || !(rectMesh instanceof THREE.InstancedMesh)) {
        console.log('❌ Rectangular InstancedMesh not found');
        return false;
      }
      
      const rectGeometry = rectMesh.geometry;
      const rectMaterial = rectMesh.material;
      
      // Check circular pads
      const circleMesh = meshes.find(m => m.name === 'circular_pads');
      if (!circleMesh || !(circleMesh instanceof THREE.InstancedMesh)) {
        console.log('❌ Circular InstancedMesh not found');
        return false;
      }
      
      const circleGeometry = circleMesh.geometry;
      const circleMaterial = circleMesh.material;
      
      // Verify single geometry per type
      const hasSingleRectGeometry = rectGeometry instanceof THREE.PlaneGeometry;
      const hasSingleCircleGeometry = circleGeometry instanceof THREE.CircleGeometry;
      
      // Verify single material per type
      const hasSingleRectMaterial = rectMaterial instanceof THREE.ShaderMaterial;
      const hasSingleCircleMaterial = circleMaterial instanceof THREE.ShaderMaterial;
      
      // Verify materials are the same shader type
      const sameShaderType = hasSingleRectMaterial && hasSingleCircleMaterial;
      
      console.log(`Single rect geometry: ${hasSingleRectGeometry ? '✅' : '❌'}`);
      console.log(`Single circle geometry: ${hasSingleCircleGeometry ? '✅' : '❌'}`);
      console.log(`Single rect material: ${hasSingleRectMaterial ? '✅' : '❌'}`);
      console.log(`Single circle material: ${hasSingleCircleMaterial ? '✅' : '❌'}`);
      console.log(`Same shader type: ${sameShaderType ? '✅' : '❌'}`);
      
      return hasSingleRectGeometry && hasSingleCircleGeometry && 
             hasSingleRectMaterial && hasSingleCircleMaterial && sameShaderType;
    } catch (error) {
      console.error('Single geometry/material test failed:', error);
      return false;
    }
  }

  /**
   * Test instanceId selection functionality
   */
  public testInstanceIdSelection(): boolean {
    console.log('Testing instanceId selection...');
    
    try {
      // Create test pads with known positions
      const testPads: PadData[] = [
        {
          id: 'select_test_1',
          type: 'rect',
          position: new THREE.Vector3(0, 0, 0),
          size: new THREE.Vector2(2, 2),
          layer: 'top'
        },
        {
          id: 'select_test_2',
          type: 'circle',
          position: new THREE.Vector3(5, 0, 0),
          size: new THREE.Vector2(2, 2),
          layer: 'top'
        },
        {
          id: 'select_test_3',
          type: 'rect',
          position: new THREE.Vector3(10, 0, 0),
          size: new THREE.Vector2(2, 2),
          layer: 'top'
        }
      ];
      
      // Add pads and track their instance IDs
      const instanceIds: number[] = [];
      testPads.forEach(pad => {
        const instanceId = this.pads.addPad(pad);
        instanceIds.push(instanceId);
      });
      
      // Test instance ID to pad ID mapping
      const pad1Id = this.pads.getPadIdByInstanceId(instanceIds[0]);
      const pad2Id = this.pads.getPadIdByInstanceId(instanceIds[1]);
      const pad3Id = this.pads.getPadIdByInstanceId(instanceIds[2]);
      
      const correctMapping = pad1Id === 'select_test_1' && 
                         pad2Id === 'select_test_2' && 
                         pad3Id === 'select_test_3';
      
      // Test instance matrix retrieval
      const matrix1 = this.pads.getInstanceMatrix(instanceIds[0]);
      const matrix2 = this.pads.getInstanceMatrix(instanceIds[1]);
      const matrix3 = this.pads.getInstanceMatrix(instanceIds[2]);
      
      const matricesValid = matrix1 !== null && matrix2 !== null && matrix3 !== null;
      
      // Test position extraction from matrices
      const position1 = new THREE.Vector3();
      const position2 = new THREE.Vector3();
      const position3 = new THREE.Vector3();
      
      if (matrix1) matrix1.decompose(position1, new THREE.Quaternion(), new THREE.Vector3());
      if (matrix2) matrix2.decompose(position2, new THREE.Quaternion(), new THREE.Vector3());
      if (matrix3) matrix3.decompose(position3, new THREE.Quaternion(), new THREE.Vector3());
      
      const positionsCorrect = 
        Math.abs(position1.x - 0) < 0.001 &&
        Math.abs(position2.x - 5) < 0.001 &&
        Math.abs(position3.x - 10) < 0.001;
      
      console.log(`Instance ID mapping: ${correctMapping ? '✅' : '❌'}`);
      console.log(`Matrix retrieval: ${matricesValid ? '✅' : '❌'}`);
      console.log(`Position extraction: ${positionsCorrect ? '✅' : '❌'}`);
      console.log(`Pad 1 position: (${position1.x.toFixed(2)}, ${position1.y.toFixed(2)}, ${position1.z.toFixed(2)})`);
      console.log(`Pad 2 position: (${position2.x.toFixed(2)}, ${position2.y.toFixed(2)}, ${position2.z.toFixed(2)})`);
      console.log(`Pad 3 position: (${position3.x.toFixed(2)}, ${position3.y.toFixed(2)}, ${position3.z.toFixed(2)})`);
      
      return correctMapping && matricesValid && positionsCorrect;
    } catch (error) {
      console.error('Instance ID selection test failed:', error);
      return false;
    }
  }

  /**
   * Test instance matrix updates during drag operations
   */
  public testInstanceMatrixUpdates(): boolean {
    console.log('Testing instance matrix updates during drag...');
    
    try {
      // Create a test pad
      const originalPad: PadData = {
        id: 'drag_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 2),
        layer: 'top'
      };
      
      const instanceId = this.pads.addPad(originalPad);
      
      // Get original matrix
      const originalMatrix = this.pads.getInstanceMatrix(instanceId);
      if (!originalMatrix) {
        console.log('❌ Failed to get original matrix');
        return false;
      }
      
      // Simulate drag operation - update position
      const newPosition = new THREE.Vector3(5, 0, 3);
      const newMatrix = new THREE.Matrix4();
      newMatrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z);
      
      // Update instance matrix
      this.pads.updateInstanceMatrix(instanceId, newMatrix);
      
      // Verify matrix was updated
      const updatedMatrix = this.pads.getInstanceMatrix(instanceId);
      if (!updatedMatrix) {
        console.log('❌ Failed to get updated matrix');
        return false;
      }
      
      // Verify position changed
      const updatedPosition = new THREE.Vector3();
      updatedMatrix.decompose(updatedPosition, new THREE.Quaternion(), new THREE.Vector3());
      
      const positionChanged = 
        Math.abs(updatedPosition.x - newPosition.x) < 0.001 &&
        Math.abs(updatedPosition.y - newPosition.y) < 0.001 &&
        Math.abs(updatedPosition.z - newPosition.z) < 0.001;
      
      // Verify pad data was updated
      const updatedPadData = this.pads.getPadData('drag_test_pad');
      const padDataUpdated = updatedPadData && 
                           Math.abs(updatedPadData.position.x - newPosition.x) < 0.001 &&
                           Math.abs(updatedPadData.position.y - newPosition.y) < 0.001 &&
                           Math.abs(updatedPadData.position.z - newPosition.z) < 0.001;
      
      console.log(`Matrix update: ${positionChanged ? '✅' : '❌'}`);
      console.log(`Pad data update: ${padDataUpdated ? '✅' : '❌'}`);
      console.log(`New position: (${updatedPosition.x.toFixed(2)}, ${updatedPosition.y.toFixed(2)}, ${updatedPosition.z.toFixed(2)})`);
      
      return positionChanged && padDataUpdated;
    } catch (error) {
      console.error('Instance matrix update test failed:', error);
      return false;
    }
  }

  /**
   * Test performance with 200 pads
   */
  public testPerformance200Pads(): boolean {
    console.log('Testing performance with 200 pads...');
    
    try {
      const startTime = performance.now();
      
      // Create 200 pads
      for (let i = 0; i < 200; i++) {
        const padData: PadData = {
          id: `perf_pad_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(
            (i % 20 - 10) * 2,
            0,
            (Math.floor(i / 20) - 5) * 2
          ),
          size: new THREE.Vector2(1.5, 1.5),
          layer: i % 2 === 0 ? 'top' : 'bottom'
        };
        
        this.pads.addPad(padData);
      }
      
      const creationTime = performance.now() - startTime;
      
      // Test matrix update performance
      const updateStartTime = performance.now();
      
      for (let i = 0; i < 200; i++) {
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(
          Math.random() * 10 - 5,
          0,
          Math.random() * 10 - 5
        );
        this.pads.updateInstanceMatrix(i, matrix);
      }
      
      const updateTime = performance.now() - updateStartTime;
      
      // Performance criteria
      const creationFast = creationTime < 100; // < 100ms for 200 pads
      const updateFast = updateTime < 50;    // < 50ms for 200 matrix updates
      
      console.log(`Creation time: ${creationTime.toFixed(2)}ms ${creationFast ? '✅' : '❌'}`);
      console.log(`Update time: ${updateTime.toFixed(2)}ms ${updateFast ? '✅' : '❌'}`);
      console.log(`Average per pad: ${(creationTime / 200).toFixed(3)}ms`);
      console.log(`Average per update: ${(updateTime / 200).toFixed(3)}ms`);
      
      return creationFast && updateFast;
    } catch (error) {
      console.error('Performance test failed:', error);
      return false;
    }
  }

  /**
   * Test memory efficiency
   */
  public testMemoryEfficiency(): boolean {
    console.log('Testing memory efficiency...');
    
    try {
      // Get initial memory state
      const initialGeometries = this.scene.children.filter(child => 
        child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh
      ).length;
      
      // Create 200 pads
      for (let i = 0; i < 200; i++) {
        const padData: PadData = {
          id: `mem_test_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(i * 0.1, 0, 0),
          size: new THREE.Vector2(1, 1),
          layer: 'top'
        };
        
        this.pads.addPad(padData);
      }
      
      // Add meshes to scene for memory test
      const meshes = this.pads.getMeshes();
      meshes.forEach(mesh => this.scene.add(mesh));
      
      // Count geometries in scene
      const finalGeometries = this.scene.children.filter(child => 
        child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh
      ).length;
      
      // Should only have 2 geometries (rect + circle), not 200
      const memoryEfficient = finalGeometries === initialGeometries + 2;
      
      // Verify InstancedMesh counts
      const rectMesh = meshes.find(m => m.name === 'rectangular_pads');
      const circleMesh = meshes.find(m => m.name === 'circular_pads');
      
      const rectHasCapacity = rectMesh && rectMesh.count >= 100;
      const circleHasCapacity = circleMesh && circleMesh.count >= 100;
      
      console.log(`Memory efficient: ${memoryEfficient ? '✅' : '❌'} (${finalGeometries} geometries)`);
      console.log(`Rect mesh capacity: ${rectHasCapacity ? '✅' : '❌'}`);
      console.log(`Circle mesh capacity: ${circleHasCapacity ? '✅' : '❌'}`);
      
      return memoryEfficient && rectHasCapacity && circleHasCapacity;
    } catch (error) {
      console.error('Memory efficiency test failed:', error);
      return false;
    }
  }

  /**
   * Run all InstancedMesh pad tests
   */
  public runAllTests(): boolean {
    console.log('=== InstancedMesh Pad Tests (Step 1) ===');
    
    const results = [
      this.testLargePadCount(),
      this.testSingleGeometryMaterial(),
      this.testInstanceIdSelection(),
      this.testInstanceMatrixUpdates(),
      this.testPerformance200Pads(),
      this.testMemoryEfficiency()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }

  /**
   * Cleanup test resources
   */
  public dispose(): void {
    // Remove meshes from scene
    const meshes = this.pads.getMeshes();
    meshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    
    // Dispose pad system
    this.pads.dispose();
  }
}
