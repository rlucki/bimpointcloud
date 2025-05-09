
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
          
          setViewerInitialized(true);
          
          // The next step would be to load an IFC file from a URL
          // For demo purposes, we'll show a toast instead since we don't have the actual file URL
          setLoadingModel(false);
          toast({
            title: "IFC Viewer Initialized",
            description: "Ready to load IFC models.",
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
            // Mock rendering for LAS files
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#f0f4ff');
            gradient.addColorStop(1, '#e0e7ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw point cloud placeholder
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            ctx.fillStyle = 'rgba(79, 70, 229, 0.5)';
            for (let i = 0; i < 1000; i++) {
              const x = centerX + (Math.random() - 0.5) * 300;
              const y = centerY + (Math.random() - 0.5) * 300;
              ctx.beginPath();
              ctx.arc(x, y, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Add a label
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("LAS Point Cloud", centerX, centerY - 120);
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
            className="w-full h-[600px]"
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
