
import React from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ViewerContainerProps {
  children: React.ReactNode;
}

// A container component for 3D scene setup
const ViewerContainer: React.FC<ViewerContainerProps> = ({ children }) => {
  const { camera } = useThree();
  
  React.useEffect(() => {
    // Set up camera position on mount
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return (
    <>
      {/* Common scene elements */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Grid and helper elements */}
      <gridHelper args={[20, 20, '#999999', '#444444']} />
      <axesHelper args={[5]} />
      
      {/* Reference cube */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4f46e5" wireframe />
      </mesh>
      
      {/* Viewer controls */}
      <OrbitControls makeDefault />
      
      {/* Child components (IFC models, point clouds, etc.) */}
      {children}
    </>
  );
};

export default ViewerContainer;
