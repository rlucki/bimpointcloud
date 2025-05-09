
import React from "react";
import ViewerDropArea from "./ViewerDropArea";

interface ViewerCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDragging: boolean;
  width?: number;
  height?: number;
}

const ViewerCanvas: React.FC<ViewerCanvasProps> = ({ 
  canvasRef, 
  isDragging,
  width = 1000,
  height = 600
}) => {
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
