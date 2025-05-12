
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";

interface ViewerMainProps {
  files: any[];
  setLoadingError: (error: string | null) => void;
  onModelLoad: (fileId: string, model: any) => void;
}

const ViewerMain: React.FC<ViewerMainProps> = ({ 
  files, 
  setLoadingError, 
  onModelLoad 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const [wasmError, setWasmError] = useState<boolean>(false);
  const { toast } = useToast();

  // Verificar que los archivos WASM son accesibles
  useEffect(() => {
    const checkWasmFiles = async () => {
      try {
        // Verificar que podemos acceder a los archivos WASM
        const wasmResponse = await fetch("/wasm/web-ifc.wasm", { method: 'HEAD' });
        if (!wasmResponse.ok) {
          console.error("Error: No se puede acceder al archivo WASM:", wasmResponse.status, wasmResponse.statusText);
          setWasmError(true);
          setLoadingError(`No se puede acceder al archivo WASM necesario (status ${wasmResponse.status}). Por favor, asegúrate de que los archivos WASM estén instalados correctamente en la carpeta public/wasm/`);
          return false;
        }
        console.log("✅ Archivos WASM accesibles");
        return true;
      } catch (error) {
        console.error("Error al verificar archivos WASM:", error);
        setWasmError(true);
        setLoadingError("No se puede acceder a los archivos WASM necesarios. Por favor, verifica que los archivos estén instalados correctamente.");
        return false;
      }
    };

    checkWasmFiles();
  }, [setLoadingError]);

  useEffect(() => {
    if (!containerRef.current || files.length === 0 || wasmError) return;

    const initializeViewer = async () => {
      try {
        console.log("Inicializando el visor IFC...");
        
        // Crear el visor con configuración mejorada
        const viewer = new IfcViewerAPI({
          container: containerRef.current!,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        viewerRef.current = viewer;
        
        // Configurar la ruta WASM explícitamente ANTES de cargar cualquier modelo
        console.log("Configurando ruta WASM a /wasm/");
        await viewer.IFC.setWasmPath("/wasm/");
        
        // Configurar cámara
        viewer.context.ifcCamera.cameraControls.setPosition(10, 10, 10);
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Crear una cuadrícula
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
        grid.position.set(0, 0, 0);
        viewer.context.getScene().add(grid);
        
        // Añadir ejes
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.position.set(0, 0.1, 0);
        viewer.context.getScene().add(axesHelper);
        
        // Añadir iluminación
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        viewer.context.getScene().add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        viewer.context.getScene().add(directionalLight);
        
        // Añadir cubo de referencia en el origen
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0xff0000, 
          wireframe: true 
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.3, 0);
        viewer.context.getScene().add(cube);

        // Cargar todos los modelos IFC
        for (const file of files.filter(f => f.fileType === 'ifc')) {
          await loadIfcFile(viewer, file);
        }
      } catch (e) {
        console.error("Error al inicializar el visor:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setLoadingError(`Error al inicializar el visor IFC: ${errorMessage}`);
        
        // Mostrar información adicional para ayudar a diagnosticar problemas WASM
        if (errorMessage.includes("wasm") || errorMessage.includes("WebAssembly")) {
          console.error("Problema detectado con los archivos WASM:");
          toast({
            variant: "destructive",
            title: "Error con archivos WASM",
            description: "No se pueden cargar los archivos WebAssembly necesarios. Consulta la consola para más detalles.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error al inicializar el visor",
            description: "No se pudo inicializar el visor 3D.",
          });
        }
      }
    };

    const loadIfcFile = async (viewer: IfcViewerAPI, file: any) => {
      try {
        if (file.fileUrl) {
          console.log(`Intentando cargar el modelo IFC: ${file.fileName} desde ${file.fileUrl}`);
          
          // Asegurarse de que la ruta WASM esté configurada
          await viewer.IFC.setWasmPath("/wasm/");
          
          // Cargar el modelo
          const model = await viewer.IFC.loadIfcUrl(file.fileUrl);
          console.log("IFC model loaded:", model);
          
          if (!model) {
            throw new Error("El modelo se cargó pero es null o undefined");
          }
          
          // Optimizar el modelo si es necesario
          if (model && model.mesh) {
            optimizeModel(viewer, model);
          }
          
          // Notificar al componente padre sobre el modelo cargado
          if (file.id) {
            onModelLoad(file.id, model);
          }
          
          toast({
            title: "Modelo cargado",
            description: `Se ha cargado correctamente ${file.fileName}`,
          });
        } else {
          await loadExampleModel(viewer);
        }
      } catch (e) {
        console.error(`Error al cargar el modelo ${file.fileName}:`, e);
        const errorMsg = e instanceof Error ? e.message : String(e);
        
        // Detectar errores específicos relacionados con WASM
        if (errorMsg.includes("wasm") || errorMsg.includes("WebAssembly")) {
          setLoadingError(`Error en archivos WASM al cargar ${file.fileName}. Por favor, verifica que los archivos WASM estén instalados correctamente.`);
        } else {
          setLoadingError(`Error al cargar el modelo ${file.fileName}: ${errorMsg}`);
        }
      }
    };
    
    const loadExampleModel = async (viewer: IfcViewerAPI) => {
      try {
        const exampleUrl = "https://examples.ifcjs.io/models/ifc/SametLibrary.ifc";
        console.log("Cargando modelo de ejemplo desde:", exampleUrl);
        
        // Asegurarse de que la ruta WASM esté configurada
        await viewer.IFC.setWasmPath("/wasm/");
        
        const model = await viewer.IFC.loadIfcUrl(exampleUrl);
        
        if (model && model.mesh) {
          optimizeModel(viewer, model);
        }
        
        toast({
          title: "Modelo de ejemplo cargado",
          description: "Usando modelo IFC de ejemplo",
        });
      } catch (e) {
        console.error("Error al cargar el ejemplo:", e);
        const errorMsg = e instanceof Error ? e.message : String(e);
        setLoadingError(`No se pudo cargar el modelo de ejemplo: ${errorMsg}`);
      }
    };
    
    const optimizeModel = (viewer: IfcViewerAPI, model: any) => {
      // Handle model position and scale issues
      const box = new THREE.Box3().setFromObject(model.mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      
      // Fix extremely large coordinates
      if (box.min.length() > 100000 || box.max.length() > 100000) {
        model.mesh.position.sub(center);
      }
      
      // Fix millimeter scale
      if (size.length() > 10000) {
        model.mesh.scale.setScalar(0.001);
      }
      
      // Adjust camera
      const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
      camera.near = 0.1;
      camera.far = Math.max(10000, size.length() * 20);
      camera.updateProjectionMatrix();
      
      // Frame model for proper viewing
      setTimeout(() => {
        viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
      }, 500);
    };

    initializeViewer();
    
    // Limpieza
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (e) {
          console.error("Error al liberar el visor:", e);
        }
      }
    };
  }, [files, setLoadingError, toast, onModelLoad, wasmError]);
  
  return (
    <div ref={containerRef} className="w-full h-full" />
  );
};

export default ViewerMain;
