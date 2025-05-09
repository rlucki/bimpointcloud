
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Box, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModelViewerProps {
  fileType: "ifc" | "las" | null;
  fileName: string | null;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ fileType, fileName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingModel, setLoadingModel] = useState(true);

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

    // Simulate model loading with a delay
    const loadTimeout = setTimeout(() => {
      setLoadingModel(false);
      
      // Initialize canvas rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Mock rendering to show something is working
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Background gradient
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#f0f4ff');
          gradient.addColorStop(1, '#e0e7ff');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw grid
          ctx.strokeStyle = 'rgba(79, 70, 229, 0.2)';
          ctx.lineWidth = 1;
          const gridSize = 40;
          for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          
          for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          
          // Draw model placeholder
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          if (fileType === 'ifc') {
            // IFC building placeholder
            ctx.fillStyle = 'rgba(79, 70, 229, 0.7)';
            ctx.fillRect(centerX - 100, centerY - 100, 200, 200);
            ctx.fillStyle = 'rgba(79, 70, 229, 0.5)';
            ctx.fillRect(centerX - 120, centerY - 80, 240, 160);
            
            // Add a label
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("IFC Building Model", centerX, centerY);
          } else {
            // LAS point cloud placeholder
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
          }
          
          // Draw file info
          ctx.fillStyle = '#1e293b';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${fileType.toUpperCase()} File: ${fileName}`, centerX, 40);
          ctx.font = '14px sans-serif';
          ctx.fillText('(3D visualization would appear here with three.js)', centerX, canvas.height - 30);
        }
      }
    }, 800); // Simulate loading time
    
    return () => clearTimeout(loadTimeout);
  }, [fileType, fileName, toast]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        <h2 className="text-2xl font-semibold">3D Model Viewer</h2>
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
            <h3 className="text-xl font-medium mb-2">Cargando Modelo</h3>
            <p className="text-muted-foreground">Preparando la visualización del modelo {fileName}</p>
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
          <span>This is a placeholder. Actual 3D visualization would require three.js integration.</span>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;
