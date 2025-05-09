
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Box, Eye, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

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
              const model = await viewer.IFC.loadIfcUrl(fileUrl);
              console.log("IFC model loaded successfully:", model);
              
              // Fit to model after loading
              setTimeout(() => {
                viewer?.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
              }, 500);
              
              setModelLoaded(true);
              
              toast({
                title: "Model Loaded",
                description: `Successfully loaded ${fileName}`,
              });
            } catch (e) {
              console.error("Error loading IFC model:", e);
              setError("Failed to load IFC model. The file might be corrupted or in an unsupported format.");
              
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
      // For LAS files, we'll continue to use the canvas fallback for now
      const loadTimeout = setTimeout(() => {
        setLoadingModel(false);
        
        // Initialize canvas rendering for LAS
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#222222');
            gradient.addColorStop(1, '#333333');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid for better spatial reference
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            
            // Draw vertical grid lines
            for (let x = 0; x <= canvas.width; x += 50) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            
            // Draw horizontal grid lines
            for (let y = 0; y <= canvas.height; y += 50) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }

            // Draw coordinate axes
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // X axis (red)
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + 100, centerY);
            ctx.stroke();
            
            // Y axis (green)
            ctx.strokeStyle = 'green';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, centerY - 100);
            ctx.stroke();
            
            // Z axis (blue)
            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX - 50, centerY + 50);
            ctx.stroke();
            
            // Draw point cloud placeholder centered at origin
            ctx.fillStyle = 'rgba(79, 70, 229, 0.5)';
            const originX = canvas.width / 2;
            const originY = canvas.height / 2;
            
            for (let i = 0; i < 1000; i++) {
              const x = originX + (Math.random() - 0.5) * 300;
              const y = originY + (Math.random() - 0.5) * 300;
              ctx.beginPath();
              ctx.arc(x, y, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Add coordinate labels
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            
            // X axis label
            ctx.fillText("X", centerX + 110, centerY + 15);
            
            // Y axis label
            ctx.fillText("Y", centerX - 15, centerY - 110);
            
            // Z axis label
            ctx.fillText("Z", centerX - 60, centerY + 65);
            
            // Origin label
            ctx.fillText("Origin (0,0,0)", centerX, centerY + 20);
            
            // Add a file info label
            ctx.fillText(fileName ? `File: ${fileName}` : 'No file loaded', centerX, 40);
          }
        }
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

  // Debugging function to show model status
  const debug = () => {
    if (viewerRef.current) {
      console.log("Viewer state:", viewerRef.current);
      console.log("Scene:", viewerRef.current.context.getScene());
      console.log("Camera position:", viewerRef.current.context.ifcCamera.cameraControls.getPosition());
      console.log("Model loaded:", modelLoaded);
      
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
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        <h2 className="text-2xl font-semibold">3D Model Viewer</h2>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={openFileDialog} className="flex items-center gap-1">
            <Box className="h-4 w-4" /> 
            Open File
            <input 
              ref={fileInputRef}
              type="file"
              accept=".ifc,.las"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </Button>
          {process.env.NODE_ENV !== 'production' && (
            <Button variant="ghost" onClick={debug}>Debug</Button>
          )}
        </div>
      </div>
      
      <Card 
        className={`relative overflow-hidden border shadow-md transition-all duration-300 ${isDragging ? 'border-primary bg-primary/5' : 'bg-card'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {loadingModel ? (
          <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <h3 className="text-xl font-medium mb-2">Loading Model</h3>
            <p className="text-muted-foreground">Preparing to visualize {fileName}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-xl font-medium mb-2 text-red-500">Error</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/')} className="mt-4">Return to Upload</Button>
          </div>
        ) : fileType === 'ifc' ? (
          <div 
            ref={containerRef} 
            className="w-full h-[600px] relative"
            style={{ visibility: viewerInitialized ? 'visible' : 'hidden' }}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10">
                <div className="text-center p-6 bg-card rounded-lg shadow">
                  <Eye className="mx-auto h-12 w-12 text-primary mb-2" />
                  <p className="text-lg font-medium">Drop to load file</p>
                </div>
              </div>
            )}
            
            {/* Status indicator */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
              {modelLoaded ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  Model loaded: {fileName}
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  Viewer ready - No model loaded
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 relative">
            <canvas
              ref={canvasRef}
              width={1000}
              height={600}
              className="w-full h-full rounded-md"
            ></canvas>
            {isDragging && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10">
                <div className="text-center p-6 bg-card rounded-lg shadow">
                  <Eye className="mx-auto h-12 w-12 text-primary mb-2" />
                  <p className="text-lg font-medium">Drop to load file</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!fileType && !fileName && !loadingModel && !error && (
          <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
            <Box className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-xl font-medium mb-2">Drag & Drop to View</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Drag and drop your IFC or LAS files here to visualize them, or click "Open File" above.
            </p>
            <Button onClick={openFileDialog}>Select File</Button>
          </div>
        )}
      </Card>
      
      <div className="mt-6 flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Info className="h-4 w-4 mr-1" /> 
          {fileType === 'ifc' 
            ? "IFC Viewer powered by web-ifc-viewer and Three.js"
            : "LAS point cloud visualization requires additional configuration."}
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;
