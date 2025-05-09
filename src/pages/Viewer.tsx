
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
  ChevronRight,
  Eye,
  MinimizeIcon,
  MaximizeIcon
} from "lucide-react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const Viewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  
  // References for the viewer elements
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);

  // Extract state from location or provide defaults
  const state = location.state || {};
  const fileType = state.fileType;
  const fileName = state.fileName;
  const fileSize = state.fileSize;

  // If no state, redirect to the main page
  useEffect(() => {
    if (!fileType || !fileName) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a file first to view it in 3D",
      });
      navigate('/');
    } else {
      console.log("Viewer received:", { fileType, fileName, fileSize });
      
      // Simulate loading
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Initialize the appropriate viewer
        initializeViewer();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [fileType, fileName, navigate, toast]);
  
  const initializeViewer = async () => {
    if (fileType === 'ifc') {
      try {
        if (!containerRef.current) return;
        
        console.log("Initializing IFC viewer in full-screen mode...");
        
        // Create the viewer
        const viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0x222222)
        });
        
        viewerRef.current = viewer;
        
        // Center the model at 0,0,0
        viewer.context.getScene().position.set(0, 0, 0);
        
        // Set up camera
        viewer.context.ifcCamera.cameraControls.setPosition(10, 10, 10);
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Add grid for better spatial reference
        const grid = new THREE.GridHelper(50, 50, 0x555555, 0x333333);
        viewer.context.getScene().add(grid);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        viewer.context.getScene().add(axesHelper);
        
        // Add a sample model at origin (0,0,0)
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1.5, 0);
        viewer.context.getScene().add(cube);
        
        setViewerInitialized(true);
        
        toast({
          title: "Viewer Initialized",
          description: "3D environment ready at origin (0,0,0)"
        });
        
      } catch (e) {
        console.error("Error initializing IFC viewer:", e);
        toast({
          variant: "destructive",
          title: "Visualization error",
          description: "Could not initialize the IFC viewer.",
        });
      }
    } else if (fileType === 'las' && canvasRef.current) {
      // For LAS files, render in canvas with origin reference
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Adjust canvas size to fit container
        const resizeCanvas = () => {
          if (containerRef.current && canvas) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
            renderLasVisualization(ctx, canvas.width, canvas.height);
          }
        };
        
        // Call resize immediately and on window resize
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        setViewerInitialized(true);
        
        toast({
          title: "LAS Viewer Ready",
          description: "Point cloud visualization at origin (0,0,0)"
        });
        
        return () => {
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    }
  };
  
  const renderLasVisualization = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const gridExtent = 2000;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw grid lines
    for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(centerX + x, centerY - gridExtent);
      ctx.lineTo(centerX + x, centerY + gridExtent);
      ctx.stroke();
    }
    
    for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(centerX - gridExtent, centerY + y);
      ctx.lineTo(centerX + gridExtent, centerY + y);
      ctx.stroke();
    }
    
    // Draw axes
    // X axis (red)
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + 100, centerY);
    ctx.stroke();
    
    // Y axis (green)
    ctx.strokeStyle = '#33ff33';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 100);
    ctx.stroke();
    
    // Z axis (blue)
    ctx.strokeStyle = '#3333ff';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 50, centerY + 50);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("X", centerX + 110, centerY + 15);
    ctx.fillText("Y", centerX - 15, centerY - 110);
    ctx.fillText("Z", centerX - 60, centerY + 65);
    ctx.fillText("(0,0,0)", centerX, centerY + 20);
    
    // Draw point cloud
    ctx.fillStyle = 'rgba(100, 149, 237, 0.7)';
    const pointCount = 2000;
    const spread = 300;
    
    for (let i = 0; i < pointCount; i++) {
      const x = centerX + (Math.random() - 0.5) * spread;
      const y = centerY + (Math.random() - 0.5) * spread;
      const size = Math.random() * 2 + 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add file info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${fileName} (${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'})`, width / 2, 30);
    ctx.fillText("Point cloud centered at origin (0,0,0)", width / 2, 55);
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
  
  // Clean up viewer on unmount
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (e) {
          console.error("Error disposing viewer:", e);
        }
      }
    };
  }, []);
  
  // If loading, show loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">Loading viewer...</p>
          <p className="text-gray-400 text-sm mt-2">Preparing {fileName}</p>
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
                <h2 className="text-lg font-medium">Project Explorer</h2>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium mb-2">MODELS</h3>
                <ul>
                  <li className="py-1 px-2 rounded hover:bg-[#444444] cursor-pointer text-sm flex items-center">
                    <File className="h-4 w-4 mr-2" /> {fileName || "No model loaded"}
                  </li>
                </ul>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="ml-4 text-white font-medium">
            {fileType === 'ifc' ? 'IFC Viewer' : 'LAS Viewer'} - {fileName}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Menubar className="border-none bg-transparent">
            <MenubarMenu>
              <MenubarTrigger className="text-white hover:bg-[#444444] data-[state=open]:bg-[#444444]">File</MenubarTrigger>
              <MenubarContent className="bg-[#333333] border-[#444444] text-white">
                <MenubarItem>Open</MenubarItem>
                <MenubarItem>Save</MenubarItem>
                <MenubarItem>Export</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="text-white hover:bg-[#444444] data-[state=open]:bg-[#444444]">View</MenubarTrigger>
              <MenubarContent className="bg-[#333333] border-[#444444] text-white">
                <MenubarItem>Properties</MenubarItem>
                <MenubarItem>Layers</MenubarItem>
                <MenubarItem>Models</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="text-white hover:bg-[#444444] data-[state=open]:bg-[#444444]">Tools</MenubarTrigger>
              <MenubarContent className="bg-[#333333] border-[#444444] text-white">
                <MenubarItem>Measure</MenubarItem>
                <MenubarItem>Cut</MenubarItem>
                <MenubarItem>Annotate</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="text-white hover:bg-[#444444] data-[state=open]:bg-[#444444]">Help</MenubarTrigger>
              <MenubarContent className="bg-[#333333] border-[#444444] text-white">
                <MenubarItem>About</MenubarItem>
                <MenubarItem>Documentation</MenubarItem>
                <MenubarItem>Keyboard Shortcuts</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          
          <div className="flex items-center ml-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#444444]" onClick={goBack}>
              <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#444444]">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#444444]">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-[#444444]">
              {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel */}
        {isSidebarOpen && (
          <aside className="w-64 bg-[#2A2A2A] border-r border-[#444444] flex flex-col">
            <div className="p-3 border-b border-[#444444]">
              <h3 className="text-white text-sm font-medium">Model Structure</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {fileType === 'ifc' ? (
                <div>
                  <div className="py-1 px-2 text-[#ABABAB] text-xs font-medium">BUILDING STRUCTURE</div>
                  <ul className="text-[#CCCCCC] text-sm">
                    <li className="py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center">
                      <ChevronRight className="h-3 w-3 mr-1" /> Building
                    </li>
                    <li className="py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-2">
                      <ChevronRight className="h-3 w-3 mr-1" /> Levels
                    </li>
                    <li className="py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-4">
                      <span className="w-3 mr-1"></span> Level 1
                    </li>
                    <li className="py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-4">
                      <span className="w-3 mr-1"></span> Level 2
                    </li>
                    <li className="py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-2">
                      <ChevronRight className="h-3 w-3 mr-1" /> Elements
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="text-[#CCCCCC] text-sm p-2">
                  <p>LAS Point Cloud</p>
                  <p className="text-xs text-gray-400 mt-2">File: {fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">Size: {fileSize ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
                  <p className="text-xs text-gray-400 mt-1">Location: Origin (0,0,0)</p>
                </div>
              )}
            </div>
            <div className="p-2 border-t border-[#444444]">
              <Button variant="outline" size="sm" className="w-full bg-[#444444] text-white border-[#555555] hover:bg-[#555555]">
                Properties
              </Button>
            </div>
          </aside>
        )}
        
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-64 top-1/2 transform -translate-y-1/2 z-10 bg-[#333333] text-white p-1 rounded-r-md border border-l-0 border-[#444444]"
          style={{ left: isSidebarOpen ? '16rem' : '0' }}
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {/* Main Viewer Area */}
        <main className="flex-1 relative">
          {fileType === 'ifc' ? (
            <div 
              ref={containerRef} 
              className="w-full h-full"
              style={{ visibility: viewerInitialized ? 'visible' : 'hidden' }}
            >
              {/* IFC Viewer will be initialized here */}
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
          )}
          
          {/* File info overlay */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-[#333333] text-white px-3 py-2 rounded border border-[#444444]">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" /> 
                <span>{fileName}</span>
                <span className="text-xs bg-[#444444] px-2 py-1 rounded">{fileType?.toUpperCase()}</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Position: Origin (0,0,0)
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Ready</span>
        <span className="ml-auto">{fileType?.toUpperCase()} Viewer</span>
      </footer>
    </div>
  );
};

export default Viewer;
