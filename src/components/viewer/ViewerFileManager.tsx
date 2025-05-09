
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Type definitions for the file data
export interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  visible?: boolean;
  id?: string;
}

export const useViewerFileManager = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [visibleFiles, setVisibleFiles] = useState<{[key: string]: boolean}>({});
  
  // Extract files from location state
  const state = location.state || {};
  const [files, setFiles] = useState<FileData[]>(() => {
    console.log("Initial state:", state);
    const initialFiles = state.files || [];
    
    // Add a single file if no files array but fileType exists
    if (initialFiles.length === 0 && state.fileType) {
      return [{
        fileType: state.fileType,
        fileName: state.fileName || 'Unknown file',
        fileUrl: state.fileUrl || undefined,
        id: `${state.fileName || 'file'}-${Date.now() + Math.random() * 1000}`,
        visible: true
      }];
    }
    
    // Add IDs and visibility to files
    return initialFiles.map((file: FileData) => ({
      ...file,
      id: `${file.fileName}-${Date.now() + Math.random() * 1000}`,
      visible: true
    }));
  });
  
  const isDemoMode = state.demo || files.length === 0;
  
  // Initialize visibility state for files
  useEffect(() => {
    const initialVisibility: {[key: string]: boolean} = {};
    files.forEach(file => {
      if (file.id) {
        initialVisibility[file.id] = true;
      }
    });
    setVisibleFiles(initialVisibility);
    
    console.log("Files initialized:", files);
  }, []);

  // Function to toggle file visibility
  const toggleFileVisibility = (fileId: string) => {
    setVisibleFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return {
    files,
    isLoading,
    setIsLoading,
    isDemoMode,
    visibleFiles,
    toggleFileVisibility,
    loadingError,
    setLoadingError
  };
};
