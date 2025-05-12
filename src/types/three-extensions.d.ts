
// Definiciones de tipo para las extensiones de Three.js

// Extensiones para el objeto THREE global
declare namespace THREE {
  // Añadir OrbitControls al namespace THREE
  class OrbitControls {
    constructor(camera: THREE.Camera, domElement: HTMLElement);
    target: THREE.Vector3;
    update(): void;
    enableDamping: boolean;
    dampingFactor: number;
    maxDistance: number;
    minDistance: number;
    dispose(): void;
  }
}
