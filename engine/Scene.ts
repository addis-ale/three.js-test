import * as THREE from 'three';

/**
 * Scene management for PCB visualization
 * Handles scene graph, lighting, and layer organization
 */
export class Scene {
  public scene: THREE.Scene;
  private layers: Map<string, THREE.Object3D>;

  constructor() {
    this.scene = new THREE.Scene();
    this.layers = new Map();
    this.setupLighting();
    this.createLayers();
  }

  private setupLighting(): void {
    // Ambient lighting for overall visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Primary directional light simulating overhead inspection
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);

    // Secondary fill light for copper visibility
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
  }

  private createLayers(): void {
    // Explicit PCB layer organization
    const layerNames = ['board', 'topCopper', 'bottomCopper', 'components'];
    
    layerNames.forEach(name => {
      const layer = new THREE.Object3D();
      layer.name = name;
      this.layers.set(name, layer);
      this.scene.add(layer);
    });
  }

  public addToLayer(object: THREE.Object3D, layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.add(object);
    } else {
      console.warn(`Layer "${layerName}" not found. Adding to scene directly.`);
      this.scene.add(object);
    }
  }

  public getLayer(layerName: string): THREE.Object3D | undefined {
    return this.layers.get(layerName);
  }

  public removeFromLayer(object: THREE.Object3D, layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.remove(object);
    }
  }

  /**
   * Complete scene cleanup
   * Traverses scene graph and disposes all geometries, materials, textures
   */
  public dispose(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    
    this.layers.clear();
    this.scene.clear();
  }
}
