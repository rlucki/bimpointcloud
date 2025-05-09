
import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import ViewerHeader from "./viewer/ViewerHeader";
import ViewerStatusBar from "./viewer/ViewerStatusBar";
import ViewerPlaceholder from "./viewer/ViewerPlaceholder";
import ViewerError from "./viewer/ViewerError";
import ViewerLoading from "./viewer/ViewerLoading";
import { useIFCViewer } from "@/hooks/useIFCViewer";
import IfcViewerContainer from "./viewer/IfcViewerContainer";
import LoadingOverlay from "./viewer/LoadingOverlay";

interface ModelViewerProps {
  fileType: "ifc" | null;
  fileName: string | null;
  fileUrl?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ fileType, fileName, fileUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready");

  // Use our custom hook for IFC viewer
  const {
    isLoading,
    error,
    errorDetails,
    isInitialized: viewerInitialized,
    modelLoaded,
    loadingStatus,
    frameAll,
    retry,
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
    if (fileExtension === 'ifc') {
      // Process file
      toast({
        title: "File received",
        description: `Processing ${file.name}...`,
      });
      
      // Create a URL for the file
      const fileURL = URL.createObjectURL(file);
      
      // Now navigate with both the file name and URL
      navigate('/viewer', { 
        state: { 
          fileType: 'ifc' as const, 
          fileName: file.name,
          fileUrl: fileURL // Pass the object URL
        }
      });
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported file format",
        description: "Please upload an IFC file.",
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

  // Update status message based on viewer state
  React.useEffect(() => {
    if (isLoading) {
      setStatusMessage(loadingStatus);
    } else if (error) {
      setStatusMessage("Error: " + error);
    } else if (modelLoaded) {
      setStatusMessage("Model loaded: " + fileName);
    } else if (viewerInitialized) {
      setStatusMessage("Viewer ready - no model loaded");
    } else {
      setStatusMessage("Initializing...");
    }
  }, [isLoading, error, modelLoaded, viewerInitialized, fileName, loadingStatus]);

  // Show loading overlay if we're loading
  if (isLoading) {
    return (
      <LoadingOverlay 
        isDemoMode={!fileUrl} 
        filesCount={fileUrl ? 1 : 0} 
        statusMessage={loadingStatus} 
      />
    );
  }

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
        {error ? (
          <ViewerError 
            error={error} 
            details={errorDetails || undefined}
            navigate={navigate} 
            onRetry={retry}
          />
        ) : fileType === 'ifc' ? (
          <IfcViewerContainer 
            containerRef={containerRef}
            viewerInitialized={viewerInitialized}
            isDragging={isDragging}
            modelLoaded={modelLoaded}
            fileName={fileName}
          />
        ) : null}

        {!fileType && !fileName && !error && (
          <ViewerPlaceholder openFileDialog={openFileDialog} />
        )}
      </Card>
      
      <ViewerStatusBar 
        status={statusMessage}
        fileName={fileName}
        fileType={fileType}
        isLoading={isLoading}
        info={"IFC Viewer"}
      />
    </div>
  );
};

export default ModelViewer;
