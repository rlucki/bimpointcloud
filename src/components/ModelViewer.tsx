import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Box, Eye, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import IfcViewerContainer from "./viewer/IfcViewerContainer";
import ViewerHeader from "./viewer/ViewerHeader";
import ViewerStatus from "./viewer/ViewerStatus";
import ViewerDropArea from "./viewer/ViewerDropArea";
import ViewerPlaceholder from "./viewer/ViewerPlaceholder";
import ViewerError from "./viewer/ViewerError";
import ViewerLoading from "./viewer/ViewerLoading";
import ViewerCanvas from "./viewer/ViewerCanvas";
import ViewerStatusBar from "./viewer/ViewerStatusBar";
import { useIFCViewer } from "@/hooks/useIFCViewer";
import { handleFrameAll, debugViewer } from "./viewer/ViewerUtils";

interface ModelViewerProps {
  fileType: "ifc" | "las" | null;
  fileName: string | null;
  fileUrl?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ fileType, fileName, fileUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingModel, setLoadingModel] = useState(true);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing...");

  useEffect(() => {
    // Log info for debugging
    console.log("ModelViewer received:", { fileType, fileName, fileUrl });
    
    if (!fileType && !fileName) {
      setLoadingModel(false);
      return;
    }

    setLoadingModel(true);
    setError(null);
    setModelLoaded(false);

    if (fileType === 'ifc') {
      // Initialize IFC viewer when component mounts
      let viewer: IfcViewerAPI | null = null;
      
      const initIFCViewer = async () => {
        try {
          if (!containerRef.current) return;
          
          console.log("Initializing IFC viewer...");
          setStatusMessage("Initializing IFC viewer...");
          
          // Create the viewer
          viewer = new IfcViewerAPI({
            container: containerRef.current,
            backgroundColor: new THREE.Color(0x222222)
          });
          
          // Store viewer reference
          viewerRef.current = viewer;
          
          // Set up camera
          viewer.context.ifcCamera.cameraControls.setPosition(5, 5, 5);
          viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
          
          setViewerInitialized(true);
          setStatusMessage("Viewer initialized");
          
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
          
          // Try to load the IFC file if URL is provided
          if (fileUrl) {
            try {
              console.log("Loading IFC model from URL:", fileUrl);
              setStatusMessage("Loading model from URL...");
              const model = await viewer.IFC.loadIfcUrl(fileUrl);
              console.log("IFC model loaded successfully:", model);
              setStatusMessage("Model loaded successfully");
              
              // Fit to model after loading - Fix: Ensure mesh is properly passed to fitToSphere
              setTimeout(() => {
                if (viewer && model && model.mesh) {
                  // Fix: Pass the model.mesh as required first argument
                  viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
                }
              }, 500);
              
              setModelLoaded(true);
              
              toast({
                title: "Model Loaded",
                description: `Successfully loaded ${fileName}`,
              });
            } catch (e) {
              console.error("Error loading IFC model:", e);
              setError("Failed to load IFC model. The file might be corrupted or in an unsupported format.");
              setStatusMessage("Error loading model");
              
              // Add a demo cube to show that the viewer is working
              const geometry = new THREE.BoxGeometry(2, 2, 2);
              const material = new THREE.MeshStandardMaterial({ 
                color: 0x4f46e5, 
                wireframe: true 
              });
              const cube = new THREE.Mesh(geometry, material);
              cube.position.set(0, 1, 0);
              viewer.context.getScene().add(cube);
            }
          } else {
            // If no URL, add a demo cube
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({ 
              color: 0x4f46e5, 
              wireframe: true 
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 1, 0);
            viewer.context.getScene().add(cube);
          }
          
          setLoadingModel(false);
          toast({
            title: "Viewer Initialized",
            description: "3D environment ready",
          });
          
        } catch (e) {
          console.error("Error initializing IFC viewer:", e);
          setError("Failed to initialize IFC viewer. Please try again.");
          setLoadingModel(false);
          setStatusMessage("Initialization error");
          toast({
            variant: "destructive",
            title: "Visualization error",
            description: "Could not initialize the IFC viewer.",
          });
        }
      };

      initIFCViewer();
      
      // Clean up viewer on unmount
      return () => {
        if (viewer) {
          try {
            viewer.dispose();
          } catch (e) {
            console.error("Error disposing viewer:", e);
          }
        }
      };
    } else if (fileType === 'las') {
      // For LAS files, we'll continue to use the canvas fallback
      setStatusMessage("Preparing LAS viewer...");
      const loadTimeout = setTimeout(() => {
        setLoadingModel(false);
        setStatusMessage("LAS viewer ready");
      }, 800);
      
      return () => clearTimeout(loadTimeout);
    }
  }, [fileType, fileName, fileUrl, toast]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'ifc' || fileExtension === 'las') {
      // Process file
      toast({
        title: "File received",
        description: `Processing ${file.name}...`,
      });
      
      // In a real implementation, we would load this file into the viewer
      // For now, we'll just set the file info and reload the viewer
      const newFileType = fileExtension as "ifc" | "las";
      navigate('/viewer', { 
        state: { 
          fileType: newFileType, 
          fileName: file.name,
        }
      });
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported file format",
        description: "Please upload an IFC or LAS file.",
      });
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use the separated utility function for debugging
  const debug = () => {
    debugViewer(viewerRef, toast);
  };

  // Use the separated utility function for frame all
  const frameAllObjects = (target?: THREE.Object3D) => {
    handleFrameAll(viewerRef, target);
  };

  // Handle scene ready from canvas component
  const handleSceneReady = (scene: THREE.Scene) => {
    console.log("Canvas scene is ready");
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
      <ViewerHeader 
        navigate={navigate} 
        openFileDialog={openFileDialog} 
        fileInputRef={fileInputRef}
        handleFileInputChange={handleFileInputChange}
        debug={debug}
      />
      
      <Card 
        className={`relative overflow-hidden border shadow-md transition-all duration-300 flex-1 ${isDragging ? 'border-primary bg-primary/5' : 'bg-card'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {loadingModel ? (
          <ViewerLoading fileName={fileName} />
        ) : error ? (
          <ViewerError error={error} navigate={navigate} />
        ) : fileType === 'ifc' ? (
          <IfcViewerContainer 
            containerRef={containerRef}
            viewerInitialized={viewerInitialized}
            isDragging={isDragging}
            modelLoaded={modelLoaded}
            fileName={fileName}
          />
        ) : (
          <ViewerCanvas 
            canvasRef={canvasRef} 
            isDragging={isDragging}
            fileType={fileType}
            fileName={fileName}
            onSceneReady={handleSceneReady}
          />
        )}

        {!fileType && !fileName && !loadingModel && !error && (
          <ViewerPlaceholder openFileDialog={openFileDialog} />
        )}
      </Card>
      
      <ViewerStatusBar 
        status={statusMessage}
        fileName={fileName}
        fileType={fileType}
        isLoading={loadingModel}
        info={fileType === "ifc" ? "IFC Viewer" : fileType === "las" ? "LAS Viewer" : "3D Viewer"}
      />
    </div>
  );
};

export default ModelViewer;
