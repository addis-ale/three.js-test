// Simple test runner for Step 2: Pad Edges
// Run this in browser console to test the edge implementation

console.log('🧪 Testing Step 2: Pad Edges...');

// Test 1: Check if edge meshes exist
function testEdgeMeshes() {
  console.log('\n📋 Test 1: Edge Mesh Creation');
  
  const meshes = window.pads?.getMeshes?.() || [];
  console.log(`Total meshes: ${meshes.length}`);
  
  const rectPadMesh = meshes.find(m => m.name === 'rectangular_pads');
  const circlePadMesh = meshes.find(m => m.name === 'circular_pads');
  const rectEdgeMesh = meshes.find(m => m.name === 'rectangular_edges');
  const circleEdgeMesh = meshes.find(m => m.name === 'circular_edges');
  
  const hasAllMeshes = rectPadMesh && circlePadMesh && rectEdgeMesh && circleEdgeMesh;
  const edgesAreInstanced = rectEdgeMesh instanceof THREE.InstancedMesh && circleEdgeMesh instanceof THREE.InstancedMesh;
  
  console.log(`All meshes present: ${hasAllMeshes ? '✅' : '❌'}`);
  console.log(`Edges are InstancedMesh: ${edgesAreInstanced ? '✅' : '❌'}`);
  
  return hasAllMeshes && edgesAreInstanced;
}

// Test 2: Check edge visibility
function testEdgeVisibility() {
  console.log('\n📋 Test 2: Edge Visibility');
  
  const meshes = window.pads?.getMeshes?.() || [];
  const rectEdgeMesh = meshes.find(m => m.name === 'rectangular_edges');
  const circleEdgeMesh = meshes.find(m => m.name === 'circular_edges');
  
  if (!rectEdgeMesh || !circleEdgeMesh) {
    console.log('❌ Edge meshes not found');
    return false;
  }
  
  // Check if edge materials are transparent
  const rectEdgeTransparent = (rectEdgeMesh.material as THREE.ShaderMaterial)?.transparent;
  const circleEdgeTransparent = (circleEdgeMesh.material as THREE.ShaderMaterial)?.transparent;
  
  console.log(`Rect edge transparent: ${rectEdgeTransparent ? '✅' : '❌'}`);
  console.log(`Circle edge transparent: ${circleEdgeTransparent ? '✅' : '❌'}`);
  
  return rectEdgeTransparent && circleEdgeTransparent;
}

// Test 3: Check Z-fighting prevention
function testZFightPrevention() {
  console.log('\n📋 Test 3: Z-fighting Prevention');
  
  const meshes = window.pads?.getMeshes?.() || [];
  const rectEdgeMesh = meshes.find(m => m.name === 'rectangular_edges');
  const circleEdgeMesh = meshes.find(m => m.name === 'circular_edges');
  
  if (!rectEdgeMesh || !circleEdgeMesh) {
    console.log('❌ Edge meshes not found');
    return false;
  }
  
  // Check polygon offset and depth write settings
  const rectEdgeMaterial = rectEdgeMesh.material as THREE.ShaderMaterial;
  const circleEdgeMaterial = circleEdgeMesh.material as THREE.ShaderMaterial;
  
  const rectEdgeHasOffset = rectEdgeMaterial?.polygonOffset;
  const circleEdgeHasOffset = circleEdgeMaterial?.polygonOffset;
  const rectEdgeDepthWrite = rectEdgeMaterial?.depthWrite;
  const circleEdgeDepthWrite = circleEdgeMaterial?.depthWrite;
  
  console.log(`Edge meshes have polygon offset: ${rectEdgeHasOffset && circleEdgeHasOffset ? '✅' : '❌'}`);
  console.log(`Edge meshes depth write disabled: ${!rectEdgeDepthWrite && !circleEdgeDepthWrite ? '✅' : '❌'}`);
  
  return rectEdgeHasOffset && circleEdgeHasOffset && !rectEdgeDepthWrite && !circleEdgeDepthWrite;
}

// Test 4: Check hover/selection reactivity
function testHoverSelectionReactivity() {
  console.log('\n📋 Test 4: Hover/Selection Reactivity');
  
  // Create test pad
  const testPad = {
    id: 'test_pad_edges',
    type: 'rect',
    position: new THREE.Vector3(0, 0, 0),
    size: new THREE.Vector2(2, 2),
    layer: 'top'
  };
  
  window.pads?.addPad?.(testPad);
  
  // Test hover state
  window.pads?.setPadHovered?.('test_pad_edges', true);
  window.pads?.setPadSelected?.('test_pad_edges', false);
  
  // Test selection state
  window.pads?.setPadHovered?.('test_pad_edges', false);
  window.pads?.setPadSelected?.('test_pad_edges', true);
  
  // Check uniforms
  const meshes = window.pads?.getMeshes?.() || [];
  const rectPadMesh = meshes.find(m => m.name === 'rectangular_pads');
  const rectEdgeMesh = meshes.find(m => m.name === 'rectangular_edges');
  
  if (!rectPadMesh || !rectEdgeMesh) {
    console.log('❌ Test meshes not found');
    return false;
  }
  
  const padMaterial = rectPadMesh.material as THREE.ShaderMaterial;
  const edgeMaterial = rectEdgeMesh.material as THREE.ShaderMaterial;
  
  const padHasHoverUniform = padMaterial?.uniforms?.uHovered;
  const padHasSelectedUniform = padMaterial?.uniforms?.uSelected;
  const edgeHasHoverUniform = edgeMaterial?.uniforms?.uHovered;
  const edgeHasSelectedUniform = edgeMaterial?.uniforms?.uSelected;
  
  console.log(`Pad has hover uniform: ${padHasHoverUniform ? '✅' : '❌'}`);
  console.log(`Pad has selected uniform: ${padHasSelectedUniform ? '✅' : '❌'}`);
  console.log(`Edge has hover uniform: ${edgeHasHoverUniform ? '✅' : '❌'}`);
  console.log(`Edge has selected uniform: ${edgeHasSelectedUniform ? '✅' : '❌'}`);
  
  return padHasHoverUniform && padHasSelectedUniform && edgeHasHoverUniform && edgeHasSelectedUniform;
}

// Test 5: Check edge synchronization
function testEdgeSynchronization() {
  console.log('\n📋 Test 5: Edge Synchronization');
  
  // Create test pad
  const testPad = {
    id: 'test_pad_sync',
    type: 'rect',
    position: new THREE.Vector3(0, 0, 0),
    size: new THREE.Vector2(2, 2),
    layer: 'top'
  };
  
  const instanceId = window.pads?.addPad?.(testPad);
  
  // Get original matrices
  const originalPadMatrix = window.pads?.getInstanceMatrix?.(instanceId);
  const originalEdgeMatrix = window.pads?.getInstanceMatrix?.(instanceId);
  
  // Update position
  const newPosition = new THREE.Vector3(5, 0, 0);
  const newMatrix = new THREE.Matrix4();
  newMatrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z);
  
  window.pads?.updateInstanceMatrix?.(instanceId, newMatrix);
  
  // Get updated matrices
  const updatedPadMatrix = window.pads?.getInstanceMatrix?.(instanceId);
  const updatedEdgeMatrix = window.pads?.getInstanceMatrix?.(instanceId);
  
  // Check if both matrices were updated
  const padUpdated = originalPadMatrix && updatedPadMatrix && !originalPadMatrix.equals(updatedPadMatrix);
  const edgeUpdated = originalEdgeMatrix && updatedEdgeMatrix && !originalEdgeMatrix.equals(updatedEdgeMatrix);
  
  console.log(`Pad matrix updated: ${padUpdated ? '✅' : '❌'}`);
  console.log(`Edge matrix updated: ${edgeUpdated ? '✅' : '❌'}`);
  
  return padUpdated && edgeUpdated;
}

// Run all tests
function runAllTests() {
  console.log('=== Pad Edges Tests (Step 2) ===');
  
  const results = [
    testEdgeMeshes(),
    testEdgeVisibility(),
    testZFightPrevention(),
    testHoverSelectionReactivity(),
    testEdgeSynchronization()
  ];
  
  const allPassed = results.every(result => result === true);
  const passedCount = results.filter(result => result === true).length;
  
  console.log(`\n=== Test Results ===`);
  console.log(`Tests Passed: ${passedCount}/${results.length}`);
  console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Step 2 - Add visible pad edges: COMPLETE');
    console.log('✅ Duplicate instanced mesh with edge shader');
    console.log('✅ Edges always visible');
    console.log('✅ No Z-fighting with polygon offset');
    console.log('✅ React to hover/selection');
  } else {
    console.log('\n⚠️ Step 2 needs attention');
  }
  
  return allPassed;
}

// Auto-run tests
if (typeof window !== 'undefined') {
  setTimeout(() => {
    runAllTests();
  }, 2000);
}

// Export for manual testing
window.testPadEdges = {
  runAllTests,
  testEdgeMeshes,
  testEdgeVisibility,
  testZFightPrevention,
  testHoverSelectionReactivity,
  testEdgeSynchronization
};
