
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Menu, XIcon, Settings, Maximize, Maximize2, Eye, Bug } from 'lucide-react';
import ViewerSidebar from './ViewerSidebar';
import ViewerToolbar from './ViewerToolbar';
import ViewerDiagnostics from './ViewerDiagnostics';
import ViewerStatus from './ViewerStatus';

interface ViewerLayoutProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onDebug: () => void;
  isFullscreen: boolean;
  files: any[];
  viewer: IfcViewerAPI | null;
  fileUrl?: string;
  fileName?: string | null;
  // Add new props for diagnostics
  wasmLoaded?: boolean;
  modelLoaded?: boolean;
  meshExists?: boolean;
}

const ViewerLayout: React.FC<ViewerLayoutProps> = ({
  title,
  children,
  onClose,
  onToggleFullscreen,
  onDebug,
  isFullscreen,
  files,
  viewer,
  fileUrl,
  fileName,
  wasmLoaded,
  modelLoaded,
  meshExists
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shadow-sm">
        <div className="flex items-center space-x-4">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
              <ViewerSidebar 
                files={files}
                onClose={() => setIsSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-medium">{title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowDiagnostics(true)}
          >
            <Bug className="h-5 w-5" />
            <span className="sr-only">Diagnostics</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Maximize className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main viewer */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {children}
          
          {/* ViewerToolbar component - small floating toolbar */}
          <ViewerToolbar 
            className="absolute top-4 right-4"
            onDebug={onDebug}
          />
        </main>
      </div>
      
      {/* Diagnostics dialog */}
      {showDiagnostics && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ViewerDiagnostics 
            viewer={viewer}
            fileUrl={fileUrl}
            fileName={fileName}
            onClose={() => setShowDiagnostics(false)}
            onReload={() => window.location.reload()}
            wasmLoaded={wasmLoaded}
            modelLoaded={modelLoaded}
            meshExists={meshExists}
          />
        </div>
      )}
    </div>
  );
};

export default ViewerLayout;
