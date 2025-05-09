
import React from "react";
import { Button } from "@/components/ui/button";

interface ViewerErrorOverlayProps {
  error: string | null;
  onBack: () => void;
}

const ViewerErrorOverlay: React.FC<ViewerErrorOverlayProps> = ({ error, onBack }) => {
  if (!error) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
      <div className="bg-card p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={onBack}>Return to Upload</Button>
      </div>
    </div>
  );
};

export default ViewerErrorOverlay;
