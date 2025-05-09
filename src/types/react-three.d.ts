
import * as THREE from 'three';
import { Object3DNode, extend } from '@react-three/fiber';

// Augment JSX IntrinsicElements for Three.js elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Basic Three.js elements
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      points: Object3DNode<THREE.Points, typeof THREE.Points>;
      bufferGeometry: Object3DNode<THREE.BufferGeometry, typeof THREE.BufferGeometry>;
      bufferAttribute: any;
      pointsMaterial: Object3DNode<THREE.PointsMaterial, typeof THREE.PointsMaterial>;
      boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
      meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
      
      // Lights
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      hemisphereLight: Object3DNode<THREE.HemisphereLight, typeof THREE.HemisphereLight>;
      
      // Helpers
      gridHelper: Object3DNode<THREE.GridHelper, typeof THREE.GridHelper>;
      axesHelper: Object3DNode<THREE.AxesHelper, typeof THREE.AxesHelper>;
    }
  }
}

// Make sure the compiler knows this is a module
export {};
