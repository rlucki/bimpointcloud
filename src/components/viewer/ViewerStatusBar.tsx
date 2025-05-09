
import React from "react";
import { File, Info } from "lucide-react";

interface ViewerStatusBarProps {
  status?: string;
  info?: string;
  fileName?: string | null;
  fileType?: string | null;
  isLoading?: boolean;
}

const ViewerStatusBar: React.FC<ViewerStatusBarProps> = ({ 
  status = "Ready", 
  info = "3D Viewer",
  fileName = null,
  fileType = null,
  isLoading = false
}) => {
  return (
    <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
      <div className="flex items-center">
        {isLoading ? (
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
        )}
        <span>{status}</span>
      </div>
      
      {fileName && fileType && (
        <div className="flex items-center ml-4">
          <File className="h-3 w-3 mr-1" />
          <span>{fileName} ({fileType.toUpperCase()})</span>
        </div>
      )}
      
      <span className="ml-auto flex items-center">
        <Info className="h-3 w-3 mr-1" />
        {info}
      </span>
    </footer>
  );
};

export default ViewerStatusBar;
