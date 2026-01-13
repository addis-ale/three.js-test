import * as THREE from 'three';

/**
 * Barycentric Geometry Utilities
 * 
 * Adds barycentric coordinates to geometries for edge detection
 */
export class BarycentricGeometry {
  
  /**
   * Add barycentric coordinates to a geometry
   */
  public static addBarycentricCoordinates(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    // Clone geometry to avoid modifying original
    const geo = geometry.clone();
    
    // Get position attribute
    const positions = geo.attributes.position;
    if (!positions) {
      console.warn('Geometry has no position attribute');
      return geo;
    }
    
    const count = positions.count;
    const barycentrics = new Float32Array(count * 3);
    
    // Generate barycentric coordinates based on geometry type
    if (geo.index) {
      // Indexed geometry (triangles)
      this.addIndexedBarycentrics(geo, barycentrics);
    } else {
      // Non-indexed geometry
      this.addNonIndexedBarycentrics(geo, barycentrics);
    }
    
    // Add barycentric attribute
    geo.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));
    
    return geo;
  }
  
  /**
   * Add barycentric coordinates for indexed geometry
   */
  private static addIndexedBarycentrics(geometry: THREE.BufferGeometry, barycentrics: Float32Array): void {
    const index = geometry.index!;
    const positions = geometry.attributes.position;
    const count = positions.count;
    
    // Initialize barycentric coordinates
    for (let i = 0; i < count; i++) {
      barycentrics[i * 3] = 1.0;     // Red
      barycentrics[i * 3 + 1] = 0.0; // Green  
      barycentrics[i * 3 + 2] = 0.0; // Blue
    }
    
    // Set barycentric coordinates for each triangle
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);
      
      // Vertex A: (1, 0, 0)
      barycentrics[a * 3] = 1.0;
      barycentrics[a * 3 + 1] = 0.0;
      barycentrics[a * 3 + 2] = 0.0;
      
      // Vertex B: (0, 1, 0)
      barycentrics[b * 3] = 0.0;
      barycentrics[b * 3 + 1] = 1.0;
      barycentrics[b * 3 + 2] = 0.0;
      
      // Vertex C: (0, 0, 1)
      barycentrics[c * 3] = 0.0;
      barycentrics[c * 3 + 1] = 0.0;
      barycentrics[c * 3 + 2] = 1.0;
    }
  }
  
  /**
   * Add barycentric coordinates for non-indexed geometry
   */
  private static addNonIndexedBarycentrics(geometry: THREE.BufferGeometry, barycentrics: Float32Array): void {
    const positions = geometry.attributes.position;
    const count = positions.count;
    
    // For non-indexed geometry, assume triangles
    for (let i = 0; i < count; i += 3) {
      // Vertex A: (1, 0, 0)
      barycentrics[i * 3] = 1.0;
      barycentrics[i * 3 + 1] = 0.0;
      barycentrics[i * 3 + 2] = 0.0;
      
      // Vertex B: (0, 1, 0)
      barycentrics[(i + 1) * 3] = 0.0;
      barycentrics[(i + 1) * 3 + 1] = 1.0;
      barycentrics[(i + 1) * 3 + 2] = 0.0;
      
      // Vertex C: (0, 0, 1)
      barycentrics[(i + 2) * 3] = 0.0;
      barycentrics[(i + 2) * 3 + 1] = 0.0;
      barycentrics[(i + 2) * 3 + 2] = 1.0;
    }
  }
  
  /**
   * Create barycentric plane geometry
   */
  public static createBarycentricPlane(width: number, height: number, widthSegments?: number, heightSegments?: number): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    return this.addBarycentricCoordinates(geometry) as THREE.PlaneGeometry;
  }
  
  /**
   * Create barycentric circle geometry
   */
  public static createBarycentricCircle(radius: number, segments?: number, thetaStart?: number, thetaLength?: number): THREE.CircleGeometry {
    const geometry = new THREE.CircleGeometry(radius, segments, thetaStart, thetaLength);
    return this.addBarycentricCoordinates(geometry) as THREE.CircleGeometry;
  }
  
  /**
   * Create barycentric box geometry
   */
  public static createBarycentricBox(width: number, height: number, depth: number, widthSegments?: number, heightSegments?: number, depthSegments?: number): THREE.BoxGeometry {
    const geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
    return this.addBarycentricCoordinates(geometry) as THREE.BoxGeometry;
  }
  
  /**
   * Create barycentric cylinder geometry
   */
  public static createBarycentricCylinder(radiusTop: number, radiusBottom: number, height: number, radialSegments?: number, heightSegments?: number, openEnded?: boolean, thetaStart?: number, thetaLength?: number): THREE.CylinderGeometry {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);
    return this.addBarycentricCoordinates(geometry) as THREE.CylinderGeometry;
  }
  
  /**
   * Validate barycentric coordinates
   */
  public static validateBarycentrics(geometry: THREE.BufferGeometry): boolean {
    const barycentrics = geometry.attributes.barycentric;
    if (!barycentrics) return false;
    
    const count = barycentrics.count;
    for (let i = 0; i < count; i++) {
      const x = barycentrics.getX(i);
      const y = barycentrics.getY(i);
      const z = barycentrics.getZ(i);
      
      // Check if coordinates are valid barycentric (one component should be 1, others 0)
      const isValid = (Math.abs(x - 1.0) < 0.001 && Math.abs(y) < 0.001 && Math.abs(z) < 0.001) ||
                      (Math.abs(x) < 0.001 && Math.abs(y - 1.0) < 0.001 && Math.abs(z) < 0.001) ||
                      (Math.abs(x) < 0.001 && Math.abs(y) < 0.001 && Math.abs(z - 1.0) < 0.001);
      
      if (!isValid) {
        console.warn(`Invalid barycentric coordinates at vertex ${i}: (${x}, ${y}, ${z})`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get barycentric coordinate statistics
   */
  public static getBarycentricStats(geometry: THREE.BufferGeometry): {
    hasBarycentrics: boolean;
    vertexCount: number;
    validBarycentrics: boolean;
  } {
    const barycentrics = geometry.attributes.barycentric;
    const hasBarycentrics = barycentrics !== undefined;
    const vertexCount = geometry.attributes.position?.count || 0;
    const validBarycentrics = hasBarycentrics ? this.validateBarycentrics(geometry) : false;
    
    return {
      hasBarycentrics,
      vertexCount,
      validBarycentrics
    };
  }
}
