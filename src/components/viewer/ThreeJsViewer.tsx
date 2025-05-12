
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { IFCLoader } from 'three/examples/jsm/loaders/IFCLoader';
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
        <hemisphereLight args={['#ffffff', '#8888ff', 0.5]} />
        
        {/* Componente que maneja el modelo IFC */}
        <IFCModel fileUrl={fileUrl} setLoading={setLoading} setError={setError} />
        
        {/* Grid y ejes de ayuda */}
        {showGrid && <gridHelper args={[20, 20, '#999999', '#444444']} />}
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
    
    // Crear un loader IFC
    const ifcLoader = new IFCLoader();
    
    // Configurar la ruta de los archivos WASM
    ifcLoader.ifcManager.setWasmPath('/wasm/');
    
    // Intentar cargar el modelo IFC
    try {
      ifcLoader.load(
        fileUrl,
        (ifcModel) => {
          console.log('Modelo IFC cargado:', ifcModel);
          
          // Limpiar cualquier modelo anterior
          while (modelRef.current.children.length > 0) {
            modelRef.current.remove(modelRef.current.children[0]);
          }
          
          // Añadir el nuevo modelo al grupo
          modelRef.current.add(ifcModel);
          
          // Calcular el bounding box para centrar y escalar el modelo
          const box = new THREE.Box3().setFromObject(ifcModel);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);
          
          // Centrar el modelo si tiene coordenadas muy grandes
          if (box.min.length() > 100000 || box.max.length() > 100000) {
            console.log('Recentrando modelo con coordenadas muy grandes');
            ifcModel.position.sub(center);
          }
          
          // Escalar si el modelo está en milímetros
          if (size.length() > 10000) {
            console.log('Reescalando modelo de mm a m');
            ifcModel.scale.setScalar(0.001);
          }
          
          setLoading(false);
          toast({
            title: "Modelo cargado",
            description: "El modelo IFC se ha cargado correctamente.",
          });
        },
        // Callback de progreso
        (progress) => {
          const percent = Math.round(progress.loaded / progress.total * 100);
          console.log(`Cargando: ${percent}%`);
        },
        // Callback de error
        (error) => {
          console.error('Error al cargar el modelo IFC:', error);
          setError(`Error al cargar el modelo: ${error.message || 'Error desconocido'}`);
          setLoading(false);
          
          toast({
            variant: "destructive",
            title: "Error de carga",
            description: "No se pudo cargar el modelo IFC. Verifica que los archivos WASM estén instalados.",
          });
        }
      );
    } catch (error) {
      console.error('Error al inicializar el cargador IFC:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al inicializar el cargador IFC: ${errorMsg}`);
      setLoading(false);
    }
    
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
