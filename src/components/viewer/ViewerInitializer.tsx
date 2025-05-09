
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
import { FileData } from "./ViewerFileManager";
import { handleFrameAll as utilsHandleFrameAll } from "./ViewerUtils";

interface ViewerInitializerProps {
  fileData: FileData;
  containerRef: React.RefObject<HTMLDivElement>;
  onModelLoaded: () => void;
  onError: (error: string) => void;
}

const ViewerInitializer: React.FC<ViewerInitializerProps> = ({ 
  fileData, 
  containerRef, 
  onModelLoaded,
  onError
}) => {
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const modelRefs = useRef<{[key: string]: any}>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!containerRef.current) return;
    
    const initializeViewer = async () => {
      try {
        console.log("Initializing IFC viewer for:", fileData.fileName);
        
        // Create the viewer with enhanced settings
        const viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        // Assign viewer to the reference
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
        
        // IMPORTANTE: Configurar la ruta de WASM antes de cargar cualquier modelo
        try {
          await viewer.IFC.setWasmPath("/wasm/");
          console.log("WASM path set for IFC parser");
        } catch (wasmError) {
          console.error("Error setting WASM path:", wasmError);
          onError("Failed to set WebAssembly path. Check if WASM files are available in /wasm/ directory.");
          toast({
            variant: "destructive",
            title: "WASM error",
            description: "Could not load WebAssembly modules required for IFC parsing",
          });
          return;
        }
        
        // Load the IFC model if URL is provided
        if (fileData.fileUrl) {
          try {
            console.log(`Loading IFC model: ${fileData.fileName} from URL: ${fileData.fileUrl}`);
            const model = await viewer.IFC.loadIfcUrl(fileData.fileUrl);
            
            // Store reference to the model
            if (fileData.id) {
              modelRefs.current[fileData.id] = model;
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
            
            onModelLoaded();
            toast({
              title: "Model loaded",
              description: `Successfully loaded ${fileData.fileName}`,
            });
          } catch (e) {
            console.error(`Error loading IFC model ${fileData.fileName}:`, e);
            onError(`Error loading model ${fileData.fileName}. The file might be corrupted or inaccessible.`);
            toast({
              variant: "destructive",
              title: `Error loading ${fileData.fileName}`,
              description: "The IFC model could not be loaded."
            });
          }
        } else {
          // Use example model if no URL is provided
          const exampleUrl = "https://examples.ifcjs.io/models/ifc/SametLibrary.ifc";
          console.log(`Using example IFC model from: ${exampleUrl}`);
          
          toast({
            title: "Loading example",
            description: "No file URL provided, loading example model",
          });
          
          try {
            // Try to load example model
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
            
            onModelLoaded();
          } catch (e) {
            console.error("Error loading example model:", e);
            onError("Could not load example model. Check network connection.");
          }
        }
      } catch (e) {
        console.error("Error initializing IFC viewer:", e);
        onError("Failed to initialize the viewer. Please try again.");
        toast({
          variant: "destructive",
          title: "Viewer initialization failed",
          description: "Could not initialize the 3D viewer.",
        });
      }
    };
    
    initializeViewer();
    
    // Clean up function
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (e) {
          console.error("Error disposing viewer:", e);
        }
      }
    };
  }, [fileData, containerRef, toast, onModelLoaded, onError]);

  return null; // This is a logic component, it doesn't render anything
};

export default ViewerInitializer;
