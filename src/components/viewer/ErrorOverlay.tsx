
import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorOverlayProps {
  errorMessage: string | null;
  details?: string;
  onReturn: () => void;
  onRetry?: () => void;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ 
  errorMessage, 
  details, 
  onReturn,
  onRetry 
}) => {
  if (!errorMessage) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
      <div className="bg-card p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        
        {details && (
          <div className="bg-black/10 p-3 rounded-md mb-4 overflow-auto max-h-32 text-xs text-left text-muted-foreground">
            <code>{details}</code>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>Retry</Button>
          )}
          <Button onClick={onReturn}>Return to Upload</Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;
