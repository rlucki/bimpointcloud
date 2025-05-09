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
  Square,
  Axis3d
} from "lucide-react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const Viewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Set default to false to hide the sidebar
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
        
        // Set up camera - position farther back for better initial view
        viewer.context.ifcCamera.cameraControls.setPosition(20, 20, 20);
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Mejorar la cuadrícula para que sea más visible
        const gridSize = 100;
        const gridDivisions = 100;
        const gridColor = 0x888888;
        const gridColorCenterLines = 0xffffff;
        
        // Crear una cuadrícula más grande y visible
        const grid = new THREE.GridHelper(gridSize, gridDivisions, gridColorCenterLines, gridColor);
        grid.position.set(0, 0, 0); // Asegurar que está en el origen
        viewer.context.getScene().add(grid);
        
        // Añadir ejes de coordenadas más grandes y visibles
        const axesHelper = new THREE.AxesHelper(15); // Tamaño aumentado para mejor visibilidad
        axesHelper.position.set(0, 0.1, 0); // Ligeramente por encima de la cuadrícula para evitar z-fighting
        viewer.context.getScene().add(axesHelper);
        
        // Check if there's a file URL to load
        if (fileUrl) {
          try {
            console.log("Loading IFC file from URL:", fileUrl);
            
            // Load the actual IFC model
            const model = await viewer.IFC.loadIfcUrl(fileUrl);
            
            // Enable shadows for better visualization
            viewer.shadowDropper.renderShadow(model.modelID);
            
            // Fit the model in the view
            const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
            
            // Center view on the model - Fix: providing both required parameters
            setTimeout(() => {
              // Start with a view of the origin to help user orient
              viewer.context.ifcCamera.cameraControls.setPosition(20, 20, 20);
              viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
              
              // Then adjust to fit the model
              viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
              
              toast({
                variant: "default",
                title: "Modelo IFC Cargado",
                description: `${fileName} cargado exitosamente. Use el mouse para navegar.`
              });
            }, 500);
          } catch (e) {
            console.error("Error loading IFC model:", e);
            toast({
              variant: "destructive",
              title: "Error al cargar el modelo",
              description: "No se pudo cargar el modelo IFC. Mostrando modelo de ejemplo."
            });
            
            // If loading fails, show a placeholder cube at the origin
            const geometry = new THREE.BoxGeometry(5, 5, 5);
            const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 2.5, 0); // Colocado justo en el origen, elevado para que se vea sobre la cuadrícula
            viewer.context.getScene().add(cube);
            
            // Reset camera to show the origin and cube
            viewer.context.ifcCamera.cameraControls.setPosition(15, 15, 15);
            viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
          }
        } else {
          // No file URL, so we'll show a placeholder
          console.log("No IFC file URL provided. Showing placeholder cube.");
          toast({
            variant: "default",
            title: "Modo Demo",
            description: "No se proporcionó archivo IFC. Mostrando modelo de ejemplo."
          });
          
          // Crear un cubo grande y colorido en el origen como referencia
          const geometry = new THREE.BoxGeometry(5, 5, 5);
          const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 2.5, 0); // Elevado para que se vea sobre la cuadrícula
          viewer.context.getScene().add(cube);
          
          // Reset camera to show the origin and cube
          viewer.context.ifcCamera.cameraControls.setPosition(15, 15, 15);
          viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        }
        
        setViewerInitialized(true);
        
      } catch (e) {
        console.error("Error initializing IFC viewer:", e);
        toast({
          variant: "destructive",
          title: "Error de visualización",
          description: "No se pudo inicializar el visualizador IFC.",
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
          variant: "default",
          title: "Visualizador LAS Listo",
          description: "Visualización de nube de puntos centrada en el origen (0,0,0)"
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
    
    // Mejorar la visibilidad de la cuadrícula
    ctx.strokeStyle = 'rgba(120, 120, 120, 0.6)';
    ctx.lineWidth = 1;
    
    const gridSize = 50 * zoomLevel;
    const gridExtent = 2000;
    
    // Dibujar líneas de cuadrícula
    for (let x = -gridExtent; x <= gridExtent; x += gridSize / zoomLevel) {
      // Línea central más brillante (eje X)
      if (Math.abs(x) < 1) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.4)';
        ctx.lineWidth = 1;
      }
      
      ctx.beginPath();
      ctx.moveTo(centerX + x * zoomLevel, centerY - gridExtent * zoomLevel);
      ctx.lineTo(centerX + x * zoomLevel, centerY + gridExtent * zoomLevel);
      ctx.stroke();
    }
    
    for (let y = -gridExtent; y <= gridExtent; y += gridSize / zoomLevel) {
      // Línea central más brillante (eje Y)
      if (Math.abs(y) < 1) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.4)';
        ctx.lineWidth = 1;
      }
      
      ctx.beginPath();
      ctx.moveTo(centerX - gridExtent * zoomLevel, centerY + y * zoomLevel);
      ctx.lineTo(centerX + gridExtent * zoomLevel, centerY + y * zoomLevel);
      ctx.stroke();
    }
    
    // Marcar el origen con un círculo para que sea más evidente
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4 * zoomLevel, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw axes with increased size and visibility
    // X axis (red)
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + 150 * zoomLevel, centerY);
    ctx.stroke();
    
    // Y axis (green)
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 150 * zoomLevel);
    ctx.stroke();
    
    // Z axis (blue)
    ctx.strokeStyle = '#3333ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 75 * zoomLevel, centerY + 75 * zoomLevel);
    ctx.stroke();
    
    // Etiquetar los ejes con texto más grande y visible
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("X", centerX + 160 * zoomLevel, centerY + 20);
    ctx.fillText("Y", centerX - 20, centerY - 160 * zoomLevel);
    ctx.fillText("Z", centerX - 85 * zoomLevel, centerY + 95 * zoomLevel);
    
    // Marcar el origen de manera más visible
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText("Origen (0,0,0)", centerX, centerY + 30);
    
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
    ctx.fillText("Nube de puntos centrada en el origen (0,0,0)", width / 2, 55);
    
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
      // Reset IFC view to origin
      try {
        // Mostrar el origen primero
        viewerRef.current.context.ifcCamera.cameraControls.setPosition(20, 20, 20);
        viewerRef.current.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        
        // Luego encajar el modelo si existe
        const scene = viewerRef.current.context.getScene();
        viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
        
        toast({
          variant: "default",
          title: "Vista Reiniciada",
          description: "Vista centrada en el origen (0,0,0)"
        });
      } catch (e) {
        console.error("Error resetting view:", e);
      }
    } else if (fileType === 'las') {
      // Reset LAS view to origin
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
        variant: "default",
        title: "Vista Reiniciada",
        description: "Vista centrada en el origen (0,0,0)"
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
  
  // If loading, show loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">Cargando visualizador...</p>
          <p className="text-gray-400 text-sm mt-2">Preparando {fileName}</p>
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
                <h2 className="text-lg font-medium">Explorador</h2>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium mb-2">ARCHIVO</h3>
                <ul>
                  <li className="py-1 px-2 rounded hover:bg-[#444444] cursor-pointer text-sm flex items-center">
                    <File className="h-4 w-4 mr-2" /> {fileName || "No hay modelo cargado"}
                  </li>
                </ul>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="ml-4 text-white font-medium">
            {fileType === 'ifc' ? 'Visualizador IFC' : 'Visualizador LAS'} - {fileName}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={goBack} className="text-white hover:bg-[#444444]">
            <X className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#444444]"
            onClick={resetView}
            title="Centrar en origen (0,0,0)"
          >
            <Axis3d className="h-4 w-4" />
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
          
          {/* Instrucciones de navegación superpuestas */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded">
            <div className="flex items-center gap-2 text-sm">
              <Axis3d className="h-4 w-4" /> 
              <span>Origen (0,0,0) visible con ejes X, Y, Z</span>
            </div>
          </div>
          
          {/* File info overlay */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-[#333333] text-white px-3 py-2 rounded border border-[#444444]">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" /> 
                <span>{fileName}</span>
                <span className="text-xs bg-[#444444] px-2 py-1 rounded">{fileType?.toUpperCase()}</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Posición: Origen (0,0,0)
              </div>
            </div>
          </div>
          
          {/* Viewer Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button 
              onClick={resetView}
              variant="outline" 
              size="icon"
              title="Centrar en origen (0,0,0)"
              className="bg-[#333333] text-white hover:bg-[#444444] border-[#444444]"
            >
              <Move className="h-5 w-5" />
            </Button>
            <Button 
              onClick={toggleFullscreen}
              variant="outline" 
              size="icon"
              title="Pantalla completa"
              className="bg-[#333333] text-white hover:bg-[#444444] border-[#444444]"
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
              variant="outline" 
              size="icon"
              title="Aumentar zoom"
              className="bg-[#333333] text-white hover:bg-[#444444] border-[#444444]"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>
        </main>
      </div>
      
      {/* Status bar */}
      <footer className="h-6 bg-[#333333] border-t border-[#444444] text-[#AAAAAA] text-xs px-4 flex items-center">
        <span>Listo</span>
        <span className="ml-auto">{fileType?.toUpperCase()} Viewer</span>
      </footer>
    </div>
  );
};

export default Viewer;
