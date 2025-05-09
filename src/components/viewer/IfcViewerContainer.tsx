
import React from "react";
import ViewerDropArea from "./ViewerDropArea";
import { Button } from "@/components/ui/button";
import { Bug, AlertTriangle } from "lucide-react";

interface IfcViewerContainerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  viewerInitialized: boolean;
  isDragging: boolean;
  modelLoaded: boolean;
  fileName: string | null;
  onOpenDiagnostics?: () => void;
  meshExists?: boolean;
}

const IfcViewerContainer: React.FC<IfcViewerContainerProps> = ({ 
  containerRef, 
  viewerInitialized,
  isDragging,
  modelLoaded,
  fileName,
  onOpenDiagnostics,
  meshExists
}) => {
  return (
    <div 
      ref={containerRef} 
      className="w-full h-[600px] relative"
      style={{ visibility: viewerInitialized ? 'visible' : 'hidden' }}
    >
      <ViewerDropArea isDragging={isDragging} />
      
      {/* Status indicator */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
        {modelLoaded ? (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            Model loaded: {fileName}
            {meshExists === false && (
              <span className="ml-2 flex items-center text-yellow-300">
                <AlertTriangle className="h-3 w-3 mr-1" /> No mesh
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
            Viewer ready - No model loaded
          </div>
        )}
      </div>
      
      {/* Diagnostics shortcut button */}
      {((!modelLoaded && onOpenDiagnostics && viewerInitialized) || (modelLoaded && meshExists === false)) && (
        <div className="absolute top-4 right-4">
          <Button 
            onClick={onOpenDiagnostics}
            className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"
            size="sm"
          >
            <Bug className="h-4 w-4" />
            <span>Diagnose Model</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default IfcViewerContainer;
