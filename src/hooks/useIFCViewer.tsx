import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";
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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [meshExists, setMeshExists] = useState<boolean | null>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const modelRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Initialize viewer
  useEffect(() => {
    let viewer: IfcViewerAPI | null = null;
    
    const initViewer = async () => {
      try {
        if (!containerRef.current) return;
        
        console.log("Initializing IFC viewer...");
        
        // Create the viewer
        viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        // Store the reference to the viewer correctly
        viewerRef.current = viewer;
        
        // Set up camera
        viewer.context.ifcCamera.cameraControls.setPosition(5, 5, 5);
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Add grid for better spatial reference
        const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
        viewer.context.getScene().add(grid);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        viewer.context.getScene().add(axesHelper);
        
        // Add lighting for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        viewer.context.getScene().add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 3);
        viewer.context.getScene().add(directionalLight);
        
        setIsInitialized(true);
        console.log("Viewer initialized successfully");
        
        // IMPORTANT: Set WASM path immediately after initialization
        try {
          await viewer.IFC.setWasmPath("/wasm/");
          console.log("WASM path set successfully");
          
          // Add a visual reference for debugging
          const geometry = new THREE.SphereGeometry(0.5, 16, 16);
          const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(0, 0, 0);
          viewer.context.getScene().add(sphere);
          console.log("Added reference sphere at origin");
        } catch (wasmError) {
          console.error("Error setting WASM path:", wasmError);
          setError("Failed to set WebAssembly path. Check if WASM files are available.");
        }
        
        // Try to load model if URL is provided
        if (fileUrl) {
          await loadModel(viewer, fileUrl);
        } else {
          // Add a demo cube if no model
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0x4f46e5, 
            wireframe: true 
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          viewer.context.getScene().add(cube);
          
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error initializing IFC viewer:", e);
        setError("Failed to initialize IFC viewer. Please try again.");
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Visualization error",
          description: "Could not initialize the IFC viewer.",
        });
      }
    };
    
    // Enhanced helper function to load model with better mesh detection
    const loadModel = async (viewer: IfcViewerAPI, url: string) => {
      try {
        console.log("Loading IFC model from URL:", url);
        
        // Verify the model URL is valid
        if (!url || !url.trim()) {
          throw new Error("Invalid model URL");
        }
        
        console.log("Attempting to load IFC model...");
        
        // Use try/catch to better handle model loading errors
        try {
          // More detailed loading process
          console.log("Starting IFC loading process...");
          const model = await viewer.IFC.loadIfcUrl(url);
          console.log("IFC loading process completed:", model);
          
          // Store the model reference
          modelRef.current = model;
          
          // Update model loaded state
          setModelLoaded(true);
          
          // Log the model structure to understand what's available
          console.log("Model structure:", JSON.stringify({
            hasModelProperty: !!model,
            modelKeys: model ? Object.keys(model) : 'null',
            hasMesh: model && model.mesh ? true : false,
            meshType: model && model.mesh ? model.mesh.constructor.name : 'N/A',
            meshChildren: model && model.mesh && model.mesh.children ? model.mesh.children.length : 'N/A'
          }));
          
          // Check if model.mesh exists and validate it
          if (model && model.mesh) {
            console.log("Mesh found in model!");
            setMeshExists(true);
            
            // Calculate model bounds and log them for debugging
            const box = new THREE.Box3().setFromObject(model.mesh);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            
            console.log("Model bounds:", {
              min: box.min,
              max: box.max,
              size: size.toArray(),
              center: center.toArray()
            });
            
            // Check for extremely large coordinates (likely UTM or EPSG format)
            if (box.min.length() > 100000 || box.max.length() > 100000) {
              console.warn("Model has extremely large coordinates - likely in UTM or EPSG format. Recentering...");
              model.mesh.position.sub(center);
              console.log("Model recentered to origin");
            }
            
            // Check for millimeter scale
            if (size.length() > 10000) {
              console.warn("Model appears to be in millimeters - scaling down by 0.001");
              model.mesh.scale.setScalar(0.001);
              console.log("Model rescaled from mm to m");
            }
            
            // Force update material to ensure visibility
            if (model.mesh.material) {
              if (Array.isArray(model.mesh.material)) {
                model.mesh.material.forEach(mat => {
                  mat.needsUpdate = true;
                  mat.transparent = false;
                  mat.opacity = 1.0;
                });
              } else {
                model.mesh.material.needsUpdate = true;
                model.mesh.material.transparent = false;
                model.mesh.material.opacity = 1.0;
              }
              console.log("Updated material properties for visibility");
            }
            
            // Ensure the mesh and its children are visible
            model.mesh.visible = true;
            model.mesh.traverse((child: THREE.Object3D) => {
              child.visible = true;
            });
            
            // Make sure the mesh is actually in the scene
            const scene = viewer.context.getScene();
            if (!scene.getObjectById(model.mesh.id)) {
              console.log("Mesh not found in scene, adding it manually");
              scene.add(model.mesh);
            }
            
            // Frame the model using our improved utility function
            await frameIFCModel(viewerRef, model.mesh);
          } else {
            console.warn("Model loaded but mesh is not available!");
            setMeshExists(false);
            
            // Try to find any IFC-related objects in the scene
            const scene = viewer.context.getScene();
            let ifcFound = false;
            
            scene.traverse((object: THREE.Object3D) => {
              if (object.userData && object.userData.modelID !== undefined) {
                console.log("Found IFC object in scene:", object);
                ifcFound = true;
                
                // Try to frame this object
                try {
                  viewer.context.ifcCamera.cameraControls.fitToSphere(object, true);
                } catch (e) {
                  console.error("Error framing IFC object:", e);
                }
              }
            });
            
            if (!ifcFound) {
              console.warn("No IFC objects found in scene after loading");
            }
          }
          
          setIsLoading(false);
          
          toast({
            title: "Model Loaded",
            description: meshExists ? 
              `Successfully loaded ${fileName || 'model'} with geometry` :
              `Model ${fileName || 'file'} loaded but no 3D geometry found`,
            variant: meshExists ? "default" : "secondary",
          });
          
        } catch (loadError) {
          console.error("Error during IFC.loadIfcUrl:", loadError);
          throw new Error(`IFC loading failed: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
        }
      } catch (e) {
        console.error("Error loading IFC model:", e);
        setError("Failed to load IFC model. The file might be corrupted or in an unsupported format.");
        setIsLoading(false);
        setModelLoaded(false);
        setMeshExists(false);
        
        // Add a demo cube to show that the viewer is working
        if (viewer) {
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0x4f46e5, 
            wireframe: true 
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          viewer.context.getScene().add(cube);
        }
        
        toast({
          variant: "destructive",
          title: "Model loading error",
          description: `Error loading IFC model: ${e instanceof Error ? e.message : 'Unknown error'}`,
        });
      }
    };
    
    // Only initialize viewer when container is available
    if (containerRef.current) {
      initViewer();
    } else {
      console.warn("Container reference not available");
      setIsLoading(false);
      setError("Viewer container not found");
    }
    
    // Clean up
    return () => {
      if (viewer) {
        try {
          viewer.dispose();
        } catch (e) {
          console.error("Error disposing viewer:", e);
        }
      }
    };
  }, [containerRef, fileUrl, fileName, toast]);
  
  // Frame all objects in view using the improved method
  const frameAll = async () => {
    if (viewerRef.current) {
      try {
        if (modelRef.current && modelRef.current.mesh) {
          // Use our improved framing utility
          await frameIFCModel(viewerRef, modelRef.current.mesh);
        } else {
          // Otherwise frame the whole scene
          const scene = viewerRef.current.context.getScene();
          viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
        }
        console.log("Framed all objects");
      } catch (e) {
        console.error("Error framing objects:", e);
      }
    }
  };
  
  // Debug function
  const debug = () => {
    if (viewerRef.current) {
      console.log("Viewer state:", viewerRef.current);
      console.log("Scene:", viewerRef.current.context.getScene());
      console.log("Model:", modelRef.current);
      
      // Get model by ID from the IFC manager
      try {
        // Log all modelIDs to help debug
        const allIds = Object.keys(viewerRef.current.IFC.context.items.ifcModels || {});
        console.log("All IFC model IDs:", allIds);
        
        // Try to get the first model ID
        if (modelRef.current && modelRef.current.modelID !== undefined) {
          const modelID = modelRef.current.modelID;
          console.log(`Attempting to get model with ID: ${modelID}`);
          const ifcModel = viewerRef.current.IFC.getIfcModel(modelID);
          console.log("IFC model by ID:", ifcModel);
        }
      } catch (e) {
        console.error("Error getting model by ID:", e);
      }
      
      // Add a visible marker at origin for debugging
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(0, 0, 0);
      viewerRef.current.context.getScene().add(sphere);
      toast({
        title: "Debug info",
        description: "Check console for viewer state",
      });
    } else {
      console.log("Viewer not initialized");
      toast({
        variant: "destructive",
        title: "Debug info",
        description: "Viewer not initialized",
      });
    }
  };
  
  return {
    viewer: viewerRef.current,
    isInitialized,
    isLoading,
    error,
    modelLoaded,
    meshExists,
    frameAll,
    debug
  };
};
