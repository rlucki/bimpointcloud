
import React, { useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface PointCloudProps {
  url?: string;
  color?: string;
  size?: number;
  opacity?: number;
}

// Enhanced point cloud component with better performance and visualization
const DemoPointCloud = ({ color = '#4f46e5', size = 0.03, opacity = 0.8 }: Omit<PointCloudProps, 'url'>) => {
  // Generate a more detailed point cloud with 15000 points (increased from 5000)
  const count = 15000;
  const [hovered, setHovered] = useState(false);
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Create a more realistic terrain-like point cloud
      const r = Math.sqrt(Math.random()) * 5; // Square root distribution for more density near center
      const theta = Math.random() * 2 * Math.PI;
      
      // Create some terrain features with sine waves
      const baseHeight = Math.sin(r * 0.5) * Math.cos(theta * 2) * 1.5;
      const noise = (Math.random() - 0.5) * 0.5;
      const height = baseHeight + noise;
      
      positions[i * 3] = r * Math.cos(theta);      // x
      positions[i * 3 + 1] = height;                // y
      positions[i * 3 + 2] = r * Math.sin(theta);   // z
    }
    
    return positions;
  }, [count]);
  
  // Generate colors based on height for better visualization
  const colors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      // Get the Y position (height)
      const height = positions[i * 3 + 1];
      
      // Color based on height
      if (height < -0.5) {
        // Blue for low points
        color.set('#1e40af');
      } else if (height < 0) {
        // Teal for medium-low points
        color.set('#0d9488');
      } else if (height < 0.5) {
        // Green for medium points
        color.set('#16a34a');
      } else if (height < 1) {
        // Yellow for medium-high points
        color.set('#ca8a04');
      } else {
        // Red for high points
        color.set('#dc2626');
      }
      
      color.toArray(colors, i * 3);
    }
    
    return colors;
  }, [positions, count]);

  return (
    <Points
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          itemSize={3}
          array={positions}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          itemSize={3}
          array={colors}
        />
      </bufferGeometry>
      <pointsMaterial
        size={hovered ? size * 1.5 : size}
        sizeAttenuation={true}
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </Points>
  );
};

// Component for displaying point clouds
const PointCloudViewer: React.FC<PointCloudProps> = ({ url, color = '#4f46e5', size = 0.03, opacity = 0.8 }) => {
  return <DemoPointCloud color={color} size={size} opacity={opacity} />;
};

export default PointCloudViewer;
