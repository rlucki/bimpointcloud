
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  Wrench,
  Settings,
  SquareDashed,
  CircleX,
  CircleCheck,
  SquareX,
  SquareCheck,
  Eye,
  EyeOff
} from "lucide-react";
import * as THREE from "three";

interface ViewerDiagnosticsProps {
  viewer: any; // Using any here to work with the IFC viewer API
  fileUrl?: string;
  fileName: string | null;
  onClose: () => void;
  onReload: () => void;
}

const ViewerDiagnostics: React.FC<ViewerDiagnosticsProps> = ({
  viewer,
  fileUrl,
  fileName,
  onClose,
  onReload
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [systemChecks, setSystemChecks] = useState<{[key: string]: boolean | null}>({
    viewerExists: false,
    sceneExists: false,
    ifcManagerExists: false,
    modelLoaded: false,
    meshExists: false,
    meshInScene: false,
    geometryExists: false,
  });
  const [modelDetails, setModelDetails] = useState<any>(null);
  const [fixStatus, setFixStatus] = useState("");

  useEffect(() => {
    if (viewer) {
      analyzeViewer();
    }
  }, [viewer]);

  const analyzeViewer = () => {
    const checks = {
      viewerExists: !!viewer,
      sceneExists: viewer && !!viewer.context?.getScene(),
      ifcManagerExists: viewer && !!viewer.IFC,
      modelLoaded: false,
      meshExists: false,
      meshInScene: false,
      geometryExists: false,
    };
    
    let modelInfo: any = null;

    try {
      // Check scene content
      if (checks.sceneExists) {
        const scene = viewer.context.getScene();
        console.log("Scene objects:", scene.children.length);
        
        // Look for IFC models in the scene
        const ifcObjects: any[] = [];
        scene.traverse((object: THREE.Object3D) => {
          if (object.userData && (object.userData.modelID !== undefined || object.userData.ifcModel)) {
            ifcObjects.push(object);
          }
        });
        
        checks.modelLoaded = ifcObjects.length > 0;
        
        // If we have objects, check for mesh
        if (ifcObjects.length > 0) {
          // Check if any object has a mesh property
          const meshObjects = ifcObjects.filter((obj: any) => obj.isMesh || obj.type === 'Mesh');
          checks.meshExists = meshObjects.length > 0;
          
          // Check if meshes are in the scene
          checks.meshInScene = meshObjects.some((mesh: THREE.Mesh) => {
            const parent = mesh.parent;
            return parent === scene || (parent && scene.children.includes(parent));
          });
          
          // Check if any object has geometry
          checks.geometryExists = meshObjects.some((mesh: THREE.Mesh) => 
            !!mesh.geometry && mesh.geometry.attributes.position?.count > 0
          );
          
          // Get model details from the first object
          if (meshObjects.length > 0) {
            const firstMesh = meshObjects[0];
            const box = new THREE.Box3().setFromObject(firstMesh);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            
            modelInfo = {
              name: firstMesh.name || "Unknown",
              type: firstMesh.type,
              vertices: firstMesh.geometry?.attributes.position?.count || 0,
              boundingBox: {
                min: box.min.toArray(),
                max: box.max.toArray(),
                size: size.toArray(),
                center: center.toArray()
              },
              position: firstMesh.position.toArray(),
              scale: firstMesh.scale.toArray(),
              visible: firstMesh.visible,
              parent: firstMesh.parent ? firstMesh.parent.name || "Unnamed Parent" : "None"
            };
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing viewer:", error);
    }
    
    setSystemChecks(checks);
    setModelDetails(modelInfo);
  };

  const tryFixMeshIssues = async () => {
    if (!viewer) return;
    
    setIsFixing(true);
    setFixStatus("Attempting to fix mesh issues...");
    
    try {
      const scene = viewer.context.getScene();
      
      // Find any IFC-related objects in the scene
      let ifcObjects: any[] = [];
      scene.traverse((object: THREE.Object3D) => {
        if (object.userData && (object.userData.modelID !== undefined || object.userData.ifcModel)) {
          ifcObjects.push(object);
        }
      });
      
      if (ifcObjects.length === 0) {
        setFixStatus("No IFC objects found in the scene. Cannot proceed with fix.");
        setIsFixing(false);
        return;
      }
      
      // First try: Ensure all IFC objects are visible
      setFixStatus("Setting all IFC objects to visible...");
      ifcObjects.forEach((obj: THREE.Object3D) => {
        obj.visible = true;
        
        // Make all children visible too
        obj.traverse((child: THREE.Object3D) => {
          child.visible = true;
          
          // If it's a mesh, ensure material is visible
          if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.needsUpdate = true;
              });
            } else if (mesh.material) {
              mesh.material.transparent = false;
              mesh.material.opacity = 1.0;
              mesh.material.needsUpdate = true;
            }
          }
        });
      });
      
      // Second try: Add a model to the scene if it's not already there
      const meshObjects = ifcObjects.filter((obj: any) => obj.isMesh || obj.type === 'Mesh');
      if (meshObjects.length > 0) {
        const firstMesh = meshObjects[0];
        if (firstMesh.parent !== scene) {
          setFixStatus("Adding mesh directly to scene...");
          // Clone the mesh to avoid issues with existing parent relationships
          const clonedMesh = firstMesh.clone();
          scene.add(clonedMesh);
        }
        
        // Set camera to view the mesh
        setFixStatus("Positioning camera to view mesh...");
        setTimeout(() => {
          try {
            viewer.context.ifcCamera.cameraControls.fitToSphere(firstMesh, true);
            console.log("Camera positioned to view mesh");
          } catch (e) {
            console.error("Error positioning camera:", e);
          }
        }, 500);
      }
      
      // Final check to see if our fixes worked
      setTimeout(() => {
        analyzeViewer();
        setFixStatus("Fix attempt completed. Check results above.");
        setIsFixing(false);
      }, 1000);
    } catch (error) {
      console.error("Error fixing mesh issues:", error);
      setFixStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-card p-6 rounded-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bug className="h-5 w-5" /> Viewer Diagnostics
        </h2>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
      
      {/* File information */}
      <div className="mb-6 bg-muted/50 p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">File Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground">File Name:</span>
            <span>{fileName || "No file"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">File URL:</span>
            <span className="truncate">{fileUrl || "No URL"}</span>
          </div>
        </div>
      </div>
      
      {/* System checks */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(systemChecks).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
              {value === true ? <CircleCheck className="h-4 w-4 text-green-500" /> : 
               value === false ? <CircleX className="h-4 w-4 text-red-500" /> : 
               <SquareDashed className="h-4 w-4 text-yellow-500" />}
              <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Model details */}
      {modelDetails && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Model Details</h3>
          <div className="bg-muted/30 p-4 rounded-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Name:</span>
                <span>{modelDetails.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Type:</span>
                <span>{modelDetails.type}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Vertices:</span>
                <span>{modelDetails.vertices.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Visible:</span>
                <span className="flex items-center gap-1">
                  {modelDetails.visible ? 
                    <><Eye className="h-4 w-4 text-green-500" /> Yes</> : 
                    <><EyeOff className="h-4 w-4 text-red-500" /> No</>}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Parent:</span>
                <span>{modelDetails.parent}</span>
              </div>
            </div>
            
            {modelDetails.boundingBox && (
              <div>
                <span className="text-muted-foreground block">Bounding Box:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 mt-1">
                  <div>
                    <span className="text-muted-foreground text-sm">Size: </span>
                    <span className="text-sm">[{modelDetails.boundingBox.size.map((v: number) => v.toFixed(2)).join(', ')}]</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Center: </span>
                    <span className="text-sm">[{modelDetails.boundingBox.center.map((v: number) => v.toFixed(2)).join(', ')}]</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Fix actions */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="default" 
            onClick={analyzeViewer} 
            className="flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" /> Refresh Diagnostics
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={onReload}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" /> Reload Viewer
          </Button>
          
          <Button 
            variant="default" 
            onClick={tryFixMeshIssues}
            disabled={isFixing}
            className="flex items-center gap-2"
          >
            <SquareCheck className="h-4 w-4" /> Fix Mesh Issues
          </Button>
        </div>
        
        {/* Fix status */}
        {fixStatus && (
          <div className="mt-3 p-3 bg-muted rounded-md">
            <p className="text-sm">{fixStatus}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ViewerDiagnostics;
