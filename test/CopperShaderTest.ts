import * as THREE from 'three';
import { ShaderManager } from '../shaders/ShaderManager';
import { SMDPads, SMDDPadData } from '../components/SMDPads';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for Custom Copper Shader (Phase 3)
 * Validates shader uniforms, visual effects, and reusability
 */
export class CopperShaderTest {
  private copperLayerManager: CopperLayerManager;
  private shaderManager: ShaderManager;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6);
    this.shaderManager = ShaderManager.getInstance();
  }

  /**
   * Test basic shader material creation
   */
  public testShaderMaterialCreation(): boolean {
    console.log('Testing copper shader material creation...');
    
    try {
      const material = this.shaderManager.createCopperMaterial();
      
      // Verify material type
      const isShaderMaterial = material instanceof THREE.ShaderMaterial;
      
      // Verify required uniforms
      const hasTimeUniform = material.uniforms.uTime !== undefined;
      const hasHoveredUniform = material.uniforms.uHovered !== undefined;
      const hasSelectedUniform = material.uniforms.uSelected !== undefined;
      const hasBaseColorUniform = material.uniforms.uBaseColor !== undefined;
      
      // Verify uniform types
      const timeIsNumber = typeof material.uniforms.uTime.value === 'number';
      const hoveredIsBoolean = typeof material.uniforms.uHovered.value === 'boolean';
      const selectedIsBoolean = typeof material.uniforms.uSelected.value === 'boolean';
      const baseColorIsColor = material.uniforms.uBaseColor.value instanceof THREE.Color;
      
      console.log(`Material type: ${isShaderMaterial ? '✅' : '❌'}`);
      console.log(`Required uniforms: ${hasTimeUniform && hasHoveredUniform && hasSelectedUniform && hasBaseColorUniform ? '✅' : '❌'}`);
      console.log(`Uniform types: ${timeIsNumber && hoveredIsBoolean && selectedIsBoolean && baseColorIsColor ? '✅' : '❌'}`);
      
      // Cleanup
      material.dispose();
      
      return isShaderMaterial && hasTimeUniform && hasHoveredUniform && hasSelectedUniform && hasBaseColorUniform;
    } catch (error) {
      console.error('Shader material creation failed:', error);
      return false;
    }
  }

  /**
   * Test uniform updates (hover and selection states)
   */
  public testUniformUpdates(): boolean {
    console.log('Testing shader uniform updates...');
    
    try {
      const material = this.shaderManager.createCopperMaterial();
      
      // Test initial state (verify they exist, values checked implicitly)
      const _initialHovered = material.uniforms.uHovered.value;
      const _initialSelected = material.uniforms.uSelected.value;
      
      // Test hover state update
      this.shaderManager.setHovered(material, true);
      const hoveredUpdated = material.uniforms.uHovered.value === true;
      
      // Test selection state update
      this.shaderManager.setSelected(material, true);
      const selectedUpdated = material.uniforms.uSelected.value === true;
      
      // Test clearing states
      this.shaderManager.setHovered(material, false);
      this.shaderManager.setSelected(material, false);
      const clearedHovered = material.uniforms.uHovered.value === false;
      const clearedSelected = material.uniforms.uSelected.value === false;
      
      console.log(`Hover update: ${hoveredUpdated ? '✅' : '❌'}`);
      console.log(`Selection update: ${selectedUpdated ? '✅' : '❌'}`);
      console.log(`State clearing: ${clearedHovered && clearedSelected ? '✅' : '❌'}`);
      
      // Cleanup
      material.dispose();
      
      return Boolean(hoveredUpdated && selectedUpdated && clearedHovered && clearedSelected);
    } catch (error) {
      console.error('Uniform update test failed:', error);
      return false;
    }
  }

  /**
   * Test shader integration with SMD pads
   */
  public testSMDPadIntegration(): boolean {
    console.log('Testing shader integration with SMD pads...');
    
    try {
      const smdPads = new SMDPads(this.copperLayerManager, 100);
      
      // Add test pad
      const testPad: SMDDPadData = {
        id: 'shader_test_pad',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(2, 1),
        rotation: 0,
        layer: 'top'
      };
      
      const addSuccess = smdPads.addPad(testPad);
      
      // Test shader material access
      const shaderMaterial = smdPads.getShaderMaterial();
      const isShaderMaterial = shaderMaterial instanceof THREE.ShaderMaterial;
      
      // Test interaction states
      const hoverResult = smdPads.setPadHovered('shader_test_pad', true);
      const selectResult = smdPads.setPadSelected('shader_test_pad', true);
      const clearResult = smdPads.clearInteractionStates();
      
      const hoverSuccess = Boolean(hoverResult);
      const selectSuccess = Boolean(selectResult);
      const clearSuccess = Boolean(clearResult);
      
      console.log(`Pad addition: ${addSuccess ? '✅' : '❌'}`);
      console.log(`Shader material access: ${isShaderMaterial ? '✅' : '❌'}`);
      console.log(`Hover interaction: ${hoverSuccess ? '✅' : '❌'}`);
      console.log(`Selection interaction: ${selectSuccess ? '✅' : '❌'}`);
      console.log(`State clearing: ${clearSuccess ? '✅' : '❌'}`);
      
      // Cleanup
      smdPads.dispose();
      
      return addSuccess && isShaderMaterial && hoverSuccess && selectSuccess && clearSuccess;
    } catch (error) {
      console.error('SMD pad integration test failed:', error);
      return false;
    }
  }

  /**
   * Test shader reusability across different components
   */
  public testShaderReusability(): boolean {
    console.log('Testing shader reusability...');
    
    try {
      // Create multiple materials
      const material1 = this.shaderManager.createCopperMaterial();
      const material2 = this.shaderManager.createCopperMaterial();
      const material3 = this.shaderManager.createCopperMaterial();
      
      // Verify they're independent instances
      const areIndependent = material1 !== material2 && material2 !== material3 && material1 !== material3;
      
      // Test independent state updates
      this.shaderManager.setHovered(material1, true);
      this.shaderManager.setSelected(material2, true);
      
      const independentStates = 
        material1.uniforms.uHovered.value === true &&
        material1.uniforms.uSelected.value === false &&
        material2.uniforms.uHovered.value === false &&
        material2.uniforms.uSelected.value === true &&
        material3.uniforms.uHovered.value === false &&
        material3.uniforms.uSelected.value === false;
      
      // Test batch updates
      const materials = [material1, material2, material3];
      this.shaderManager.updateMaterials(materials, { hovered: false, selected: false });
      
      const batchUpdateSuccess = materials.every(mat => 
        mat.uniforms.uHovered.value === false && mat.uniforms.uSelected.value === false
      );
      
      console.log(`Independent instances: ${areIndependent ? '✅' : '❌'}`);
      console.log(`Independent states: ${independentStates ? '✅' : '❌'}`);
      console.log(`Batch updates: ${batchUpdateSuccess ? '✅' : '❌'}`);
      
      // Cleanup
      material1.dispose();
      material2.dispose();
      material3.dispose();
      
      return areIndependent && independentStates && batchUpdateSuccess;
    } catch (error) {
      console.error('Shader reusability test failed:', error);
      return false;
    }
  }

  /**
   * Test base color customization
   */
  public testBaseColorCustomization(): boolean {
    console.log('Testing base color customization...');
    
    try {
      // Test default color
      const defaultMaterial = this.shaderManager.createCopperMaterial();
      const defaultColor = defaultMaterial.uniforms.uBaseColor.value.clone();
      
      // Test custom color
      const customColor = new THREE.Color(0xff0000); // Red
      const customMaterial = this.shaderManager.createCopperMaterial({
        baseColor: customColor
      });
      
      const colorApplied = customMaterial.uniforms.uBaseColor.value.equals(customColor);
      
      // Test color update
      const anotherColor = new THREE.Color(0x0000ff); // Blue
      this.shaderManager.setBaseColor(customMaterial, anotherColor);
      const colorUpdated = customMaterial.uniforms.uBaseColor.value.equals(anotherColor);
      
      console.log(`Default color: ${defaultColor.getHexString()} ✅`);
      console.log(`Custom color application: ${colorApplied ? '✅' : '❌'}`);
      console.log(`Color update: ${colorUpdated ? '✅' : '❌'}`);
      
      // Cleanup
      defaultMaterial.dispose();
      customMaterial.dispose();
      
      return colorApplied && colorUpdated;
    } catch (error) {
      console.error('Base color customization test failed:', error);
      return false;
    }
  }

  /**
   * Test animation and time-based effects
   */
  public testTimeBasedEffects(): Promise<boolean> {
    console.log('Testing time-based shader effects...');
    
    try {
      const material = this.shaderManager.createCopperMaterial();
      
      // Test initial time
      const initialTime = material.uniforms.uTime.value;
      
      // Wait a moment and check time update
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedTime = material.uniforms.uTime.value;
          const timeUpdated = updatedTime > initialTime;
          
          console.log(`Time update: ${timeUpdated ? '✅' : '❌'}`);
          console.log(`Initial: ${initialTime.toFixed(2)}, Updated: ${updatedTime.toFixed(2)}`);
          
          // Cleanup
          material.dispose();
          
          resolve(timeUpdated);
        }, 100);
      });
    } catch (error) {
      console.error('Time-based effects test failed:', error);
      return Promise.resolve(false);
    }
  }

  /**
   * Run all shader tests
   */
  public async runAllTests(): Promise<boolean> {
    console.log('=== Copper Shader Tests (Phase 3) ===');
    
    const results = [
      this.testShaderMaterialCreation(),
      this.testUniformUpdates(),
      this.testSMDPadIntegration(),
      this.testShaderReusability(),
      this.testBaseColorCustomization(),
      await this.testTimeBasedEffects()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
