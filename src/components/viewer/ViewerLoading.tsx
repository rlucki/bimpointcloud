
import React from "react";

interface ViewerLoadingProps {
  fileName: string | null;
}

const ViewerLoading: React.FC<ViewerLoadingProps> = ({ fileName }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <h3 className="text-xl font-medium mb-2">Loading Model</h3>
      <p className="text-muted-foreground">Preparing to visualize {fileName}</p>
    </div>
  );
};

export default ViewerLoading;
