
import React, { useEffect, useRef, useState } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import * as THREE from 'three';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

export default function MinimalViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>("Inicializando...");
  const [error, setError] = useState<string | null>(null);
  const [wasmLoaded, setWasmLoaded] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Este efecto solo se ocupa de una cosa: cargar un IFC básico
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Variables para limpiar
    let viewer: IfcViewerAPI | null = null;
    
    async function initializeViewer() {
      try {
        setStatus("Creando visor...");
        
        // 1. Crear el visor
        viewer = new IfcViewerAPI({
          container: containerRef.current!,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        // 2. Preparar la escena
        const scene = viewer.context.getScene();
        scene.add(new THREE.GridHelper(50, 50));
        scene.add(new THREE.AxesHelper(5));
        
        // 3. Configurar WASM dinámicamente
        const wasmPath = import.meta.env.BASE_URL.replace(/\/$/, '') + '/wasm/';
        setStatus(`Cargando WASM desde ${wasmPath}...`);
        
        try {
          await viewer.IFC.setWasmPath(wasmPath);
          
          // Comprobar si el archivo WASM está accesible
          const response = await fetch(`${wasmPath}web-ifc.wasm`, { method: 'HEAD' });
          setWasmLoaded(response.ok);
          
          if (!response.ok) {
            throw new Error(`No se encontró web-ifc.wasm en ${wasmPath}`);
          }
          
          console.log("✅ WASM cargado correctamente");
          toast({
            title: "WASM disponible",
            description: `Motor web-ifc.wasm cargado desde ${wasmPath}`
          });
        } catch (e) {
          console.error("Error cargando WASM:", e);
          setError(`Error cargando WASM: ${e instanceof Error ? e.message : 'Error desconocido'}`);
          return;
        }
        
        // 4. Cargar modelo (puedes usar un ejemplo o tu propio IFC)
        try {
          // Usar una URL de ejemplo si estamos en modo demo
          const exampleUrl = "https://examples.ifcjs.io/models/ifc/SametLibrary.ifc";
          setStatus("Cargando modelo de ejemplo...");
          
          const model = await viewer.IFC.loadIfcUrl(exampleUrl);
          setModelLoaded(true);
          
          if (!model?.mesh) {
            throw new Error("El modelo no contiene geometría");
          }
          
          console.log("✅ Modelo cargado correctamente");
          
          // 5. Normalizar coordenadas (por si acaso)
          const box = new THREE.Box3().setFromObject(model.mesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          // Si está lejos (UTM) lo llevamos al origen
          if (center.length() > 5000) {
            model.mesh.position.sub(center);
          }
          
          // Si viene en milímetros lo escalamos a metros
          if (size.length() > 10000) {
            model.mesh.scale.setScalar(0.001);
          }
          
          // 6. Encuadrar la cámara
          const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
          camera.near = 0.1;
          camera.far = size.length() * 10;
          camera.updateProjectionMatrix();
          
          viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
          viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
          
          setStatus("Todo listo - Modelo cargado");
          toast({
            title: "Modelo cargado",
            description: "IFC de ejemplo visualizado correctamente"
          });
        } catch (e) {
          console.error("Error cargando modelo:", e);
          setError(`Error cargando modelo: ${e instanceof Error ? e.message : 'Error desconocido'}`);
        }
      } catch (e) {
        console.error("Error inicializando visor:", e);
        setError(`Error inicializando visor: ${e instanceof Error ? e.message : 'Error desconocido'}`);
      }
    }
    
    // Iniciar el proceso
    initializeViewer();
    
    // Cleanup
    return () => {
      if (viewer) {
        // Limpiar recursos si es necesario
        try {
          viewer.dispose();
        } catch (e) {
          console.warn("Error durante la limpieza del visor:", e);
        }
      }
    };
  }, [toast]);
  
  return (
    <div className="flex flex-col h-screen">
      {/* Barra de estado */}
      <header className="h-14 bg-card border-b border-border flex justify-between items-center px-4">
        <div className="font-medium">Visor IFC Minimalista</div>
        <Button variant="outline" onClick={() => navigate('/')}>
          Volver
        </Button>
      </header>
      
      {/* Contenedor del visor */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Panel de estado/error */}
        <div className="absolute bottom-4 left-4 p-3 bg-black/60 text-white rounded-md max-w-md">
          <div className="mb-2">
            <div className="text-sm font-medium">Estado:</div>
            <div className="text-sm">{status}</div>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${wasmLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs">WASM</span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${modelLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs">Modelo</span>
            </div>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-900/50 rounded border border-red-700 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
