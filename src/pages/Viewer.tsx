
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useViewerFileManager } from "@/components/viewer/ViewerFileManager";
import ViewerLoadingState from "@/components/viewer/ViewerLoadingState";
import ViewerInitializer from "@/components/viewer/ViewerInitializer";
import ViewerLasContent from "@/components/viewer/ViewerLasContent";
import ViewerOverlays from "@/components/viewer/ViewerOverlays";
import ViewerControls from "@/components/viewer/ViewerControls";
import ViewerLayout from "@/components/viewer/ViewerLayout";
import IfcViewerContainer from "@/components/viewer/IfcViewerContainer";
import ViewerDiagnostics from "@/components/viewer/ViewerDiagnostics";

const Viewer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    files,
    isLoading,
    setIsLoading,
    isDemoMode,
    visibleFiles,
    toggleFileVisibility,
    loadingError,
    setLoadingError
  } = useViewerFileManager();
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const frameAllRef = useRef<() => void>(() => {});
  
  // If no files and not in demo mode, redirect to the main page
  React.useEffect(() => {
    if (!isDemoMode && files.length === 0) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a file first to view it in 3D",
      });
      navigate('/');
    } else {
      console.log("Viewer received:", { files, isDemoMode });
    }
  }, [files, isDemoMode, navigate, toast]);

  // Functions for fullscreen and stats
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Could not enter fullscreen mode:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error("Could not exit fullscreen mode:", err);
        });
      }
    }
  };

  const toggleStats = () => {
    setShowStats(prev => !prev);
  };

  const handleFrameAll = () => {
    // Call the frame all function stored in ref
    frameAllRef.current();
  };
  
  const handleDebug = () => {
    // Show the diagnostics dialog
    setShowDiagnostics(true);
  };

  const reloadViewer = () => {
    // Reload the page - simplest way to fully reset the viewer
    window.location.reload();
  };

  const goBack = () => {
    navigate('/');
  };
  
  // If loading, show loader
  if (isLoading) {
    return <ViewerLoadingState isDemoMode={isDemoMode} filesCount={files.length} />;
  }
  
  // Get current file URL if available
  const currentFileUrl = files.length > 0 && files[0].fileUrl ? files[0].fileUrl : undefined;
  const currentFileName = files.length > 0 ? files[0].fileName : null;
  
  // Determine the title based on files
  const viewerTitle = files.length > 0 
    ? `3D Viewer - ${files.length} file(s)` 
    : "3D Viewer - Demo Mode";
  
  return (
    <ViewerLayout
      title={viewerTitle}
      onClose={goBack}
      onToggleFullscreen={toggleFullscreen}
      onDebug={handleDebug}
      isFullscreen={isFullscreen}
      files={files}
      viewer={viewerRef.current}
      fileUrl={currentFileUrl}
      fileName={currentFileName}
    >
      {/* Main Viewer Area */}
      <div className="flex-1 relative">
        {/* IFC files need the IFC viewer */}
        {files.some(f => f.fileType === 'ifc') && (
          <>
            <IfcViewerContainer 
              containerRef={containerRef} 
              viewerInitialized={viewerInitialized}
              isDragging={isDragging}
              modelLoaded={modelLoaded}
              fileName={currentFileName}
              onOpenDiagnostics={handleDebug}
              meshExists={true}
            />
            
            {files.length > 0 && files[0].fileType === 'ifc' && (
              <ViewerInitializer
                fileData={files[0]}
                containerRef={containerRef}
                onModelLoaded={() => {
                  setModelLoaded(true);
                  setViewerInitialized(true);
                }}
                onError={setLoadingError}
              />
            )}
            
            {/* Show error message if loading failed */}
            {loadingError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="bg-card p-6 rounded-lg max-w-md text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
                  <p className="text-muted-foreground mb-4">{loadingError}</p>
                  <button 
                    onClick={goBack}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Return to Upload
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* LAS files use React Three Fiber */}
        {(files.some(f => f.fileType === 'las') && !files.some(f => f.fileType === 'ifc')) || files.length === 0 ? (
          <ViewerLasContent 
            files={files}
            visibleFiles={visibleFiles}
            showStats={showStats}
            onFrameAll={handleFrameAll}
          />
        ) : null}
        
        {/* UI Overlays */}
        <ViewerOverlays filesCount={files.length} />
        
        {/* Viewer Controls */}
        <ViewerControls
          onFrameAll={handleFrameAll}
          onToggleFullscreen={toggleFullscreen}
          onToggleStats={toggleStats}
          isFullscreen={isFullscreen}
        />
      </div>
      
      {/* Modal de diagnósticos */}
      {showDiagnostics && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <ViewerDiagnostics
            viewer={viewerRef.current}
            fileUrl={currentFileUrl}
            fileName={currentFileName}
            onClose={() => setShowDiagnostics(false)}
            onReload={reloadViewer}
          />
        </div>
      )}
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Ready</span>
        <span className="ml-auto">3D Viewer</span>
      </footer>
    </ViewerLayout>
  );
};

export default Viewer;
