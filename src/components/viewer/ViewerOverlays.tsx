
import React from "react";
import { Axis3d, File } from "lucide-react";

interface ViewerOverlaysProps {
  filesCount: number;
}

const ViewerOverlays: React.FC<ViewerOverlaysProps> = ({ filesCount }) => {
  return (
    <>
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
              {filesCount > 0 
                ? `${filesCount} file(s) loaded` 
                : "Demo Mode"}
            </span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Use mouse to navigate: drag to rotate, scroll to zoom
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewerOverlays;
