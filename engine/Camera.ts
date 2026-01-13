import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Camera management optimized for PCB inspection
 * Provides realistic PCB viewing angles and zoom controls
 */
export class Camera {
  public camera: THREE.PerspectiveCamera;
  private controls!: OrbitControls;

  constructor(canvas: HTMLCanvasElement) {
    // Perspective camera optimized for PCB viewing
    this.camera = new THREE.PerspectiveCamera(
      35, // Reduced FOV for better edge visibility
      window.innerWidth / window.innerHeight,
      0.1, // Near plane for close inspection
      1000  // Far plane for large boards
    );

    // Raised position for better edge visibility
    this.camera.position.set(60, 80, 60);
    this.camera.lookAt(0, 0, 0);
    
    this.setupControls(canvas);
  }

  private setupControls(canvas: HTMLCanvasElement): void {
    this.controls = new OrbitControls(this.camera, canvas);
    
    // Configure for PCB inspection
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Tilt downward for better edge visibility
    this.controls.minPolarAngle = Math.PI * 0.1; // Minimum angle from top
    this.controls.maxPolarAngle = Math.PI * 0.7; // Maximum angle (tilted downward)
    
    // Zoom limits
    this.controls.minDistance = 20;
    this.controls.maxDistance = 200;
    
    // Pan limits (keep board in view)
    this.controls.maxPolarAngle = Math.PI * 0.8;
    this.controls.minAzimuthAngle = -Math.PI * 0.5;
    this.controls.maxAzimuthAngle = Math.PI * 0.5;
    
    // Auto-rotate for demo (optional)
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 2.0;
    
    // Target center of board
    this.controls.target.set(0, 0, 0);
    
    this.controls.update();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public update(): void {
    // Update OrbitControls
    this.controls.update();
  }

  public dispose(): void {
    // Cleanup OrbitControls
    this.controls.dispose();
  }

  /**
   * Enable/disable auto-rotation for demo
   */
  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled;
  }

  /**
   * Get current camera position for debugging
   */
  public getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  /**
   * Reset camera to default position
   */
  public reset(): void {
    this.camera.position.set(60, 80, 60);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }
}
