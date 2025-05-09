
import React from "react";

const ViewerStatusBar: React.FC = () => {
  return (
    <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
      <span>Ready</span>
      <span className="ml-auto">3D Viewer</span>
    </footer>
  );
};

export default ViewerStatusBar;
