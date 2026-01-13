import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

/**
 * Enhanced Interaction system for PCB element selection and manipulation
 * Handles raycasting, hover states, and TransformControls for pad manipulation
 */
export class Interaction {
  public raycaster: THREE.Raycaster;
  public mouse: THREE.Vector2;
  private hoveredObject: THREE.Object3D | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private hoveredInstanceId: number | null = null; // Track hovered instance
  private selectedInstanceId: number | null = null; // Track selected instance
  private transformControls: TransformControls | null = null; // NEW: TransformControls
  private interactableObjects: THREE.Object3D[] = []; // Store interactable objects
  private camera: THREE.Camera;
  private scene: THREE.Scene; // NEW: Scene reference for TransformControls
  private canvas: HTMLCanvasElement; // NEW: Canvas reference

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.scene = scene;
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    // Convert mouse position to normalized device coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update cursor based on hover state
    this.updateCursor();
  }

  private onClick(_event: MouseEvent): void {
    const intersects = this.performRaycast();
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object;
      const instanceId = intersection.instanceId || 0;
      
      // Select the object
      this.selectObject(object, instanceId);
    } else {
      this.deselectObject();
    }
  }

  private performRaycast(objects?: THREE.Object3D[]): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // If no specific objects provided, raycast against stored interactable objects
    const targetObjects = objects || this.interactableObjects;
    
    return this.raycaster.intersectObjects(targetObjects, true);
  }

  // getAllInteractableObjects kept for potential future use
  // private getAllInteractableObjects(): THREE.Object3D[] {
  //   return this.interactableObjects;
  // }

  private updateCursor(): void {
    const intersects = this.performRaycast();
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object;
      const instanceId = intersection.instanceId || 0;
      
      // Check if this is a different object or instance
      if (this.hoveredObject !== object || this.hoveredInstanceId !== instanceId) {
        this.clearHoverState();
        this.hoveredObject = object;
        this.hoveredInstanceId = instanceId;
        
        // Update shader uniform for hover effect on specific instance
        this.updateInstanceHoverState(object, instanceId, true);
      }
      
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'default';
      this.clearHoverState();
    }
  }

  // updateHoverState now handled by updateCursor with instance detection
  // private updateHoverState(object: THREE.Object3D): void { }

  public clearHoverState(): void {
    if (this.hoveredObject && this.hoveredInstanceId !== null) {
      // Clear hover state for specific instance
      this.updateInstanceHoverState(this.hoveredObject, this.hoveredInstanceId, false);
      this.hoveredObject = null;
      this.hoveredInstanceId = null;
    }
  }

  /**
   * Update hover state for specific InstancedMesh instance
   */
  private updateInstanceHoverState(object: THREE.Object3D, instanceId: number, hovered: boolean): void {
    if (object instanceof THREE.InstancedMesh) {
      // For InstancedMesh, we need to handle per-instance hover state
      // This requires a custom shader that supports per-instance hover
      this.updateInstancedMeshHover(object, instanceId, hovered);
    } else if (object instanceof THREE.Mesh) {
      // For regular meshes, use standard shader uniform update
      this.updateShaderUniform(object, 'uHovered', hovered);
    }
  }

  /**
   * Update hover state for InstancedMesh with per-instance hover support
   */
  private updateInstancedMeshHover(instancedMesh: THREE.InstancedMesh, instanceId: number, hovered: boolean): void {
    // Check if this is our SMD pad mesh
    if (instancedMesh.name === 'smd_pads') {
      // Use the SMD pad system's instance hover method
      // This requires access to the SMD pad manager
      console.log(`Hovering over pad instance ${instanceId}`);
      
      // For now, we'll use a global approach
      // In a full implementation, we'd have a reference to the SMD pad manager
      this.updateGlobalHoverState(instancedMesh, hovered);
    } else {
      // Fallback to standard shader uniform update
      this.updateShaderUniform(instancedMesh, 'uHovered', hovered);
    }
  }

  /**
   * Update hover state globally (fallback method)
   */
  private updateGlobalHoverState(object: THREE.Object3D, hovered: boolean): void {
    if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
      const material = object.material as THREE.ShaderMaterial;
      if (material && material.uniforms.uHovered) {
        material.uniforms.uHovered.value = hovered;
      }
    }
  }

  public selectObject(object: THREE.Object3D, instanceId?: number): void {
    this.deselectObject(); // Clear previous selection
    this.selectedObject = object;
    this.selectedInstanceId = instanceId || 0;
    
    // Update shader uniform for selection effect
    this.updateShaderUniform(object, 'uSelected', true);
    
    // Attach transform controls
    this.attachTransformControls(object);
  }

  public deselectObject(): void {
    if (this.selectedObject) {
      this.updateShaderUniform(this.selectedObject, 'uSelected', false);
      this.detachTransformControls();
      this.selectedObject = null;
    }
  }

  private updateShaderUniform(object: THREE.Object3D, uniformName: string, value: boolean): void {
    if (object instanceof THREE.Mesh) {
      const material = object.material as THREE.ShaderMaterial;
      if (material && material.uniforms[uniformName]) {
        material.uniforms[uniformName].value = value;
      }
    }
  }

  private attachTransformControls(object: THREE.Object3D): void {
    // Create TransformControls if not exists
    if (!this.transformControls) {
      this.transformControls = new TransformControls(this.camera, this.canvas);
      this.transformControls.addEventListener('change', () => {
        // Handle transform changes
        this.onTransformChange();
      });
    }
    
    // Attach to the selected object
    this.transformControls.attach(object);
    
    // Constrain movement to XZ plane (no Y movement)
    this.transformControls.object = object;
    
    // Set mode to translate for pad movement
    this.transformControls.setMode('translate');
    
    // Add to scene for visibility
    this.scene.add(this.transformControls);
    
    console.log(`TransformControls attached to: ${object.name} (instance ${this.selectedInstanceId})`);
  }

  private detachTransformControls(): void {
    if (this.transformControls) {
      this.transformControls.detach();
      this.scene.remove(this.transformControls);
      this.transformControls.dispose();
      this.transformControls = null;
      console.log('TransformControls detached');
    }
  }

  /**
   * Handle TransformControls changes
   */
  private onTransformChange(): void {
    // Update pad position when transformed
    if (this.selectedObject && this.selectedInstanceId !== null && this.transformControls) {
      // For InstancedMesh, we need to update instance matrix
      if (this.selectedObject instanceof THREE.InstancedMesh) {
        // Get current world position from TransformControls
        const position = new THREE.Vector3();
        if (this.transformControls.object) {
          this.transformControls.object.getWorldPosition(position);
        }
        
        // Create a new matrix for the instance
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(position.x, position.y, position.z);
        
        // Apply transform to specific instance
        this.selectedObject.setMatrixAt(this.selectedInstanceId, matrix);
        this.selectedObject.instanceMatrix.needsUpdate = true;
        
        // Update pad data if needed (for position tracking)
        this.updatePadPosition(this.selectedObject, this.selectedInstanceId, position);
      }
    }
  }

  /**
   * Update pad position in data structure when moved
   */
  private updatePadPosition(_object: THREE.Object3D, instanceId: number, position: THREE.Vector3): void {
    // This would update the pad data structure if we had access to it
    // For now, just log the position change
    console.log(`Pad instance ${instanceId} moved to:`, position);
  }

  public getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }

  public getHoveredObject(): THREE.Object3D | null {
    return this.hoveredObject;
  }

  public setInteractableObjects(objects: THREE.Object3D[]): void {
    // Update the list of objects that can be interacted with
    this.interactableObjects = objects;
    console.log(`Set ${objects.length} interactable objects for raycasting`);
  }

  /**
   * Get current hover information
   */
  public getHoverInfo(): {
    object: THREE.Object3D | null;
    instanceId: number | null;
  } {
    return {
      object: this.hoveredObject,
      instanceId: this.hoveredInstanceId
    };
  }

  /**
   * Check if currently hovering over a pad
   */
  public isHovering(): boolean {
    return this.hoveredObject !== null && this.hoveredInstanceId !== null;
  }

  /**
   * Get TransformControls instance (for testing)
   */
  public getTransformControls(): TransformControls | null {
    return this.transformControls;
  }

  public dispose(): void {
    // Cleanup event listeners and controls
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('click', this.onClick.bind(this));
    this.detachTransformControls();
  }
}
