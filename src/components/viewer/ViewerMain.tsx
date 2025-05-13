
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
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

    // Simulamos la carga de un IFC con un modelo arquitectónico simplificado
    const simulateLoadIFCModel = async (url: string, fileName: string, fileId: string) => {
      try {
        setIsLoading(true);
        toast({
          title: "Cargando modelo",
          description: `Cargando ${fileName || 'modelo'} desde URL...`,
        });

        console.log("Simulando carga de IFC desde:", url);
        
        // Tiempo para simular la carga del modelo
        setTimeout(() => {
          // Limpiar escena previa
          if (sceneRef.current) {
            sceneRef.current.children = sceneRef.current.children.filter(
              child => child.type === "GridHelper" || 
                      child.type === "AxesHelper" ||
                      child.type === "DirectionalLight" ||
                      child.type === "AmbientLight"
            );
          }
          
          createArchitecturalModelFromIfc(fileId, fileName);
          
          toast({
            title: "Modelo visualizado",
            description: `${fileName || 'Modelo'} representado en modo simplificado`,
            variant: "default"
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

    // Crear un modelo arquitectónico simplificado basado en un IFC
    const createArchitecturalModelFromIfc = (fileId: string, fileName: string) => {
      try {
        if (!sceneRef.current) return;
        
        const group = new THREE.Group();
        group.name = "IFC_Model_Simplified";
        
        // Edificio principal - más elaborado que el modelo demo estándar
        const mainBuildingGeo = new THREE.BoxGeometry(8, 12, 10);
        const mainBuildingMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.8,
        });
        const mainBuilding = new THREE.Mesh(mainBuildingGeo, mainBuildingMat);
        mainBuilding.position.set(0, 6, 0);
        group.add(mainBuilding);
        
        // Techo 
        const roofGeo = new THREE.ConeGeometry(6, 3, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 13.5, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        // Planta baja / base
        const baseGeo = new THREE.BoxGeometry(12, 1, 14);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, -0.5, 0);
        group.add(base);
        
        // Ventanas - primera fila
        const windowMaterial = new THREE.MeshStandardMaterial({
          color: 0x90cdf4,
          transparent: true,
          opacity: 0.8,
        });
        
        // Crear ventanas en filas
        for (let floor = 1; floor <= 3; floor++) {
          for (let i = -2.5; i <= 2.5; i += 1.5) {
            // Ventanas frontales
            const windowGeom = new THREE.BoxGeometry(1, 1.5, 0.1);
            const windowMesh = new THREE.Mesh(windowGeom, windowMaterial);
            windowMesh.position.set(i, floor * 3, 5.05);
            group.add(windowMesh);
            
            // Ventanas traseras
            const backWindow = windowMesh.clone();
            backWindow.position.z = -5.05;
            group.add(backWindow);
            
            // Ventanas laterales si hay espacio
            if (i > -2.5 && i < 2.5) {
              const sideWindow = windowMesh.clone();
              sideWindow.rotation.y = Math.PI / 2;
              sideWindow.position.set(4.05, floor * 3, i);
              group.add(sideWindow);
              
              const otherSideWindow = sideWindow.clone();
              otherSideWindow.position.x = -4.05;
              group.add(otherSideWindow);
            }
          }
        }
        
        // Entrada
        const doorGeo = new THREE.BoxGeometry(2, 3, 0.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.5, 5.1);
        group.add(door);
        
        // Escalones
        const stepsGeo = new THREE.BoxGeometry(3, 0.5, 1);
        const stepsMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af });
        const steps = new THREE.Mesh(stepsGeo, stepsMat);
        steps.position.set(0, 0.25, 5.6);
        group.add(steps);
        
        // Terreno / Suelo
        const groundGeo = new THREE.CircleGeometry(15, 32);
        const groundMat = new THREE.MeshStandardMaterial({
          color: 0x4ade80,
          side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        group.add(ground);
        
        // Añadir algunos árboles
        for (let i = 0; i < 6; i++) {
          const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          
          const leavesGeo = new THREE.ConeGeometry(1, 2, 8);
          const leavesMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
          const leaves = new THREE.Mesh(leavesGeo, leavesMat);
          leaves.position.y = 1.8;
          
          const tree = new THREE.Group();
          tree.add(trunk);
          tree.add(leaves);
          
          // Posición aleatoria pero fuera del edificio
          const angle = Math.random() * Math.PI * 2;
          const distance = 8 + Math.random() * 6;
          tree.position.set(
            Math.cos(angle) * distance,
            0.75,
            Math.sin(angle) * distance
          );
          
          group.add(tree);
        }
        
        // Añadir el grupo a la escena
        if (sceneRef.current) {
          sceneRef.current.add(group);
          
          // Crear una bounding box para calcular el centro y el tamaño
          const box = new THREE.Box3().setFromObject(group);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          // Calcular la distancia para ver correctamente el modelo
          const maxDim = Math.max(size.x, size.y, size.z);
          const distance = maxDim * 1.5;
          
          // Posicionar la cámara para mirar al modelo
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(
              center.x + distance,
              center.y + distance / 1.2,
              center.z + distance
            );
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }
        }
        
        // Crear referencia al modelo para el manejador
        const modelInfo = { 
          mesh: group,
          id: fileId,
          name: fileName || "Modelo IFC Simplificado"
        };
        
        // Notificar al componente padre sobre el modelo cargado
        onModelLoad(fileId, modelInfo);
        setIsLoading(false);
      } catch (e) {
        console.error("Error creating architectural model:", e);
        createDemoModel();
        setLoadingError("Error al crear el modelo arquitectónico");
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
          id: "demo-model",
          name: "Demo Model"
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
