
import React from "react";
import FileUploader from "@/components/FileUploader";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/30">
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
          </div>
          
          <FileUploader />
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">IFC Files</h3>
              <p className="text-muted-foreground mb-4">
                Industry Foundation Classes (IFC) is the open standard for Building
                Information Modeling data.
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>BIM models with integrated data</li>
                <li>Architectural components and metadata</li>
                <li>Compatible with most CAD software</li>
              </ul>
            </div>
            
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">LAS Files</h3>
              <p className="text-muted-foreground mb-4">
                LAS is a binary file format for storing 3D point cloud data from
                laser scanning and LiDAR.
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>High-density point cloud data</li>
                <li>Terrain and as-built capture</li>
                <li>Millions of 3D points with color data</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2025 IFC & LAS Visualizer. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
