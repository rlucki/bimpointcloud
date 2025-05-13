
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Menu, File, X, Settings } from "lucide-react";
import ViewerSidebar from "@/components/viewer/ViewerSidebar";
import ViewerControls from "@/components/viewer/ViewerControls";
import ViewerMain from "@/components/viewer/ViewerMain";
import LoadingOverlay from "@/components/viewer/LoadingOverlay";
import ErrorOverlay from "@/components/viewer/ErrorOverlay";

// Type definitions for the file data
interface FileData {
  fileType: 'ifc';
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
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [visibleFiles, setVisibleFiles] = useState<{[key: string]: boolean}>({});
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  
  // Model references
  const modelRefs = useRef<{[key: string]: any}>({});
  
  // Extract files from location state
  const state = location.state || {};
  const [files, setFiles] = useState<FileData[]>(() => {
    const initialFiles = state.files || [];
    
    // Add a single file if no files array but fileType exists
    if (initialFiles.length === 0 && state.fileType) {
      return [{
        fileType: state.fileType,
        fileName: state.fileName || 'Unknown file',
        fileUrl: state.fileUrl || undefined,
        id: `${state.fileName || 'file'}-${Date.now()}`,
        visible: true
      }];
    }
    
    // Add IDs and visibility to files
    return initialFiles.map((file: FileData) => ({
      ...file,
      id: `${file.fileName}-${Date.now()}`,
      visible: true
    }));
  });
  
  const isDemoMode = state.demo || files.length === 0;
  
  // Initialize visibility state for files
  useEffect(() => {
    const initialVisibility: {[key: string]: boolean} = {};
    files.forEach(file => {
      if (file.id) {
        initialVisibility[file.id] = true;
      }
    });
    setVisibleFiles(initialVisibility);
  }, []);
  
  // Check for files and simulate loading
  useEffect(() => {
    if (!isDemoMode && files.length === 0) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a file first to view it in 3D",
      });
      navigate('/');
    } else {
      // Simulate loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [files, isDemoMode, navigate, toast]);
  
  // Handle model load event
  const handleModelLoad = (fileId: string, model: any) => {
    modelRefs.current[fileId] = model;
  };

  // Toggle file visibility
  const toggleFileVisibility = (fileId: string) => {
    setVisibleFiles(prev => {
      const newState = { ...prev, [fileId]: !prev[fileId] };
      const model = modelRefs.current[fileId];
      
      if (model && model.mesh) {
        model.mesh.visible = newState[fileId];
        
        // Handle children
        if (model.mesh.children?.length > 0) {
          model.mesh.traverse((child: any) => {
            child.visible = newState[fileId];
          });
        }
      }
      
      return newState;
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Frame all objects - with cooldown to prevent too frequent reframing
  const handleFrameAll = () => {
    const now = Date.now();
    // Only allow framing once every 2 seconds to prevent accidental double-clicks
    if (now - lastFrameTime > 2000) {
      setLastFrameTime(now);
      console.log("Frame all objects - user triggered");
      
      // Implementation would go here if needed
      toast({
        title: "Ajuste de vista",
        description: "Encuadrando todos los objetos en la vista",
      });
    }
  };
  
  // Handle debug
  const handleDebug = () => {
    console.log("Debug info:", { files, models: modelRefs.current });
    toast({
      title: "Debug info",
      description: "Check console for debug information",
    });
  };

  // Go back to upload page
  const goBack = () => {
    navigate('/');
  };
  
  // If loading, show loader
  if (isLoading) {
    return <LoadingOverlay isDemoMode={isDemoMode} filesCount={files.length} />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-[#222222]">
      {/* Top Navigation Bar */}
      <header className="bg-[#333333] border-b border-[#444444] h-12 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#444444]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <ViewerSidebar 
              files={files} 
              selectedItem={selectedItem} 
              visibleFiles={visibleFiles}
              onSelectItem={setSelectedItem}
              onToggleVisibility={toggleFileVisibility}
            />
          </Sheet>
          
          <div className="ml-4 text-white font-medium">
            {files.length > 0 
              ? `3D Viewer - ${files.length} file(s)` 
              : "3D Viewer - Demo Mode"}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {process.env.NODE_ENV === 'development' && (
            <Button variant="ghost" size="icon" onClick={handleDebug} className="text-white hover:bg-[#444444]">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={goBack} className="text-white hover:bg-[#444444]">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
          <ViewerMain 
            files={files}
            setLoadingError={setLoadingError}
            onModelLoad={handleModelLoad}
          />
          
          <ErrorOverlay errorMessage={loadingError} onReturn={goBack} />
          
          {/* File info overlay */}
          <div className="absolute bottom-4 right-4 pointer-events-none">
            <div className="bg-[#333333] text-white px-3 py-2 rounded border border-[#444444]">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" /> 
                <span>
                  {files.length > 0 
                    ? `${files.length} file(s) loaded` 
                    : "Demo Mode"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Viewer Controls */}
          <ViewerControls
            onFrameAll={handleFrameAll}
            onToggleFullscreen={toggleFullscreen}
            onToggleStats={() => setShowStats(!showStats)}
            isFullscreen={isFullscreen}
          />
        </main>
      </div>
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Ready</span>
        <span className="ml-auto">IFC Viewer</span>
      </footer>
    </div>
  );
};

export default Viewer;
