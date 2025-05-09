
import React, { useState } from "react";
import ViewerToolbar from "./ViewerToolbar";
import ViewerSidebar from "./ViewerSidebar";
import ViewerStatusBar from "./ViewerStatusBar";
import ViewerDiagnostics from "./ViewerDiagnostics";
import { IfcViewerAPI } from "web-ifc-viewer";

interface ViewerLayoutProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onDebug?: () => void;
  isFullscreen: boolean;
  files: any[];
  viewer?: IfcViewerAPI | null;
  fileUrl?: string;
  fileName?: string | null;
}

const ViewerLayout: React.FC<ViewerLayoutProps> = ({ 
  children,
  title,
  onClose,
  onToggleFullscreen,
  onDebug,
  isFullscreen,
  files,
  viewer,
  fileUrl,
  fileName
}) => {
  const [isDiagnosticsVisible, setIsDiagnosticsVisible] = useState(false);
  
  const toggleDiagnostics = () => {
    setIsDiagnosticsVisible(prev => !prev);
  };
  
  const handleReloadViewer = () => {
    // Reload the page - simplest way to fully reset the viewer
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#222222]">
      <ViewerToolbar 
        title={title}
        onClose={onClose}
        onToggleFullscreen={onToggleFullscreen}
        onDebug={onDebug}
        onDiagnostics={toggleDiagnostics}
        isFullscreen={isFullscreen}
        isDiagnosticsEnabled={isDiagnosticsVisible}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {children}
        
        {isDiagnosticsVisible && (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
            <ViewerDiagnostics 
              viewer={viewer} 
              fileUrl={fileUrl}
              fileName={fileName}
              onClose={() => setIsDiagnosticsVisible(false)}
              onReload={handleReloadViewer}
            />
          </div>
        )}
      </div>
      
      <ViewerStatusBar />
    </div>
  );
};

export default ViewerLayout;
