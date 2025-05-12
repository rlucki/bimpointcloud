
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
import { frameIFCModel } from "@/components/viewer/ViewerUtils";

interface UseIFCViewerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  fileUrl?: string;
  fileName?: string | null;
}

export const useIFCViewer = ({ containerRef, fileUrl, fileName }: UseIFCViewerProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("Inicializando visor...");
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const modelRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Initialize viewer
  useEffect(() => {
    let viewer: IfcViewerAPI | null = null;
    
    const initViewer = async () => {
      try {
        if (!containerRef.current) return;
        
        setLoadingStatus("Creando visor IFC...");
        console.log("Inicializando visor IFC...");
        
        // Create the viewer
        viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        viewerRef.current = viewer;
        
        // IMPORTANTE: Configurar la ruta WASM desde el inicio
        await viewer.IFC.setWasmPath("/wasm/");
        console.log("Ruta WASM configurada para el parseador IFC");
        
        // Set up camera
        viewer.context.ifcCamera.cameraControls.setPosition(5, 5, 5);
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Add grid for better spatial reference
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
        viewer.context.getScene().add(grid);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        viewer.context.getScene().add(axesHelper);
        
        // Add lighting for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        viewer.context.getScene().add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 3);
        viewer.context.getScene().add(directionalLight);
        
        setLoadingStatus("Visor inicializado correctamente");
        setIsInitialized(true);
        
        // Try to load model if URL is provided
        if (fileUrl) {
          loadModel(viewer, fileUrl);
        } else {
          // Add a demo cube if no model
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0x4f46e5, 
            wireframe: true 
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          viewer.context.getScene().add(cube);
          
          setIsLoading(false);
          setLoadingStatus("Modo demo - sin modelo IFC");
        }
        
      } catch (e) {
        console.error("Error inicializando el visor IFC:", e);
        setError("Error al inicializar el visor IFC. Por favor, inténtelo de nuevo.");
        setErrorDetails(e instanceof Error ? e.message : String(e));
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error de visualización",
          description: "No se pudo inicializar el visor IFC.",
        });
      }
    };
    
    // Helper function to load model
    const loadModel = async (viewer: IfcViewerAPI, url: string) => {
      try {
        console.log("Cargando modelo IFC desde URL:", url);
        setLoadingStatus("Preparando WebAssembly para analizar IFC...");
        
        // Explícitamente verificamos si podemos acceder a los archivos WASM
        try {
          const wasmResponse = await fetch("/wasm/web-ifc.wasm", { method: 'HEAD' });
          if (!wasmResponse.ok) {
            throw new Error(`No se pudo acceder a los archivos WASM necesarios (${wasmResponse.status})`);
          }
          console.log("Archivos WASM accesibles");
        } catch (wasmError) {
          console.error("Error al verificar archivos WASM:", wasmError);
        }
        
        setLoadingStatus(`Cargando modelo: ${fileName || url}...`);
        const model = await viewer.IFC.loadIfcUrl(url);
        console.log("Modelo IFC cargado correctamente:", model);
        
        // Calculate model bounds and log them for debugging
        if (model && model.mesh) {
          const box = new THREE.Box3().setFromObject(model.mesh);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          console.table({
            min: box.min,               // minimum coordinate
            max: box.max,               // maximum coordinate
            size,                       // length × height × width
            center                      // geometric center
          });
          
          // Check for extremely large coordinates (likely UTM or EPSG format)
          if (box.min.length() > 100000 || box.max.length() > 100000) {
            console.warn("El modelo tiene coordenadas extremadamente grandes - probablemente en formato UTM o EPSG");
            // Center the model
            model.mesh.position.sub(center);
            console.log("Modelo recentrado al origen");
          }
          
          // Check for millimeter scale
          if (size.length() > 10000) {
            console.warn("El modelo parece estar en milímetros - escalándolo por 0.001");
            model.mesh.scale.setScalar(0.001);
            // Recalculate box after scaling
            box.setFromObject(model.mesh);
            box.getCenter(center);
            console.log("Modelo reescalado de mm a m");
          }
        }
        
        modelRef.current = model;
        
        if (model && model.mesh) {
          // Frame the model using our improved utility function
          setLoadingStatus("Preparando vista...");
          await frameIFCModel(viewerRef, model.mesh);
        }
        
        setModelLoaded(true);
        setIsLoading(false);
        setLoadingStatus("Modelo cargado correctamente");
        
        toast({
          title: "Modelo Cargado",
          description: `Se ha cargado correctamente ${fileName || 'el modelo'}`,
        });
      } catch (e) {
        console.error("Error al cargar el modelo IFC:", e);
        setError("Error al cargar el modelo IFC. El archivo podría estar dañado o en un formato no compatible.");
        setErrorDetails(e instanceof Error ? e.message : String(e));
        setIsLoading(false);
        
        // Add a demo cube to show that the viewer is working
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x4f46e5, 
          wireframe: true 
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1, 0);
        viewer.context.getScene().add(cube);
        
        toast({
          variant: "destructive",
          title: "Error al cargar el modelo",
          description: "No se pudo cargar el modelo IFC.",
        });
      }
    };
    
    initViewer();
    
    // Clean up
    return () => {
      if (viewer) {
        try {
          viewer.dispose();
        } catch (e) {
          console.error("Error al liberar el visor:", e);
        }
      }
    };
  }, [containerRef, fileUrl, fileName, toast]);
  
  // Frame all objects in view using the improved method
  const frameAll = async () => {
    if (viewerRef.current) {
      try {
        if (modelRef.current && modelRef.current.mesh) {
          // Use our improved framing utility
          await frameIFCModel(viewerRef, modelRef.current.mesh);
        } else {
          // Otherwise frame the whole scene
          const scene = viewerRef.current.context.getScene();
          viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
        }
        console.log("Framed all objects");
        toast({
          title: "View adjusted",
          description: "Camera position optimized",
        });
      } catch (e) {
        console.error("Error framing objects:", e);
      }
    }
  };
  
  // Reload the viewer and try loading the model again
  const retry = async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    
    // Dispose of the current viewer if it exists
    if (viewerRef.current) {
      try {
        viewerRef.current.dispose();
        viewerRef.current = null;
      } catch (e) {
        console.error("Error disposing viewer during retry:", e);
      }
    }
    
    // Wait a moment to ensure disposal is complete
    setTimeout(() => {
      // Reset loading state
      setLoadingStatus("Initializing viewer...");
      setIsInitialized(false);
      setModelLoaded(false);
      
      // The effect will trigger again and re-initialize the viewer
    }, 500);
  };
  
  // Debug function
  const debug = () => {
    if (viewerRef.current) {
      console.log("Viewer state:", viewerRef.current);
      console.log("Scene:", viewerRef.current.context.getScene());
      console.log("Model:", modelRef.current);
      
      // Diagnostic information about the wasm path - CORRECCIÓN DE ERROR
      console.log("WASM information:");
      try {
        console.log("Current WASM path: (checking IFC object)");
        console.log(viewerRef.current.IFC);
      } catch (e) {
        console.log("Could not get WASM path:", e);
      }
      
      // Test if the wasm files are accessible
      fetch('/wasm/web-ifc.wasm')
        .then(response => {
          if (response.ok) {
            console.log("WASM file accessible:", response.url);
          } else {
            console.error("WASM file not found or inaccessible:", response.url);
          }
        })
        .catch(error => console.error("Error checking WASM file:", error));
      
      // Add a visible marker at origin for debugging
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(0, 0, 0);
      viewerRef.current.context.getScene().add(sphere);
      
      toast({
        title: "Debug info",
        description: "Check console for viewer state",
      });
    }
  };
  
  return {
    viewer: viewerRef.current,
    isInitialized,
    isLoading,
    error,
    errorDetails,
    modelLoaded,
    loadingStatus,
    frameAll,
    retry,
    debug
  };
};
