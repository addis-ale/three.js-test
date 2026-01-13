import * as THREE from 'three';

/**
 * Edge shader for PCB pad outlines
 * Renders clean edges with hover/selection reactivity
 */
export class EdgeShader {
  public static createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uHovered: { value: false },
        uSelected: { value: false },
        uEdgeColor: { value: new THREE.Color(0x000000) }, // Black edges
        uEdgeWidth: { value: 1.0 },
        uOpacity: { value: 1.0 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      depthWrite: false, // Don't write depth to avoid Z-fighting
      polygonOffset: true,
      polygonOffsetFactor: -1, // Slight offset to appear on top
      polygonOffsetUnits: -1
    });
  }

  private static getVertexShader(): string {
    return `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vViewPosition = -vPosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private static getFragmentShader(): string {
    return `
      uniform float uTime;
      uniform bool uHovered;
      uniform bool uSelected;
      uniform vec3 uEdgeColor;
      uniform float uEdgeWidth;
      uniform float uOpacity;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;

      // Barycentric coordinates for edge detection
      vec3 barycentric = vec3(1.0, 0.0, 0.0);
      
      // Edge detection using UV coordinates
      float edgeFactor() {
        vec2 edge = vec2(
          min(vUv.x, 1.0 - vUv.x),
          min(vUv.y, 1.0 - vUv.y)
        );
        return min(edge.x, edge.y);
      }

      // Smooth edge function
      float smoothEdge(float edge, float width) {
        return smoothstep(0.0, width, edge);
      }

      void main() {
        // Calculate edge factor
        float edge = edgeFactor();
        float smoothEdge = smoothEdge(edge, uEdgeWidth * 0.01);
        
        // Base edge color
        vec3 edgeColor = uEdgeColor;
        
        // Hover effect - animated glow
        if (uHovered) {
          float pulse = sin(uTime * 4.0) * 0.3 + 0.7;
          edgeColor = mix(edgeColor, vec3(0.2, 0.6, 1.0), pulse * 0.5);
        }
        
        // Selection effect - persistent highlight
        if (uSelected) {
          edgeColor = mix(edgeColor, vec3(0.0, 0.4, 0.8), 0.8);
        }
        
        // Final color with edge detection
        vec3 finalColor = mix(vec3(0.0), edgeColor, smoothEdge);
        
        gl_FragColor = vec4(finalColor, uOpacity * smoothEdge);
      }
    `;
  }

  /**
   * Update shader uniforms for animation and interaction
   */
  public static updateMaterial(material: THREE.ShaderMaterial, time: number): void {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = time;
    }
  }

  /**
   * Set hover state on material
   */
  public static setHovered(material: THREE.ShaderMaterial, hovered: boolean): void {
    if (material.uniforms.uHovered) {
      material.uniforms.uHovered.value = hovered;
    }
  }

  /**
   * Set selection state on material
   */
  public static setSelected(material: THREE.ShaderMaterial, selected: boolean): void {
    if (material.uniforms.uSelected) {
      material.uniforms.uSelected.value = selected;
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
   * Set edge opacity
   */
  public static setOpacity(material: THREE.ShaderMaterial, opacity: number): void {
    if (material.uniforms.uOpacity) {
      material.uniforms.uOpacity.value = opacity;
    }
  }
}
