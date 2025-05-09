
import React from "react";
import { Button } from "@/components/ui/button";
import { NavigateFunction } from "react-router-dom";

interface ViewerErrorProps {
  error: string;
  details?: string;
  navigate: NavigateFunction;
  onRetry?: () => void;
}

const ViewerError: React.FC<ViewerErrorProps> = ({ 
  error, 
  details, 
  navigate, 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
      <div className="text-red-500 mb-4 text-4xl">⚠️</div>
      <h3 className="text-xl font-medium mb-2 text-red-500">Error</h3>
      <p className="text-muted-foreground mb-4">{error}</p>
      
      {details && (
        <div className="bg-black/10 p-3 rounded-md mb-4 overflow-auto max-h-32 text-xs text-left w-full max-w-lg text-muted-foreground">
          <code>{details}</code>
        </div>
      )}
      
      <div className="flex gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>Retry</Button>
        )}
        <Button onClick={() => navigate('/')}>Return to Upload</Button>
      </div>
    </div>
  );
};

export default ViewerError;
