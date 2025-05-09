
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
  Package,
  FileSearch
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
  const [modelId, setModelId] = useState<number | null>(null);
  const [sceneObjects, setSceneObjects] = useState<number>(0);
  const [modelDetails, setModelDetails] = useState<any>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Check for WASM files
  useEffect(() => {
    const checkWasmFiles = async () => {
      try {
        // Check if web-ifc.wasm can be fetched
        const response = await fetch('/wasm/web-ifc.wasm', { method: 'HEAD' });
        setWasmLoaded(response.ok);
        
        if (!response.ok) {
          console.error('WASM file not found:', response.status, response.statusText);
          setErrorMessage('WASM files not found. Check if they are correctly installed in /wasm/ directory.');
        }
      } catch (e) {
        setWasmLoaded(false);
        console.error('Error checking WASM files:', e);
        setErrorMessage('Error accessing WASM files. Network or server issue.');
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
      // Step 1: Check scene objects
      const scene = viewer.context.getScene();
      let objectCount = 0;
      scene.traverse(() => objectCount++);
      setSceneObjects(objectCount);
      console.log(`Scene contains ${objectCount} objects`);
      
      // Step 2: Check camera settings
      const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
      setCameraSettings({
        near: camera.near,
        far: camera.far
      });
      
      // Step 3: Locate IFC models in the scene
      const ifcModels: THREE.Mesh[] = [];
      scene.traverse((object) => {
        if (object.userData && object.userData.modelID !== undefined) {
          ifcModels.push(object as THREE.Mesh);
          console.log('Found IFC model in scene:', object);
          
          // Try to extract model ID
          if (object.userData.modelID !== undefined) {
            setModelId(object.userData.modelID);
          }
          
          // Store detailed model info
          setModelDetails({
            uuid: object.uuid,
            type: object.type,
            name: object.name || 'Unnamed',
            visible: object.visible,
            userData: JSON.stringify(object.userData),
            childrenCount: object.children ? object.children.length : 0,
            hasGeometry: !!(object as any).geometry,
            hasMaterial: !!(object as any).material
          });
        }
      });
      
      if (ifcModels.length === 0) {
        console.log('No IFC models found in the scene');
        setModelLoaded(false);
        setMeshExists(false);
      } else {
        setModelLoaded(true);
        console.log(`Found ${ifcModels.length} IFC models in scene`);
        
        // Check if mesh exists in the found model
        const firstModel = ifcModels[0];
        if (firstModel && firstModel.geometry) {
          setMeshExists(true);
          
          // Calculate model bounds
          const box = new THREE.Box3().setFromObject(firstModel);
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
          console.error('Model found but mesh/geometry is missing');
        }
      }
      
      // If no models were found in the scene and a URL is provided, try loading it
      if (ifcModels.length === 0 && fileUrl) {
        console.log('No models in scene, trying to load from URL:', fileUrl);
        
        // Set WASM path first (required)
        try {
          await viewer.IFC.setWasmPath('/wasm/');
          console.log('WASM path set for diagnostics');
          
          // Attempt to load the model
          try {
            console.log('Attempting to load model for diagnostics');
            const model = await viewer.IFC.loadIfcUrl(fileUrl);
            console.log('Model loaded during diagnostics:', model);
            
            if (model) {
              setModelLoaded(true);
              
              // Check if mesh exists
              if (model.mesh) {
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
                
                console.log('Model diagnostics:', {
                  size: size.toArray(),
                  center: center.toArray(),
                  min: box.min.toArray(),
                  max: box.max.toArray()
                });
                
                // Store model ID if available
                if (model.modelID !== undefined) {
                  setModelId(model.modelID);
                }
              } else {
                setMeshExists(false);
                console.error('Model loaded but mesh is missing');
              }
            }
          } catch (e) {
            console.error('Error loading model during diagnostics:', e);
            setErrorMessage(`Could not load model: ${e instanceof Error ? e.message : String(e)}`);
          }
        } catch (e) {
          console.error('Error setting WASM path during diagnostics:', e);
          setErrorMessage(`WASM error: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      console.error('Diagnostics error:', e);
      setErrorMessage(`Diagnostics failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enhanced fix that attempts to resolve common IFC viewer issues
  const applyAdvancedFix = async () => {
    if (!viewer) {
      setErrorMessage('Cannot apply fix: Viewer not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      let fixesApplied = [];
      
      // Fix 1: Ensure WASM path is set
      try {
        await viewer.IFC.setWasmPath('/wasm/');
        console.log('WASM path set');
        fixesApplied.push('Set WASM path');
      } catch (e) {
        console.error('Error setting WASM path:', e);
      }
      
      // Fix 2: Attempt to load model if URL available but model not loaded
      if (fileUrl && (!modelLoaded || !meshExists)) {
        try {
          console.log('Attempting to load model from URL:', fileUrl);
          const model = await viewer.IFC.loadIfcUrl(fileUrl);
          
          if (model) {
            console.log('Model loaded successfully:', model);
            fixesApplied.push('Model loaded successfully');
            
            // Fix 3: Center and scale model if needed
            if (model.mesh) {
              const box = new THREE.Box3().setFromObject(model.mesh);
              const size = new THREE.Vector3();
              const center = new THREE.Vector3();
              box.getSize(size);
              box.getCenter(center);
              
              // Check for extremely large coordinates (UTM/EPSG format)
              if (center.length() > 10000) {
                console.log('Recalibrating model position (extremely large coordinates)');
                model.mesh.position.sub(center);
                fixesApplied.push('Model recentered to origin');
              }
              
              // Check for millimeter scale
              if (size.length() > 1000) {
                console.log('Rescaling model (likely in millimeters)');
                model.mesh.scale.setScalar(0.001);
                fixesApplied.push('Model rescaled from mm to m');
              }
              
              // Adjust camera near/far planes based on model size
              const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
              camera.near = 0.1;
              camera.far = Math.max(10000, size.length() * 20);
              camera.updateProjectionMatrix();
              fixesApplied.push(`Camera planes adjusted (near: ${camera.near.toFixed(2)}, far: ${camera.far.toFixed(2)})`);
              
              // Frame to model
              viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
              viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
              fixesApplied.push('Camera adjusted to frame model');
            } else {
              console.warn('Model loaded but mesh is missing');
              fixesApplied.push('WARNING: Model loaded but no mesh available');
              
              // Add a visible marker at origin to show where the model should be
              const geometry = new THREE.SphereGeometry(0.5, 16, 16);
              const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
              const sphere = new THREE.Mesh(geometry, material);
              sphere.position.set(0, 0, 0);
              viewer.context.getScene().add(sphere);
              fixesApplied.push('Added visual marker at origin');
            }
          }
        } catch (e) {
          console.error('Error loading model:', e);
          setErrorMessage(`Failed to load model: ${e instanceof Error ? e.message : String(e)}`);
          
          // Add placeholder geometry to visualize the scene coordinate system
          const axesHelper = new THREE.AxesHelper(5);
          viewer.context.getScene().add(axesHelper);
          
          const gridHelper = new THREE.GridHelper(20, 20);
          viewer.context.getScene().add(gridHelper);
          
          fixesApplied.push('Added visual helpers (grid and axes)');
        }
      } else if (modelLoaded && meshExists) {
        // Model already loaded - just try to find and frame it
        const scene = viewer.context.getScene();
        let modelMesh: THREE.Object3D | null = null;
        
        scene.traverse((object) => {
          if (object.userData && object.userData.modelID !== undefined) {
            modelMesh = object;
          }
        });
        
        if (modelMesh) {
          console.log('Found existing model in scene, framing view');
          viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
          viewer.context.ifcCamera.cameraControls.fitToSphere(modelMesh, true);
          fixesApplied.push('View framed to existing model');
        } else {
          console.warn('Model reported as loaded but not found in scene');
        }
      }
      
      // Fix 4: Make sure camera is properly positioned
      const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
      if (camera.position.length() < 0.1) {
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        fixesApplied.push('Reset camera position (was too close to origin)');
      }
      
      // Fix 5: Add basic scene elements if scene is empty
      const sceneEmpty = sceneObjects < 5; // Some basic minimum number of objects
      if (sceneEmpty) {
        console.log('Scene appears empty, adding basic elements');
        
        // Grid
        const grid = new THREE.GridHelper(20, 20, 0xffffff, 0x888888);
        grid.position.set(0, 0, 0);
        viewer.context.getScene().add(grid);
        
        // Axes
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.set(0, 0.01, 0); // Slightly above grid
        viewer.context.getScene().add(axesHelper);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        viewer.context.getScene().add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        viewer.context.getScene().add(directionalLight);
        
        // Reference cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x4f46e5, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.5, 0);
        viewer.context.getScene().add(cube);
        
        fixesApplied.push('Added basic scene elements (grid, axes, lights, reference cube)');
      }
      
      setFixApplied(fixesApplied.join(', '));
      console.log('Fixes applied:', fixesApplied);
      
      // Run diagnostics again to verify fixes
      setTimeout(runDiagnostics, 500);
    } catch (e) {
      console.error('Error applying fixes:', e);
      setErrorMessage(`Error applying fixes: ${e instanceof Error ? e.message : String(e)}`);
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? 'Basic Mode' : 'Advanced Mode'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
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
                <Package className="h-4 w-4" />
                <span>Model loaded</span>
              </div>
              <div className="flex items-center">
                <StatusIcon status={getStatus(modelLoaded)} />
                <span className="ml-2">{modelLoaded === null ? 'Unknown' : modelLoaded ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                <span>Mesh exists</span>
              </div>
              <div className="flex items-center">
                <StatusIcon status={getStatus(meshExists)} />
                <span className="ml-2">{meshExists === null ? 'Unknown' : meshExists ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Scene objects</span>
              </div>
              <span>{sceneObjects > 0 ? `${sceneObjects} objects` : 'Unknown'}</span>
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
              {modelId !== null && (
                <p>Model ID: {modelId}</p>
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
        
        {debugMode && modelDetails && (
          <div className="space-y-2">
            <h3 className="font-medium">Advanced Model Details</h3>
            <div className="bg-muted p-3 rounded-md text-sm font-mono max-h-48 overflow-y-auto">
              <p>UUID: {modelDetails.uuid}</p>
              <p>Type: {modelDetails.type}</p>
              <p>Name: {modelDetails.name}</p>
              <p>Visible: {modelDetails.visible ? 'Yes' : 'No'}</p>
              <p>Children: {modelDetails.childrenCount}</p>
              <p>Has Geometry: {modelDetails.hasGeometry ? 'Yes' : 'No'}</p>
              <p>Has Material: {modelDetails.hasMaterial ? 'Yes' : 'No'}</p>
              <p className="truncate">UserData: {modelDetails.userData}</p>
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
            onClick={applyAdvancedFix}
            disabled={isLoading} 
            variant="secondary"
            className="flex items-center gap-2"
          >
            Apply Advanced Fixes
          </Button>
          
          <Button 
            onClick={onReload} 
            variant="outline"
            className="flex items-center gap-2"
          >
            Reload Viewer
          </Button>
        </div>
        
        {debugMode && (
          <div className="p-3 border border-dashed border-muted-foreground rounded-md mt-4">
            <h4 className="text-sm font-medium mb-2">Debug Tips:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• If model doesn't load: Check WASM files and make sure URL is accessible</li>
              <li>• If mesh doesn't exist: The IFC parser completed but couldn't create geometry</li>
              <li>• UTM coordinates: Large numbers (e.g. 6-digit) may require translation to origin</li>
              <li>• After applying fixes, click "Run Diagnostics" to verify the changes</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ViewerDiagnostics;
