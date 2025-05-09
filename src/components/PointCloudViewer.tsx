import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Points } from '@react-three/drei';

interface PointCloudProps {
  url?: string;
  color?: string;
  size?: number;
  opacity?: number;
  pointCount?: number;
}

// Component for visualizing point clouds with Three.js
const PointCloudViewer: React.FC<PointCloudProps> = ({ 
  url, 
  color = '#4f46e5', 
  size = 0.03, 
  opacity = 0.8,
  pointCount = 15000 
}) => {
  const [points, setPoints] = useState<Float32Array | null>(null);
  const [colors, setColors] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // When a URL is provided, try to load the point cloud
  useEffect(() => {
    if (url) {
      setIsLoading(true);
      console.log("Trying to load point cloud from:", url);
      
      // For a real LAS file, we would need to use a specific parser
      // For now, we'll simulate the loading
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error loading file: ${response.statusText}`);
          }
          
          console.log("File received, processing...");
          // Simulate points for the demonstration
          setTimeout(() => {
            console.log("Generating simulated point cloud");
            // Generate points to simulate a LAS file
            const count = 50000;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const color = new THREE.Color();
            
            for (let i = 0; i < count; i++) {
              // Distribution in sphere to simulate terrain
              const r = 5 * Math.cbrt(Math.random()); // Cubic root for better distribution
              const theta = Math.random() * Math.PI * 2; // Horizontal angle
              const phi = Math.acos(2 * Math.random() - 1); // Vertical angle
              
              positions[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
              positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
              positions[i * 3 + 2] = r * Math.cos(phi) - 2; // z (shifted down)
              
              // Color based on height (z)
              const height = positions[i * 3 + 2];
              if (height < -3) {
                color.set('#0047AB'); // Blue for low points
              } else if (height < -2) {
                color.set('#0096FF'); // Light blue
              } else if (height < -1) {
                color.set('#00BFFF'); // Sky blue
              } else if (height < 0) {
                color.set('#40E0D0'); // Turquoise
              } else if (height < 1) {
                color.set('#90EE90'); // Light green
              } else if (height < 2) {
                color.set('#32CD32'); // Green
              } else {
                color.set('#228B22'); // Dark green
              }
              
              color.toArray(colors, i * 3);
            }
            
            setPoints(positions);
            setColors(colors);
            setIsLoading(false);
            console.log("Simulated point cloud generated successfully");
          }, 1000);
        })
        .catch(error => {
          console.error("Error loading LAS file:", error);
          setError(error.message);
          setIsLoading(false);
        });
    } else {
      // If there's no URL, show the demo point cloud
      setPoints(null);
      setColors(null);
    }
  }, [url]);

  // If there's an error or it's loading, show a message
  if (error) {
    console.error("Error in PointCloudViewer:", error);
    return <DemoPointCloud color="red" size={size} opacity={opacity} pointCount={pointCount} />;
  }

  if (isLoading || !url) {
    return url ? <LoadingIndicator /> : <DemoPointCloud color={color} size={size} opacity={opacity} pointCount={pointCount} />;
  }

  // If we have points, show them
  if (points && colors) {
    return (
      <Points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length / 3}
            itemSize={3}
            array={points}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            itemSize={3}
            array={colors}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          sizeAttenuation={true}
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </Points>
    );
  }

  // If there's no data, show the demo point cloud
  return <DemoPointCloud color={color} size={size} opacity={opacity} pointCount={pointCount} />;
};

// Component for the demo point cloud
const DemoPointCloud = ({ 
  color = '#4f46e5', 
  size = 0.03, 
  opacity = 0.8,
  pointCount = 15000
}: Omit<PointCloudProps, 'url'> & { pointCount?: number }) => {
  // Generate a more detailed point cloud with 15000 points
  const count = pointCount;
  const [hovered, setHovered] = useState(false);
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Create a point cloud with terrain shape
      const r = Math.sqrt(Math.random()) * 5; // Square root distribution for higher density in center
      const theta = Math.random() * 2 * Math.PI;
      
      // Create terrain features with sinusoidal waves
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
      // Get Y position (height)
      const height = positions[i * 3 + 1];
      
      // Color based on height
      if (height < -0.5) {
        // Blue for low points
        color.set('#1e40af');
      } else if (height < 0) {
        // Blue-green for medium-low points
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

// Loading indicator for when we're processing a file
const LoadingIndicator = () => {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => r + 0.05);
    }, 16);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <mesh rotation-y={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" wireframe />
    </mesh>
  );
};

export default PointCloudViewer;
