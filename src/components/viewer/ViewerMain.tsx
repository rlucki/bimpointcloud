
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
import { OrbitControls } from "three-stdlib";

// Usamos directamente THREE para crear un IFC loader simulado
// ya que three-stdlib no proporciona IFCLoader y el import directo falla

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
            simulateLoadIFCModel(file.fileUrl, file.fileName, file.id || 'model-1');
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

    // Simulamos la carga de un IFC sin usar el IFCLoader
    const simulateLoadIFCModel = async (url: string, fileName: string, fileId: string) => {
      try {
        setIsLoading(true);
        toast({
          title: "Cargando modelo",
          description: `Cargando ${fileName || 'modelo'} desde URL...`,
        });

        // Como no tenemos acceso al IFCLoader real, simulamos el proceso con el modelo demo
        console.log("Simulando carga de IFC desde:", url);
        
        setTimeout(() => {
          // Simulación de carga completada
          createDemoModel(fileId, fileName);
          
          toast({
            title: "Modelo cargado (simulado)",
            description: `${fileName || 'Modelo'} cargado en modo simulación`,
          });
        }, 2000);
        
      } catch (error) {
        console.error('Error al simular carga de archivo IFC:', error);
        createDemoModel();
        setLoadingError(`Error en la simulación de carga de archivo IFC: ${error}`);
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "Error al simular la carga del modelo. Mostrando modelo de demostración.",
        });
      }
    };

    const createDemoModel = (fileId: string = "demo-model", fileName: string = "Demo Model") => {
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
          id: fileId,
          name: fileName
        };
        
        // Notify parent component about loaded model
        onModelLoad(fileId, mockModel);
        
        setIsLoading(false);
        toast({
          title: "Modelo visualizado",
          description: fileName === "Demo Model" ? "Se ha cargado un modelo de demostración" : `Modelo ${fileName} visualizado en modo simplificado`,
        });
        
      } catch (e) {
        console.error("Error creating demo model:", e);
        setLoadingError("Error al crear el modelo de visualización");
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
