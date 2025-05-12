
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { useToast } from '@/components/ui/use-toast';

interface ThreeJsViewerProps {
  fileUrl?: string;
  fileName?: string;
  showStats?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
}

// Componente principal que configura el Canvas de React Three Fiber
export const ThreeJsViewer: React.FC<ThreeJsViewerProps> = ({
  fileUrl,
  fileName,
  showStats = false,
  showAxes = true,
  showGrid = true,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        style={{ background: '#222222' }}
      >
        {/* Elementos comunes de la escena */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <hemisphereLight args={[0xffffff, 0x8888ff, 0.5]} />
        
        {/* Componente que maneja el modelo IFC */}
        <IFCModel fileUrl={fileUrl} setLoading={setLoading} setError={setError} />
        
        {/* Grid y ejes de ayuda */}
        {showGrid && <gridHelper args={[20, 20, 0x999999, 0x444444]} />}
        {showAxes && <axesHelper args={[5]} />}
        
        {/* Controles de órbita */}
        <OrbitControls 
          makeDefault 
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
        
        {/* Stats para debugging */}
        {showStats && <Stats />}
      </Canvas>
      
      {/* Overlay de carga */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="bg-card p-4 rounded-md shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-white text-center">Cargando modelo {fileName || ''}...</p>
          </div>
        </div>
      )}
      
      {/* Overlay de error */}
      {error && (
        <div className="absolute bottom-4 left-4 bg-red-900/80 text-white px-3 py-2 rounded-md max-w-xs">
          <p className="text-sm font-medium">Error: {error}</p>
          <p className="text-xs mt-1">Asegúrate de que los archivos WASM estén instalados correctamente.</p>
        </div>
      )}
    </div>
  );
};

// Componente para cargar y mostrar el modelo IFC
const IFCModel = ({ 
  fileUrl, 
  setLoading, 
  setError 
}: { 
  fileUrl?: string; 
  setLoading: (loading: boolean) => void; 
  setError: (error: string | null) => void; 
}) => {
  const modelRef = useRef<THREE.Group>(new THREE.Group());
  const { toast } = useToast();
  
  useEffect(() => {
    if (!fileUrl) return;
    
    setLoading(true);
    setError(null);
    
    // Implementamos un modelo de fallback básico
    const loadFallbackModel = () => {
      // Crear geometría básica
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4f46e5,
        wireframe: true
      });
      const cube = new THREE.Mesh(geometry, material);
      
      // Limpiar el grupo actual
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
      
      // Añadir el cubo al grupo
      modelRef.current.add(cube);
      
      setLoading(false);
      toast({
        title: "Vista previa generada",
        description: "Se ha generado una vista previa básica en lugar del modelo IFC.",
      });
    };
    
    // Simular carga de IFC
    setTimeout(() => {
      loadFallbackModel();
    }, 1000);
    
    // Limpieza
    return () => {
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
    };
  }, [fileUrl, setLoading, setError, toast]);
  
  return <primitive object={modelRef.current} />;
};

export default ThreeJsViewer;
