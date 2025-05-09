
import React from "react";
import FileUploader from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-700 bg-clip-text text-transparent">
            IFC & LAS Visualizer
          </h1>
        </div>
        <Button variant="outline">Login</Button>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Upload Your 3D Models</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Drag and drop your IFC building models or LAS point cloud files to
              visualize and analyze them in 3D space.
            </p>
            
            <div className="mt-6">
              <Button 
                onClick={() => navigate('/viewer')} 
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Go to 3D Viewer
              </Button>
            </div>
          </div>
          
          <FileUploader />
        </div>
      </main>

      <footer className="mt-20 border-t border-border py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2025 IFC & LAS Visualizer. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
