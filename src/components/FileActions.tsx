
import React from "react";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";

interface FileActionsProps {
  isUploading: boolean;
  filesExist: boolean;
  hasSuccessfulFiles: boolean;
  onUpload: () => void;
  onViewIn3D: () => void;
}

const FileActions: React.FC<FileActionsProps> = ({
  isUploading,
  filesExist,
  hasSuccessfulFiles,
  onUpload,
  onViewIn3D,
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={onUpload} 
        disabled={isUploading || !filesExist}
      >
        {isUploading ? "Uploading..." : "Upload Files"}
      </Button>
      
      {hasSuccessfulFiles && (
        <Button 
          onClick={onViewIn3D} 
          variant="outline"
          className="flex items-center gap-1"
        >
          <Box className="h-4 w-4" /> View in 3D
        </Button>
      )}
    </div>
  );
};

export default FileActions;
