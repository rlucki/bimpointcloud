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
  MaximizeIcon,
  Move,
  ZoomIn,
  Square
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
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // References for the viewer elements
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });

  // Extract state from location or provide defaults
  const state = location.state || {};
  const fileType = state.fileType;
  const fileName = state.fileName;
  const fileSize = state.fileSize;
  const fileUrl = state.fileUrl; // Add support for fileUrl

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
      console.log("Viewer received:", { fileType, fileName, fileSize, fileUrl });
      
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
        
        // Check if there's a file URL to load
        if (fileUrl) {
          try {
            console.log("Loading IFC file from URL:", fileUrl);
            
            // Load the actual IFC model
            const model = await viewer.IFC.loadIfcUrl(fileUrl);
            
            // Center and adjust camera to the loaded model
            viewer.shadowDropper.renderShadow(model.modelID);
            
            // Fit the model in the view
            const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
            
            // Center view on the model
            setTimeout(() => {
              viewer.context.ifcCamera.cameraControls.fitToSphere(false, 1.5);
              toast({
                title: "IFC Model Loaded",
                description: `${fileName} loaded successfully`
              });
            }, 500);
          } catch (e) {
            console.error("Error loading IFC model:", e);
            toast({
              variant: "destructive",
              title: "Model loading error",
              description: "Could not load the IFC model. Using placeholder instead."
            });
            
            // If loading fails, show a placeholder cube as fallback
            const geometry = new THREE.BoxGeometry(3, 3, 3);
            const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 1.5, 0);
            viewer.context.getScene().add(cube);
          }
        } else {
          // No file URL, so we'll show a placeholder
          console.log("No IFC file URL provided. Showing placeholder cube.");
          toast({
            variant: "info",
            title: "Demo Mode",
            description: "No IFC file provided. Showing placeholder model."
          });
          
          const geometry = new THREE.BoxGeometry(3, 3, 3);
          const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1.5, 0);
          viewer.context.getScene().add(cube);
        }
        
        setViewerInitialized(true);
        
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
        
        // Setup canvas interactions
        const handleMouseDown = (e: MouseEvent) => {
          isDraggingRef.current = true;
          lastPosRef.current = { x: e.clientX, y: e.clientY };
        };
        
        const handleMouseMove = (e: MouseEvent) => {
          if (isDraggingRef.current) {
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            
            setViewPosition(prev => ({
              x: prev.x + dx / zoomLevel,
              y: prev.y + dy / zoomLevel
            }));
            
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            
            // Re-render with new position
            renderLasVisualization(ctx, canvas.width, canvas.height);
          }
        };
        
        const handleMouseUp = () => {
          isDraggingRef.current = false;
        };
        
        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          const newZoom = Math.max(0.5, Math.min(5.0, zoomLevel + delta));
          setZoomLevel(newZoom);
          
          // Re-render with new zoom
          renderLasVisualization(ctx, canvas.width, canvas.height);
        };
        
        // Add event listeners
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel);
        
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
          canvas.removeEventListener('mousedown', handleMouseDown);
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseup', handleMouseUp);
          canvas.removeEventListener('mouseleave', handleMouseUp);
          canvas.removeEventListener('wheel', handleWheel);
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
    
    const centerX = width / 2 + viewPosition.x * zoomLevel;
    const centerY = height / 2 + viewPosition.y * zoomLevel;
    
    // Grid
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 50 * zoomLevel;
    const gridExtent = 2000;
    
    // Draw grid lines
    for (let x = -gridExtent; x <= gridExtent; x += gridSize / zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(centerX + x * zoomLevel, centerY - gridExtent * zoomLevel);
      ctx.lineTo(centerX + x * zoomLevel, centerY + gridExtent * zoomLevel);
      ctx.stroke();
    }
    
    for (let y = -gridExtent; y <= gridExtent; y += gridSize / zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(centerX - gridExtent * zoomLevel, centerY + y * zoomLevel);
      ctx.lineTo(centerX + gridExtent * zoomLevel, centerY + y * zoomLevel);
      ctx.stroke();
    }
    
    // Draw axes
    // X axis (red)
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + 100 * zoomLevel, centerY);
    ctx.stroke();
    
    // Y axis (green)
    ctx.strokeStyle = '#33ff33';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 100 * zoomLevel);
    ctx.stroke();
    
    // Z axis (blue)
    ctx.strokeStyle = '#3333ff';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 50 * zoomLevel, centerY + 50 * zoomLevel);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("X", centerX + 110 * zoomLevel, centerY + 15);
    ctx.fillText("Y", centerX - 15, centerY - 110 * zoomLevel);
    ctx.fillText("Z", centerX - 60 * zoomLevel, centerY + 65 * zoomLevel);
    ctx.fillText("(0,0,0)", centerX, centerY + 20);
    
    // Draw point cloud
    ctx.fillStyle = 'rgba(100, 149, 237, 0.7)';
    const pointCount = 25000; // Increased point count for more densely populated visualization
    const spread = 300 * zoomLevel;
    
    // Generate pseudo-random points but in a stable pattern to simulate a real point cloud
    const seed = 12345;
    const pseudoRandom = (i: number, offset: number = 0) => {
      return (Math.sin(i * seed + offset) + 1) / 2;
    };
    
    // Draw points in a more realistic point cloud pattern
    for (let i = 0; i < pointCount; i++) {
      // Create a more realistic distribution of points
      const angle = pseudoRandom(i, 100) * Math.PI * 2;
      const distFromCenter = Math.pow(pseudoRandom(i, 200), 0.5) * spread; // More points at the center
      const heightVariation = (pseudoRandom(i, 300) - 0.5) * spread * 0.4; // Vertical variation
      
      // X and Y coordinates in a disc pattern with height variation 
      const x = centerX + Math.cos(angle) * distFromCenter;
      const y = centerY + Math.sin(angle) * distFromCenter + heightVariation;
      
      // Size and color depends on distance from center to simulate depth
      const distanceFromCenter = Math.sqrt(
        Math.pow((x - centerX) / zoomLevel, 2) + Math.pow((y - centerY) / zoomLevel, 2)
      );
      
      // Color varies with distance to create visual depth
      const intensity = Math.max(0, 1 - distanceFromCenter / (spread / zoomLevel * 1.2));
      const hue = 210; // Blue hue
      const saturation = 80 + Math.floor(intensity * 20); // More saturated closer to center
      const lightness = 50 + Math.floor((1-intensity) * 30); // Brighter in the distance
      
      // Size varies with distance - slightly smaller in distance for better depth perception
      const size = Math.max(0.8, 2 * zoomLevel * intensity);
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + intensity * 0.3})`;
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add file info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${fileName} (${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'})`, width / 2, 30);
    ctx.fillText("Point cloud centered at origin (0,0,0)", width / 2, 55);
    
    // Highlight selected item if any
    if (selectedItem) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Selected: ${selectedItem}`, width / 2, height - 20);
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
  
  const resetView = () => {
    if (fileType === 'ifc' && viewerRef.current) {
      // Reset IFC view to show the whole model
      try {
        viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(false, 1.5);
        toast({
          title: "View Reset",
          description: "IFC model centered in view"
        });
      } catch (e) {
        console.error("Error resetting view:", e);
      }
    } else if (fileType === 'las') {
      // Reset LAS view
      setZoomLevel(1.0);
      setViewPosition({ x: 0, y: 0 });
      
      // Re-render with reset values
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          renderLasVisualization(ctx, canvasRef.current.width, canvasRef.current.height);
        }
      }
      
      toast({
        title: "View Reset",
        description: "Point cloud centered in view"
      });
    }
  };
  
  const expandModel = () => {
    if (fileType === 'ifc' && viewerRef.current) {
      toggleFullscreen();
    } else if (fileType === 'las') {
      toggleFullscreen();
    }
  };
  
  const selectModelItem = (itemName: string) => {
    setSelectedItem(selectedItem === itemName ? null : itemName);
    
    toast({
      title: selectedItem === itemName ? "Item Deselected" : "Item Selected",
      description: selectedItem === itemName ? "Item deselected" : `Selected: ${itemName}`,
    });
    
    // Re-render with selection if it's LAS
    if (fileType === 'las' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        renderLasVisualization(ctx, canvasRef.current.width, canvasRef.current.height);
      }
    }
    // For IFC, we would highlight the selected component here
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
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ${selectedItem === 'Building' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Building')}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" /> Building
                    </li>
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-2 ${selectedItem === 'Levels' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Levels')}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" /> Levels
                    </li>
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-4 ${selectedItem === 'Level 1' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Level 1')}
                    >
                      <span className="w-3 mr-1"></span> Level 1
                    </li>
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-4 ${selectedItem === 'Level 2' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Level 2')}
                    >
                      <span className="w-3 mr-1"></span> Level 2
                    </li>
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-2 ${selectedItem === 'Elements' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Elements')}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" /> Elements
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="py-1 px-2 text-[#ABABAB] text-xs font-medium">POINT CLOUD STRUCTURE</div>
                  <ul className="text-[#CCCCCC] text-sm">
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ${selectedItem === 'Full Cloud' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Full Cloud')}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" /> Full Cloud
                    </li>
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-2 ${selectedItem === 'Sections' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Sections')}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" /> Sections
                    </li>
                    <li 
                      className={`py-1 px-2 rounded cursor-pointer hover:bg-[#444444] flex items-center ml-2 ${selectedItem === 'Classifications' ? 'bg-[#4f46e5] text-white' : ''}`}
                      onClick={() => selectModelItem('Classifications')}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" /> Classifications
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="p-2 border-t border-[#444444] space-y-2">
              <Button variant="viewer" size="sm" className="w-full">
                Properties
              </Button>
              <Button onClick={expandModel} variant="viewer" size="sm" className="w-full flex items-center gap-2">
                <Square className="h-4 w-4" />
                <span>View Fullscreen</span>
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
                Position: Origin (0,0,0) {selectedItem ? `| Selected: ${selectedItem}` : ''}
              </div>
            </div>
          </div>
          
          {/* Viewer Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button 
              onClick={resetView}
              variant="viewer" 
              size="icon"
              title="Frame model in view"
            >
              <Move className="h-5 w-5" />
            </Button>
            <Button 
              onClick={toggleFullscreen}
              variant="viewer" 
              size="icon"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={() => {
                if (fileType === 'las') {
                  setZoomLevel(prev => Math.min(5.0, prev + 0.2));
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) renderLasVisualization(ctx, canvasRef.current.width, canvasRef.current.height);
                  }
                } else if (viewerRef.current) {
                  viewerRef.current.context.ifcCamera.cameraControls.zoom(1.2);
                }
              }}
              variant="viewer" 
              size="icon"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
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
