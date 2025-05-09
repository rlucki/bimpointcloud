
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import ViewerHeader from "./viewer/ViewerHeader";
import ViewerStatusBar from "./viewer/ViewerStatusBar";
import ViewerDropArea from "./viewer/ViewerDropArea";
import ViewerPlaceholder from "./viewer/ViewerPlaceholder";
import ViewerError from "./viewer/ViewerError";
import ViewerLoading from "./viewer/ViewerLoading";
import ViewerCanvas from "./viewer/ViewerCanvas";
import { useIFCViewer } from "@/hooks/useIFCViewer";
import IfcViewerContainer from "./viewer/IfcViewerContainer";

interface ModelViewerProps {
  fileType: "ifc" | "las" | null;
  fileName: string | null;
  fileUrl?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ fileType, fileName, fileUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing...");

  // Use our new custom hook for IFC viewer
  const {
    isLoading,
    error,
    isInitialized: viewerInitialized,
    modelLoaded,
    frameAll,
    debug
  } = useIFCViewer({
    containerRef,
    fileUrl: fileType === 'ifc' ? fileUrl : undefined,
    fileName
  });

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'ifc' || fileExtension === 'las') {
      // Process file
      toast({
        title: "File received",
        description: `Processing ${file.name}...`,
      });
      
      // In a real implementation, we would load this file into the viewer
      // For now, we'll just set the file info and reload the viewer
      const newFileType = fileExtension as "ifc" | "las";
      navigate('/viewer', { 
        state: { 
          fileType: newFileType, 
          fileName: file.name,
        }
      });
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported file format",
        description: "Please upload an IFC or LAS file.",
      });
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle scene ready from canvas component
  const handleSceneReady = (scene: THREE.Scene) => {
    console.log("Canvas scene is ready");
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
      <ViewerHeader 
        navigate={navigate} 
        openFileDialog={openFileDialog} 
        fileInputRef={fileInputRef}
        handleFileInputChange={handleFileInputChange}
        debug={debug}
      />
      
      <Card 
        className={`relative overflow-hidden border shadow-md transition-all duration-300 flex-1 ${isDragging ? 'border-primary bg-primary/5' : 'bg-card'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <ViewerLoading fileName={fileName} />
        ) : error ? (
          <ViewerError error={error} navigate={navigate} />
        ) : fileType === 'ifc' ? (
          <IfcViewerContainer 
            containerRef={containerRef}
            viewerInitialized={viewerInitialized}
            isDragging={isDragging}
            modelLoaded={modelLoaded}
            fileName={fileName}
          />
        ) : (
          <ViewerCanvas 
            canvasRef={canvasRef} 
            isDragging={isDragging}
            fileType={fileType}
            fileName={fileName}
            onSceneReady={handleSceneReady}
          />
        )}

        {!fileType && !fileName && !isLoading && !error && (
          <ViewerPlaceholder openFileDialog={openFileDialog} />
        )}
      </Card>
      
      <ViewerStatusBar 
        status={statusMessage}
        fileName={fileName}
        fileType={fileType}
        isLoading={isLoading}
        info={fileType === "ifc" ? "IFC Viewer" : fileType === "las" ? "LAS Viewer" : "3D Viewer"}
      />
    </div>
  );
};

export default ModelViewer;
