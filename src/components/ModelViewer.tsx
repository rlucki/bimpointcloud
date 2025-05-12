
import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import ViewerHeader from "./viewer/ViewerHeader";
import ViewerStatusBar from "./viewer/ViewerStatusBar";
import ViewerPlaceholder from "./viewer/ViewerPlaceholder";
import ViewerError from "./viewer/ViewerError";
import LoadingOverlay from "./viewer/LoadingOverlay";
import ExampleModelSelector from "./viewer/ExampleModelSelector";
import DirectThreeViewer from "./viewer/DirectThreeViewer";
// import { useIFCViewer } from "@/hooks/useIFCViewer"; // Comentamos el hook anterior
// import IfcViewerContainer from "./viewer/IfcViewerContainer"; // Comentamos el contenedor anterior

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
  const [exampleUrl, setExampleUrl] = useState<string | undefined>(fileUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setExampleUrl(fileURL);
      
      // Update navigation state without reloading the page
      window.history.pushState(
        { fileType: 'ifc' as const, fileName: file.name, fileUrl: fileURL },
        '',
        window.location.pathname
      );
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

  const handleLoadExampleModel = (url: string) => {
    setExampleUrl(url);
    const fileName = url.split('/').pop() || "example-model.ifc";
    
    // Update navigation state without reloading the page
    window.history.pushState(
      { fileType: 'ifc' as const, fileName, fileUrl: url },
      '',
      window.location.pathname
    );
    
    toast({
      title: "Loading example model",
      description: `Loading ${fileName} from remote server...`,
    });
  };

  // Manejadores para eventos del visualizador
  const handleModelLoad = () => {
    setStatusMessage("Model loaded: " + (fileName || 'unknown'));
    setIsLoading(false);
  };

  const handleModelError = (errorMsg: string) => {
    setError(`Error al cargar el modelo: ${errorMsg}`);
    setStatusMessage("Error: " + errorMsg);
    setIsLoading(false);
  };

  const retry = () => {
    setError(null);
    setIsLoading(true);
    setStatusMessage("Retrying...");
    // Forzar una recarga del modelo simulando un cambio en la URL
    const currentUrl = exampleUrl;
    setExampleUrl(undefined);
    setTimeout(() => {
      setExampleUrl(currentUrl);
    }, 100);
  };

  // Show loading overlay if we're loading
  if (isLoading) {
    return (
      <LoadingOverlay 
        isDemoMode={!fileUrl && !exampleUrl} 
        filesCount={fileUrl || exampleUrl ? 1 : 0} 
        statusMessage={statusMessage} 
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
        debug={() => console.log("Debug info:", { fileUrl: exampleUrl, fileName })}
      />
      
      {!fileName && !error && !exampleUrl && (
        <ExampleModelSelector onLoadExample={handleLoadExampleModel} />
      )}
      
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
            details="El modelo no se pudo cargar. Verifica que los archivos WASM estén correctamente instalados en la carpeta /public/wasm/"
            navigate={navigate} 
            onRetry={retry}
          />
        ) : (fileType === 'ifc' || exampleUrl) ? (
          <div className="h-[600px] relative">
            <DirectThreeViewer 
              fileUrl={exampleUrl} 
              fileName={fileName}
              onLoad={handleModelLoad}
              onError={handleModelError}
            />
          </div>
        ) : null}

        {!fileType && !fileName && !exampleUrl && !error && (
          <ViewerPlaceholder openFileDialog={openFileDialog} />
        )}
      </Card>
      
      <ViewerStatusBar 
        status={statusMessage}
        fileName={fileName || (exampleUrl ? exampleUrl.split('/').pop() : null)}
        fileType={fileType || (exampleUrl ? 'ifc' : null)}
        isLoading={isLoading}
        info={"IFC Viewer with direct Three.js rendering"}
      />
    </div>
  );
};

export default ModelViewer;
