
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface PointCloudProps {
  url?: string;
  color?: string;
  size?: number;
  opacity?: number;
}

// Componente para visualizar nubes de puntos LAS
const PointCloudViewer: React.FC<PointCloudProps> = ({ 
  url, 
  color = '#4f46e5', 
  size = 0.03, 
  opacity = 0.8 
}) => {
  const [points, setPoints] = useState<Float32Array | null>(null);
  const [colors, setColors] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { scene } = useThree();
  const pointsRef = useRef();

  // Cuando se proporciona una URL, intentamos cargar la nube de puntos
  useEffect(() => {
    if (url) {
      setIsLoading(true);
      console.log("Intentando cargar nube de puntos desde:", url);
      
      // Para un archivo LAS real, necesitaríamos usar un parser específico
      // Como no tenemos uno implementado, simulamos la carga
      // En una implementación real, aquí se procesaría el archivo LAS
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error al cargar archivo: ${response.statusText}`);
          }
          
          console.log("Archivo recibido, procesando...");
          // Simulamos puntos para la demostración
          // En una implementación real aquí procesaríamos el archivo LAS
          setTimeout(() => {
            console.log("Generando nube de puntos simulada");
            // Generamos 50000 puntos para simular un archivo LAS
            const count = 50000;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const color = new THREE.Color();
            
            for (let i = 0; i < count; i++) {
              // Distribución en esfera para simular terreno
              const r = 5 * Math.cbrt(Math.random()); // Raíz cúbica para mejor distribución
              const theta = Math.random() * Math.PI * 2; // Ángulo horizontal
              const phi = Math.acos(2 * Math.random() - 1); // Ángulo vertical
              
              positions[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
              positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
              positions[i * 3 + 2] = r * Math.cos(phi) - 2; // z (desplazado hacia abajo)
              
              // Color basado en altura (z)
              const height = positions[i * 3 + 2];
              if (height < -3) {
                color.set('#0047AB'); // Azul para puntos bajos
              } else if (height < -2) {
                color.set('#0096FF'); // Azul claro
              } else if (height < -1) {
                color.set('#00BFFF'); // Celeste
              } else if (height < 0) {
                color.set('#40E0D0'); // Turquesa
              } else if (height < 1) {
                color.set('#90EE90'); // Verde claro
              } else if (height < 2) {
                color.set('#32CD32'); // Verde
              } else {
                color.set('#228B22'); // Verde oscuro
              }
              
              color.toArray(colors, i * 3);
            }
            
            setPoints(positions);
            setColors(colors);
            setIsLoading(false);
            console.log("Nube de puntos simulada generada con éxito");
          }, 1000);
        })
        .catch(error => {
          console.error("Error al cargar el archivo LAS:", error);
          setError(error.message);
          setIsLoading(false);
        });
    } else {
      // Si no hay URL, mostramos la nube de puntos de demostración
      console.log("No hay URL, mostrando nube de puntos de demostración");
      setPoints(null);
      setColors(null);
    }
  }, [url]);

  // Si hay un error o está cargando, mostramos un mensaje
  if (error) {
    console.error("Error en PointCloudViewer:", error);
    return <DemoPointCloud color="red" size={size} opacity={opacity} />;
  }

  if (isLoading || !url) {
    return url ? <LoadingIndicator /> : <DemoPointCloud color={color} size={size} opacity={opacity} />;
  }

  // Si tenemos puntos, los mostramos
  if (points && colors) {
    return (
      <Points ref={pointsRef}>
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

  // Si no hay datos, mostramos la nube de puntos de demostración
  return <DemoPointCloud color={color} size={size} opacity={opacity} />;
};

// Componente para la nube de puntos de demostración
const DemoPointCloud = ({ color = '#4f46e5', size = 0.03, opacity = 0.8 }: Omit<PointCloudProps, 'url'>) => {
  // Generamos una nube de puntos más detallada con 15000 puntos
  const count = 15000;
  const [hovered, setHovered] = useState(false);
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Creamos una nube de puntos con forma de terreno
      const r = Math.sqrt(Math.random()) * 5; // Distribución de raíz cuadrada para mayor densidad en el centro
      const theta = Math.random() * 2 * Math.PI;
      
      // Creamos características de terreno con ondas sinusoidales
      const baseHeight = Math.sin(r * 0.5) * Math.cos(theta * 2) * 1.5;
      const noise = (Math.random() - 0.5) * 0.5;
      const height = baseHeight + noise;
      
      positions[i * 3] = r * Math.cos(theta);      // x
      positions[i * 3 + 1] = height;                // y
      positions[i * 3 + 2] = r * Math.sin(theta);   // z
    }
    
    return positions;
  }, [count]);
  
  // Generamos colores basados en la altura para mejor visualización
  const colors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      // Obtenemos la posición Y (altura)
      const height = positions[i * 3 + 1];
      
      // Color basado en altura
      if (height < -0.5) {
        // Azul para puntos bajos
        color.set('#1e40af');
      } else if (height < 0) {
        // Verde azulado para puntos medio-bajos
        color.set('#0d9488');
      } else if (height < 0.5) {
        // Verde para puntos medios
        color.set('#16a34a');
      } else if (height < 1) {
        // Amarillo para puntos medio-altos
        color.set('#ca8a04');
      } else {
        // Rojo para puntos altos
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

// Indicador de carga para cuando estamos procesando un archivo
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
