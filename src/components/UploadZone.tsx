
import React, { useCallback, useState } from "react";
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
  const { toast } = useToast();
  const acceptString = accept.join(",");
  
  const validateFiles = (files: FileList | File[]): File[] => {
    return Array.from(files).filter((file) => {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!accept.includes(fileExtension)) {
        toast({
          variant: "destructive",
          title: "Unsupported file",
          description: `${file.name} is not supported. Please upload ${accept.join(" or ")} files.`,
        });
        return false;
      }
      return true;
    });
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
      const files = validateFiles(e.target.files);
      if (files.length > 0) {
        onFileSelect(files);
        toast({
          title: "Files added",
          description: `${files.length} file(s) ready for upload`,
        });
      }
    }
  }, [onFileSelect, toast, accept]);

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-all duration-300 ease-in-out",
        isDragging ? "drag-active pulse-border" : "hover:border-primary/50 hover:bg-secondary/50"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={acceptString}
        onChange={handleFileSelect}
      />
      <div className="flex flex-col items-center justify-center">
        <Upload className="h-10 w-10 mb-3 text-primary" />
        <h3 className="font-medium text-lg mb-1">Drag and drop files here</h3>
        <p className="text-sm text-muted-foreground mb-2">or click to browse</p>
        <div className="flex flex-row space-x-4 mt-2">
          <div className="flex flex-col items-center">
            <FileArchive className="file-icon" />
            <span className="text-xs font-medium">.ifc</span>
          </div>
          <div className="flex flex-col items-center">
            <FileImage className="file-icon" />
            <span className="text-xs font-medium">.las</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
