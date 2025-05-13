
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
        
        setLoadingStatus("Creando visor 3D...");
        console.log("Inicializando visor 3D...");
        
        // Create the viewer
        viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        viewerRef.current = viewer;
        
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
        
        // Create demo scene since we're not loading IFC models
        createDemoScene(viewer);
        
      } catch (e) {
        console.error("Error inicializando el visor 3D:", e);
        setError("Error al inicializar el visor 3D. Por favor, inténtelo de nuevo.");
        setErrorDetails(e instanceof Error ? e.message : String(e));
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error de visualización",
          description: "No se pudo inicializar el visor 3D.",
        });
      }
    };
    
    const createDemoScene = async (viewer: IfcViewerAPI) => {
      try {
        // Create simple demo geometry to represent building
        setLoadingStatus("Creando modelo de demostración...");
        
        // Create a simple building-like shape
        const buildingGeometry = new THREE.BoxGeometry(5, 10, 8);
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x4f46e5,
          transparent: true,
          opacity: 0.7,
          wireframe: false
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(0, 5, 0);
        viewer.context.getScene().add(building);
        
        // Add a second building
        const building2Geometry = new THREE.BoxGeometry(4, 7, 4);
        const building2Material = new THREE.MeshStandardMaterial({ 
          color: 0x34d399,
          transparent: true,
          opacity: 0.7,
          wireframe: false
        });
        const building2 = new THREE.Mesh(building2Geometry, building2Material);
        building2.position.set(-8, 3.5, 5);
        viewer.context.getScene().add(building2);
        
        // Add a floor plane
        const floorGeometry = new THREE.PlaneGeometry(30, 30);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xcccccc,
          side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.position.set(0, 0, 0);
        viewer.context.getScene().add(floor);
        
        // Create a mock model as stand-in for IFC model
        const mockModel = {
          mesh: building
        };
        modelRef.current = mockModel;
        
        // Frame the model
        await frameIFCModel(viewerRef, building);
        
        setModelLoaded(true);
        setIsLoading(false);
        setLoadingStatus("Modelo de demostración cargado");
        
        toast({
          title: "Visor Listo",
          description: "Se ha creado un modelo de demostración",
        });
      } catch (e) {
        console.error("Error al crear la escena de demostración:", e);
        setError("Error al crear la escena de demostración");
        setErrorDetails(e instanceof Error ? e.message : String(e));
        setIsLoading(false);
        
        toast({
          variant: "destructive",
          title: "Error en la escena",
          description: "No se pudo crear la escena de demostración.",
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
  
  // Frame all objects in view
  const frameAll = async () => {
    if (viewerRef.current) {
      try {
        if (modelRef.current && modelRef.current.mesh) {
          await frameIFCModel(viewerRef, modelRef.current.mesh);
        } else {
          const scene = viewerRef.current.context.getScene();
          viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
        }
        console.log("Framed all objects");
        toast({
          title: "Vista ajustada",
          description: "Posición de cámara optimizada",
        });
      } catch (e) {
        console.error("Error framing objects:", e);
      }
    }
  };
  
  // Reload the viewer
  const retry = async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    
    if (viewerRef.current) {
      try {
        viewerRef.current.dispose();
        viewerRef.current = null;
      } catch (e) {
        console.error("Error disposing viewer during retry:", e);
      }
    }
    
    setTimeout(() => {
      setLoadingStatus("Initializing viewer...");
      setIsInitialized(false);
      setModelLoaded(false);
    }, 500);
  };
  
  // Debug function
  const debug = () => {
    if (viewerRef.current) {
      console.log("Viewer state:", viewerRef.current);
      console.log("Scene:", viewerRef.current.context.getScene());
      console.log("Model:", modelRef.current);
      
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
