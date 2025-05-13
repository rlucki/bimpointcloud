import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useToast } from "@/components/ui/use-toast";
import { OrbitControls } from "three-stdlib";

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
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Flag to prevent automatic framing
  const autoFrameDisabledRef = useRef(false);
  
  const { toast } = useToast();
  
  // Initialize viewer
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Disable auto framing after a short delay
    setTimeout(() => {
      autoFrameDisabledRef.current = true;
      console.log("Auto framing disabled in useIFCViewer");
    }, 3000);
    
    const initViewer = async () => {
      try {
        if (!containerRef.current) return;
        
        setLoadingStatus("Creando visor 3D básico...");
        console.log("Inicializando visor 3D simple...");
        
        // Create Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);
        sceneRef.current = scene;
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75, 
          containerRef.current.clientWidth / containerRef.current.clientHeight, 
          0.1, 
          1000
        );
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Create controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;
        controls.target.set(0, 0, 0);
        
        // Important: Listen for user interaction to disable auto framing
        controls.addEventListener('start', () => {
          autoFrameDisabledRef.current = true;
        });
        
        controls.update();
        controlsRef.current = controls;
        
        // Add grid for better spatial reference
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
        scene.add(grid);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
        
        // Add lighting for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 3);
        scene.add(directionalLight);
        
        // Animation loop
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
        
        // Handle window resizing
        const handleResize = () => {
          if (containerRef.current && cameraRef.current && rendererRef.current) {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            
            rendererRef.current.setSize(width, height);
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        setLoadingStatus("Visor inicializado correctamente");
        setIsInitialized(true);
        
        // Define cleanup function for later
        cleanup = () => {
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          window.removeEventListener('resize', handleResize);
          
          if (rendererRef.current && containerRef.current) {
            containerRef.current.removeChild(rendererRef.current.domElement);
            rendererRef.current.dispose();
          }
          
          // Clean up scene
          if (sceneRef.current) {
            while(sceneRef.current.children.length > 0) { 
              const object = sceneRef.current.children[0];
              sceneRef.current.remove(object);
            }
          }
          
          sceneRef.current = null;
          cameraRef.current = null;
          rendererRef.current = null;
          controlsRef.current = null;
        };
        
        // Create simple box if URL provided, otherwise create demo scene
        if (fileUrl) {
          createSimpleIfcRepresentation(fileUrl);
        } else {
          createDemoScene();
        }
        
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
    
    // Simple representation for IFC files - just creates a colored box with the name
    const createSimpleIfcRepresentation = (url: string) => {
      try {
        if (!sceneRef.current) return;
        
        setLoadingStatus("Creando representación simple del IFC...");
        console.log("Creando representación simple desde URL:", url);
        
        // Clear previous models
        sceneRef.current.children = sceneRef.current.children.filter(
          child => child.type === "GridHelper" || 
                  child.type === "AxesHelper" ||
                  child.type === "DirectionalLight" ||
                  child.type === "AmbientLight"
        );
        
        // Create simple building group
        const buildingGroup = new THREE.Group();
        buildingGroup.name = "Simple_IFC_Model_" + (fileName || "unknown");
        
        // Main structure - a blue semi-transparent box
        const mainGeometry = new THREE.BoxGeometry(8, 12, 10);
        const mainMaterial = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.7,
        });
        const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
        mainBuilding.position.set(0, 6, 0);
        buildingGroup.add(mainBuilding);
        
        // Add floor
        const floorGeometry = new THREE.BoxGeometry(12, 0.5, 14);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(0, 0, 0);
        buildingGroup.add(floor);
        
        // Add the group to the scene
        sceneRef.current.add(buildingGroup);
        
        // Create a box to calculate size and center
        const box = new THREE.Box3().setFromObject(buildingGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Only position camera if auto framing is not disabled
        if (!autoFrameDisabledRef.current) {
          // Calculate distance for camera
          const maxDim = Math.max(size.x, size.y, size.z);
          const distance = maxDim * 2;
          
          // Position camera
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(
              center.x + distance,
              center.y + distance / 1.5,
              center.z + distance
            );
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }
        }
        
        // Store model reference
        modelRef.current = {
          mesh: buildingGroup,
          id: "simple-ifc-representation"
        };
        
        // Update state
        setModelLoaded(true);
        setIsLoading(false);
        setLoadingStatus(`Modelo ${fileName || ''} representado (modo muy simple)`);
        
        // Show toast
        toast({
          title: "Modelo representado",
          description: `Se ha creado una representación básica para ${fileName || 'el archivo IFC'}`,
        });
      } catch (e) {
        console.error("Error creando modelo simplificado:", e);
        createDemoScene();
        setError('Error al crear visualización del modelo');
        setErrorDetails(e instanceof Error ? e.message : String(e));
      }
    };
    
    const createDemoScene = async () => {
      try {
        if (!sceneRef.current) return;
        
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
        sceneRef.current.add(building);
        
        // Add a floor plane
        const floorGeometry = new THREE.PlaneGeometry(30, 30);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xcccccc,
          side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.position.set(0, 0, 0);
        sceneRef.current.add(floor);
        
        // Create a mock model as stand-in for IFC model
        modelRef.current = {
          mesh: building
        };
        
        // Position camera to see the demo scene
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(15, 15, 15);
          controlsRef.current.target.set(0, 5, 0);
          controlsRef.current.update();
        }
        
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
    
    // Clean up function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [containerRef, fileUrl, fileName, toast]);
  
  // Frame all objects - modified to respect the auto frame disabled flag
  const frameAll = async () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    try {
      // Set the auto frame disabled flag to prevent future auto framing
      autoFrameDisabledRef.current = true;
      
      // Find all visible meshes in the scene
      const meshes: THREE.Object3D[] = [];
      sceneRef.current.traverse((object) => {
        if (object.type === 'Mesh' && object.visible) {
          meshes.push(object);
        }
      });
      
      if (meshes.length === 0) return;
      
      // Create a bounding box for all meshes
      const boundingBox = new THREE.Box3();
      
      meshes.forEach((mesh) => {
        boundingBox.expandByObject(mesh);
      });
      
      // Calculate center and size
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      
      // Calculate the distance based on the size of the object
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5;
      
      // Position the camera to look at the center of the object
      cameraRef.current.position.copy(center);
      cameraRef.current.position.z += distance;
      cameraRef.current.lookAt(center);
      
      // Update controls
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
      
      toast({
        title: "Vista ajustada",
        description: "Posición de cámara optimizada",
      });
    } catch (e) {
      console.error("Error framing objects:", e);
    }
  };
  
  // Reload the viewer
  const retry = async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    
    // Clean up existing scene
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (rendererRef.current && containerRef.current) {
      try {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      } catch (e) {
        console.error("Error disposing renderer during retry:", e);
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
    console.log("Scene:", sceneRef.current);
    console.log("Camera:", cameraRef.current);
    console.log("Controls:", controlsRef.current);
    console.log("Model:", modelRef.current);
    
    toast({
      title: "Debug info",
      description: "Check console for viewer state",
    });
  };
  
  return {
    viewer: {
      scene: sceneRef.current,
      camera: cameraRef.current,
      renderer: rendererRef.current,
      controls: controlsRef.current
    },
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
