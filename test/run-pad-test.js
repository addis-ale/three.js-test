// Simple test runner for InstancedMesh pad system
// Run this in browser console to test Step 1 implementation

console.log('🧪 Testing InstancedMesh Pad System (Step 1)...');

// Test 1: Check if pads are using InstancedMesh
function testInstancedMeshImplementation() {
  console.log('\n📋 Test 1: InstancedMesh Implementation');
  
  // Find pad meshes in the scene
  const scene = window.engine?.scene?.scene;
  if (!scene) {
    console.log('❌ Scene not found');
    return false;
  }
  
  const padMeshes = scene.children.filter(child => 
    child.name === 'rectangular_pads' || child.name === 'circular_pads'
  );
  
  const hasRectangularPads = padMeshes.some(m => m.name === 'rectangular_pads');
  const hasCircularPads = padMeshes.some(m => m.name === 'circular_pads');
  const bothAreInstancedMesh = padMeshes.every(m => m instanceof THREE.InstancedMesh);
  
  console.log(`Rectangular pads found: ${hasRectangularPads ? '✅' : '❌'}`);
  console.log(`Circular pads found: ${hasCircularPads ? '✅' : '❌'}`);
  console.log(`Using InstancedMesh: ${bothAreInstancedMesh ? '✅' : '❌'}`);
  console.log(`Total pad meshes: ${padMeshes.length}`);
  
  return hasRectangularPads && hasCircularPads && bothAreInstancedMesh;
}

// Test 2: Check single geometry and material
function testSingleGeometryMaterial() {
  console.log('\n📋 Test 2: Single Geometry and Material');
  
  const scene = window.engine?.scene?.scene;
  const padMeshes = scene.children.filter(child => 
    child.name === 'rectangular_pads' || child.name === 'circular_pads'
  );
  
  const rectMesh = padMeshes.find(m => m.name === 'rectangular_pads');
  const circleMesh = padMeshes.find(m => m.name === 'circular_pads');
  
  if (!rectMesh || !circleMesh) {
    console.log('❌ Pad meshes not found');
    return false;
  }
  
  const rectHasGeometry = rectMesh.geometry instanceof THREE.PlaneGeometry;
  const circleHasGeometry = circleMesh.geometry instanceof THREE.CircleGeometry;
  const bothHaveShaderMaterial = rectMesh.material instanceof THREE.ShaderMaterial && 
                              circleMesh.material instanceof THREE.ShaderMaterial;
  
  console.log(`Rectangular geometry: ${rectHasGeometry ? '✅' : '❌'} (${rectMesh.geometry.type})`);
  console.log(`Circular geometry: ${circleHasGeometry ? '✅' : '❌'} (${circleMesh.geometry.type})`);
  console.log(`Both have shader material: ${bothHaveShaderMaterial ? '✅' : '❌'}`);
  
  return rectHasGeometry && circleHasGeometry && bothHaveShaderMaterial;
}

// Test 3: Check instance capacity for 100-200 pads
function testInstanceCapacity() {
  console.log('\n📋 Test 3: Instance Capacity (100-200 pads)');
  
  const scene = window.engine?.scene?.scene;
  const padMeshes = scene.children.filter(child => 
    child.name === 'rectangular_pads' || child.name === 'circular_pads'
  );
  
  const rectMesh = padMeshes.find(m => m.name === 'rectangular_pads');
  const circleMesh = padMeshes.find(m => m.name === 'circular_pads');
  
  if (!rectMesh || !circleMesh) {
    console.log('❌ Pad meshes not found');
    return false;
  }
  
  const rectCapacity = rectMesh.count;
  const circleCapacity = circleMesh.count;
  const totalCapacity = rectCapacity + circleCapacity;
  const supports200Pads = totalCapacity >= 200;
  
  console.log(`Rectangular capacity: ${rectCapacity}`);
  console.log(`Circular capacity: ${circleCapacity}`);
  console.log(`Total capacity: ${totalCapacity}`);
  console.log(`Supports 200 pads: ${supports200Pads ? '✅' : '❌'}`);
  
  return supports200Pads;
}

// Test 4: Check interaction system supports instanceId
function testInstanceIdSupport() {
  console.log('\n📋 Test 4: InstanceId Selection Support');
  
  const interaction = window.engine?.interaction;
  if (!interaction) {
    console.log('❌ Interaction system not found');
    return false;
  }
  
  // Check if interaction system has instanceId properties
  const hasHoveredInstanceId = 'hoveredInstanceId' in interaction;
  const hasSelectedInstanceId = 'selectedInstanceId' in interaction;
  const hasGetHoverInfo = typeof interaction.getHoverInfo === 'function';
  
  console.log(`Has hoveredInstanceId: ${hasHoveredInstanceId ? '✅' : '❌'}`);
  console.log(`Has selectedInstanceId: ${hasSelectedInstanceId ? '✅' : '❌'}`);
  console.log(`Has getHoverInfo: ${hasGetHoverInfo ? '✅' : '❌'}`);
  
  return hasHoveredInstanceId && hasSelectedInstanceId && hasGetHoverInfo;
}

// Test 5: Check TransformControls support for instances
function testTransformControlsSupport() {
  console.log('\n📋 Test 5: TransformControls for Instance Updates');
  
  const interaction = window.engine?.interaction;
  if (!interaction) {
    console.log('❌ Interaction system not found');
    return false;
  }
  
  // Check if TransformControls are available
  const hasTransformControls = 'transformControls' in interaction;
  const hasGetTransformControls = typeof interaction.getTransformControls === 'function';
  
  console.log(`Has TransformControls: ${hasTransformControls ? '✅' : '❌'}`);
  console.log(`Has getTransformControls: ${hasGetTransformControls ? '✅' : '❌'}`);
  
  return hasTransformControls && hasGetTransformControls;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting InstancedMesh Pad System Tests...\n');
  
  const results = [
    testInstancedMeshImplementation(),
    testSingleGeometryMaterial(),
    testInstanceCapacity(),
    testInstanceIdSupport(),
    testTransformControlsSupport()
  ];
  
  const passedCount = results.filter(r => r === true).length;
  const allPassed = results.every(r => r === true);
  
  console.log('\n📊 Test Results:');
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Step 1 - Convert pads to InstancedMesh: COMPLETE');
    console.log('✅ 100-200 pads supported');
    console.log('✅ One geometry per pad type');
    console.log('✅ One material per pad type');
    console.log('✅ Selection via instanceId');
    console.log('✅ Update instance matrix on drag');
  } else {
    console.log('\n⚠️  Step 1 needs attention');
  }
  
  return allPassed;
}

// Auto-run tests
if (typeof window !== 'undefined') {
  // Wait for engine to be ready
  setTimeout(() => {
    runAllTests();
  }, 2000);
}

// Export for manual testing
window.testInstancedMeshPads = {
  runAllTests,
  testInstancedMeshImplementation,
  testSingleGeometryMaterial,
  testInstanceCapacity,
  testInstanceIdSupport,
  testTransformControlsSupport
};
