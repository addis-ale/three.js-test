import * as THREE from 'three';
import { ShaderManager } from '../shaders/ShaderManager';
import { CopperLayerManager } from '../engine/CopperLayerManager';
import { SMDPads, SMDDPadData } from '../components/SMDPads';

/**
 * Shader System Demonstration
 * Shows custom copper shader effects and interactions
 */
export class ShaderDemo {
  private scene: THREE.Scene;
  private copperLayerManager: CopperLayerManager;
  private shaderManager: ShaderManager;
  private smdPads: SMDPads;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.copperLayerManager = new CopperLayerManager(1.6);
    this.shaderManager = ShaderManager.getInstance();
    this.smdPads = new SMDPads(this.copperLayerManager, 100);
    
    // Add to scene
    this.scene.add(this.smdPads.instancedMesh);
  }

  /**
   * Demonstrate shader capabilities
   */
  public demonstrateShaderEffects(): void {
    console.log('=== Copper Shader Demo ===');
    
    // Create test pads for demonstration
    this.createTestPads();
    
    // Show shader information
    this.showShaderInfo();
    
    // Demonstrate interaction states
    this.demonstrateInteractions();
    
    console.log('✅ Shader demo initialized');
  }

  /**
   * Create test pads for shader demonstration
   */
  private createTestPads(): void {
    const testPads: SMDDPadData[] = [
      {
        id: 'demo_pad_default',
        type: 'rect',
        position: new THREE.Vector3(-10, 0, 0),
        size: new THREE.Vector2(3, 2),
        rotation: 0,
        layer: 'top'
      },
      {
        id: 'demo_pad_hover',
        type: 'rect',
        position: new THREE.Vector3(0, 0, 0),
        size: new THREE.Vector2(3, 2),
        rotation: 0,
        layer: 'top'
      },
      {
        id: 'demo_pad_selected',
        type: 'rect',
        position: new THREE.Vector3(10, 0, 0),
        size: new THREE.Vector2(3, 2),
        rotation: 0,
        layer: 'top'
      },
      {
        id: 'demo_pad_circle',
        type: 'circle',
        position: new THREE.Vector3(0, 0, 10),
        size: new THREE.Vector2(2, 2),
        rotation: 0,
        layer: 'top'
      }
    ];

    this.smdPads.addPads(testPads);
    console.log(`Created ${testPads.length} test pads for shader demo`);
  }

  /**
   * Display shader information
   */
  private showShaderInfo(): void {
    const material = this.smdPads.getShaderMaterial();
    
    console.log('🎨 Shader Information:');
    console.log(`  Type: ${material.type}`);
    console.log(`  Uniforms: ${Object.keys(material.uniforms).join(', ')}`);
    console.log(`  Vertex Shader: ${material.vertexShader ? '✅' : '❌'}`);
    console.log(`  Fragment Shader: ${material.fragmentShader ? '✅' : '❌'}`);
    
    // Show current uniform values
    console.log('🔧 Current Uniform Values:');
    console.log(`  uTime: ${material.uniforms.uTime.value.toFixed(2)}`);
    console.log(`  uHovered: ${material.uniforms.uHovered.value}`);
    console.log(`  uSelected: ${material.uniforms.uSelected.value}`);
    console.log(`  uBaseColor: #${material.uniforms.uBaseColor.value.getHexString()}`);
  }

  /**
   * Demonstrate interaction states
   */
  public demonstrateInteractions(): void {
    console.log('🎯 Demonstrating Interaction States...');
    
    // Set hover state on middle pad
    this.smdPads.setPadHovered('demo_pad_hover', true);
    console.log('  ✅ Hover effect applied to "demo_pad_hover"');
    
    // Set selection state on right pad
    this.smdPads.setPadSelected('demo_pad_selected', true);
    console.log('  ✅ Selection effect applied to "demo_pad_selected"');
    
    // Left pad remains in default state
    console.log('  ℹ️  "demo_pad_default" shows default copper appearance');
    
    // Show circular pad with default state
    console.log('  ℹ️  "demo_pad_circle" shows circular geometry with shader');
  }

  /**
   * Cycle through different interaction states
   */
  public cycleInteractionStates(): void {
    const states = [
      { pad: 'demo_pad_hover', hovered: true, selected: false },
      { pad: 'demo_pad_selected', hovered: false, selected: true },
      { pad: 'demo_pad_default', hovered: true, selected: true },
      { pad: 'demo_pad_circle', hovered: true, selected: false }
    ];
    
    let currentIndex = 0;
    
    const cycle = () => {
      // Clear all states first
      this.smdPads.clearInteractionStates();
      
      // Apply current state
      const state = states[currentIndex];
      this.smdPads.setPadHovered(state.pad, state.hovered);
      this.smdPads.setPadSelected(state.pad, state.selected);
      
      console.log(`🔄 State ${currentIndex + 1}/${states.length}: ${state.pad}`);
      console.log(`   Hovered: ${state.hovered}, Selected: ${state.selected}`);
      
      currentIndex = (currentIndex + 1) % states.length;
    };
    
    // Start cycling
    cycle();
    setInterval(cycle, 2000); // Change every 2 seconds
  }

  /**
   * Test base color customization
   */
  public testColorCustomization(): void {
    console.log('🎨 Testing Color Customization...');
    
    const material = this.smdPads.getShaderMaterial();
    const originalColor = material.uniforms.uBaseColor.value.clone();
    
    // Test different colors
    const colors = [
      { name: 'Gold', color: new THREE.Color(0xffd700) },
      { name: 'Silver', color: new THREE.Color(0xc0c0c0) },
      { name: 'Rose Gold', color: new THREE.Color(0xb76e79) },
      { name: 'Original Copper', color: originalColor }
    ];
    
    let colorIndex = 0;
    
    const changeColor = () => {
      const colorTest = colors[colorIndex];
      this.shaderManager.setBaseColor(material, colorTest.color);
      
      console.log(`🎨 Changed to: ${colorTest.name} (#${colorTest.color.getHexString()})`);
      
      colorIndex = (colorIndex + 1) % colors.length;
    };
    
    // Start color cycling
    changeColor();
    setInterval(changeColor, 3000); // Change every 3 seconds
  }

  /**
   * Get shader performance statistics
   */
  public getPerformanceStats(): {
    padCount: number;
    materialCount: number;
    uniformCount: number;
    shaderManagerActive: boolean;
  } {
    const material = this.smdPads.getShaderMaterial();
    
    return {
      padCount: this.smdPads.getStats().totalInstances,
      materialCount: 1, // Single material for all pads
      uniformCount: Object.keys(material.uniforms).length,
      shaderManagerActive: this.shaderManager !== null
    };
  }

  /**
   * Cleanup demo resources
   */
  public dispose(): void {
    this.scene.remove(this.smdPads.instancedMesh);
    this.smdPads.dispose();
    console.log('🗑️ Shader demo disposed');
  }
}
