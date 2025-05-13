
import React, { useRef, useEffect } from "react";
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
  const { toast } = useToast();

  useEffect(() => {
    if (!containerRef.current || files.length === 0) return;

    const initializeViewer = async () => {
      try {
        // Create the viewer with enhanced settings
        const viewer = new IfcViewerAPI({
          container: containerRef.current!,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        viewerRef.current = viewer;
        
        // Set up camera
        viewer.context.ifcCamera.cameraControls.setPosition(10, 10, 10);
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Create a grid
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
        grid.position.set(0, 0, 0);
        viewer.context.getScene().add(grid);
        
        // Add axes
        const axesHelper = new THREE.AxesHelper(10);
        axesHelper.position.set(0, 0.1, 0);
        viewer.context.getScene().add(axesHelper);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        viewer.context.getScene().add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        viewer.context.getScene().add(directionalLight);
        
        // Add reference cube at origin
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0xff0000, 
          wireframe: true 
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.3, 0);
        viewer.context.getScene().add(cube);

        // Nota: Ya no cargamos modelos IFC por ahora
        // En su lugar, creamos un modelo de demostración
        createDemoModel(viewer);
        
        toast({
          title: "Visor inicializado",
          description: "Visor 3D inicializado sin módulo WASM",
        });
      } catch (e) {
        console.error("Error initializing viewer:", e);
        setLoadingError("Failed to initialize the viewer. Please try again.");
        toast({
          variant: "destructive",
          title: "Viewer initialization failed",
          description: "Could not initialize the 3D viewer.",
        });
      }
    };

    const createDemoModel = (viewer: IfcViewerAPI) => {
      try {
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
        
        // Create a mock model reference for the handler
        const mockModel = { 
          mesh: building,
          id: "demo-model"
        };
        
        // Notify parent component about loaded model
        onModelLoad("demo-model", mockModel);
        
      } catch (e) {
        console.error("Error creating demo model:", e);
      }
    };

    initializeViewer();
    
    // Cleanup
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (e) {
          console.error("Error disposing viewer:", e);
        }
      }
    };
  }, [files, setLoadingError, toast, onModelLoad]);
  
  return (
    <div ref={containerRef} className="w-full h-full" />
  );
};

export default ViewerMain;
