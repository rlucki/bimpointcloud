
import React from "react";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewerPlaceholderProps {
  openFileDialog: () => void;
}

const ViewerPlaceholder: React.FC<ViewerPlaceholderProps> = ({ openFileDialog }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
      <Box className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
      <h3 className="text-xl font-medium mb-2">Drag & Drop to View</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Drag and drop your IFC or LAS files here to visualize them, or click "Open File" above.
      </p>
      <Button onClick={openFileDialog}>Select File</Button>
    </div>
  );
};

export default ViewerPlaceholder;
