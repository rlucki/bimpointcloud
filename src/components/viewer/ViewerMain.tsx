
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
import { IFCLoader } from "three-stdlib";
import { OrbitControls } from "three-stdlib";

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
  const viewerRef = useRef<any>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!containerRef.current) return;

    const initializeViewer = async () => {
      try {
        // Set up basic Three.js components
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(
          75, 
          containerRef.current.clientWidth / containerRef.current.clientHeight, 
          0.1, 
          1000
        );
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Add controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.update();
        controlsRef.current = controls;
        
        // Create a grid
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
        grid.position.set(0, 0, 0);
        scene.add(grid);
        
        // Add axes
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.position.set(0, 0.1, 0);
        scene.add(axesHelper);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        // Animation loop
        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);
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
        
        viewerRef.current = {
          scene,
          camera,
          renderer,
          controls
        };
        
        // Check if we have files to load
        if (files.length > 0) {
          const file = files[0];
          if (file.fileUrl) {
            loadIFCModelFromURL(file.fileUrl, file.fileName, file.id || 'model-1');
          } else {
            createDemoModel();
          }
        } else {
          createDemoModel();
        }
        
      } catch (e) {
        console.error("Error initializing viewer:", e);
        setLoadingError("Error al inicializar el visor. Por favor, intenta de nuevo.");
        toast({
          variant: "destructive",
          title: "Error de inicialización",
          description: "No se pudo inicializar el visor 3D.",
        });
      }
    };

    const loadIFCModelFromURL = async (url: string, fileName: string, fileId: string) => {
      try {
        setIsLoading(true);
        toast({
          title: "Cargando modelo",
          description: `Cargando ${fileName || 'modelo'} desde URL...`,
        });

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
              
              // Notify parent component
              const modelInfo = {
                mesh: object,
                id: fileId,
                name: fileName
              };
              onModelLoad(fileId, modelInfo);
              
              setIsLoading(false);
              toast({
                title: "Modelo cargado",
                description: `${fileName || 'Modelo'} cargado correctamente`,
              });
            }
          },
          (progress) => {
            // Handle loading progress if needed
            const percentComplete = Math.round((progress.loaded / progress.total) * 100);
            console.log(`${percentComplete}% cargado`);
          },
          (error) => {
            console.error('Error al cargar el modelo IFC:', error);
            createDemoModel();
            setLoadingError(`Error al cargar el modelo IFC: ${error.message}`);
            toast({
              variant: "destructive",
              title: "Error de carga",
              description: "No se pudo cargar el modelo IFC. Mostrando modelo de demostración.",
            });
          }
        );
        
      } catch (error) {
        console.error('Error en la carga del archivo IFC:', error);
        createDemoModel();
        setLoadingError(`Error en la carga del archivo IFC: ${error}`);
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "Error inesperado al cargar el modelo. Mostrando modelo de demostración.",
        });
      }
    };

    const createDemoModel = () => {
      try {
        if (!sceneRef.current) return;
        
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
        
        // Create a mock model reference for the handler
        const mockModel = { 
          mesh: building,
          id: "demo-model"
        };
        
        // Notify parent component about loaded model
        onModelLoad("demo-model", mockModel);
        
        setIsLoading(false);
        toast({
          title: "Modelo de demostración",
          description: "Se ha cargado un modelo de demostración",
        });
        
      } catch (e) {
        console.error("Error creating demo model:", e);
        setLoadingError("Error al crear el modelo de demostración");
      }
    };

    initializeViewer();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      window.removeEventListener('resize', () => {});
      
      if (viewerRef.current) {
        viewerRef.current = null;
      }
    };
  }, [files, setLoadingError, toast, onModelLoad]);
  
  return (
    <div ref={containerRef} className="w-full h-full" />
  );
};

export default ViewerMain;
