
import React, { useEffect } from "react";
import ViewerDropArea from "./ViewerDropArea";

interface ViewerCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDragging: boolean;
}

const ViewerCanvas: React.FC<ViewerCanvasProps> = ({ canvasRef, isDragging }) => {
  return (
    <div className="p-4 relative">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="w-full h-full rounded-md"
      ></canvas>
      <ViewerDropArea isDragging={isDragging} />
    </div>
  );
};

export default ViewerCanvas;
