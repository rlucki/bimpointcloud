
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
import { IFCLoader } from "three-stdlib";
import { OrbitControls } from "three-stdlib";
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
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  
  // Initialize viewer
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initViewer = async () => {
      try {
        if (!containerRef.current) return;
        
        setLoadingStatus("Creando visor 3D...");
        console.log("Inicializando visor 3D alternativo...");
        
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
          
          // Clear scene
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
        
        // Load model if URL provided, otherwise create demo scene
        if (fileUrl) {
          loadIFCModelFromURL(fileUrl);
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
    
    const loadIFCModelFromURL = async (url: string) => {
      try {
        if (!sceneRef.current) return;
        
        setLoadingStatus("Cargando modelo IFC...");
        
        // Create an IFC loader
        const loader = new IFCLoader();
        
        // Load the IFC model
        loader.load(
          url,
          (object) => {
            if (sceneRef.current) {
              // Clear any existing demo models
              sceneRef.current.children = sceneRef.current.children.filter(
                child => child.type === "GridHelper" || 
                          child.type === "AxesHelper" ||
                          child.type === "DirectionalLight" ||
                          child.type === "AmbientLight"
              );
              
              // Add the loaded model to the scene
              sceneRef.current.add(object);
              
              // Create a bounding box to calculate the center and size of the model
              const box = new THREE.Box3().setFromObject(object);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              
              // Calculate the distance to properly view the model
              const maxDim = Math.max(size.x, size.y, size.z);
              const distance = maxDim * 2.5;
              
              // Set the camera position to look at the model
              if (cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(
                  center.x + distance,
                  center.y + distance,
                  center.z + distance
                );
                controlsRef.current.target.copy(center);
                controlsRef.current.update();
              }
              
              modelRef.current = {
                mesh: object,
                id: "loaded-model"
              };
              
              setModelLoaded(true);
              setIsLoading(false);
              setLoadingStatus(`Modelo ${fileName || ''} cargado correctamente`);
              
              toast({
                title: "Modelo cargado",
                description: `El modelo ${fileName || 'IFC'} ha sido cargado correctamente`,
              });
            }
          },
          (progress) => {
            // Update loading status with progress
            const percentComplete = Math.round((progress.loaded / progress.total) * 100);
            setLoadingStatus(`Cargando modelo... ${percentComplete}%`);
          },
          (error) => {
            console.error('Error al cargar el modelo IFC:', error);
            createDemoScene();
            setError('Error al cargar el modelo IFC');
            setErrorDetails(error.message);
            toast({
              variant: "destructive",
              title: "Error de carga",
              description: "No se pudo cargar el modelo IFC. Mostrando modelo de demostración.",
            });
          }
        );
        
      } catch (e) {
        console.error("Error al cargar el modelo IFC:", e);
        createDemoScene();
        setError("Error al cargar el modelo IFC");
        setErrorDetails(e instanceof Error ? e.message : String(e));
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "Error inesperado al cargar el modelo. Mostrando modelo de demostración.",
        });
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
        sceneRef.current.add(building2);
        
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
  
  // Frame all objects in view
  const frameAll = async () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    try {
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
      
      console.log("Framed all objects");
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
