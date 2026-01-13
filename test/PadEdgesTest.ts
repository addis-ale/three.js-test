import * as THREE from 'three';
import { BarycentricShader } from '../shaders/BarycentricShader';
import { BarycentricGeometry } from '../utils/BarycentricGeometry';
import { SMDPads, SMDDPadData } from '../components/SMDPads';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for Pad Edges System (Phase 4)
 * Validates barycentric wireframe shader and edge rendering
 */
export class PadEdgesTest {
  private copperLayerManager: CopperLayerManager;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6);
  }

  /**
   * Test barycentric shader material creation
   */
  public testBarycentricShaderCreation(): boolean {
    console.log('Testing barycentric shader material creation...');
    
    try {
      const material = BarycentricShader.createMaterial({
        edgeColor: new THREE.Color(0x000000),
        edgeWidth: 1.5,
        opacity: 0.8
      });
      
      // Verify material type
      const isShaderMaterial = material instanceof THREE.ShaderMaterial;
      
      // Verify required uniforms
      const hasEdgeColorUniform = material.uniforms.uEdgeColor !== undefined;
      const hasEdgeWidthUniform = material.uniforms.uEdgeWidth !== undefined;
      const hasOpacityUniform = material.uniforms.uOpacity !== undefined;
      const hasTimeUniform = material.uniforms.uTime !== undefined;
      
      // Verify uniform types
      const edgeColorIsColor = material.uniforms.uEdgeColor.value instanceof THREE.Color;
      const edgeWidthIsNumber = typeof material.uniforms.uEdgeWidth.value === 'number';
      const opacityIsNumber = typeof material.uniforms.uOpacity.value === 'number';
      const timeIsNumber = typeof material.uniforms.uTime.value === 'number';
      
      console.log(`Material type: ${isShaderMaterial ? '✅' : '❌'}`);
      console.log(`Required uniforms: ${hasEdgeColorUniform && hasEdgeWidthUniform && hasOpacityUniform && hasTimeUniform ? '✅' : '❌'}`);
      console.log(`Uniform types: ${edgeColorIsColor && edgeWidthIsNumber && opacityIsNumber && timeIsNumber ? '✅' : '❌'}`);
      
      // Cleanup
      material.dispose();
      
      return isShaderMaterial && hasEdgeColorUniform && hasEdgeWidthUniform && hasOpacityUniform && hasTimeUniform;
    } catch (error) {
      console.error('Barycentric shader creation failed:', error);
      return false;
    }
  }

  /**
   * Test barycentric geometry generation
   */
  public testBarycentricGeometry(): boolean {
    console.log('Testing barycentric geometry generation...');
    
    try {
      // Create plane geometry with barycentric coordinates
      const planeGeo = BarycentricGeometry.createBarycentricPlane(1, 1);
      const circleGeo = BarycentricGeometry.createBarycentricCircle(0.5, 32);
      
      // Verify barycentric attributes
      const planeHasBarycentrics = planeGeo.attributes.barycentric !== undefined;
      const circleHasBarycentrics = circleGeo.attributes.barycentric !== undefined;
      
      // Validate barycentric coordinates
      const planeValid = BarycentricGeometry.validateBarycentrics(planeGeo);
      const circleValid = BarycentricGeometry.validateBarycentrics(circleGeo);
      
      // Get statistics
      const planeStats = BarycentricGeometry.getBarycentricStats(planeGeo);
      const circleStats = BarycentricGeometry.getBarycentricStats(circleGeo);
      
      console.log(`Plane barycentrics: ${planeHasBarycentrics ? '✅' : '❌'}`);
      console.log(`Circle barycentrics: ${circleHasBarycentrics ? '✅' : '❌'}`);
      console.log(`Plane validation: ${planeValid ? '✅' : '❌'}`);
      console.log(`Circle validation: ${circleValid ? '✅' : '❌'}`);
      console.log(`Plane vertices: ${planeStats.vertexCount}`);
      console.log(`Circle vertices: ${circleStats.vertexCount}`);
      
      // Cleanup
      planeGeo.dispose();
      circleGeo.dispose();
      
      return planeHasBarycentrics && circleHasBarycentrics && planeValid && circleValid;
    } catch (error) {
      console.error('Barycentric geometry test failed:', error);
      return false;
    }
  }

  /**
   * Test edge uniform updates
   */
  public testEdgeUniformUpdates(): boolean {
    console.log('Testing edge uniform updates...');
    
    try {
      const material = BarycentricShader.createMaterial();
      
      // Test initial state (verify they exist, values checked after updates)
      const _initialColor = material.uniforms.uEdgeColor.value.clone();
      const _initialWidth = material.uniforms.uEdgeWidth.value;
      const _initialOpacity = material.uniforms.uOpacity.value;
      
      // Test edge color update
      const newColor = new THREE.Color(0xff0000);
      BarycentricShader.setEdgeColor(material, newColor);
      const colorUpdated = material.uniforms.uEdgeColor.value.equals(newColor);
      
      // Test edge width update
      BarycentricShader.setEdgeWidth(material, 2.5);
      const widthUpdated = Math.abs(material.uniforms.uEdgeWidth.value - 2.5) < 0.001;
      
      // Test opacity update
      BarycentricShader.setOpacity(material, 0.5);
      const opacityUpdated = Math.abs(material.uniforms.uOpacity.value - 0.5) < 0.001;
      
      // Test time update
      BarycentricShader.updateMaterial(material, 1.5);
      const timeUpdated = Math.abs(material.uniforms.uTime.value - 1.5) < 0.001;
      
      console.log(`Color update: ${colorUpdated ? '✅' : '❌'}`);
      console.log(`Width update: ${widthUpdated ? '✅' : '❌'}`);
      console.log(`Opacity update: ${opacityUpdated ? '✅' : '❌'}`);
      console.log(`Time update: ${timeUpdated ? '✅' : '❌'}`);
      
      // Cleanup
      material.dispose();
      
      return colorUpdated && widthUpdated && opacityUpdated && timeUpdated;
    } catch (error) {
      console.error('Edge uniform update test failed:', error);
      return false;
    }
  }

  /**
   * Test SMD pad edge integration
   */
  public testSMDEdgeIntegration(): boolean {
    console.log('Testing SMD pad edge integration...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'edge_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      const addSuccess = smdPads.addPad(testPad);
      
      // Test edge mesh access
      const edgeMesh = smdPads.edgeMesh;
      const edgeMeshExists = edgeMesh !== undefined;
      const isInstancedMesh = edgeMesh instanceof THREE.InstancedMesh;
      
      // Test edge material access
      const edgeMaterial = smdPads.getEdgeMaterial();
      const edgeMaterialExists = edgeMaterial !== undefined;
      const isShaderMaterial = edgeMaterial instanceof THREE.ShaderMaterial;
      
      // Test edge controls
      const initialVisible = edgeMesh.visible;
      smdPads.setEdgeVisible(false);
      const visibilityToggle = edgeMesh.visible !== initialVisible;
      
      // Test edge color
      const testColor = new THREE.Color(0x00ff00);
      smdPads.setEdgeColor(testColor);
      const colorSet = edgeMaterial.uniforms.uEdgeColor.value.equals(testColor);
      
      // Test edge width
      smdPads.setEdgeWidth(2.0);
      const widthSet = Math.abs(edgeMaterial.uniforms.uEdgeWidth.value - 2.0) < 0.001;
      
      console.log(`Pad addition: ${addSuccess ? '✅' : '❌'}`);
      console.log(`Edge mesh exists: ${edgeMeshExists ? '✅' : '❌'}`);
      console.log(`Edge mesh type: ${isInstancedMesh ? '✅' : '❌'}`);
      console.log(`Edge material exists: ${edgeMaterialExists ? '✅' : '❌'}`);
      console.log(`Edge material type: ${isShaderMaterial ? '✅' : '❌'}`);
      console.log(`Visibility control: ${visibilityToggle ? '✅' : '❌'}`);
      console.log(`Color control: ${colorSet ? '✅' : '❌'}`);
      console.log(`Width control: ${widthSet ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      
      return addSuccess && edgeMeshExists && isInstancedMesh && edgeMaterialExists && isShaderMaterial && visibilityToggle && colorSet && widthSet;
    } catch (error) {
      console.error('SMD edge integration test failed:', error);
      return false;
    }
  }

  /**
   * Test edge transform synchronization
   */
  public testEdgeTransformSync(): boolean {
    console.log('Testing edge transform synchronization...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      
      // Add test pad with specific transform
      const testPad: SMDDPadData = {
        id: 'transform_test_pad',
        type: 'rect',
        position: new THREE.Vector3(5, 0, 10),
        size: new THREE.Vector2(3, 2),
        rotation: Math.PI / 4,
        layer: 'top'
      };
      
      smdPads.addPad(testPad);
      
      // Get instance matrices
      const padMatrix = new THREE.Matrix4();
      const edgeMatrix = new THREE.Matrix4();
      
      smdPads.instancedMesh.getMatrixAt(0, padMatrix);
      smdPads.edgeMesh.getMatrixAt(0, edgeMatrix);
      
      // Compare matrices
      const elementsEqual = padMatrix.elements.every((val, i) => 
        Math.abs(val - edgeMatrix.elements[i]) < 0.001
      );
      
      console.log(`Transform synchronization: ${elementsEqual ? '✅' : '❌'}`);
      
      if (!elementsEqual) {
        console.log('Pad matrix:', padMatrix.elements);
        console.log('Edge matrix:', edgeMatrix.elements);
      }
      
      // Cleanup
      smdPads.dispose();
      
      return elementsEqual;
    } catch (error) {
      console.error('Edge transform sync test failed:', error);
      return false;
    }
  }

  /**
   * Test edge performance with multiple pads
   */
  public testEdgePerformance(): boolean {
    console.log('Testing edge performance with multiple pads...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 1000);
      
      // Add multiple pads
      const pads: SMDDPadData[] = [];
      for (let i = 0; i < 100; i++) {
        pads.push({
          id: `perf_test_pad_${i}`,
          type: i % 2 === 0 ? 'rect' : 'circle',
          position: new THREE.Vector3(
            (i % 10 - 5) * 5,
            0,
            (Math.floor(i / 10) - 5) * 5
          ),
          size: new THREE.Vector2(2, 2),
          rotation: (i * Math.PI) / 20,
          layer: 'top'
        });
      }
      
      const startTime = performance.now();
      const addedCount = smdPads.addPads(pads);
      const addTime = performance.now() - startTime;
      
      // Test edge uniform updates
      const updateStartTime = performance.now();
      smdPads.setEdgeColor(new THREE.Color(0xff0000));
      smdPads.setEdgeWidth(2.0);
      smdPads.setEdgeOpacity(0.9);
      const updateTime = performance.now() - updateStartTime;
      
      const stats = smdPads.getStats();
      const performanceOk = addTime < 100 && updateTime < 10; // Add should be <100ms, updates <10ms
      
      console.log(`Added ${addedCount} pads in ${addTime.toFixed(2)}ms: ${addTime < 100 ? '✅' : '❌'}`);
      console.log(`Updated edge uniforms in ${updateTime.toFixed(2)}ms: ${updateTime < 10 ? '✅' : '❌'}`);
      console.log(`Total instances: ${stats.totalInstances}`);
      console.log(`Performance acceptable: ${performanceOk ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      
      return addedCount === 100 && performanceOk;
    } catch (error) {
      console.error('Edge performance test failed:', error);
      return false;
    }
  }

  /**
   * Run all edge tests
   */
  public runAllTests(): boolean {
    console.log('=== Pad Edges Tests (Phase 4) ===');
    
    const results = [
      this.testBarycentricShaderCreation(),
      this.testBarycentricGeometry(),
      this.testEdgeUniformUpdates(),
      this.testSMDEdgeIntegration(),
      this.testEdgeTransformSync(),
      this.testEdgePerformance()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
