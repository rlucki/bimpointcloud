// Integrate the improved logic with the setWasmPath fix into the Viewer component
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Menu, 
  File,
  X,
  Settings, 
  MaximizeIcon,
  MinimizeIcon,
  Axis3d,
  ZoomIn,
  Layers,
  Eye,
  EyeOff,
  Move,
  Bug
} from "lucide-react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import PointCloudViewer from "@/components/PointCloudViewer";
import ViewerContainer, { HtmlOverlay } from "@/components/ViewerContainer";
import { handleFrameAll as utilsHandleFrameAll, debugViewer } from "@/components/viewer/ViewerUtils";
import ViewerSidebar from "@/components/viewer/ViewerSidebar";
import ViewerControls from "@/components/viewer/ViewerControls";
import ViewerLayout from "@/components/viewer/ViewerLayout";

// Type definitions for the file data
interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  visible?: boolean;
  id?: string;
}

const Viewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [visibleFiles, setVisibleFiles] = useState<{[key: string]: boolean}>({});
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Extract files from location state
  const state = location.state || {};
  const [files, setFiles] = useState<FileData[]>(() => {
    console.log("Initial state:", state);
    const initialFiles = state.files || [];
    
    // Add a single file if no files array but fileType exists
    if (initialFiles.length === 0 && state.fileType) {
      return [{
        fileType: state.fileType,
        fileName: state.fileName || 'Unknown file',
        fileUrl: state.fileUrl || undefined,
        id: `${state.fileName || 'file'}-${Date.now() + Math.random() * 1000}`,
        visible: true
      }];
    }
    
    // Add IDs and visibility to files
    return initialFiles.map((file: FileData) => ({
      ...file,
      id: `${file.fileName}-${Date.now() + Math.random() * 1000}`,
      visible: true
    }));
  });
  const isDemoMode = state.demo || files.length === 0;
  
  // References for the IFC viewer
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const modelRefs = useRef<{[key: string]: any}>({});
  
  // Initialize visibility state for files
  useEffect(() => {
    const initialVisibility: {[key: string]: boolean} = {};
    files.forEach(file => {
      if (file.id) {
        initialVisibility[file.id] = true;
      }
    });
    setVisibleFiles(initialVisibility);
    
    console.log("Files initialized:", files);
  }, []);
  
  // If no files and not in demo mode, redirect to the main page
  useEffect(() => {
    if (!isDemoMode && files.length === 0) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a file first to view it in 3D",
      });
      navigate('/');
    } else {
      console.log("Viewer received:", { files, isDemoMode });
      
      // Simulate loading
      const timer = setTimeout(() => {
        setIsLoading(false);
        
        // If there's an IFC file, initialize the IFC viewer
        const ifcFile = files.find(file => file.fileType === 'ifc');
        if (ifcFile) {
          initializeIfcViewer(ifcFile);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [files, isDemoMode, navigate, toast]);
  
  const initializeIfcViewer = async (fileData: FileData) => {
    if (!containerRef.current) return;
    
    try {
      console.log("Initializing IFC viewer for:", fileData.fileName);
      
      // Create the viewer with enhanced settings
      const viewer = new IfcViewerAPI({
        container: containerRef.current,
        backgroundColor: new THREE.Color(0x222222)
      });
      
      viewerRef.current = viewer;
      
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
            console.warn(`No URL provided for file: ${file.fileName}`);
            // Use example model if no URL is provided
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

  // Updated function to properly toggle IFC model visibility
  const toggleFileVisibility = (fileId: string) => {
    // Update visibility state
    setVisibleFiles(prev => {
      const newState = { ...prev, [fileId]: !prev[fileId] };
      
      // Update IFC model visibility if it's an IFC file
      const model = modelRefs.current[fileId];
      if (model) {
        const isVisible = newState[fileId];
        console.log(`Setting visibility for model ${fileId} to ${isVisible}`);
        
        // Handle the entire model structure
        if (model.mesh) {
          // Set visibility for the main mesh
          model.mesh.visible = isVisible;
          
          // Recursively set visibility for all children
          if (model.mesh.children && model.mesh.children.length > 0) {
            model.mesh.traverse((child: THREE.Object3D) => {
              child.visible = isVisible;
            });
          }
        }
        
        // If the model has an ifcModel property, handle that too
        if (model.ifcModel) {
          model.ifcModel.visible = isVisible;
        }
        
        // Additional handling for other possible model structures
        if (model.geometry) {
          model.visible = isVisible;
        }
        
        // Force scene update
        if (viewerRef.current) {
          viewerRef.current.context.getScene().updateMatrixWorld();
          // Eliminamos la llamada al método update() que no existe en esta versión
        }
        
        console.log("Model visibility updated", { model, isVisible });
      }
      
      return newState;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Could not enter fullscreen mode:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error("Could not exit fullscreen mode:", err);
        });
      }
    }
  };

  const toggleStats = () => {
    setShowStats(prev => !prev);
  };

  // Add a reference for frame-all function
  const frameAllRef = useRef<() => void>(() => {});

  // Fix: Remove the unused parameter to match expected function signature
  const handleFrameAll = () => {
    // Call the frame all function stored in ref
    frameAllRef.current();
  };

  const frameAll = () => {
    // If using IFC Viewer
    if (viewerRef.current) {
      utilsHandleFrameAll(viewerRef);
    }
  };

  // Store frame all function in ref for access from outside Canvas
  useEffect(() => {
    frameAllRef.current = frameAll;
  }, []);
  
  // Use the improved debug viewer utility
  const handleDebug = () => {
    if (viewerRef.current) {
      debugViewer(viewerRef, toast);
    } else {
      console.log("Viewer not initialized");
      console.log("Files:", files);
    }
  };

  const goBack = () => {
    navigate('/');
  };
  
  // If loading, show loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">Loading viewer...</p>
          <p className="text-gray-400 text-sm mt-2">
            {isDemoMode ? "Preparing demo environment" : `Loading ${files.length} file(s)`}
          </p>
        </div>
      </div>
    );
  }
  
  // Get current file URL if available
  const currentFileUrl = files.length > 0 && files[0].fileUrl ? files[0].fileUrl : undefined;
  const currentFileName = files.length > 0 ? files[0].fileName : null;
  
  // Determine the title based on files
  const viewerTitle = files.length > 0 
    ? `3D Viewer - ${files.length} file(s)` 
    : "3D Viewer - Demo Mode";
  
  // Get the current hook instance for the IFC viewer
  const currentViewer = useIFCViewer(
    containerRef,
    files.length > 0 && files[0].fileUrl ? files[0].fileUrl : undefined,
    files.length > 0 ? files[0].fileName : null
  );
  
  return (
    <ViewerLayout
      title={viewerTitle}
      onClose={goBack}
      onToggleFullscreen={toggleFullscreen}
      onDebug={handleDebug}
      isFullscreen={isFullscreen}
      files={files}
      viewer={viewerRef.current}
      fileUrl={currentFileUrl}
      fileName={currentFileName}
      // Pass diagnostic status
      wasmLoaded={currentViewer.wasmLoaded}
      modelLoaded={currentViewer.modelLoaded}
      meshExists={currentViewer.meshExists}
    >
      {/* Main Viewer Area */}
      <div className="flex-1 relative">
        {/* IFC files need the IFC viewer */}
        {files.some(f => f.fileType === 'ifc') && (
          <div 
            ref={containerRef} 
            className="w-full h-full"
          >
            {/* IFC Viewer will be initialized here */}
            
            {/* Show error message if loading failed */}
            {loadingError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="bg-card p-6 rounded-lg max-w-md text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
                  <p className="text-muted-foreground mb-4">{loadingError}</p>
                  <Button onClick={goBack}>Return to Upload</Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* LAS files use React Three Fiber */}
        {(files.some(f => f.fileType === 'las') && !files.some(f => f.fileType === 'ifc')) || files.length === 0 ? (
          <div className="w-full h-full">
            <Canvas>
              <ViewerContainer showStats={showStats}>
                {files.length > 0 ? (
                  files
                    .filter(f => f.fileType === 'las' && f.id && visibleFiles[f.id])
                    .map((file, index) => (
                      <PointCloudViewer
                        key={file.id}
                        url={file.fileUrl}
                        color="#4f46e5"
                        opacity={0.8}
                      />
                    ))
                ) : (
                  // Demo point cloud for empty state
                  <PointCloudViewer />
                )}
              </ViewerContainer>
            </Canvas>
            
            {/* Place HTML overlay outside of Canvas */}
            <HtmlOverlay onFrameAll={handleFrameAll} />
          </div>
        ) : null}
        
        {/* Overlay with instructions */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded pointer-events-none">
          <div className="flex items-center gap-2 text-sm">
            <Axis3d className="h-4 w-4" /> 
            <span>Origin (0,0,0) with X, Y, Z axes</span>
          </div>
        </div>
        
        {/* File info overlay */}
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="bg-[#333333] text-white px-3 py-2 rounded border border-[#444444]">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4" /> 
              <span>
                {files.length > 0 
                  ? `${files.length} file(s) loaded` 
                  : "Demo Mode"}
              </span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Use mouse to navigate: drag to rotate, scroll to zoom
            </div>
          </div>
        </div>
        
        {/* Viewer Controls - now using the separate component */}
        <ViewerControls
          onFrameAll={handleFrameAll}
          onToggleFullscreen={toggleFullscreen}
          onToggleStats={toggleStats}
          isFullscreen={isFullscreen}
        />
      </div>
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Ready</span>
        <span className="ml-auto">3D Viewer</span>
      </footer>
    </ViewerLayout>
  );
};

export default Viewer;
