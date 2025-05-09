
import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Stats, Text } from '@react-three/drei';
import * as THREE from 'three';

interface ViewerContainerProps {
  children: React.ReactNode;
  showStats?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
}

// An enhanced container component for 3D scene setup
const ViewerContainer: React.FC<ViewerContainerProps> = ({ 
  children, 
  showStats = false, 
  showAxes = true, 
  showGrid = true 
}) => {
  const { camera, gl, scene } = useThree();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Set up camera position on mount
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Set better rendering parameters
    gl.setClearColor(new THREE.Color(0x222222));
    gl.setPixelRatio(window.devicePixelRatio);
    
    // Mark as ready after setup
    setIsReady(true);
    
    // Return cleanup function
    return () => {
      // Clean up scene objects when unmounting
      while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
      }
    };
  }, [camera, gl, scene]);
  
  return (
    <>
      {/* Common scene elements */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <hemisphereLight args={['#ffffff', '#8888ff', 0.5]} />
      
      {/* Grid and helper elements */}
      {showGrid && <gridHelper args={[20, 20, '#999999', '#444444']} />}
      {showAxes && <axesHelper args={[5]} />}
      
      {/* Reference cube - made smaller to be less intrusive */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#4f46e5" wireframe />
      </mesh>
      
      {/* Performance stats (togglable) */}
      {showStats && <Stats />}
      
      {/* Viewer controls */}
      <OrbitControls 
        makeDefault 
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
      
      {/* Child components (IFC models, point clouds, etc.) */}
      {isReady && children}
    </>
  );
};

export default ViewerContainer;
