
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface FileWithStatus extends File {
  id: string;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
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
      files.forEach(file => {
        console.log(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
      });
    }
  }, [files]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    // Debug logs for selected files
    console.log("Selected files:", selectedFiles);
    selectedFiles.forEach(file => {
      console.log(`Selected file: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    });
    
    // Filter only IFC and LAS files
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
      // Ensure we've captured all file properties correctly
      const fileWithStatus = {
        ...file,
        id: `${file.name}-${Date.now()}`,
        progress: 0,
        status: "idle" as const,
      };
      
      // Debug log for the created file object
      console.log("Created file with status:", fileWithStatus);
      
      return fileWithStatus;
    });
    
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

      // Automatically navigate to viewer after successful upload
      const successFile = files.find((file) => file.status === "success");
      if (successFile) {
        const fileExtension = successFile.name.split('.').pop()?.toLowerCase();
        const fileType = fileExtension === 'ifc' ? 'ifc' : 'las';
        
        // Log for debugging
        console.log("Auto-navigating to viewer with:", { fileType, fileName: successFile.name });
        
        navigate('/viewer', { state: { fileType, fileName: successFile.name } });
      }
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
