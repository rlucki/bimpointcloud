
import React from "react";
import { Eye } from "lucide-react";

interface ViewerDropAreaProps {
  isDragging: boolean;
}

const ViewerDropArea: React.FC<ViewerDropAreaProps> = ({ isDragging }) => {
  if (!isDragging) return null;
  
  return (
    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10">
      <div className="text-center p-6 bg-card rounded-lg shadow">
        <Eye className="mx-auto h-12 w-12 text-primary mb-2" />
        <p className="text-lg font-medium">Drop to load file</p>
      </div>
    </div>
  );
};

export default ViewerDropArea;
