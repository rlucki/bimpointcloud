
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Menu, 
  File,
  X,
  Settings, 
  ChevronLeft, 
  MaximizeIcon,
  MinimizeIcon,
  Axis3d,
  ZoomIn
} from "lucide-react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import PointCloudViewer from "@/components/PointCloudViewer";
import ViewerContainer from "@/components/ViewerContainer";

// Type definitions for the file data
interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize: number;
  fileUrl?: string;
}

const Viewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Extract files from location state
  const state = location.state || {};
  const files: FileData[] = state.files || [];
  const isDemoMode = state.demo || files.length === 0;
  
  // References for the IFC viewer
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  
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
        
        // If there's an IFC file, initialize the IFC viewer
        const ifcFile = files.find(file => file.fileType === 'ifc');
        if (ifcFile && ifcFile.fileUrl) {
          initializeIfcViewer(ifcFile);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [files, isDemoMode, navigate, toast]);
  
  const initializeIfcViewer = async (fileData: FileData) => {
    if (!containerRef.current) return;
    
    try {
      console.log("Initializing IFC viewer for:", fileData.fileName);
      
      // Create the viewer
      const viewer = new IfcViewerAPI({
        container: containerRef.current,
        backgroundColor: new THREE.Color(0x222222)
      });
      
      viewerRef.current = viewer;
      
      // Set up camera
      viewer.context.ifcCamera.cameraControls.setPosition(10, 10, 10);
      viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
      
      // Create a grid
      const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x888888);
      grid.position.set(0, 0, 0);
      viewer.context.getScene().add(grid);
      
      // Add axes
      const axesHelper = new THREE.AxesHelper(10);
      axesHelper.position.set(0, 0.1, 0);
      viewer.context.getScene().add(axesHelper);
      
      // Load the IFC model if URL is available
      if (fileData.fileUrl) {
        try {
          const model = await viewer.IFC.loadIfcUrl(fileData.fileUrl);
          console.log("IFC model loaded:", model);
          
          // Center view on the model
          setTimeout(() => {
            viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
          }, 500);
        } catch (e) {
          console.error("Error loading IFC model:", e);
          toast({
            variant: "destructive",
            title: "Error loading model",
            description: "The IFC model could not be loaded. Showing reference only."
          });
        }
      }
    } catch (e) {
      console.error("Error initializing IFC viewer:", e);
      toast({
        variant: "destructive",
        title: "Viewer initialization failed",
        description: "Could not initialize the 3D viewer.",
      });
    }
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

  const goBack = () => {
    navigate('/');
  };
  
  // If loading, show loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">Loading viewer...</p>
          <p className="text-gray-400 text-sm mt-2">
            {isDemoMode ? "Preparing demo environment" : `Loading ${files.length} file(s)`}
          </p>
        </div>
      </div>
    );
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
            <SheetContent side="left" className="bg-[#333333] border-r border-[#444444] text-white w-64 p-0">
              <div className="p-4 border-b border-[#444444]">
                <h2 className="text-lg font-medium">Files</h2>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium mb-2">LOADED FILES</h3>
                <ul>
                  {files.length > 0 ? (
                    files.map((file, index) => (
                      <li 
                        key={index}
                        className={`py-1 px-2 rounded cursor-pointer text-sm flex items-center ${selectedItem === file.fileName ? 'bg-[#444444]' : 'hover:bg-[#3a3a3a]'}`}
                        onClick={() => setSelectedItem(file.fileName)}
                      >
                        <File className="h-4 w-4 mr-2" /> 
                        {file.fileName} <span className="ml-2 text-xs opacity-50">{file.fileType.toUpperCase()}</span>
                      </li>
                    ))
                  ) : (
                    <li className="py-1 px-2 text-sm text-gray-400">
                      Demo mode - no files loaded
                    </li>
                  )}
                </ul>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="ml-4 text-white font-medium">
            {files.length > 0 
              ? `3D Viewer - ${files.length} file(s)` 
              : "3D Viewer - Demo Mode"}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={goBack} className="text-white hover:bg-[#444444]">
            <X className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-[#444444]">
            {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Viewer Area */}
        <main className="flex-1 relative">
          {/* IFC files need the IFC viewer */}
          {files.some(f => f.fileType === 'ifc') && (
            <div 
              ref={containerRef} 
              className="w-full h-full"
            >
              {/* IFC Viewer will be initialized here */}
            </div>
          )}
          
          {/* LAS files use React Three Fiber */}
          {files.some(f => f.fileType === 'las') && !files.some(f => f.fileType === 'ifc') && (
            <div className="w-full h-full">
              <Canvas>
                <ViewerContainer>
                  {files.filter(f => f.fileType === 'las').map((file, index) => (
                    <PointCloudViewer
                      key={index}
                      url={file.fileUrl}
                      color="#4f46e5"
                      opacity={0.8}
                    />
                  ))}
                </ViewerContainer>
              </Canvas>
            </div>
          )}
          
          {/* Demo mode when no files */}
          {files.length === 0 && (
            <div className="w-full h-full">
              <Canvas>
                <ViewerContainer>
                  {/* Demo point cloud */}
                  <PointCloudViewer />
                </ViewerContainer>
              </Canvas>
            </div>
          )}
          
          {/* Overlay with instructions */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded">
            <div className="flex items-center gap-2 text-sm">
              <Axis3d className="h-4 w-4" /> 
              <span>Origin (0,0,0) with X, Y, Z axes</span>
            </div>
          </div>
          
          {/* File info overlay */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-[#333333] text-white px-3 py-2 rounded border border-[#444444]">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" /> 
                <span>
                  {files.length > 0 
                    ? `${files.length} file(s) loaded` 
                    : "Demo Mode"}
                </span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Use mouse to navigate: drag to rotate, scroll to zoom
              </div>
            </div>
          </div>
          
          {/* Viewer Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button 
              onClick={toggleFullscreen}
              variant="outline" 
              size="icon"
              title="Toggle fullscreen"
              className="bg-[#333333] text-white hover:bg-[#444444] border-[#444444]"
            >
              {isFullscreen ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
            </Button>
          </div>
        </main>
      </div>
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Ready</span>
        <span className="ml-auto">3D Viewer</span>
      </footer>
    </div>
  );
};

export default Viewer;
