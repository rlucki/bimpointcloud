
import React, { useCallback, useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Upload, FileImage, FileArchive } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (files: File[]) => void;
  accept?: string[];
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  accept = [".ifc", ".las"],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const acceptString = accept.join(",");
  
  const validateFiles = (files: FileList | File[]): File[] => {
    // Debug log for validating files
    console.log("Validating files:", files);
    
    const validatedFiles = Array.from(files).filter((file) => {
      if (!file.name) {
        console.log("Invalid file - missing name:", file);
        return false;
      }
      
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidExtension = accept.includes(fileExtension);
      
      if (!isValidExtension) {
        toast({
          variant: "destructive",
          title: "Unsupported file",
          description: `${file.name} is not supported. Please upload ${accept.join(" or ")} files.`,
        });
        return false;
      }
      
      // Log valid file details
      console.log(`Valid file: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
      return true;
    });
    
    return validatedFiles;
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Debug log for dropped files
    console.log("Dropped files:", e.dataTransfer.files);
    
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files);
      toast({
        title: "Files added",
        description: `${files.length} file(s) ready for upload`,
      });
    }
  }, [onFileSelect, toast, accept]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Debug log for selected files via input
      console.log("Files selected via input:", e.target.files);
      
      const files = validateFiles(e.target.files);
      if (files.length > 0) {
        onFileSelect(files);
        toast({
          title: "Files added",
          description: `${files.length} file(s) ready for upload`,
        });
      }
      
      // Reset the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onFileSelect, toast, accept]);

  // Add a click handler to trigger the hidden file input
  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-all duration-300 ease-in-out cursor-pointer",
        isDragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-secondary/50"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClickUpload}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden" // Hide the actual input
        accept={acceptString}
        onChange={handleFileSelect}
      />
      <div className="flex flex-col items-center justify-center">
        <Upload className="h-10 w-10 mb-3 text-primary" />
        <h3 className="font-medium text-lg mb-1">Drag and drop files here</h3>
        <p className="text-sm text-muted-foreground mb-2">or click to browse</p>
        <div className="flex flex-row space-x-4 mt-2">
          <div className="flex flex-col items-center">
            <FileArchive className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium mt-1">.ifc</span>
          </div>
          <div className="flex flex-col items-center">
            <FileImage className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium mt-1">.las</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
