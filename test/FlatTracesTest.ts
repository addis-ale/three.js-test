import * as THREE from 'three';
import { FlatTraces, TraceData } from '../components/FlatTraces';
import { CopperLayerManager } from '../engine/CopperLayerManager';

/**
 * Test suite for Flat Traces System (Phase 8)
 * Validates flat manifold geometry, real width, path following, and shader integration
 */
export class FlatTracesTest {
  private copperLayerManager: CopperLayerManager;
  private scene: THREE.Scene;

  constructor() {
    this.copperLayerManager = new CopperLayerManager(1.6);
    this.scene = new THREE.Scene();
  }

  /**
   * Test flat manifold geometry creation
   */
  public testFlatManifoldGeometry(): boolean {
    console.log('Testing flat manifold geometry creation...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 100);
      
      // Create a simple trace
      const traceData: TraceData = {
        id: 'test_flat_geometry',
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(10, 0)
        ],
        width: 1.0,
        layer: 'top'
      };
      
      const added = flatTraces.addTrace(traceData);
      const hasSegments = flatTraces.traceSegments.has(traceData.id);
      const segmentCount = flatTraces.traceSegments.get(traceData.id)?.length || 0;
      
      console.log(`Trace added: ${added ? '✅' : '❌'}`);
      console.log(`Has segments: ${hasSegments ? '✅' : '❌'}`);
      console.log(`Segment count: ${segmentCount} (expected: 1)`);
      
      // Verify geometry is flat (all vertices have y=0)
      const segments = flatTraces.traceSegments.get(traceData.id) || [];
      let allVerticesFlat = true;
      
      segments.forEach((_, index) => {
        const meshKey = `${traceData.id}_${index}`;
        const mesh = flatTraces.traceMeshes.get(meshKey);
        
        if (mesh) {
          const positions = mesh.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
            if (Math.abs(positions[i]) > 0.001) { // y coordinate
              allVerticesFlat = false;
              break;
            }
          }
        }
      });
      
      console.log(`All vertices flat: ${allVerticesFlat ? '✅' : '❌'}`);
      
      // Cleanup
      flatTraces.dispose();
      
      return added && hasSegments && segmentCount === 1 && allVerticesFlat;
    } catch (error) {
      console.error('Flat manifold geometry test failed:', error);
      return false;
    }
  }

  /**
   * Test real width implementation
   */
  public testRealWidth(): boolean {
    console.log('Testing real width implementation...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 100);
      
      // Create traces with different widths
      const widths = [0.5, 1.0, 2.0, 3.5];
      const traces: string[] = [];
      
      widths.forEach((width, index) => {
        const traceData: TraceData = {
          id: `test_width_${index}`,
          points: [
            new THREE.Vector2(index * 10, 0),
            new THREE.Vector2(index * 10 + 5, 0)
          ],
          width: width,
          layer: 'top'
        };
        
        if (flatTraces.addTrace(traceData)) {
          traces.push(traceData.id);
        }
      });
      
      // Verify each trace has the correct width
      let allWidthsCorrect = true;
      
      traces.forEach((traceId, index) => {
        const segments = flatTraces.traceSegments.get(traceId) || [];
        const expectedWidth = widths[index];
        
        segments.forEach((segment, segIndex) => {
          const meshKey = `${traceId}_${segIndex}`;
          const mesh = flatTraces.traceMeshes.get(meshKey);
          
          if (mesh) {
            const positions = mesh.geometry.attributes.position.array as Float32Array;
            
            // Check width by measuring distance between vertices
            const halfWidth = expectedWidth / 2;
            
            // Find z-coordinates (width direction)
            const zCoords = [positions[2], positions[5], positions[8], positions[11]];
            const actualHalfWidth = Math.abs(zCoords[0]);
            
            const widthCorrect = Math.abs(actualHalfWidth - halfWidth) < 0.01;
            
            if (!widthCorrect) {
              allWidthsCorrect = false;
              console.log(`Trace ${traceId} segment ${segIndex}: Expected ${expectedWidth}, got ${actualHalfWidth * 2}`);
            }
          }
        });
      });
      
      console.log(`All widths correct: ${allWidthsCorrect ? '✅' : '❌'}`);
      
      // Cleanup
      flatTraces.dispose();
      
      return allWidthsCorrect;
    } catch (error) {
      console.error('Real width test failed:', error);
      return false;
    }
  }

  /**
   * Test path following
   */
  public testPathFollowing(): boolean {
    console.log('Testing path following...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 100);
      
      // Create trace with complex path
      const traceData: TraceData = {
        id: 'test_path_following',
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(5, 5),
          new THREE.Vector2(10, 0),
          new THREE.Vector2(15, -5),
          new THREE.Vector2(20, 0)
        ],
        width: 1.0,
        layer: 'top'
      };
      
      const added = flatTraces.addTrace(traceData);
      const segments = flatTraces.traceSegments.get(traceData.id) || [];
      
      // Verify segments follow the path correctly
      let pathCorrect = true;
      
      segments.forEach((segment, index) => {
        const expectedStart = traceData.points[index];
        const expectedEnd = traceData.points[index + 1];
        
        const startDistance = segment.startPoint.distanceTo(expectedStart);
        const endDistance = segment.endPoint.distanceTo(expectedEnd);
        
        if (startDistance > 0.01 || endDistance > 0.01) {
          pathCorrect = false;
          console.log(`Segment ${index}: Start error ${startDistance.toFixed(3)}, End error ${endDistance.toFixed(3)}`);
        }
        
        // Verify segment length matches expected
        const expectedLength = expectedStart.distanceTo(expectedEnd);
        const lengthCorrect = Math.abs(segment.length - expectedLength) < 0.01;
        
        if (!lengthCorrect) {
          pathCorrect = false;
          console.log(`Segment ${index}: Length error ${Math.abs(segment.length - expectedLength).toFixed(3)}`);
        }
      });
      
      console.log(`Path following correct: ${pathCorrect ? '✅' : '❌'}`);
      console.log(`Segments created: ${segments.length} (expected: ${traceData.points.length - 1})`);
      
      // Cleanup
      flatTraces.dispose();
      
      return added && pathCorrect && segments.length === traceData.points.length - 1;
    } catch (error) {
      console.error('Path following test failed:', error);
      return false;
    }
  }

  /**
   * Test copper layer positioning
   */
  public testCopperLayerPositioning(): boolean {
    console.log('Testing copper layer positioning...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 100);
      
      // Create traces on different layers
      const topTrace: TraceData = {
        id: 'test_top_layer',
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(10, 0)
        ],
        width: 1.0,
        layer: 'top'
      };
      
      const bottomTrace: TraceData = {
        id: 'test_bottom_layer',
        points: [
          new THREE.Vector2(0, 10),
          new THREE.Vector2(10, 10)
        ],
        width: 1.0,
        layer: 'bottom'
      };
      
      const topAdded = flatTraces.addTrace(topTrace);
      const bottomAdded = flatTraces.addTrace(bottomTrace);
      
      // Verify traces are positioned correctly on copper layers
      const copperLayerManager = this.copperLayerManager;
      const topLayerZ = copperLayerManager.getLayerZ('top');
      const bottomLayerZ = copperLayerManager.getLayerZ('bottom');
      
      // Check trace mesh positions
      let positioningCorrect = true;
      
      // Check top layer trace
      const topSegments = flatTraces.traceSegments.get(topTrace.id) || [];
      topSegments.forEach((_, index) => {
        const meshKey = `${topTrace.id}_${index}`;
        const mesh = flatTraces.traceMeshes.get(meshKey);
        
        if (mesh) {
          const zPosition = mesh.position.z;
          if (Math.abs(zPosition - topLayerZ) > 0.01) {
            positioningCorrect = false;
            console.log(`Top trace z: ${zPosition.toFixed(3)}, expected: ${topLayerZ.toFixed(3)}`);
          }
        }
      });
      
      // Check bottom layer trace
      const bottomSegments = flatTraces.traceSegments.get(bottomTrace.id) || [];
      bottomSegments.forEach((_, index) => {
        const meshKey = `${bottomTrace.id}_${index}`;
        const mesh = flatTraces.traceMeshes.get(meshKey);
        
        if (mesh) {
          const zPosition = mesh.position.z;
          if (Math.abs(zPosition - bottomLayerZ) > 0.01) {
            positioningCorrect = false;
            console.log(`Bottom trace z: ${zPosition.toFixed(3)}, expected: ${bottomLayerZ.toFixed(3)}`);
          }
        }
      });
      
      console.log(`Top layer positioning: ${topAdded ? '✅' : '❌'}`);
      console.log(`Bottom layer positioning: ${bottomAdded ? '✅' : '❌'}`);
      console.log(`All positioning correct: ${positioningCorrect ? '✅' : '❌'}`);
      
      // Cleanup
      flatTraces.dispose();
      
      return topAdded && bottomAdded && positioningCorrect;
    } catch (error) {
      console.error('Copper layer positioning test failed:', error);
      return false;
    }
  }

  /**
   * Test shader integration (same as pads)
   */
  public testShaderIntegration(): boolean {
    console.log('Testing shader integration...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 100);
      
      // Create a trace
      const traceData: TraceData = {
        id: 'test_shader_integration',
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(10, 0)
        ],
        width: 1.0,
        layer: 'top'
      };
      
      flatTraces.addTrace(traceData);
      
      // Verify shader material is used
      const segments = flatTraces.traceSegments.get(traceData.id) || [];
      let allUseCorrectShader = true;
      
      segments.forEach((_, index) => {
        const meshKey = `${traceData.id}_${index}`;
        const mesh = flatTraces.traceMeshes.get(meshKey);
        
        if (mesh) {
          const isShaderMaterial = mesh.material instanceof THREE.ShaderMaterial;
          const hasUniforms = mesh.material instanceof THREE.ShaderMaterial && 
                              mesh.material.uniforms.uBaseColor && 
                              mesh.material.uniforms.uEdgeColor &&
                              mesh.material.uniforms.uHovered &&
                              mesh.material.uniforms.uSelected;
          
          if (!isShaderMaterial || !hasUniforms) {
            allUseCorrectShader = false;
            console.log(`Segment ${index}: Shader material issue`);
          }
        }
      });
      
      console.log(`All segments use correct shader: ${allUseCorrectShader ? '✅' : '❌'}`);
      
      // Test hover and selection
      const hoverWorks = flatTraces.setTraceHovered(traceData.id, true);
      const selectionWorks = flatTraces.setTraceSelected(traceData.id, true);
      
      console.log(`Hover functionality: ${hoverWorks ? '✅' : '❌'}`);
      console.log(`Selection functionality: ${selectionWorks ? '✅' : '❌'}`);
      
      // Cleanup
      flatTraces.dispose();
      
      return allUseCorrectShader && hoverWorks && selectionWorks;
    } catch (error) {
      console.error('Shader integration test failed:', error);
      return false;
    }
  }

  /**
   * Test no Line or LineSegments usage
   */
  public testNoLineSegments(): boolean {
    console.log('Testing no Line or LineSegments usage...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 100);
      
      // Create a trace
      const traceData: TraceData = {
        id: 'test_no_line_segments',
        points: [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(10, 0),
          new THREE.Vector2(10, 10),
          new THREE.Vector2(0, 10)
        ],
        width: 1.0,
        layer: 'top'
      };
      
      flatTraces.addTrace(traceData);
      
      // Verify all meshes are Mesh type, not Line or LineSegments
      const segments = flatTraces.traceSegments.get(traceData.id) || [];
      let allAreMeshes = true;
      
      segments.forEach((_, index) => {
        const meshKey = `${traceData.id}_${index}`;
        const mesh = flatTraces.traceMeshes.get(meshKey);
        
        if (mesh) {
          const isMesh = mesh instanceof THREE.Mesh;
          const isLine = mesh instanceof THREE.Line || mesh instanceof THREE.LineSegments;
          
          if (!isMesh || isLine) {
            allAreMeshes = false;
            console.log(`Segment ${index}: Type issue - Mesh: ${isMesh}, Line: ${isLine}`);
          }
          
          // Verify geometry has faces (not just lines)
          const hasFaces = mesh.geometry.index && mesh.geometry.index.count > 0;
          if (!hasFaces) {
            allAreMeshes = false;
            console.log(`Segment ${index}: No faces found`);
          }
        }
      });
      
      console.log(`All segments are proper meshes: ${allAreMeshes ? '✅' : '❌'}`);
      
      // Cleanup
      flatTraces.dispose();
      
      return allAreMeshes;
    } catch (error) {
      console.error('No LineSegments test failed:', error);
      return false;
    }
  }

  /**
   * Test performance with many traces
   */
  public testPerformanceWithManyTraces(): boolean {
    console.log('Testing performance with many traces...');
    
    try {
      const flatTraces = new FlatTraces(this.copperLayerManager, this.scene, 1000);
      
      // Create many traces
      const traces: TraceData[] = [];
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const traceData: TraceData = {
          id: `perf_trace_${i}`,
          points: [
            new THREE.Vector2(Math.random() * 40 - 20, Math.random() * 40 - 20),
            new THREE.Vector2(Math.random() * 40 - 20, Math.random() * 40 - 20),
            new THREE.Vector2(Math.random() * 40 - 20, Math.random() * 40 - 20)
          ],
          width: Math.random() * 2 + 0.5,
          layer: Math.random() > 0.5 ? 'top' : 'bottom'
        };
        
        traces.push(traceData);
      }
      
      const addTime = performance.now() - startTime;
      
      // Add all traces
      const addStartTime = performance.now();
      let addedCount = 0;
      
      traces.forEach(traceData => {
        if (flatTraces.addTrace(traceData)) {
          addedCount++;
        }
      });
      
      const actualAddTime = performance.now() - addStartTime;
      
      const stats = flatTraces.getStats();
      const performanceOk = addTime < 50 && actualAddTime < 100; // <50ms prep, <100ms add
      
      console.log(`Preparation time: ${addTime.toFixed(2)}ms: ${addTime < 50 ? '✅' : '❌'}`);
      console.log(`Add time: ${actualAddTime.toFixed(2)}ms: ${actualAddTime < 100 ? '✅' : '❌'}`);
      console.log(`Added traces: ${addedCount}/${traces.length}`);
      console.log(`Total segments: ${stats.totalSegments}`);
      console.log(`Performance acceptable: ${performanceOk ? '✅' : '❌'}`);
      
      // Cleanup
      flatTraces.dispose();
      
      return performanceOk && addedCount === traces.length;
    } catch (error) {
      console.error('Performance test failed:', error);
      return false;
    }
  }

  /**
   * Run all flat traces tests
   */
  public runAllTests(): boolean {
    console.log('=== Flat Traces Tests (Phase 8) ===');
    
    const results = [
      this.testFlatManifoldGeometry(),
      this.testRealWidth(),
      this.testPathFollowing(),
      this.testCopperLayerPositioning(),
      this.testShaderIntegration(),
      this.testNoLineSegments(),
      this.testPerformanceWithManyTraces()
    ];
    
    const allPassed = results.every(result => result === true);
    const passedCount = results.filter(result => result === true).length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
  }
}
