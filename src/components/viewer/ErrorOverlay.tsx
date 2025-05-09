
import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorOverlayProps {
  errorMessage: string | null;
  onReturn: () => void;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ errorMessage, onReturn }) => {
  if (!errorMessage) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
      <div className="bg-card p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <Button onClick={onReturn}>Return to Upload</Button>
      </div>
    </div>
  );
};

export default ErrorOverlay;
