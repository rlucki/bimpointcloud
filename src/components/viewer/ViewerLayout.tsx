
import React from "react";
import ViewerToolbar from "./ViewerToolbar";
import ViewerSidebar from "./ViewerSidebar";
import ViewerStatusBar from "./ViewerStatusBar";

interface ViewerLayoutProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onDebug?: () => void;
  isFullscreen: boolean;
  files: any[];
}

const ViewerLayout: React.FC<ViewerLayoutProps> = ({ 
  children,
  title,
  onClose,
  onToggleFullscreen,
  onDebug,
  isFullscreen,
  files
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#222222]">
      <ViewerToolbar 
        title={title}
        onClose={onClose}
        onToggleFullscreen={onToggleFullscreen}
        onDebug={onDebug}
        isFullscreen={isFullscreen}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
      
      <ViewerStatusBar />
    </div>
  );
};

export default ViewerLayout;
