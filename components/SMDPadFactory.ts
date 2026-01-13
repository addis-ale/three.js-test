import * as THREE from 'three';
import { SMDDPadData } from './SMDPads';

/**
 * Factory for creating sample SMD pads
 * Generates realistic pad layouts for demonstration
 */
export class SMDPadFactory {
  
  /**
   * Create a grid of rectangular SMD pads
   */
  static createRectangularGrid(
    rows: number,
    cols: number,
    spacing: number,
    padSize: THREE.Vector2,
    startPosition: THREE.Vector3,
    layer: 'top' | 'bottom'
  ): SMDDPadData[] {
    const pads: SMDDPadData[] = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startPosition.x + (col - cols / 2) * spacing;
        const z = startPosition.z + (row - rows / 2) * spacing;
        
        pads.push({
          id: `rect_pad_${row}_${col}`,
          type: 'rect',
          position: new THREE.Vector3(x, startPosition.y, z),
          size: padSize.clone(),
          rotation: 0,
          layer
        });
      }
    }
    
    return pads;
  }

  /**
   * Create a line of circular SMD pads
   */
  static createCircularLine(
    count: number,
    spacing: number,
    padDiameter: number,
    startPosition: THREE.Vector3,
    layer: 'top' | 'bottom'
  ): SMDDPadData[] {
    const pads: SMDDPadData[] = [];
    
    for (let i = 0; i < count; i++) {
      const x = startPosition.x + (i - count / 2) * spacing;
      
      pads.push({
        id: `circle_pad_${i}`,
        type: 'circle',
        position: new THREE.Vector3(x, startPosition.y, startPosition.z),
        size: new THREE.Vector2(padDiameter, padDiameter),
        rotation: 0,
        layer
      });
    }
    
    return pads;
  }

  /**
   * Create an IC package footprint (e.g., SOIC-8)
   */
  static createICFootprint(
    pinCount: number,
    pitch: number,
    padWidth: number,
    padLength: number,
    bodyWidth: number,
    layer: 'top' | 'bottom'
  ): SMDDPadData[] {
    const pads: SMDDPadData[] = [];
    const pinsPerSide = pinCount / 2;
    
    // Left side pins
    for (let i = 0; i < pinsPerSide; i++) {
      const z = (i - pinsPerSide / 2 + 0.5) * pitch;
      
      pads.push({
        id: `ic_pin_${i + 1}`,
        type: 'rect',
        position: new THREE.Vector3(-bodyWidth / 2 - padLength / 2, 0, z),
        size: new THREE.Vector2(padLength, padWidth),
        rotation: 0,
        layer
      });
    }
    
    // Right side pins
    for (let i = 0; i < pinsPerSide; i++) {
      const z = (i - pinsPerSide / 2 + 0.5) * pitch;
      const pinNumber = pinsPerSide + i + 1;
      
      pads.push({
        id: `ic_pin_${pinNumber}`,
        type: 'rect',
        position: new THREE.Vector3(bodyWidth / 2 + padLength / 2, 0, z),
        size: new THREE.Vector2(padLength, padWidth),
        rotation: 0,
        layer
      });
    }
    
    return pads;
  }

  /**
   * Create resistor/capacitor pads
   */
  static createTwoPinComponent(
    componentLength: number,
    padWidth: number,
    padLength: number,
    layer: 'top' | 'bottom'
  ): SMDDPadData[] {
    const pads: SMDDPadData[] = [];
    
    // First pad
    pads.push({
      id: 'component_pin_1',
      type: 'rect',
      position: new THREE.Vector3(-componentLength / 2 - padLength / 2, 0, 0),
      size: new THREE.Vector2(padLength, padWidth),
      rotation: 0,
      layer
    });
    
    // Second pad
    pads.push({
      id: 'component_pin_2',
      type: 'rect',
      position: new THREE.Vector3(componentLength / 2 + padLength / 2, 0, 0),
      size: new THREE.Vector2(padLength, padWidth),
      rotation: 0,
      layer
    });
    
    return pads;
  }

  /**
   * Create a mixed layout for demonstration (100+ pads)
   */
  static createDemoLayout(layer: 'top' | 'bottom'): SMDDPadData[] {
    const allPads: SMDDPadData[] = [];
    
    // 1. Large rectangular grid (40 pads)
    const rectGrid = this.createRectangularGrid(
      8, 5, 4, 
      new THREE.Vector2(2, 1.5),
      new THREE.Vector3(0, 0, 0),
      layer
    );
    allPads.push(...rectGrid);
    
    // 2. Circular test points (20 pads)
    const circleLine = this.createCircularLine(
      20, 3, 1.5,
      new THREE.Vector3(0, 0, 25),
      layer
    );
    allPads.push(...circleLine);
    
    // 3. IC footprints (32 pads total)
    const soic8 = this.createICFootprint(8, 1.27, 0.6, 1.9, 3.9, layer);
    soic8.forEach(pad => pad.position.x -= 20);
    allPads.push(...soic8);
    
    const soic8_2 = this.createICFootprint(8, 1.27, 0.6, 1.9, 3.9, layer);
    soic8_2.forEach(pad => pad.position.x += 20);
    allPads.push(...soic8_2);
    
    // 4. Multiple resistors/capacitors (16 pads)
    for (let i = 0; i < 8; i++) {
      const xPos = (i - 3.5) * 8;
      const resistorPads = this.createTwoPinComponent(3.2, 1.2, 1.6, layer);
      resistorPads.forEach(pad => pad.position.x += xPos);
      resistorPads.forEach(pad => pad.position.z -= 25);
      allPads.push(...resistorPads);
    }
    
    // 5. Additional test patterns (12 pads)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius + 40;
      
      allPads.push({
        id: `test_pad_${i}`,
        type: i % 2 === 0 ? 'rect' : 'circle',
        position: new THREE.Vector3(x, 0, z),
        size: new THREE.Vector2(2, 2),
        rotation: angle,
        layer
      });
    }
    
    return allPads;
  }

  /**
   * Create specific pad configurations for testing
   */
  static createTestPatterns(): {
    basic: SMDDPadData[];
    grid: SMDDPadData[];
    ic: SMDDPadData[];
    mixed: SMDDPadData[];
  } {
    return {
      // Basic 4 pads
      basic: [
        {
          id: 'basic_1',
          type: 'rect',
          position: new THREE.Vector3(-5, 0, 0),
          size: new THREE.Vector2(2, 1),
          rotation: 0,
          layer: 'top'
        },
        {
          id: 'basic_2',
          type: 'rect',
          position: new THREE.Vector3(5, 0, 0),
          size: new THREE.Vector2(2, 1),
          rotation: 0,
          layer: 'top'
        },
        {
          id: 'basic_3',
          type: 'circle',
          position: new THREE.Vector3(0, 0, -5),
          size: new THREE.Vector2(1.5, 1.5),
          rotation: 0,
          layer: 'top'
        },
        {
          id: 'basic_4',
          type: 'circle',
          position: new THREE.Vector3(0, 0, 5),
          size: new THREE.Vector2(1.5, 1.5),
          rotation: 0,
          layer: 'top'
        }
      ],
      
      // 5x5 grid (25 pads)
      grid: this.createRectangularGrid(
        5, 5, 3,
        new THREE.Vector2(1.5, 1.5),
        new THREE.Vector3(0, 0, 0),
        'top'
      ),
      
      // SOIC-16 IC (16 pads)
      ic: this.createICFootprint(16, 1.27, 0.6, 1.9, 3.9, 'top'),
      
      // Mixed demo (100+ pads)
      mixed: this.createDemoLayout('top')
    };
  }
}
