import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useToast } from "@/components/ui/use-toast";
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
  const loadedFilesRef = useRef<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewInitialized, setViewInitialized] = useState(false);
  const { toast } = useToast();

  // Handle WebGL context loss
  const handleContextLost = () => {
    console.warn("WebGL context lost - will attempt to recover");
    
    if (rendererRef.current) {
      // Stop animation loop to prevent further rendering attempts
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Attempt to recover in a short while
      setTimeout(() => {
        if (containerRef.current && rendererRef.current) {
          try {
            // Dispose old renderer
            rendererRef.current.dispose();
            
            // Create new renderer
            const newRenderer = new THREE.WebGLRenderer({ 
              antialias: true,
              powerPreference: "high-performance",
              preserveDrawingBuffer: true
            });
            newRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
            newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
            
            // Replace old canvas with new one
            if (containerRef.current.contains(rendererRef.current.domElement)) {
              containerRef.current.removeChild(rendererRef.current.domElement);
            }
            containerRef.current.appendChild(newRenderer.domElement);
            rendererRef.current = newRenderer;
            
            // Restart animation loop
            if (animationRef.current === null && sceneRef.current && cameraRef.current) {
              const animate = () => {
                animationRef.current = requestAnimationFrame(animate);
                if (controlsRef.current) {
                  controlsRef.current.update();
                }
                newRenderer.render(sceneRef.current, cameraRef.current);
              };
              animate();
            }
            
            console.log("WebGL context recovered successfully");
          } catch (e) {
            console.error("Failed to recover from WebGL context loss:", e);
            setLoadingError("Error de renderizado gráfico. Por favor, recargue la página.");
          }
        }
      }, 1000);
    }
  };

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
        
        // Create renderer with better WebGL settings
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Add context loss/restore event listeners
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
        
        // Add controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.update();
        controls.enableDamping = true;
        controls.dampingFactor = 0.05; // Make controls smoother
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

        // Animation loop - only update controls, not camera position
        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);
          if (controlsRef.current) {
            controlsRef.current.update();
          }
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
        
        setViewInitialized(true);
        
        // Check if we have files to load
        if (files.length > 0) {
          const file = files[0];
          if (file.fileUrl) {
            createSimpleModelFromUrl(file.fileUrl, file.fileName, file.id || 'model-1');
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

    // Simple model creation based on URL without using IFC loader
    const createSimpleModelFromUrl = async (url: string, fileName: string, fileId: string) => {
      try {
        // Skip if we've already loaded this file
        if (loadedFilesRef.current.has(fileId)) {
          console.log(`Model ${fileId} already loaded, skipping`);
          return;
        }
        
        setIsLoading(true);
        toast({
          title: "Representando modelo",
          description: `Creando una representación simple para ${fileName || 'el modelo'}...`,
        });

        console.log("Creando representación simple para:", url);
        
        // Track that we're loading this file
        loadedFilesRef.current.add(fileId);
        
        // Short delay to simulate processing
        setTimeout(() => {
          // Clean existing models
          if (sceneRef.current) {
            sceneRef.current.children = sceneRef.current.children.filter(
              child => child.type === "GridHelper" || 
                      child.type === "AxesHelper" ||
                      child.type === "DirectionalLight" ||
                      child.type === "AmbientLight"
            );
          }
          
          // Create a basic building representation
          const buildingGroup = createBuildingRepresentation(fileName || url.split('/').pop() || 'unknown');
          
          // Add to scene
          if (sceneRef.current) {
            sceneRef.current.add(buildingGroup);
            
            // Create bounding box
            const box = new THREE.Box3().setFromObject(buildingGroup);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Only set camera position once when model is first loaded
            if (cameraRef.current && controlsRef.current && !viewInitialized) {
              const maxDim = Math.max(size.x, size.y, size.z);
              const distance = maxDim * 2;
              
              cameraRef.current.position.set(
                center.x + distance,
                center.y + distance / 1.5,
                center.z + distance
              );
              controlsRef.current.target.copy(center);
              controlsRef.current.update();
            }
            
            // Create model reference
            const modelInfo = { 
              mesh: buildingGroup,
              id: fileId,
              name: fileName || "Representación Simple"
            };
            
            // Notify parent
            onModelLoad(fileId, modelInfo);
            setIsLoading(false);
            
            toast({
              title: "Modelo representado",
              description: `Representación simplificada creada para ${fileName || 'el archivo'}`,
              variant: "default"
            });
          }
        }, 1500);
        
      } catch (error) {
        console.error('Error al crear representación simple:', error);
        createDemoModel();
        setLoadingError(`Error al crear representación: ${error}`);
        toast({
          variant: "destructive",
          title: "Error de representación",
          description: "No se pudo crear la representación. Mostrando modelo de demostración.",
        });
      }
    };

    // Create a simple building representation
    const createBuildingRepresentation = (name: string) => {
      const group = new THREE.Group();
      group.name = name;
      
      // Main building - colorize based on file name hash
      const hash = hashString(name);
      const color = new THREE.Color(
        ((hash & 0xFF0000) >> 16) / 255,
        ((hash & 0x00FF00) >> 8) / 255,
        (hash & 0x0000FF) / 255
      );
      
      // Main structure
      const mainGeometry = new THREE.BoxGeometry(8, 12, 10);
      const mainMaterial = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
      });
      const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
      mainBuilding.position.set(0, 6, 0);
      group.add(mainBuilding);
      
      // Add a roof
      const roofGeometry = new THREE.ConeGeometry(6, 3, 4);
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(0, 13.5, 0);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      
      // Add base/floor
      const baseGeometry = new THREE.BoxGeometry(12, 1, 14);
      const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(0, -0.5, 0);
      group.add(base);
      
      // Add filename text
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = '24px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 20), 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ 
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });
        
        const labelGeometry = new THREE.PlaneGeometry(4, 1);
        const label = new THREE.Mesh(labelGeometry, material);
        label.position.set(0, 15, 0);
        label.rotation.x = -Math.PI / 4;
        group.add(label);
      }
      
      return group;
    };
    
    // Simple hash function for file names
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      // Ensure positive value
      return Math.abs(hash) % 0xFFFFFF;
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
      
      if (rendererRef.current) {
        // Remove event listeners
        rendererRef.current.domElement.removeEventListener('webglcontextlost', handleContextLost);
        
        // Dispose renderer
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      
      window.removeEventListener('resize', () => {});
      
      if (viewerRef.current) {
        viewerRef.current = null;
      }
      
      // Clear loaded files tracking
      loadedFilesRef.current.clear();
    };
  }, [files, setLoadingError, toast, onModelLoad]);
  
  return (
    <div ref={containerRef} className="w-full h-full" />
  );
};

export default ViewerMain;
