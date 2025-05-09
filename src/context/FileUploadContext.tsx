
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface FileWithStatus extends File {
  id: string;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  url?: string; // Add URL for accessing the file data
}

interface FileUploadContextType {
  files: FileWithStatus[];
  isUploading: boolean;
  setFiles: React.Dispatch<React.SetStateAction<FileWithStatus[]>>;
  handleFilesSelected: (selectedFiles: File[]) => void;
  handleRemoveFile: (id: string) => void;
  simulateUpload: () => Promise<void>;
  clearCompleted: () => void;
  viewIn3D: () => void;
  hasSuccessfulFiles: boolean;
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined);

export const FileUploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debug logs to help troubleshoot file issues
  useEffect(() => {
    if (files.length > 0) {
      console.log("Current files:", files);
    }
  }, [files]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    // Debug logs for selected files
    console.log("Selected files:", selectedFiles);
    
    // Create a deep copy of each file object to ensure all properties are preserved
    const validFiles = selectedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'ifc' || extension === 'las') {
        return true;
      }
      toast({
        variant: "destructive",
        title: "Unsupported file format",
        description: `File ${file.name} is not supported. Only .ifc and .las files are supported.`
      });
      return false;
    });
    
    // Create file objects with additional properties
    const newFiles = validFiles.map((file) => {
      // Generate object URL for the file to access it later
      const url = URL.createObjectURL(file);
      
      // Create a properly structured file object with explicit properties
      const fileWithStatus = {
        ...file,
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        progress: 0,
        status: "idle" as const,
        slice: file.slice,
        stream: file.stream,
        text: file.text,
        arrayBuffer: file.arrayBuffer,
        url // Add URL to access the file data
      };
      
      // Debug log for the created file object
      console.log("Created file with status:", fileWithStatus);
      
      return fileWithStatus;
    });
    
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prevFiles) => {
      // Revoke object URLs before removing files to prevent memory leaks
      const fileToRemove = prevFiles.find(file => file.id === id);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prevFiles.filter((file) => file.id !== id);
    });
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
            
            // For demo purposes, let's make all uploads successful
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === file.id ? { ...f, status: "success", progress: 100 } : f
              )
            );
            
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
    // Revoke object URLs for completed files
    files.forEach(file => {
      if (file.status === "success" && file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    
    setFiles((prevFiles) => prevFiles.filter((file) => file.status !== "success"));
  };

  const viewIn3D = () => {
    // Get all successful files
    const successFiles = files.filter((file) => file.status === "success");
    
    if (successFiles.length > 0) {
      // Prepare file data for the viewer
      const fileData = successFiles.map(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        return {
          fileType: fileExtension === 'ifc' ? 'ifc' : 'las',
          fileName: file.name,
          fileSize: file.size,
          fileUrl: file.url // Pass the object URL
        };
      });
      
      // Log information for debugging
      console.log("Navigating to viewer with files:", fileData);
      
      navigate('/viewer', { state: { files: fileData } });
    } else {
      // Demo mode: navigate to viewer without files
      console.log("Navigating to viewer in demo mode");
      navigate('/viewer', { state: { demo: true } });
    }
  };

  const hasSuccessfulFiles = files.some((file) => file.status === "success");

  const value = {
    files,
    isUploading,
    setFiles,
    handleFilesSelected,
    handleRemoveFile,
    simulateUpload,
    clearCompleted,
    viewIn3D,
    hasSuccessfulFiles
  };

  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  );
};

export const useFileUpload = () => {
  const context = useContext(FileUploadContext);
  if (context === undefined) {
    throw new Error('useFileUpload must be used within a FileUploadProvider');
  }
  return context;
};
