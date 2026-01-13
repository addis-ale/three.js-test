import * as THREE from 'three';

/**
 * Instanced Hover Shader
 * 
 * Enhanced copper shader with per-instance hover detection support
 * Uses instance ID to determine which pad is being hovered
 */
export class InstancedHoverShader {
  /**
   * Create material with per-instance hover support
   */
  public static createMaterial(options?: {
    baseColor?: THREE.Color;
    edgeColor?: THREE.Color;
    edgeWidth?: number;
  }): THREE.ShaderMaterial {
    const baseColor = options?.baseColor || new THREE.Color(0xb87333); // Copper
    const edgeColor = options?.edgeColor || new THREE.Color(0x000000); // Black
    const edgeWidth = options?.edgeWidth || 1.5;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uHovered: { value: false },
        uSelected: { value: false },
        uHoveredInstanceId: { value: -1 }, // NEW: Track specific hovered instance
        uBaseColor: { value: baseColor },
        uEdgeColor: { value: edgeColor },
        uEdgeWidth: { value: edgeWidth }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      side: THREE.DoubleSide,
      transparent: false,
      depthTest: true,
      depthWrite: true
    });
  }

  /**
   * Enhanced vertex shader with instance ID
   */
  private static getVertexShader(): string {
    return `
      attribute vec3 barycentric;
      varying vec3 vBarycentric;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      varying float vInstanceId; // NEW: Pass instance ID to fragment shader

      void main() {
        vBarycentric = barycentric;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vViewPosition = -vPosition;
        vInstanceId = float(gl_InstanceID); // NEW: Get instance ID
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  /**
   * Enhanced fragment shader with per-instance hover detection
   */
  private static getFragmentShader(): string {
    return `
      uniform float uTime;
      uniform bool uHovered;
      uniform bool uSelected;
      uniform float uHoveredInstanceId;
      uniform vec3 uBaseColor;
      uniform vec3 uEdgeColor;
      uniform float uEdgeWidth;

      varying vec3 vBarycentric;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      varying float vInstanceId;

      // Procedural copper generation (same as CopperShader)
      vec3 generateCopper(vec2 uv, vec3 normal) {
        vec3 copperColor = vec3(0.72, 0.45, 0.20);
        float brush = sin(uv.x * 50.0) * 0.02 + sin(uv.y * 100.0) * 0.01;
        float roughness = fract(sin(dot(uv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 finalColor = copperColor + brush + roughness * 0.05;
        float oxidation = fract(sin(dot(uv * 200.0, vec2(93.9898, 28.233))) * 23458.5453);
        finalColor = mix(finalColor, vec3(0.6, 0.3, 0.1), oxidation * 0.1);
        return finalColor;
      }

      // Edge detection using barycentric coordinates
      float edgeFactor() {
        vec3 bary = vBarycentric;
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(vec3(0.0), d * uEdgeWidth, bary);
        return min(min(a3.x, a3.y), a3.z);
      }

      // NEW: Check if this instance is being hovered
      bool isInstanceHovered() {
        return uHovered && (abs(vInstanceId - uHoveredInstanceId) < 0.5);
      }

      void main() {
        // Generate procedural copper base
        vec3 copperColor = generateCopper(vPosition.xy, vNormal);
        
        // Apply base color tint
        vec3 baseColor = mix(copperColor, uBaseColor, 0.5);
        
        // Calculate lighting
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(vNormal, lightDir), 0.0);
        vec3 diffuse = diff * baseColor;
        vec3 ambient = 0.3 * baseColor;
        vec3 color = ambient + diffuse;
        
        // Edge rendering
        float edge = edgeFactor();
        color = mix(color, uEdgeColor, edge * 0.3);
        
        // NEW: Per-instance hover effect
        if (isInstanceHovered()) {
          float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
          color += vec3(0.2, 0.4, 0.8) * pulse * 0.5;
        }
        
        // Selection effect (global for now)
        if (uSelected) {
          color += vec3(0.3, 0.6, 1.0) * 0.4;
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  /**
   * Update material uniforms
   */
  public static updateMaterial(material: THREE.ShaderMaterial, time: number): void {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = time;
    }
  }

  /**
   * Set global hover state
   */
  public static setHovered(material: THREE.ShaderMaterial, hovered: boolean): void {
    if (material.uniforms.uHovered) {
      material.uniforms.uHovered.value = hovered;
    }
  }

  /**
   * Set specific hovered instance ID
   */
  public static setHoveredInstanceId(material: THREE.ShaderMaterial, instanceId: number): void {
    if (material.uniforms.uHoveredInstanceId) {
      material.uniforms.uHoveredInstanceId.value = instanceId;
    }
  }

  /**
   * Clear hover state
   */
  public static clearHover(material: THREE.ShaderMaterial): void {
    if (material.uniforms.uHovered) {
      material.uniforms.uHovered.value = false;
    }
    if (material.uniforms.uHoveredInstanceId) {
      material.uniforms.uHoveredInstanceId.value = -1;
    }
  }

  /**
   * Set selection state
   */
  public static setSelected(material: THREE.ShaderMaterial, selected: boolean): void {
    if (material.uniforms.uSelected) {
      material.uniforms.uSelected.value = selected;
    }
  }

  /**
   * Set base color
   */
  public static setBaseColor(material: THREE.ShaderMaterial, color: THREE.Color): void {
    if (material.uniforms.uBaseColor) {
      material.uniforms.uBaseColor.value = color;
    }
  }

  /**
   * Set edge properties
   */
  public static setEdgeColor(material: THREE.ShaderMaterial, color: THREE.Color): void {
    if (material.uniforms.uEdgeColor) {
      material.uniforms.uEdgeColor.value = color;
    }
  }

  public static setEdgeWidth(material: THREE.ShaderMaterial, width: number): void {
    if (material.uniforms.uEdgeWidth) {
      material.uniforms.uEdgeWidth.value = width;
    }
  }
}
