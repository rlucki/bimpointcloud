
import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { File, FileImage, FileArchive, CheckCircle, XCircle, Loader } from "lucide-react";

export interface FileItemProps {
  file: File;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  onRemove?: () => void;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  progress,
  status,
  onRemove,
}) => {
  // Format file size properly
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  
  // Add a safety check to ensure file and file.name exist before using split
  const fileExtension = file && file.name ? file.name.split(".").pop()?.toLowerCase() : '';
  
  const getFileIcon = () => {
    switch (fileExtension) {
      case "ifc":
        return <FileArchive className="h-8 w-8 text-primary" />;
      case "las":
        return <FileImage className="h-8 w-8 text-primary" />;
      default:
        return <File className="h-8 w-8 text-primary" />;
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return <Loader className="h-5 w-5 text-primary animate-spin" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Calculate actual file name and size
  const displayName = file?.name || "Unknown file";
  const displaySize = file?.size ? formatFileSize(file.size) : "0 KB";
  
  return (
    <div className={cn(
      "flex items-center p-3 rounded-md mb-3 bg-background border",
      status === "error" ? "border-red-300" : "border-gray-200"
    )}>
      <div className="mr-3 flex-shrink-0">
        {getFileIcon()}
      </div>
      <div className="flex-grow mr-3">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]" title={displayName}>
            {displayName}
          </h4>
          <span className="text-xs text-muted-foreground">{displaySize}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5">
          {getStatusIcon()}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Remove file"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FileItem;
