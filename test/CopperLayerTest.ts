import * as THREE from 'three';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for Copper Layer System
 * Validates Z-fighting prevention and positioning accuracy
 */
export class CopperLayerTest {
  private copperLayerManager: CopperLayerManager;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6); // Standard PCB thickness
  }

  /**
   * Test copper layer positioning calculations
   */
  public testCopperPositioning(): boolean {
    console.log('Testing copper layer positioning...');
    
    const boardThickness = 1.6;
    const expectedTopZ = boardThickness / 2 + 0.01; // 0.8 + 0.01 = 0.81
    const expectedBottomZ = -(boardThickness / 2) - 0.01; // -0.8 - 0.01 = -0.81
    
    const actualTopZ = this.copperLayerManager.getTopCopperZ();
    const actualBottomZ = this.copperLayerManager.getBottomCopperZ();
    
    const topCorrect = Math.abs(actualTopZ - expectedTopZ) < 0.001;
    const bottomCorrect = Math.abs(actualBottomZ - expectedBottomZ) < 0.001;
    
    console.log(`Expected Top Z: ${expectedTopZ}, Actual: ${actualTopZ}, Correct: ${topCorrect}`);
    console.log(`Expected Bottom Z: ${expectedBottomZ}, Actual: ${actualBottomZ}, Correct: ${bottomCorrect}`);
    
    return topCorrect && bottomCorrect;
  }

  /**
   * Test Z-fighting prevention validation
   */
  public testZfightingPrevention(): boolean {
    console.log('Testing Z-fighting prevention...');
    
    const isValid = this.copperLayerManager.validateZSeparation();
    const layerInfo = this.copperLayerManager.getLayerInfo();
    
    console.log('Layer Info:', layerInfo);
    console.log(`Z Separation Valid: ${isValid}`);
    
    return isValid;
  }

  /**
   * Test copper geometry creation
   */
  public testCopperGeometry(): boolean {
    console.log('Testing copper geometry creation...');
    
    try {
      // Create a simple copper plane
      const geometry = new THREE.PlaneGeometry(10, 10);
      const copperMesh = this.copperLayerManager.createCopperGeometry(geometry, 'top');
      
      // Verify positioning
      const expectedZ = this.copperLayerManager.getTopCopperZ();
      const actualZ = copperMesh.position.y;
      
      const positionCorrect = Math.abs(actualZ - expectedZ) < 0.001;
      
      console.log(`Copper mesh Z position: ${actualZ}, Expected: ${expectedZ}, Correct: ${positionCorrect}`);
      
      // Cleanup
      geometry.dispose();
      if (copperMesh.material instanceof THREE.Material) {
        copperMesh.material.dispose();
      }
      
      return positionCorrect;
    } catch (error) {
      console.error('Copper geometry creation failed:', error);
      return false;
    }
  }

  /**
   * Test board thickness updates
   */
  public testBoardThicknessUpdate(): boolean {
    console.log('Testing board thickness updates...');
    
    const originalThickness = 1.6;
    const newThickness = 2.4;
    
    // Update thickness
    this.copperLayerManager.updateBoardThickness(newThickness);
    
    const newTopZ = this.copperLayerManager.getTopCopperZ();
    const newBottomZ = this.copperLayerManager.getBottomCopperZ();
    
    const expectedTopZ = newThickness / 2 + 0.01; // 1.2 + 0.01 = 1.21
    const expectedBottomZ = -(newThickness / 2) - 0.01; // -1.2 - 0.01 = -1.21
    
    const topCorrect = Math.abs(newTopZ - expectedTopZ) < 0.001;
    const bottomCorrect = Math.abs(newBottomZ - expectedBottomZ) < 0.001;
    
    console.log(`Updated Top Z: ${newTopZ}, Expected: ${expectedTopZ}, Correct: ${topCorrect}`);
    console.log(`Updated Bottom Z: ${newBottomZ}, Expected: ${expectedBottomZ}, Correct: ${bottomCorrect}`);
    
    // Restore original thickness
    this.copperLayerManager.updateBoardThickness(originalThickness);
    
    return topCorrect && bottomCorrect;
  }

  /**
   * Run all tests
   */
  public runAllTests(): boolean {
    console.log('=== Copper Layer System Tests ===');
    
    const results = [
      this.testCopperPositioning(),
      this.testZfightingPrevention(),
      this.testCopperGeometry(),
      this.testBoardThicknessUpdate()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
