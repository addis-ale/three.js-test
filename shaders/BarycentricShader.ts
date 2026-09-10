import * as THREE from 'three';

/**
 * Barycentric Wireframe Shader
 * 
 * Renders clean outlines that match geometry transforms exactly
 * Uses barycentric coordinates for edge detection
 */
export class BarycentricShader {
  /**
   * Create barycentric wireframe material
   */
  public static createMaterial(options?: {
    edgeColor?: THREE.Color;
    edgeWidth?: number;
    opacity?: number;
  }): THREE.ShaderMaterial {
    const edgeColor = options?.edgeColor || new THREE.Color(0x000000); // Black edges
    const edgeWidth = options?.edgeWidth || 1.0;
    const opacity = options?.opacity || 1.0;

    return new THREE.ShaderMaterial({
      uniforms: {
        uEdgeColor: { value: edgeColor },
        uEdgeWidth: { value: edgeWidth },
        uOpacity: { value: opacity },
        uTime: { value: 0.0 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      side: THREE.DoubleSide,
      transparent: opacity < 1.0,
      depthTest: true,
      depthWrite: true
    });
  }

  /**
   * Vertex shader with barycentric coordinates
   */
  private static getVertexShader(): string {
    return `
      attribute vec3 barycentric;
      varying vec3 vBarycentric;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vBarycentric = barycentric;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  /**
   * Fragment shader for edge detection
   */
  private static getFragmentShader(): string {
    return `
      uniform vec3 uEdgeColor;
      uniform float uEdgeWidth;
      uniform float uOpacity;
      uniform float uTime;

      varying vec3 vBarycentric;
      varying vec3 vPosition;
      varying vec3 vNormal;

      // Edge detection using barycentric coordinates
      float edgeFactor() {
        vec3 bary = vBarycentric;
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(vec3(0.0), d * uEdgeWidth, bary);
        return min(min(a3.x, a3.y), a3.z);
      }

      // Animated edge width for hover effects
      float getAnimatedEdgeWidth() {
        float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
        return uEdgeWidth * (1.0 + pulse * 0.3);
      }

      void main() {
        // Calculate edge factor
        float edge = edgeFactor();
        
        // Create edge color
        vec3 edgeColor = uEdgeColor;
        
        // Add subtle animation to edges
        float animatedWidth = getAnimatedEdgeWidth();
        vec3 d = fwidth(vBarycentric);
        vec3 a3 = smoothstep(vec3(0.0), d * animatedWidth, vBarycentric);
        float animatedEdge = min(min(a3.x, a3.y), a3.z);
        
        // Final color with edge detection
        vec3 finalColor = mix(edgeColor, vec3(0.0), animatedEdge);
        
        // Apply opacity
        float alpha = (1.0 - animatedEdge) * uOpacity;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
  }

  /**
   * Update shader uniforms
   */
  public static updateMaterial(material: THREE.ShaderMaterial, time: number): void {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = time;
    }
  }

  /**
   * Set edge color
   */
  public static setEdgeColor(material: THREE.ShaderMaterial, color: THREE.Color): void {
    if (material.uniforms.uEdgeColor) {
      material.uniforms.uEdgeColor.value = color;
    }
  }

  /**
   * Set edge width
   */
  public static setEdgeWidth(material: THREE.ShaderMaterial, width: number): void {
    if (material.uniforms.uEdgeWidth) {
      material.uniforms.uEdgeWidth.value = width;
    }
  }

  /**
   * Set opacity
   */
  public static setOpacity(material: THREE.ShaderMaterial, opacity: number): void {
    if (material.uniforms.uOpacity) {
      material.uniforms.uOpacity.value = opacity;
    }
    material.transparent = opacity < 1.0;
    material.needsUpdate = true;
  }
}
