
import React, { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Info,
  MinimizeIcon,
  MaximizeIcon
} from "lucide-react";

const Viewer = () => {
  const location = useLocation();
  const { fileType, fileName } = location.state || { fileType: null, fileName: null };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Si no hay state, redirigir a la página principal
  if (!location.state) {
    return <Navigate to="/" />;
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
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
                  <li className="py-1 px-2 rounded hover:bg-[#444444] cursor-pointer text-sm">
                    {fileName || "No model loaded"}
                  </li>
                </ul>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="ml-4 text-white font-medium">
            {fileType === 'ifc' ? 'IFC Viewer' : 'LAS Viewer'}
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
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#444444]">
              <Search className="h-4 w-4" />
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
                  No structure available for LAS files
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
          {/* For the demo, we're embedding TheOpenEngine fragments viewer */}
          <iframe
            src="https://thatopen.github.io/engine_fragment/examples/FragmentsModels/"
            className="w-full h-full border-none"
            title="TheOpenEngine Viewer"
          ></iframe>
          
          {/* Info Overlay */}
          <div className="absolute bottom-4 right-4">
            <Button variant="outline" size="sm" className="bg-[#333333] text-white border-[#444444] hover:bg-[#444444] flex items-center gap-2">
              <Info className="h-4 w-4" /> 
              <span>{fileName || "No file"}</span>
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
