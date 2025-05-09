
import React, { useRef, useEffect } from "react";
import ViewerDropArea from "./ViewerDropArea";
import * as THREE from "three";

interface ViewerCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDragging: boolean;
  fileType?: "ifc" | "las" | null;
  fileName?: string | null;
  width?: number;
  height?: number;
  onSceneReady?: (scene: THREE.Scene) => void;
}

const ViewerCanvas: React.FC<ViewerCanvasProps> = ({ 
  canvasRef, 
  isDragging,
  fileType,
  fileName,
  width = 1000,
  height = 600,
  onSceneReady
}) => {
  // Set up basic Three.js scene for LAS files
  useEffect(() => {
    if (fileType === "las" && canvasRef.current) {
      const canvas = canvasRef.current;
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
        
        // File info
        ctx.fillText(fileName ? `File: ${fileName}` : 'No file loaded', centerX, 40);
        
        // Create a simulated scene for callbacks
        if (onSceneReady) {
          const mockScene = new THREE.Scene();
          onSceneReady(mockScene);
        }
      }
    }
  }, [fileType, fileName, width, height, canvasRef, onSceneReady]);

  return (
    <div className="p-4 relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full rounded-md"
      ></canvas>
      <ViewerDropArea isDragging={isDragging} />
    </div>
  );
};

export default ViewerCanvas;
