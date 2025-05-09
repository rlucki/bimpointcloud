
import React from "react";
import { useLocation } from "react-router-dom";
import ModelViewer from "@/components/ModelViewer";

const Viewer = () => {
  const location = useLocation();
  const { fileType, fileName } = location.state || { fileType: null, fileName: null };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/30 py-10 px-4">
      <ModelViewer fileType={fileType} fileName={fileName} />
      
      <footer className="mt-20 border-t py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2025 IFC & LAS Visualizer. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Viewer;
