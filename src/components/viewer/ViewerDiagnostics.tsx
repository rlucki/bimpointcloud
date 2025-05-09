
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileWarning, 
  Loader2, 
  RefreshCw,
  Database,
  Cube 
} from 'lucide-react';

interface ViewerDiagnosticsProps {
  viewer: IfcViewerAPI | null;
  fileUrl?: string;
  fileName?: string | null;
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
  const [wasmLoaded, setWasmLoaded] = useState<boolean | null>(null);
  const [modelLoaded, setModelLoaded] = useState<boolean | null>(null);
  const [meshExists, setMeshExists] = useState<boolean | null>(null);
  const [modelSize, setModelSize] = useState<THREE.Vector3 | null>(null);
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null);
  const [modelMinMax, setModelMinMax] = useState<{min: THREE.Vector3, max: THREE.Vector3} | null>(null);
  const [cameraSettings, setCameraSettings] = useState<{near: number, far: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fixApplied, setFixApplied] = useState<string | null>(null);
  
  // Check for WASM files
  useEffect(() => {
    const checkWasmFiles = async () => {
      try {
        // Check if web-ifc.wasm can be fetched
        const response = await fetch('/wasm/web-ifc.wasm', { method: 'HEAD' });
        setWasmLoaded(response.ok);
      } catch (e) {
        setWasmLoaded(false);
        console.error('Error checking WASM files:', e);
      }
    };
    
    checkWasmFiles();
  }, []);
  
  // Run diagnostics
  const runDiagnostics = async () => {
    if (!viewer) {
      setErrorMessage('Viewer is not initialized');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    setFixApplied(null);
    
    try {
      // Step 1: Log file URL being used
      console.log('URL being used for IFC:', fileUrl);
      
      // Step 2: Check camera settings
      const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
      setCameraSettings({
        near: camera.near,
        far: camera.far
      });
      
      // If a file URL is provided, try loading it for diagnostics
      if (fileUrl) {
        console.log('Attempting to load IFC model for diagnostics');
        
        // Set WASM path first
        await viewer.IFC.setWasmPath('/wasm/');
        console.log('WASM path set');
        
        try {
          // Load the model
          const model = await viewer.IFC.loadIfcUrl(fileUrl);
          setModelLoaded(true);
          console.log('IFC Model loaded for diagnostics:', model);
          
          // Check if mesh exists
          if (model && model.mesh) {
            setMeshExists(true);
            
            // Calculate model bounds
            const box = new THREE.Box3().setFromObject(model.mesh);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            
            setModelSize(size);
            setModelCenter(center);
            setModelMinMax({
              min: box.min.clone(),
              max: box.max.clone()
            });
            
            console.table({
              min: box.min,
              max: box.max,
              size,
              center
            });
          } else {
            setMeshExists(false);
            console.error('Model loaded but mesh is undefined');
          }
        } catch (e) {
          setModelLoaded(false);
          console.error('Error loading IFC model for diagnostics:', e);
          setErrorMessage(`Error loading model: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      console.error('Diagnostics error:', e);
      setErrorMessage(`Diagnostics failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply fix based on diagnostic results
  const applyFix = async () => {
    if (!viewer || !modelLoaded || !meshExists) {
      setErrorMessage('Cannot apply fix: Viewer not ready or model not loaded');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Find the model in the scene (current implementation assumes only one model)
      let modelMesh: THREE.Object3D | null = null;
      viewer.context.getScene().traverse((object) => {
        if (object.userData && object.userData.modelID !== undefined) {
          modelMesh = object;
        }
      });
      
      if (!modelMesh) {
        setErrorMessage('Cannot find model mesh in scene');
        return;
      }
      
      // Apply fixes based on detected issues
      if (modelSize && modelCenter) {
        let fixesApplied = [];
        
        // Fix 1: Check for extremely large coordinates (UTM/EPSG format)
        if (modelCenter.length() > 10000 || modelMinMax?.min.length() > 10000 || modelMinMax?.max.length() > 10000) {
          console.log('Fixing large coordinates - recentering model');
          modelMesh.position.sub(modelCenter);
          fixesApplied.push('Model recentered to origin');
        }
        
        // Fix 2: Check for models in millimeters
        if (modelSize.length() > 1000) {
          console.log('Fixing millimeter scale - scaling down by 0.001');
          modelMesh.scale.setScalar(0.001); 
          fixesApplied.push('Model rescaled from mm to m');
        }
        
        // Fix 3: Adjust camera planes
        const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
        camera.near = 0.1;
        camera.far = Math.max(10000, modelSize.length() * 20);
        camera.updateProjectionMatrix();
        fixesApplied.push(`Camera near/far adjusted (near: ${camera.near}, far: ${camera.far})`);
        
        // Fix 4: Reset camera target and frame model
        viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
        viewer.context.ifcCamera.cameraControls.fitToSphere(modelMesh, true);
        fixesApplied.push('Camera position and target reset');
        
        setFixApplied(fixesApplied.join(', '));
        console.log('Fixes applied:', fixesApplied.join(', '));
      }
    } catch (e) {
      console.error('Error applying fix:', e);
      setErrorMessage(`Error applying fix: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get status for a check
  const getStatus = (value: boolean | null) => {
    if (value === null) return 'unknown';
    return value ? 'success' : 'error';
  };
  
  // Get appropriate icon based on status
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <Card className="p-6 max-w-3xl mx-auto bg-card border shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          <h2 className="text-xl font-semibold">IFC Viewer Diagnostics</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium">File Information</h3>
            <Badge variant={fileUrl ? "default" : "destructive"}>
              {fileUrl ? "URL Available" : "No URL"}
            </Badge>
          </div>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p><strong>File name:</strong> {fileName || 'Unknown'}</p>
            <p className="truncate"><strong>URL:</strong> {fileUrl || 'None provided'}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">System Checks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>WASM files</span>
              </div>
              <div className="flex items-center">
                <StatusIcon status={getStatus(wasmLoaded)} />
                <span className="ml-2">{wasmLoaded === null ? 'Checking...' : wasmLoaded ? 'Available' : 'Missing'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Cube className="h-4 w-4" />
                <span>Model loaded</span>
              </div>
              <div className="flex items-center">
                <StatusIcon status={getStatus(modelLoaded)} />
                <span className="ml-2">{modelLoaded === null ? 'Unknown' : modelLoaded ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Cube className="h-4 w-4" />
                <span>Mesh exists</span>
              </div>
              <div className="flex items-center">
                <StatusIcon status={getStatus(meshExists)} />
                <span className="ml-2">{meshExists === null ? 'Unknown' : meshExists ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {modelSize && modelCenter && (
          <div className="space-y-2">
            <h3 className="font-medium">Model Geometry</h3>
            <div className="bg-muted p-3 rounded-md text-sm font-mono">
              <p>Size: x: {modelSize.x.toFixed(2)}, y: {modelSize.y.toFixed(2)}, z: {modelSize.z.toFixed(2)}</p>
              <p>Center: x: {modelCenter.x.toFixed(2)}, y: {modelCenter.y.toFixed(2)}, z: {modelCenter.z.toFixed(2)}</p>
              {modelMinMax && (
                <>
                  <p>Min: x: {modelMinMax.min.x.toFixed(2)}, y: {modelMinMax.min.y.toFixed(2)}, z: {modelMinMax.min.z.toFixed(2)}</p>
                  <p>Max: x: {modelMinMax.max.x.toFixed(2)}, y: {modelMinMax.max.y.toFixed(2)}, z: {modelMinMax.max.z.toFixed(2)}</p>
                </>
              )}
              {cameraSettings && (
                <p>Camera: near: {cameraSettings.near.toFixed(2)}, far: {cameraSettings.far.toFixed(2)}</p>
              )}
            </div>
            
            <div className="mt-2">
              {modelSize.length() > 1000 && (
                <Badge variant="warning" className="mr-2">Large model size</Badge>
              )}
              {modelCenter.length() > 10000 && (
                <Badge variant="warning" className="mr-2">Far from origin</Badge>
              )}
              {modelMinMax && (modelMinMax.min.length() > 10000 || modelMinMax.max.length() > 10000) && (
                <Badge variant="warning" className="mr-2">UTM coordinates</Badge>
              )}
            </div>
          </div>
        )}
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {fixApplied && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Fixes applied</AlertTitle>
            <AlertDescription className="text-green-700">{fixApplied}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isLoading} 
            variant="default"
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Run Diagnostics
          </Button>
          
          <Button 
            onClick={applyFix}
            disabled={isLoading || !modelLoaded || !meshExists} 
            variant="secondary"
            className="flex items-center gap-2"
          >
            Apply Fixes
          </Button>
          
          <Button 
            onClick={onReload} 
            variant="outline"
            className="flex items-center gap-2"
          >
            Reload Viewer
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ViewerDiagnostics;
