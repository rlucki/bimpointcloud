
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

        // Load all IFC models
        for (const file of files.filter(f => f.fileType === 'ifc')) {
          await loadIfcFile(viewer, file);
        }
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

    const loadIfcFile = async (viewer: IfcViewerAPI, file: any) => {
      try {
        if (file.fileUrl) {
          // Set WebAssembly path before loading
          await viewer.IFC.setWasmPath("/wasm/");
          
          // Load the model
          const model = await viewer.IFC.loadIfcUrl(file.fileUrl);
          console.log("IFC model loaded:", model);
          
          // Optimize the model if needed
          if (model && model.mesh) {
            optimizeModel(viewer, model);
          }
          
          // Notify parent component about loaded model
          if (file.id) {
            onModelLoad(file.id, model);
          }
          
          toast({
            title: "Model loaded",
            description: `Successfully loaded ${file.fileName}`,
          });
        } else {
          await loadExampleModel(viewer);
        }
      } catch (e) {
        console.error(`Error loading model ${file.fileName}:`, e);
        setLoadingError(`Error loading model ${file.fileName}.`);
      }
    };
    
    const loadExampleModel = async (viewer: IfcViewerAPI) => {
      try {
        const exampleUrl = "https://examples.ifcjs.io/models/ifc/SametLibrary.ifc";
        await viewer.IFC.setWasmPath("/wasm/");
        const model = await viewer.IFC.loadIfcUrl(exampleUrl);
        
        if (model && model.mesh) {
          optimizeModel(viewer, model);
        }
        
        toast({
          title: "Example model loaded",
          description: "Using example IFC model",
        });
      } catch (e) {
        console.error("Failed to load example:", e);
        setLoadingError("Could not load example model.");
      }
    };
    
    const optimizeModel = (viewer: IfcViewerAPI, model: any) => {
      // Handle model position and scale issues
      const box = new THREE.Box3().setFromObject(model.mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      
      // Fix extremely large coordinates
      if (box.min.length() > 100000 || box.max.length() > 100000) {
        model.mesh.position.sub(center);
      }
      
      // Fix millimeter scale
      if (size.length() > 10000) {
        model.mesh.scale.setScalar(0.001);
      }
      
      // Adjust camera
      const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
      camera.near = 0.1;
      camera.far = Math.max(10000, size.length() * 20);
      camera.updateProjectionMatrix();
      
      // Frame model for proper viewing
      setTimeout(() => {
        viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
      }, 500);
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
