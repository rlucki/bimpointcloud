
import React from "react";

interface ViewerStatusBarProps {
  status?: string;
  info?: string;
}

const ViewerStatusBar: React.FC<ViewerStatusBarProps> = ({ 
  status = "Ready", 
  info = "3D Viewer" 
}) => {
  return (
    <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
      <span>{status}</span>
      <span className="ml-auto">{info}</span>
    </footer>
  );
};

export default ViewerStatusBar;
