
import React from "react";
import { Info } from "lucide-react";

interface ViewerStatusProps {
  fileType: "ifc" | "las" | null;
}

const ViewerStatus: React.FC<ViewerStatusProps> = ({ fileType }) => {
  return (
    <div className="mt-6 flex justify-between">
      <div className="flex items-center text-sm text-muted-foreground">
        <Info className="h-4 w-4 mr-1" /> 
        {fileType === 'ifc' 
          ? "IFC Viewer powered by web-ifc-viewer and Three.js"
          : "LAS point cloud visualization requires additional configuration."}
      </div>
    </div>
  );
};

export default ViewerStatus;
