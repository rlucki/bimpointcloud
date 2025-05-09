
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Box, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

interface ModelViewerProps {
  fileType: "ifc" | "las" | null;
  fileName: string | null;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ fileType, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingModel, setLoadingModel] = useState(true);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Log info for debugging
    console.log("ModelViewer received:", { fileType, fileName });
    
    if (!fileType || !fileName) {
      toast({
        variant: "destructive",
        title: "No model to display",
        description: "Please upload an IFC or LAS file first.",
      });
      return;
    }

    setLoadingModel(true);
    setError(null);

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
            backgroundColor: new THREE.Color(0xf0f4ff)
          });
          
          // Center the model at 0,0,0
          viewer.context.getScene().position.set(0, 0, 0);
          
          // Set up camera
          viewer.context.ifcCamera.cameraControls.setPosition(5, 5, 5);
          viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
          
          setViewerInitialized(true);
          
          // Add grid for better spatial reference
          const grid = new THREE.GridHelper(50, 50);
          viewer.context.getScene().add(grid);
          
          // Add axes helper
          const axesHelper = new THREE.AxesHelper(5);
          viewer.context.getScene().add(axesHelper);
          
          // The next step would be to load an IFC file from a URL
          // For now, we'll show a message in the viewer
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          viewer.context.getScene().add(cube);
          
          // Add a text label
          const textDiv = document.createElement('div');
          textDiv.className = 'absolute bottom-4 left-4 bg-white p-2 rounded text-sm';
          textDiv.textContent = `Ready to load: ${fileName}`;
          containerRef.current.appendChild(textDiv);
          
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
            gradient.addColorStop(0, '#f0f4ff');
            gradient.addColorStop(1, '#e0e7ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid for better spatial reference
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
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
            ctx.fillStyle = '#1e293b';
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
            ctx.fillText(`File: ${fileName}`, centerX, 40);
          }
        }
      }, 800);
      
      return () => clearTimeout(loadTimeout);
    }
  }, [fileType, fileName, toast]);

  const handleViewIn3D = () => {
    navigate('/viewer', { state: { fileType, fileName } });
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        <h2 className="text-2xl font-semibold">3D Model Viewer</h2>
        
        <Button variant="outline" onClick={handleViewIn3D} className="flex items-center gap-1">
          <Box className="h-4 w-4" /> 
          Open Full Viewer
        </Button>
      </div>
      
      <Card className="relative overflow-hidden border bg-card shadow-md">
        {(!fileType || !fileName) ? (
          <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
            <Box className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Models Available</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload IFC or LAS files from the main page to visualize them in 3D.
            </p>
            <Button onClick={() => navigate('/')}>Go to Upload Page</Button>
          </div>
        ) : loadingModel ? (
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
            {/* IFC Viewer will be initialized here */}
          </div>
        ) : (
          <div className="p-4">
            <canvas
              ref={canvasRef}
              width={1000}
              height={600}
              className="w-full h-full rounded-md"
            ></canvas>
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
