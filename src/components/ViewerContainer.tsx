
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { Scan } from 'lucide-react';

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
  const controlsRef = useRef<any>(null);
  
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

  // Function to frame or fit the view to all objects
  const handleFrameAll = () => {
    if (controlsRef.current) {
      // Get all visible objects in the scene
      const visibleObjects = [];
      scene.traverse((object) => {
        if ((object.type === 'Mesh' || object.type === 'Points') && object.visible) {
          visibleObjects.push(object);
        }
      });

      if (visibleObjects.length > 0) {
        // Create a bounding box that encompasses all objects
        const boundingBox = new THREE.Box3();
        for (const object of visibleObjects) {
          boundingBox.expandByObject(object);
        }

        // Calculate the center and size of the bounding box
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        // Set the target to the center of all objects
        controlsRef.current.target.copy(center);
        
        // Calculate the radius of a sphere that contains the bounding box
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const radius = Math.max(size.x, size.y, size.z) * 0.5;
        
        // Set the camera position based on the radius
        const distance = radius * 2;
        const direction = new THREE.Vector3(1, 1, 1).normalize();
        const position = center.clone().add(direction.multiplyScalar(distance));
        
        // Move the camera
        camera.position.copy(position);
        camera.lookAt(center);
        camera.updateProjectionMatrix();
        controlsRef.current.update();
      }
    }
  };
  
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
        ref={controlsRef}
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

// Create a separate component for HTML overlay outside of the Canvas component
export const HtmlOverlay = ({ onFrameAll }: { onFrameAll: () => void }) => {
  return (
    <div className="absolute top-4 left-4">
      <button 
        onClick={onFrameAll}
        className="bg-[#333333] text-white px-3 py-2 rounded hover:bg-[#444444] flex items-center gap-1 border border-[#444444]"
      >
        <span className="material-icons">center_focus_strong</span>
        Frame All
      </button>
    </div>
  );
};

export default ViewerContainer;
