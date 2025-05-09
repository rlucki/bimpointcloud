
import React from "react";
import { Button } from "@/components/ui/button";
import { NavigateFunction } from "react-router-dom";

interface ViewerErrorProps {
  error: string;
  navigate: NavigateFunction;
}

const ViewerError: React.FC<ViewerErrorProps> = ({ error, navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[500px]">
      <div className="text-red-500 mb-4">⚠️</div>
      <h3 className="text-xl font-medium mb-2 text-red-500">Error</h3>
      <p className="text-muted-foreground">{error}</p>
      <Button onClick={() => navigate('/')} className="mt-4">Return to Upload</Button>
    </div>
  );
};

export default ViewerError;
