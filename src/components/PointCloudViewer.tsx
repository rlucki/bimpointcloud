
import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface PointCloudProps {
  url?: string;
  color?: string;
  size?: number;
  opacity?: number;
}

// Simple placeholder point cloud when no file is available
const DemoPointCloud = ({ color = '#4f46e5', size = 0.03, opacity = 0.8 }: Omit<PointCloudProps, 'url'>) => {
  // Generate a demo point cloud with 5000 points
  const count = 5000;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Create a disc-like point cloud with some height variation
      const r = Math.random() * 5;
      const theta = Math.random() * 2 * Math.PI;
      const height = (Math.random() - 0.5) * 3;
      
      positions[i * 3] = r * Math.cos(theta);      // x
      positions[i * 3 + 1] = height;                // y
      positions[i * 3 + 2] = r * Math.sin(theta);   // z
    }
    
    return positions;
  }, [count]);

  return (
    <Points>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        alphaTest={0.1}
        vertexColors
      />
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          itemSize={3}
          array={positions}
        />
      </bufferGeometry>
    </Points>
  );
};

const SceneSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    // Set initial camera position for better viewing
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <gridHelper args={[20, 20, '#999999', '#444444']} position={[0, 0.01, 0]} />
      <axesHelper args={[5]} />
      {children}
    </>
  );
};

const PointCloudViewer: React.FC<PointCloudProps> = ({ url, color = '#4f46e5', size = 0.03, opacity = 0.8 }) => {
  return (
    <Canvas style={{ width: '100%', height: '100%' }}>
      <SceneSetup>
        <DemoPointCloud color={color} size={size} opacity={opacity} />
        <OrbitControls makeDefault />
      </SceneSetup>
    </Canvas>
  );
};

export default PointCloudViewer;
