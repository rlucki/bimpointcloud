
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Box } from "lucide-react";
import { NavigateFunction } from "react-router-dom";

interface ViewerHeaderProps {
  navigate: NavigateFunction;
  openFileDialog: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  debug: () => void;
}

const ViewerHeader: React.FC<ViewerHeaderProps> = ({ 
  navigate, 
  openFileDialog, 
  fileInputRef, 
  handleFileInputChange,
  debug 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back to Upload
      </Button>
      <h2 className="text-2xl font-semibold">3D Model Viewer</h2>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={openFileDialog} className="flex items-center gap-1">
          <Box className="h-4 w-4" /> 
          Open File
          <input 
            ref={fileInputRef}
            type="file"
            accept=".ifc,.las"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </Button>
        {process.env.NODE_ENV !== 'production' && (
          <Button variant="ghost" onClick={debug}>Debug</Button>
        )}
      </div>
    </div>
  );
};

export default ViewerHeader;
