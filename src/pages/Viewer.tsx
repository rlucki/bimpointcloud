
// Refactored Viewer component with smaller, focused components
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { IfcViewerAPI } from "web-ifc-viewer";
import { debugViewer } from "@/components/viewer/ViewerUtils";
import ViewerControls from "@/components/viewer/ViewerControls";
import ViewerLayout from "@/components/viewer/ViewerLayout";
import { useIFCViewer } from "@/hooks/useIFCViewer";
import IfcViewerContainer from "@/components/viewer/IfcViewerContainer";
import LASViewerContainer from "@/components/viewer/LASViewerContainer";
import ViewerLoadingScreen from "@/components/viewer/ViewerLoadingScreen";
import { AxesInfoOverlay, FileInfoOverlay } from "@/components/viewer/ViewerInfoOverlay";

// Type definitions for the file data
interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  visible?: boolean;
  id?: string;
}

const Viewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [visibleFiles, setVisibleFiles] = useState<{[key: string]: boolean}>({});
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Extract files from location state
  const state = location.state || {};
  const [files, setFiles] = useState<FileData[]>(() => {
    console.log("Initial state:", state);
    const initialFiles = state.files || [];
    
    // Add a single file if no files array but fileType exists
    if (initialFiles.length === 0 && state.fileType) {
      return [{
        fileType: state.fileType,
        fileName: state.fileName || 'Unknown file',
        fileUrl: state.fileUrl || undefined,
        id: `${state.fileName || 'file'}-${Date.now() + Math.random() * 1000}`,
        visible: true
      }];
    }
    
    // Add IDs and visibility to files
    return initialFiles.map((file: FileData) => ({
      ...file,
      id: `${file.fileName}-${Date.now() + Math.random() * 1000}`,
      visible: true
    }));
  });
  const isDemoMode = state.demo || files.length === 0;
  
  // References for the IFC viewer
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const modelRefs = useRef<{[key: string]: any}>({});
  
  // Get current file URL and name - extract outside conditional rendering
  const currentFileUrl = files.length > 0 && files[0].fileUrl ? files[0].fileUrl : undefined;
  const currentFileName = files.length > 0 ? files[0].fileName : null;
  
  // IMPORTANT: Always call hooks unconditionally at the top level
  const { 
    viewer: ifcViewer,
    mesh,
    wasmLoaded,
    modelLoaded,
    meshExists,
    debug,
    frameAll
  } = useIFCViewer(containerRef, currentFileUrl, currentFileName);
  
  // Initialize visibility state for files
  useEffect(() => {
    const initialVisibility: {[key: string]: boolean} = {};
    files.forEach(file => {
      if (file.id) {
        initialVisibility[file.id] = true;
      }
    });
    setVisibleFiles(initialVisibility);
    
    console.log("Files initialized:", files);
  }, []);
  
  // If no files and not in demo mode, redirect to the main page
  useEffect(() => {
    if (!isDemoMode && files.length === 0) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a file first to view it in 3D",
      });
      navigate('/');
    } else {
      console.log("Viewer received:", { files, isDemoMode });
      
      // Simulate loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [files, isDemoMode, navigate, toast]);
  
  // Update visible files function
  const toggleFileVisibility = (fileId: string) => {
    setVisibleFiles(prev => {
      const newState = { ...prev, [fileId]: !prev[fileId] };
      
      // Update IFC model visibility if it's an IFC file
      const model = modelRefs.current[fileId];
      if (model) {
        const isVisible = newState[fileId];
        console.log(`Setting visibility for model ${fileId} to ${isVisible}`);
        
        // Handle the entire model structure
        if (model.mesh) {
          // Set visibility for the main mesh
          model.mesh.visible = isVisible;
          
          // Recursively set visibility for all children
          if (model.mesh.children && model.mesh.children.length > 0) {
            model.mesh.traverse((child: THREE.Object3D) => {
              child.visible = isVisible;
            });
          }
        }
        
        // If the model has an ifcModel property, handle that too
        if (model.ifcModel) {
          model.ifcModel.visible = isVisible;
        }
        
        // Additional handling for other possible model structures
        if (model.geometry) {
          model.visible = isVisible;
        }
        
        // Force scene update
        if (viewerRef.current) {
          viewerRef.current.context.getScene().updateMatrixWorld();
        }
        
        console.log("Model visibility updated", { model, isVisible });
      }
      
      return newState;
    });
  };

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

  // Add a reference for frame-all function
  const frameAllRef = useRef<() => void>(() => {});

  // Handle frame all
  const handleFrameAll = () => {
    // Call the frame all function stored in ref
    frameAllRef.current();
  };

  // Store frame all function in ref for access from outside Canvas
  useEffect(() => {
    frameAllRef.current = frameAll;
  }, [frameAll]);
  
  // Debug viewer utility
  const handleDebug = () => {
    if (viewerRef.current) {
      debugViewer(viewerRef, toast);
    } else {
      console.log("Viewer not initialized");
      console.log("Files:", files);
    }
  };

  // Go back to main page
  const goBack = () => {
    navigate('/');
  };
  
  // If loading, show loader
  if (isLoading) {
    return <ViewerLoadingScreen isDemoMode={isDemoMode} filesCount={files.length} />;
  }
  
  // Determine the title based on files
  const viewerTitle = files.length > 0 
    ? `3D Viewer - ${files.length} file(s)` 
    : "3D Viewer - Demo Mode";
  
  // Determine which viewer type to show
  const showIFCViewer = files.some(f => f.fileType === 'ifc');
  const showLASViewer = (files.some(f => f.fileType === 'las') && !files.some(f => f.fileType === 'ifc')) || files.length === 0;
  
  return (
    <ViewerLayout
      title={viewerTitle}
      onClose={() => navigate('/')}
      onToggleFullscreen={toggleFullscreen}
      onDebug={debug}
      isFullscreen={isFullscreen}
      files={files}
      viewer={viewerRef.current || ifcViewer}
      fileUrl={currentFileUrl}
      fileName={currentFileName}
      wasmLoaded={wasmLoaded}
      modelLoaded={modelLoaded}
      meshExists={meshExists}
    >
      {/* Main Viewer Area */}
      <div className="flex-1 relative">
        {/* IFC Viewer Container */}
        {showIFCViewer && (
          <IFCViewerContainer 
            containerRef={containerRef}
            viewerRef={viewerRef}
            modelRefs={modelRefs}
            files={files}
            loadingError={loadingError}
            setLoadingError={setLoadingError}
            onBack={goBack}
          />
        )}
        
        {/* LAS Viewer Container */}
        {showLASViewer && (
          <LASViewerContainer 
            files={files}
            visibleFiles={visibleFiles}
            showStats={showStats}
            onFrameAll={handleFrameAll}
          />
        )}
        
        {/* Common UI Overlays */}
        <AxesInfoOverlay />
        <FileInfoOverlay filesCount={files.length} />
        
        {/* Viewer Controls */}
        <ViewerControls
          onFrameAll={handleFrameAll}
          onToggleFullscreen={toggleFullscreen}
          onToggleStats={toggleStats}
          isFullscreen={isFullscreen}
        />
      </div>
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Ready</span>
        <span className="ml-auto">3D Viewer</span>
      </footer>
    </ViewerLayout>
  );
};

export default Viewer;
