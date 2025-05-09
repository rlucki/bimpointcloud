
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Box } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import FileItem, { FileItemProps } from "@/components/FileItem";

interface FileWithStatus extends File {
  id: string;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
}

const FileUploader: React.FC = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles = selectedFiles.map((file) => ({
      ...file,
      id: `${file.name}-${Date.now()}`,
      progress: 0,
      status: "idle" as const,
    }));
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  const simulateUpload = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files to upload",
        description: "Please select at least one file to upload.",
      });
      return;
    }

    setIsUploading(true);
    
    // Update all files to uploading state
    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        status: "uploading",
      }))
    );

    // Simulate file upload for each file with different timing
    const uploadPromises = files.map((file) => {
      return new Promise<void>((resolve) => {
        const duration = 1000 + Math.random() * 2000; // Random duration between 1-3 seconds
        const interval = 50; // Update interval in ms
        const steps = duration / interval;
        let currentStep = 0;

        const updateProgress = setInterval(() => {
          currentStep++;
          const newProgress = Math.min(100, Math.round((currentStep / steps) * 100));
          
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === file.id ? { ...f, progress: newProgress } : f
            )
          );

          if (currentStep >= steps) {
            clearInterval(updateProgress);
            
            // 10% chance of upload error for demonstration
            const isError = Math.random() < 0.1;
            
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === file.id
                  ? { ...f, status: isError ? "error" : "success", progress: isError ? 80 : 100 }
                  : f
              )
            );

            if (isError) {
              toast({
                variant: "destructive",
                title: "Upload failed",
                description: `Failed to upload ${file.name}. Please try again.`,
              });
            }
            
            resolve();
          }
        }, interval);
      });
    });

    await Promise.all(uploadPromises);
    
    // Count successful uploads
    const successCount = files.filter((file) => file.status === "success").length;
    
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} of ${files.length} files.`,
      });
    }
    
    setIsUploading(false);
  };

  const clearCompleted = () => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.status !== "success"));
  };

  const viewIn3D = () => {
    // Find the first successful file
    const successFile = files.find((file) => file.status === "success");
    
    if (successFile && successFile.name) {
      const fileExtension = successFile.name.split('.').pop()?.toLowerCase();
      let fileType = null;
      
      if (fileExtension === 'ifc') {
        fileType = 'ifc';
      } else if (fileExtension === 'las') {
        fileType = 'las';
      }
      
      // Log information for debugging
      console.log("Navigating to viewer with:", { fileType, fileName: successFile.name });
      
      if (fileType) {
        navigate('/viewer', { state: { fileType, fileName: successFile.name } });
      } else {
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: `The file ${successFile.name} has an unsupported format.`,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "No uploaded files",
        description: "Please upload at least one file successfully before viewing.",
      });
      
      // Log debugging info about current files
      console.log("Current files:", files);
      console.log("Successful files:", files.filter(f => f.status === "success"));
    }
  };

  const hasSuccessfulFiles = files.some((file) => file.status === "success");
  
  // Add debug info to help troubleshoot
  console.log("Has successful files:", hasSuccessfulFiles);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          File Upload
          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
            IFC & LAS
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UploadZone onFileSelect={handleFilesSelected} accept={[".ifc", ".las"]} />
        
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Files ({files.length})</h3>
              {files.some((file) => file.status === "success") && (
                <Button variant="link" size="sm" onClick={clearCompleted}>
                  Clear completed
                </Button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto pr-1">
              {files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  progress={file.progress}
                  status={file.status}
                  onRemove={() => handleRemoveFile(file.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          Supported formats: .ifc, .las
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={simulateUpload} 
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
          
          {hasSuccessfulFiles && (
            <Button 
              onClick={viewIn3D} 
              variant="outline"
              className="flex items-center gap-1"
            >
              <Box className="h-4 w-4" /> View in 3D
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
