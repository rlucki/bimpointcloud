import React, { useEffect } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
import ViewerErrorOverlay from "./ViewerErrorOverlay";

interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  visible?: boolean;
  id?: string;
}

interface IFCViewerContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  viewerRef: React.RefObject<IfcViewerAPI | null>;
  modelRefs: React.MutableRefObject<{[key: string]: any}>;
  files: FileData[];
  loadingError: string | null;
  setLoadingError: (error: string | null) => void;
  onBack: () => void;
}

const IfcViewerContainer: React.FC<IFCViewerContainerProps> = ({
  containerRef,
  viewerRef,
  modelRefs,
  files,
  loadingError,
  setLoadingError,
  onBack
}) => {
  const { toast } = useToast();

  const initializeIfcViewer = async (fileData: FileData) => {
    if (!containerRef.current) return;
    
    try {
      console.log("Initializing IFC viewer for:", fileData.fileName);
      
      // Create the viewer with enhanced settings
      const viewer = new IfcViewerAPI({
        container: containerRef.current,
        backgroundColor: new THREE.Color(0x222222)
      });
      
      // Correctly assign to viewerRef.current
      if (viewerRef) {
        viewerRef.current = viewer;
      }
      
      // Set WASM path with dynamic base URL
      const wasmPath = import.meta.env.BASE_URL.replace(/\/$/, '') + '/wasm/';
      console.log("Setting WASM path to:", wasmPath);
      await viewer.IFC.setWasmPath(wasmPath);
      
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
      
      // Add better lighting for IFC models
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      viewer.context.getScene().add(ambientLight);
      
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight1.position.set(5, 10, 7);
      viewer.context.getScene().add(directionalLight1);
      
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-5, 5, -5);
      viewer.context.getScene().add(directionalLight2);
      
      // Add a reference cube at origin to make sure the scene is rendering
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000, 
        wireframe: true 
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0.3, 0);
      viewer.context.getScene().add(cube);
      
      // Load all IFC models
      await loadIFCModels(viewer, files);
      
    } catch (e) {
      console.error("Error initializing IFC viewer:", e);
      setLoadingError("Failed to initialize the viewer. Please try again.");
      toast({
        variant: "destructive",
        title: "Viewer initialization failed",
        description: "Could not initialize the 3D viewer.",
      });
    }
  };

  const loadIFCModels = async (viewer: IfcViewerAPI, files: FileData[]) => {
    for (const file of files.filter(f => f.fileType === 'ifc')) {
      try {
        console.log(`Loading IFC model: ${file.fileName} from URL: ${file.fileUrl}`);
        
        if (file.fileUrl) {
          // Try loading the file
          const model = await viewer.IFC.loadIfcUrl(file.fileUrl);
          
          // Store reference to the model
          if (file.id) {
            modelRefs.current[file.id] = model;
          }
          
          console.log("IFC model loaded successfully:", model);
          
          // Calculate model bounds and handle potential issues with position/scale
          if (model && model.mesh) {
            const box = new THREE.Box3().setFromObject(model.mesh);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            
            console.table({
              min: box.min,        // minimum coordinate
              max: box.max,        // maximum coordinate
              size,                // length × height × width
              center               // geometric center
            });
            
            // Handle extremely large coordinates (UTM/EPSG format)
            if (box.min.length() > 100000 || box.max.length() > 100000) {
              console.warn("Model has extremely large coordinates - recentering");
              model.mesh.position.sub(center); // Recenter the model
            }
            
            // Handle models in millimeters
            if (size.length() > 10000) {
              console.warn("Model appears to be in millimeters - scaling down");
              model.mesh.scale.setScalar(0.001); // Convert mm to m
            }
            
            // Adjust camera planes for the scene scale
            const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
            camera.near = 0.1;
            camera.far = Math.max(10000, size.length() * 20);
            camera.updateProjectionMatrix();
            console.log("Camera near/far adjusted:", {near: camera.near, far: camera.far});
            
            // Frame the model for proper viewing
            setTimeout(() => {
              if (viewer && model && model.mesh) {
                viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
                viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
              }
            }, 500);
          }
          
          toast({
            title: "Model loaded",
            description: `Successfully loaded ${file.fileName}`,
          });
        } else {
          await loadExampleModel(viewer);
        }
      } catch (e) {
        console.error(`Error loading IFC model ${file.fileName}:`, e);
        setLoadingError(`Error loading model ${file.fileName}. The file might be corrupted or inaccessible.`);
        toast({
          variant: "destructive",
          title: `Error loading ${file.fileName}`,
          description: "The IFC model could not be loaded."
        });
      }
    }
  };

  const loadExampleModel = async (viewer: IfcViewerAPI) => {
    const exampleUrl = "https://examples.ifcjs.io/models/ifc/SametLibrary.ifc";
    console.log(`Using example IFC model from: ${exampleUrl}`);
    
    toast({
      title: "Loading example",
      description: "No file URL provided, loading example model",
    });
    
    try {
      // IMPORTANT: Set the WebAssembly path first
      await viewer.IFC.setWasmPath("/wasm/");
      console.log("WASM path set for example model");
      
      const model = await viewer.IFC.loadIfcUrl(exampleUrl);
      console.log("Example IFC model loaded successfully");
      
      // Handle model positioning and framing
      if (model && model.mesh) {
        const box = new THREE.Box3().setFromObject(model.mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Recenter if needed
        if (center.length() > 100) {
          model.mesh.position.sub(center);
        }
        
        // Fit to model
        setTimeout(() => {
          viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
          viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
        }, 500);
      }
    } catch (e) {
      console.error("Error loading example model:", e);
      setLoadingError("Could not load example model. Check network connection.");
    }
  };

  useEffect(() => {
    const ifcFile = files.find(file => file.fileType === 'ifc');
    if (ifcFile) {
      initializeIfcViewer(ifcFile);
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    >
      {/* Show error message if loading failed */}
      <ViewerErrorOverlay error={loadingError} onBack={onBack} />
    </div>
  );
};

export default IfcViewerContainer;
