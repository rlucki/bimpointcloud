
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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [meshExists, setMeshExists] = useState(false);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const modelRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Initialize viewer
  useEffect(() => {
    let viewer: IfcViewerAPI | null = null;
    
    const initViewer = async () => {
      try {
        if (!containerRef.current) return;
        
        console.log("Initializing IFC viewer...");
        
        // Create the viewer
        viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        // Almacenamos la referencia al viewer correctamente
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
        
        setIsInitialized(true);
        console.log("Viewer initialized successfully");
        
        // IMPORTANTE: Configurar la ruta de WASM inmediatamente después de inicializar
        try {
          await viewer.IFC.setWasmPath("/wasm/");
          console.log("WASM path set successfully");
        } catch (wasmError) {
          console.error("Error setting WASM path:", wasmError);
          setError("Failed to set WebAssembly path. Check if WASM files are available.");
        }
        
        // Try to load model if URL is provided
        if (fileUrl) {
          await loadModel(viewer, fileUrl);
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
        }
        
      } catch (e) {
        console.error("Error initializing IFC viewer:", e);
        setError("Failed to initialize IFC viewer. Please try again.");
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Visualization error",
          description: "Could not initialize the IFC viewer.",
        });
      }
    };
    
    // Helper function to load model
    const loadModel = async (viewer: IfcViewerAPI, url: string) => {
      try {
        console.log("Loading IFC model from URL:", url);
        
        // Importante: Verificar que la URL del modelo es válida
        if (!url || !url.trim()) {
          throw new Error("Invalid model URL");
        }
        
        // Cargar el modelo con manejo de errores mejorado
        console.log("Attempting to load IFC model...");
        const model = await viewer.IFC.loadIfcUrl(url);
        console.log("IFC model loaded successfully:", model);
        
        // Update model loaded state
        setModelLoaded(true);
        
        // Calculate model bounds and log them for debugging
        if (model && model.mesh) {
          // Update mesh exists state
          setMeshExists(true);
          
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
            console.warn("Model has extremely large coordinates - likely in UTM or EPSG format");
            // Center the model
            model.mesh.position.sub(center);
            console.log("Model recentered to origin");
          }
          
          // Check for millimeter scale
          if (size.length() > 10000) {
            console.warn("Model appears to be in millimeters - scaling down by 0.001");
            model.mesh.scale.setScalar(0.001);
            // Recalculate box after scaling
            box.setFromObject(model.mesh);
            box.getCenter(center);
            console.log("Model rescaled from mm to m");
          }
        } else {
          console.warn("Model loaded but mesh is not available");
        }
        
        modelRef.current = model;
        
        if (model && model.mesh) {
          // Frame the model using our improved utility function
          await frameIFCModel(viewerRef, model.mesh);
        }
        
        setIsLoading(false);
        
        toast({
          title: "Model Loaded",
          description: `Successfully loaded ${fileName || 'model'}`,
        });
      } catch (e) {
        console.error("Error loading IFC model:", e);
        setError("Failed to load IFC model. The file might be corrupted or in an unsupported format.");
        setIsLoading(false);
        setModelLoaded(false);
        setMeshExists(false);
        
        // Add a demo cube to show that the viewer is working
        if (viewer) {
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0x4f46e5, 
            wireframe: true 
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          viewer.context.getScene().add(cube);
        }
        
        toast({
          variant: "destructive",
          title: "Model loading error",
          description: `Error loading IFC model: ${e instanceof Error ? e.message : 'Unknown error'}`,
        });
      }
    };
    
    // Iniciar el visor solo cuando el contenedor esté disponible
    if (containerRef.current) {
      initViewer();
    } else {
      console.warn("Container reference not available");
      setIsLoading(false);
      setError("Viewer container not found");
    }
    
    // Clean up
    return () => {
      if (viewer) {
        try {
          viewer.dispose();
        } catch (e) {
          console.error("Error disposing viewer:", e);
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
      } catch (e) {
        console.error("Error framing objects:", e);
      }
    }
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
    } else {
      console.log("Viewer not initialized");
      toast({
        variant: "destructive",
        title: "Debug info",
        description: "Viewer not initialized",
      });
    }
  };
  
  return {
    viewer: viewerRef.current,
    isInitialized,
    isLoading,
    error,
    modelLoaded,
    meshExists,
    frameAll,
    debug
  };
};
