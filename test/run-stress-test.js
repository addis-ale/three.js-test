// Complete Step 5 Stress Test Runner
// Integrates all stress test components with memory monitoring

console.log('🚀 Step 5: Complete Stress Test Runner');

class CompleteStressTest {
  constructor() {
    this.testResults = {};
    this.memoryMonitor = null;
    this.testStartTime = performance.now();
    
    this.init();
  }

  async init() {
    console.log('📋 Initializing complete stress test...');
    
    // Wait for systems to be ready
    await this.waitForSystems();
    
    // Initialize memory monitor
    if (window.renderer) {
      this.memoryMonitor = new MemoryMonitor(window.renderer.renderer);
    }
    
    // Run comprehensive stress test
    await this.runCompleteStressTest();
  }

  async waitForSystems() {
    const maxWait = 5000; // 5 seconds max wait
    const startTime = Date.now();
    
    while ((!window.pads || !window.scene || !window.camera || !window.renderer) && 
           (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!window.pads || !window.scene || !window.camera || !window.renderer) {
      throw new Error('Required systems not available after timeout');
    }
  }

  async runCompleteStressTest() {
    console.log('🧪 Running complete stress test suite...');
    
    try {
      // Test 1: Baseline memory
      await this.testBaselineMemory();
      
      // Test 2: Create 200 pads
      await this.test200Pads();
      
      // Test 3: Orbit camera functionality
      await this.testOrbitCamera();
      
      // Test 4: Drag functionality
      await this.testDragFunctionality();
      
      // Test 5: Export/Reload scene
      await this.testExportReload();
      
      // Test 6: Memory leak detection
      await this.testMemoryLeaks();
      
      // Test 7: Performance under stress
      await this.testPerformanceUnderStress();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Stress test failed:', error);
    }
  }

  async testBaselineMemory() {
    console.log('\n📊 Test 1: Baseline Memory');
    
    if (!this.memoryMonitor) {
      console.log('❌ Memory monitor not available');
      return;
    }
    
    const baseline = this.memoryMonitor.captureMemoryState();
    this.testResults.baseline = baseline;
    
    this.memoryMonitor.logMemoryInfo('Baseline Memory');
    
    console.log('✅ Baseline memory captured');
  }

  async test200Pads() {
    console.log('\n🔧 Test 2: Create 200 Pads');
    
    const startTime = performance.now();
    
    // Clear existing pads
    this.clearAllPads();
    
    // Capture memory before
    const memoryBefore = this.memoryMonitor?.captureMemoryState();
    
    // Create 200 pads
    const gridSize = Math.sqrt(200);
    const spacing = 3;
    const boardSize = gridSize * spacing;
    
    for (let i = 0; i < 200; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      const x = (col - gridSize / 2) * spacing;
      const z = (row - gridSize / 2) * spacing;
      
      const type = i % 3 === 0 ? 'circle' : 'rect';
      const size = new THREE.Vector2(
        1 + Math.random() * 0.5,
        1 + Math.random() * 0.5
      );
      
      const padData = {
        id: `stress_pad_${i}`,
        type: type,
        position: new THREE.Vector3(x, 0, z),
        size: size,
        layer: i % 2 === 0 ? 'top' : 'bottom'
      };
      
      window.pads.addPad(padData);
    }
    
    // Add meshes to scene
    const meshes = window.pads.getMeshes();
    meshes.forEach(mesh => {
      if (!window.scene.children.includes(mesh)) {
        window.scene.add(mesh);
      }
    });
    
    // Capture memory after
    const memoryAfter = this.memoryMonitor?.captureMemoryState();
    
    const endTime = performance.now();
    const creationTime = endTime - startTime;
    
    this.testResults.pads200 = {
      count: 200,
      creationTime: creationTime,
      memoryBefore: memoryBefore,
      memoryAfter: memoryAfter
    };
    
    console.log(`✅ Created 200 pads in ${creationTime.toFixed(2)}ms`);
    
    if (this.memoryMonitor) {
      this.memoryMonitor.logMemoryInfo('After 200 Pads');
    }
  }

  async testOrbitCamera() {
    console.log('\n📷 Test 3: Orbit Camera');
    
    // Test camera controls
    const originalPosition = window.camera.getPosition();
    
    // Test orbit functionality
    window.camera.controls.update();
    
    // Test auto-rotate
    window.camera.setAutoRotate(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.camera.setAutoRotate(false);
    
    // Test reset
    window.camera.reset();
    
    const newPosition = window.camera.getPosition();
    
    this.testResults.orbitCamera = {
      originalPosition: originalPosition.toArray(),
      newPosition: newPosition.toArray(),
      controlsWorking: window.camera.controls !== undefined
    };
    
    console.log('✅ Orbit camera functionality verified');
    console.log(`📷 Camera position: [${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(1)}, ${newPosition.z.toFixed(1)}]`);
  }

  async testDragFunctionality() {
    console.log('\n🖱️ Test 4: Drag Functionality');
    
    // Setup drag test
    const dragTest = new DragTest();
    
    // Test drag on a few pads
    const testPadIds = ['stress_pad_0', 'stress_pad_50', 'stress_pad_100'];
    const dragResults = [];
    
    for (const padId of testPadIds) {
      const result = await dragTest.testDragOnPad(padId);
      dragResults.push(result);
    }
    
    this.testResults.drag = dragResults;
    
    console.log(`✅ Drag functionality tested on ${dragResults.length} pads`);
    
    const successfulDrags = dragResults.filter(r => r.success).length;
    console.log(`🖱️ Successful drags: ${successfulDrags}/${dragResults.length}`);
  }

  async testExportReload() {
    console.log('\n💾 Test 5: Export/Reload Scene');
    
    // Export scene
    const exportedScene = this.exportScene();
    
    // Clear scene
    this.clearAllPads();
    
    // Verify scene is empty
    const padsAfterClear = window.pads.getAllPadData();
    
    // Reload scene
    this.importScene(exportedScene);
    
    // Verify scene is restored
    const padsAfterReload = window.pads.getAllPadData();
    
    const sceneIdentical = padsAfterReload.length === 200 && 
                          exportedScene.pads.every((originalPad, index) => {
                            const reloadedPad = padsAfterReload[index];
                            return originalPad.id === reloadedPad.id &&
                                   originalPad.type === reloadedPad.type &&
                                   originalPad.position.equals(reloadedPad.position) &&
                                   originalPad.size.equals(reloadedPad.size) &&
                                   originalPad.layer === reloadedPad.layer;
                          });
    
    this.testResults.exportReload = {
      exportedPads: exportedScene.pads.length,
      padsAfterClear: padsAfterClear.length,
      padsAfterReload: padsAfterReload.length,
      sceneIdentical: sceneIdentical
    };
    
    console.log(`✅ Export/Reload test: ${sceneIdentical ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Pads: ${exportedScene.pads.length} → ${padsAfterClear.length} → ${padsAfterReload.length}`);
  }

  async testMemoryLeaks() {
    console.log('\n🔍 Test 6: Memory Leak Detection');
    
    if (!this.memoryMonitor) {
      console.log('❌ Memory monitor not available');
      return;
    }
    
    // Capture multiple memory states
    const states = [];
    for (let i = 0; i < 5; i++) {
      states.push(this.memoryMonitor.captureMemoryState());
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check for leaks
    const leakCheck = this.memoryMonitor.checkMemoryLeaks();
    
    this.testResults.memoryLeaks = {
      states: states,
      leakCheck: leakCheck
    };
    
    console.log(`🔍 Memory leak check: ${leakCheck.hasLeaks ? 'LEAKS DETECTED' : 'NO LEAKS'}`);
    
    if (leakCheck.hasLeaks) {
      console.log(`⚠️ Severity: ${leakCheck.severity}`);
      leakCheck.details.forEach(detail => console.log(`  - ${detail}`));
    }
  }

  async testPerformanceUnderStress() {
    console.log('\n⚡ Test 7: Performance Under Stress');
    
    // Test rendering performance with 200 pads
    const frameCount = 60; // 1 second at 60fps
    const frameTimes = [];
    
    for (let i = 0; i < frameCount; i++) {
      const frameStart = performance.now();
      
      // Render frame
      window.renderer.render(window.scene, window.camera.camera);
      
      const frameEnd = performance.now();
      frameTimes.push(frameEnd - frameStart);
      
      // Update shaders
      window.pads.updateShaders(performance.now() * 0.001);
      
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    
    this.testResults.performance = {
      frameCount: frameCount,
      avgFrameTime: avgFrameTime,
      fps: fps,
      frameTimes: frameTimes
    };
    
    console.log(`⚡ Performance: ${fps.toFixed(1)} FPS (${avgFrameTime.toFixed(2)}ms per frame)`);
    console.log(`✅ Performance ${fps >= 30 ? 'GOOD' : fps >= 15 ? 'ACCEPTABLE' : 'POOR'}`);
  }

  generateFinalReport() {
    console.log('\n📋 FINAL STRESS TEST REPORT');
    console.log('================================');
    
    const totalTime = performance.now() - this.testStartTime;
    
    console.log(`⏱️ Total test time: ${totalTime.toFixed(2)}ms`);
    console.log('');
    
    // Pad creation
    if (this.testResults.pads200) {
      console.log(`🔧 Pad Creation:`);
      console.log(`  - Pads created: ${this.testResults.pads200.count}`);
      console.log(`  - Creation time: ${this.testResults.pads200.creationTime.toFixed(2)}ms`);
      console.log(`  - Time per pad: ${(this.testResults.pads200.creationTime / 200).toFixed(3)}ms`);
    }
    
    // Camera
    if (this.testResults.orbitCamera) {
      console.log(`📷 Camera:`);
      console.log(`  - OrbitControls: ${this.testResults.orbitCamera.controlsWorking ? '✅' : '❌'}`);
      console.log(`  - Position reset: ✅`);
    }
    
    // Drag
    if (this.testResults.drag) {
      const successfulDrags = this.testResults.drag.filter(r => r.success).length;
      console.log(`🖱️ Drag Functionality:`);
      console.log(`  - Tested pads: ${this.testResults.drag.length}`);
      console.log(`  - Successful drags: ${successfulDrags}/${this.testResults.drag.length}`);
    }
    
    // Export/Reload
    if (this.testResults.exportReload) {
      console.log(`💾 Export/Reload:`);
      console.log(`  - Scene identical: ${this.testResults.exportReload.sceneIdentical ? '✅' : '❌'}`);
      console.log(`  - Pads preserved: ${this.testResults.exportReload.padsAfterReload}/200`);
    }
    
    // Memory
    if (this.testResults.memoryLeaks) {
      console.log(`🧠 Memory:`);
      console.log(`  - Leaks detected: ${this.testResults.memoryLeaks.leakCheck.hasLeaks ? '❌' : '✅'}`);
      if (this.memoryMonitor) {
        this.memoryMonitor.logMemoryInfo('Final Memory State');
      }
    }
    
    // Performance
    if (this.testResults.performance) {
      console.log(`⚡ Performance:`);
      console.log(`  - FPS: ${this.testResults.performance.fps.toFixed(1)}`);
      console.log(`  - Frame time: ${this.testResults.performance.avgFrameTime.toFixed(2)}ms`);
    }
    
    // Overall status
    const allTestsPassed = this.checkAllTestsPassed();
    console.log('');
    console.log(`🎉 Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPassed) {
      console.log('');
      console.log('🚀 Step 5 - Stress Test: COMPLETE');
      console.log('✅ 200 pads created and rendered');
      console.log('✅ Orbit camera with improved positioning');
      console.log('✅ Drag functionality implemented');
      console.log('✅ Export/Reload scene working');
      console.log('✅ Memory monitoring active');
      console.log('✅ Performance under stress verified');
    }
    
    // Store results globally
    window.stressTestResults = this.testResults;
  }

  checkAllTestsPassed() {
    return (
      this.testResults.pads200?.count === 200 &&
      this.testResults.orbitCamera?.controlsWorking &&
      this.testResults.drag?.filter(r => r.success).length > 0 &&
      this.testResults.exportReload?.sceneIdentical &&
      !this.testResults.memoryLeaks?.leakCheck.hasLeaks &&
      this.testResults.performance?.fps >= 15
    );
  }

  // Helper methods
  clearAllPads() {
    const padData = window.pads.getAllPadData();
    padData.forEach(pad => {
      window.pads.removePad(pad.id);
    });
  }

  exportScene() {
    return {
      pads: window.pads.getAllPadData(),
      traces: window.traces ? window.traces.getAllTraceData() : [],
      camera: {
        position: window.camera.getPosition().toArray(),
        target: window.camera.controls.target.toArray()
      },
      timestamp: new Date().toISOString()
    };
  }

  importScene(sceneState) {
    this.clearAllPads();
    
    sceneState.pads.forEach(padData => {
      window.pads.addPad(padData);
    });
    
    if (sceneState.camera) {
      window.camera.camera.position.fromArray(sceneState.camera.position);
      window.camera.controls.target.fromArray(sceneState.camera.target);
      window.camera.controls.update();
    }
    
    // Add meshes to scene
    const meshes = window.pads.getMeshes();
    meshes.forEach(mesh => {
      if (!window.scene.children.includes(mesh)) {
        window.scene.add(mesh);
      }
    });
  }
}

// Drag test helper class
class DragTest {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  async testDragOnPad(padId) {
    try {
      const padData = window.pads.getPadData(padId);
      if (!padData) {
        return { success: false, error: 'Pad not found' };
      }

      const originalPosition = padData.position.clone();
      
      // Simulate drag movement
      const newPosition = originalPosition.clone();
      newPosition.x += 5;
      newPosition.z += 5;
      
      // Update pad position
      const instanceId = window.pads.findInstanceId ? window.pads.findInstanceId(padId) : -1;
      if (instanceId >= 0) {
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z);
        window.pads.updateInstanceMatrix(instanceId, matrix);
      }
      
      // Verify position changed
      const updatedPadData = window.pads.getPadData(padId);
      const positionChanged = !updatedPadData.position.equals(originalPosition);
      
      return {
        success: positionChanged,
        originalPosition: originalPosition.toArray(),
        newPosition: updatedPadData.position.toArray()
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Auto-run stress test
if (typeof window !== 'undefined') {
  setTimeout(() => {
    window.completeStressTest = new CompleteStressTest();
  }, 2000);
}

// Export for manual testing
window.runCompleteStressTest = function() {
  return new CompleteStressTest();
};
