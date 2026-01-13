import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Pad Information Sidebar Component
 * 
 * Displays live pad information during selection and manipulation
 * Updates in real-time during TransformControls drag operations
 */
interface PadInfo {
  worldPosition: THREE.Vector3;
  surfaceArea: number;
  padId: string;
  instanceId: number;
  isSelected: boolean;
}

interface PadInfoSidebarProps {
  interaction: {
    getSelectedObject: () => THREE.Object3D | null;
    getHoverInfo: () => { object: THREE.Object3D | null; instanceId: number | null };
    getTransformControls: () => { object: { matrix: THREE.Matrix4 }; addEventListener: (event: string, callback: () => void) => void; removeEventListener: (event: string, callback: () => void) => void } | null;
  };
  smdPadManager: {
    getInstancedMesh: () => THREE.InstancedMesh | null;
    getAllPads: () => Array<{ id: string; size: THREE.Vector2; type: 'rect' | 'circle' }>;
  };
}

export const PadInfoSidebar: React.FC<PadInfoSidebarProps> = ({ interaction, smdPadManager }) => {
  const [padInfo, setPadInfo] = useState<PadInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const updateIntervalRef = useRef<number | null>(null);
  const previousTransformRef = useRef<THREE.Matrix4 | null>(null);

  /**
   * Calculate surface area for different pad types
   */
  const calculateSurfaceArea = (padData: { size: THREE.Vector2; type: 'rect' | 'circle' } | null): number => {
    if (!padData) return 0;
    
    const { size, type } = padData;
    
    if (type === 'rect') {
      // Rectangle: width × height
      return size.x * size.y;
    } else if (type === 'circle') {
      // Circle: π × r²
      const radius = size.x / 2; // Assuming size.x is diameter
      return Math.PI * radius * radius;
    }
    
    return 0;
  };

  /**
   * Get world position of a specific pad instance
   */
  const getInstanceWorldPosition = (instanceId: number): THREE.Vector3 => {
    const instancedMesh = smdPadManager.getInstancedMesh();
    if (!instancedMesh) return new THREE.Vector3();

    const matrix = new THREE.Matrix4();
    instancedMesh.getMatrixAt(instanceId, matrix);
    
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    matrix.decompose(position, rotation, scale);
    
    return position;
  };

  /**
   * Update pad information from current selection
   */
  const updatePadInfo = () => {
    const selectedObject = interaction.getSelectedObject();
    const hoverInfo = interaction.getHoverInfo();
    
    if (selectedObject && hoverInfo.instanceId !== null) {
      // Get pad data for this instance
      const allPads = smdPadManager.getAllPads();
      const padIndex = hoverInfo.instanceId;
      
      if (padIndex < allPads.length) {
        const padData = allPads[padIndex];
        const worldPosition = getInstanceWorldPosition(padIndex);
        const surfaceArea = calculateSurfaceArea(padData);
        
        setPadInfo({
          worldPosition,
          surfaceArea,
          padId: padData.id,
          instanceId: padIndex,
          isSelected: true
        });
      }
    } else {
      setPadInfo(null);
    }
  };

  /**
   * Check if TransformControls are being dragged
   */
  const checkDraggingState = () => {
    const transformControls = interaction.getTransformControls();
    if (transformControls) {
      // Check if the transform has changed (indicating active dragging)
      const currentTransform = transformControls.object.matrix.clone();
      
      if (previousTransformRef.current) {
        const isDragging = !currentTransform.equals(previousTransformRef.current);
        setIsDragging(isDragging);
      }
      
      previousTransformRef.current = currentTransform;
    } else {
      setIsDragging(false);
      previousTransformRef.current = null;
    }
  };

  /**
   * Start live updates during dragging
   */
  const startLiveUpdates = () => {
    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Update every 16ms (60fps) during dragging
    updateIntervalRef.current = window.setInterval(() => {
      updatePadInfo();
      checkDraggingState();
    }, 16);
  };

  /**
   * Stop live updates
   */
  const stopLiveUpdates = () => {
    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setIsDragging(false);
  };

  /**
   * Handle TransformControls events
   */
  const setupTransformControlsEvents = () => {
    const transformControls = interaction.getTransformControls();
    if (!transformControls) return;

    // Start live updates when dragging begins
    const onMouseDown = () => {
      startLiveUpdates();
    };

    // Continue updates during dragging
    const onChange = () => {
      if (isDragging) {
        updatePadInfo();
      }
    };

    // Stop updates when dragging ends
    const onMouseUp = () => {
      stopLiveUpdates();
      updatePadInfo(); // Final update
    };

    // Add event listeners
    transformControls.addEventListener('mouseDown', onMouseDown);
    transformControls.addEventListener('change', onChange);
    transformControls.addEventListener('mouseUp', onMouseUp);

    // Cleanup function
    return () => {
      transformControls.removeEventListener('mouseDown', onMouseDown);
      transformControls.removeEventListener('change', onChange);
      transformControls.removeEventListener('mouseUp', onMouseUp);
    };
  };

  /**
   * Update when selection changes
   */
  useEffect(() => {
    const handleSelectionChange = () => {
      updatePadInfo();
      setupTransformControlsEvents();
    };

    // Initial update
    handleSelectionChange();

    // Listen for selection changes
    // This would require adding a custom event to the Interaction class
    // For now, we'll use a polling approach as a fallback
    
    const selectionCheckInterval = window.setInterval(() => {
      const currentSelected = interaction.getSelectedObject();
      const currentPadInfo = padInfo;
      
      // Check if selection has changed
      if ((currentSelected && !currentPadInfo) || 
          (!currentSelected && currentPadInfo) ||
          (currentSelected && currentPadInfo && currentSelected !== currentPadInfo.padId)) {
        updatePadInfo();
      }
    }, 100); // Check every 100ms for selection changes

    return () => {
      clearInterval(selectionCheckInterval);
      stopLiveUpdates();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interaction, smdPadManager]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopLiveUpdates();
    };
  }, []);

  /**
   * Format position display
   */
  const formatPosition = (position: THREE.Vector3): string => {
    return `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;
  };

  /**
   * Format area display
   */
  const formatArea = (area: number): string => {
    return `${area.toFixed(3)} mm²`;
  };

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: 20,
      borderRadius: 8,
      minWidth: 280,
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#4CAF50' }}>
        Pad Information
      </h3>
      
      {padInfo ? (
        <div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>
              PAD ID
            </div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>
              {padInfo.padId}
            </div>
          </div>
          
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>
              INSTANCE ID
            </div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>
              {padInfo.instanceId}
            </div>
          </div>
          
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>
              WORLD POSITION
            </div>
            <div style={{ 
              color: isDragging ? '#4CAF50' : '#fff', 
              fontWeight: isDragging ? 'bold' : 'normal',
              transition: 'color 0.2s ease'
            }}>
              {formatPosition(padInfo.worldPosition)}
            </div>
          </div>
          
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>
              SURFACE AREA
            </div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>
              {formatArea(padInfo.surfaceArea)}
            </div>
          </div>
          
          <div style={{ marginTop: 15, padding: '10px 0', borderTop: '1px solid #444' }}>
            <div style={{ 
              color: isDragging ? '#4CAF50' : '#888', 
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isDragging ? '#4CAF50' : '#888',
                marginRight: 8
              }} />
              {isDragging ? 'DRAGGING' : 'SELECTED'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: '#888', fontSize: '12px' }}>
          <div>No pad selected</div>
          <div style={{ marginTop: 5 }}>Click on a pad to view details</div>
        </div>
      )}
    </div>
  );
};
