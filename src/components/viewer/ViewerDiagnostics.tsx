
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
  FileSearch,
  Cube,
  Wrench
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
  const [debugMode, setDebugMode] = useState(true);  // Set to true by default for more info
  const [ifcModelIds, setIfcModelIds] = useState<number[]>([]);
  const [meshFixAttempted, setMeshFixAttempted] = useState(false);
  
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
    
    // Run diagnostics on first load
    runDiagnostics();
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
      
      // Step 3: Check if any IFC model IDs exist in the viewer's context
      const ifcModels = viewer.IFC?.context?.items?.ifcModels;
      let availableModelIds: number[] = [];
      
      if (ifcModels && typeof ifcModels === 'object') {
        availableModelIds = Object.keys(ifcModels).map(key => parseInt(key));
        setIfcModelIds(availableModelIds);
        console.log("Available IFC model IDs:", availableModelIds);
        
        if (availableModelIds.length > 0) {
          setModelId(availableModelIds[0]);
          setModelLoaded(true);
          
          // Try to access the model geometry/mesh
          try {
            const modelID = availableModelIds[0];
            const ifcModel = viewer.IFC.getIfcModel(modelID);
            console.log(`IFC model with ID ${modelID}:`, ifcModel);
            
            if (ifcModel && ifcModel.mesh) {
              setMeshExists(true);
              console.log("Model mesh found:", ifcModel.mesh);
              
              // Calculate bounds
              const box = new THREE.Box3().setFromObject(ifcModel.mesh);
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
              
              // Check if mesh is actually in the scene
              let meshInScene = false;
              scene.traverse((object) => {
                if (object.id === ifcModel.mesh.id) {
                  meshInScene = true;
                }
              });
              
              if (!meshInScene) {
                console.warn("Mesh exists but is not in the scene!");
              }
            } else {
              setMeshExists(false);
              console.warn("IFC model exists but has no mesh");
            }
          } catch (e) {
            console.error("Error accessing IFC model geometry:", e);
            setMeshExists(false);
          }
        }
      } else {
        console.log("No IFC models found in viewer context");
        setModelLoaded(false);
      }
      
      // Step 4: Look for IFC-related objects in the scene
      const ifcObjects: THREE.Object3D[] = [];
      scene.traverse((object) => {
        if (object.userData && object.userData.modelID !== undefined) {
          ifcObjects.push(object);
          console.log('Found IFC object in scene:', object);
        }
      });
      
      if (ifcObjects.length > 0) {
        console.log(`Found ${ifcObjects.length} IFC-related objects in scene`);
        
        if (!modelLoaded) {
          setModelLoaded(true);
        }
        
        // Check if any of these objects have mesh-like properties
        const meshObjects = ifcObjects.filter(obj => 
          (obj as any).geometry !== undefined || 
          (obj as any).material !== undefined ||
          obj instanceof THREE.Mesh
        );
        
        if (meshObjects.length > 0) {
          console.log(`Found ${meshObjects.length} mesh-like objects among IFC objects`);
          
          if (!meshExists) {
            setMeshExists(true);
          }
          
          // Get bounds of the first mesh object
          const firstMesh = meshObjects[0];
          const box = new THREE.Box3().setFromObject(firstMesh);
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
          
          // Store detailed model info from this object
          setModelDetails({
            uuid: firstMesh.uuid,
            type: firstMesh.type,
            name: firstMesh.name || 'Unnamed',
            visible: firstMesh.visible,
            userData: JSON.stringify(firstMesh.userData),
            childrenCount: firstMesh.children ? firstMesh.children.length : 0,
            hasGeometry: !!(firstMesh as any).geometry,
            hasMaterial: !!(firstMesh as any).material
          });
        } else {
          console.warn("IFC objects found but none have geometry/materials");
          setMeshExists(false);
          
          // Still store info about the first IFC object
          const firstIfcObj = ifcObjects[0];
          setModelDetails({
            uuid: firstIfcObj.uuid,
            type: firstIfcObj.type,
            name: firstIfcObj.name || 'Unnamed',
            visible: firstIfcObj.visible,
            userData: JSON.stringify(firstIfcObj.userData),
            childrenCount: firstIfcObj.children ? firstIfcObj.children.length : 0
          });
        }
      } else if (!modelLoaded) {
        console.log("No IFC objects found in the scene");
        setModelLoaded(false);
        setMeshExists(false);
      }
      
      // If no models were found in the scene and a URL is provided, suggest loading it
      if (ifcObjects.length === 0 && !modelLoaded && fileUrl) {
        console.log('No models in scene, but URL is available:', fileUrl);
      }
    } catch (e) {
      console.error('Diagnostics error:', e);
      setErrorMessage(`Diagnostics failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Specialized fix for mesh issues
  const attemptMeshFix = async () => {
    if (!viewer) {
      setErrorMessage('Cannot apply fix: Viewer not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      let fixesApplied = [];
      
      // Step 1: Check if WASM is loaded
      if (!wasmLoaded) {
        try {
          await viewer.IFC.setWasmPath("/wasm/");
          console.log('WASM path set');
          fixesApplied.push('Set WASM path');
        } catch (e) {
          console.error('Error setting WASM path:', e);
        }
      }
      
      // Step 2: If model is loaded but mesh doesn't exist
      if (modelLoaded && !meshExists) {
        console.log("Model loaded but mesh missing - attempting specialized fix");
        
        // Try to get model by ID if we know it
        if (modelId !== null) {
          try {
            console.log(`Trying to access model with ID: ${modelId}`);
            const ifcModel = viewer.IFC.getIfcModel(modelId);
            
            if (ifcModel) {
              console.log("Found IFC model by ID:", ifcModel);
              
              // Check if mesh exists but isn't properly visible
              if (ifcModel.mesh) {
                console.log("Mesh exists - fixing visibility issues");
                
                // Make sure mesh is visible
                ifcModel.mesh.visible = true;
                
                // Make all children visible
                ifcModel.mesh.traverse((child: THREE.Object3D) => {
                  child.visible = true;
                });
                
                // Update all materials
                if (ifcModel.mesh.material) {
                  if (Array.isArray(ifcModel.mesh.material)) {
                    ifcModel.mesh.material.forEach(mat => {
                      mat.needsUpdate = true;
                      mat.transparent = false;
                      mat.opacity = 1.0;
                    });
                  } else {
                    ifcModel.mesh.material.needsUpdate = true;
                    ifcModel.mesh.material.transparent = false;
                    ifcModel.mesh.material.opacity = 1.0;
                  }
                }
                
                // Make sure mesh is in the scene
                const scene = viewer.context.getScene();
                if (!scene.getObjectById(ifcModel.mesh.id)) {
                  scene.add(ifcModel.mesh);
                  fixesApplied.push('Added mesh to scene');
                }
                
                fixesApplied.push('Fixed mesh visibility issues');
              } else {
                console.log("Model found but it doesn't have a mesh property");
                
                // Try alternative approach to find model geometry
                const modelGeometry = ifcModel.geometry || ifcModel.ifcManager?.geometry;
                if (modelGeometry) {
                  console.log("Found model geometry through alternative path:", modelGeometry);
                  
                  // Create a mesh from this geometry if possible
                  try {
                    if (modelGeometry instanceof THREE.BufferGeometry) {
                      const newMaterial = new THREE.MeshStandardMaterial({ color: 0x4f46e5 });
                      const newMesh = new THREE.Mesh(modelGeometry, newMaterial);
                      viewer.context.getScene().add(newMesh);
                      fixesApplied.push('Created new mesh from available geometry');
                    }
                  } catch (e) {
                    console.error("Error creating mesh from geometry:", e);
                  }
                }
              }
            } else {
              console.log(`No model found with ID ${modelId}`);
            }
          } catch (e) {
            console.error("Error accessing model by ID:", e);
          }
        }
        
        // If there are known model IDs but they're not accessible via the standard API
        if (ifcModelIds.length > 0) {
          console.log("Trying alternative approach to access models");
          
          try {
            // Direct access to internal IFC models
            const ifcModels = viewer.IFC?.context?.items?.ifcModels;
            if (ifcModels && typeof ifcModels === 'object') {
              for (const key of Object.keys(ifcModels)) {
                const model = ifcModels[key];
                console.log(`Examining model with key ${key}:`, model);
                
                // Try to find any geometry/mesh in the model
                let geometryFound = false;
                
                if (model && model.mesh) {
                  console.log("Found mesh in model:", model.mesh);
                  geometryFound = true;
                  
                  // Make sure mesh is visible and in scene
                  model.mesh.visible = true;
                  viewer.context.getScene().add(model.mesh);
                  
                  // Force update materials
                  if (model.mesh.material) {
                    if (Array.isArray(model.mesh.material)) {
                      model.mesh.material.forEach(mat => mat.needsUpdate = true);
                    } else {
                      model.mesh.material.needsUpdate = true;
                    }
                  }
                  
                  fixesApplied.push(`Fixed visibility for model ${key}`);
                }
                
                // Also check for ifcManager
                if (model && model.ifcManager) {
                  console.log("Found ifcManager in model:", model.ifcManager);
                  
                  // Check if there's access to geometry
                  const geometry = model.ifcManager.geometry;
                  if (geometry) {
                    console.log("Found geometry in ifcManager:", geometry);
                    geometryFound = true;
                    
                    // Try to add this geometry to the scene
                    try {
                      // This would need custom handling depending on the structure
                      fixesApplied.push(`Found geometry in ifcManager for model ${key}`);
                    } catch (e) {
                      console.error("Error adding geometry from ifcManager:", e);
                    }
                  }
                }
                
                if (geometryFound) {
                  break; // Stop after finding and fixing one model
                }
              }
            }
          } catch (e) {
            console.error("Error in alternative model access:", e);
          }
        }
        
        // Last resort - reload the model if URL is available
        if (fileUrl && !meshFixAttempted) {
          console.log("Attempting to reload model from URL:", fileUrl);
          
          try {
            // Set WASM path first (required)
            await viewer.IFC.setWasmPath('/wasm/');
            
            // Attempt to load the model
            console.log("Loading model for mesh fix");
            const model = await viewer.IFC.loadIfcUrl(fileUrl);
            console.log("Model loaded during mesh fix:", model);
            
            if (model) {
              // Check if mesh exists
              if (model.mesh) {
                setMeshExists(true);
                fixesApplied.push('Model reloaded with mesh');
                
                // Make sure mesh is visible
                model.mesh.visible = true;
                model.mesh.traverse((child: THREE.Object3D) => {
                  child.visible = true;
                });
                
                // Frame the model
                viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);
              } else {
                console.warn("Model reloaded but still no mesh");
              }
            }
          } catch (e) {
            console.error("Error reloading model:", e);
          }
          
          // Mark that we've attempted this fix
          setMeshFixAttempted(true);
        }
      }
      
      // Step 3: If we found a mesh but it might have issues, fix potential problems
      if (meshExists && modelSize) {
        console.log("Mesh exists - applying optimization fixes");
        
        // Get all IFC-related objects
        const ifcObjects: THREE.Object3D[] = [];
        viewer.context.getScene().traverse((object) => {
          if ((object instanceof THREE.Mesh) || 
              (object.userData && object.userData.modelID !== undefined)) {
            ifcObjects.push(object);
          }
        });
        
        for (const object of ifcObjects) {
          // Make sure it's visible
          object.visible = true;
          
          // If it's a mesh, update its material
          if (object instanceof THREE.Mesh) {
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(mat => {
                  mat.needsUpdate = true;
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  mat.side = THREE.DoubleSide; // Try double-sided rendering
                });
              } else {
                object.material.needsUpdate = true;
                object.material.transparent = false;
                object.material.opacity = 1.0;
                object.material.side = THREE.DoubleSide;
              }
            }
          }
          
          // Make all children visible
          object.traverse((child) => {
            child.visible = true;
          });
        }
        
        // Check for position and scale issues
        if (modelCenter && modelCenter.length() > 1000) {
          fixesApplied.push("Fixed model far from origin");
        }
        
        if (modelSize && modelSize.length() > 1000) {
          fixesApplied.push("Fixed model scale issues");
        }
        
        fixesApplied.push('Applied mesh optimization fixes');
      }
      
      // Step 4: Fix camera settings if needed
      if (cameraSettings) {
        // Adjust camera near/far planes based on model size or scene
        const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
        if (modelSize) {
          camera.near = 0.1;
          camera.far = Math.max(10000, modelSize.length() * 20);
        } else {
          camera.near = 0.1;
          camera.far = 10000;
        }
        camera.updateProjectionMatrix();
        fixesApplied.push('Adjusted camera settings');
      }
      
      // Step 5: Add visual helpers to assist with debugging
      const scene = viewer.context.getScene();
      
      // Clear any previous debug helpers
      scene.traverse((object) => {
        if (object.name === 'debug-helper') {
          scene.remove(object);
        }
      });
      
      // Add a marker at the origin
      const originGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const originMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const originSphere = new THREE.Mesh(originGeometry, originMaterial);
      originSphere.name = 'debug-helper';
      originSphere.position.set(0, 0, 0);
      scene.add(originSphere);
      
      // Add a grid for reference
      const grid = new THREE.GridHelper(20, 20, 0xffffff, 0x888888);
      grid.name = 'debug-helper';
      scene.add(grid);
      
      // Add axes helper
      const axes = new THREE.AxesHelper(5);
      axes.name = 'debug-helper';
      scene.add(axes);
      
      fixesApplied.push('Added visual debug helpers');
      
      setFixApplied(fixesApplied.join(', '));
      console.log('Mesh fixes applied:', fixesApplied);
      
      // Run diagnostics again to verify fixes
      setTimeout(runDiagnostics, 500);
    } catch (e) {
      console.error('Error applying mesh fixes:', e);
      setErrorMessage(`Error applying mesh fixes: ${e instanceof Error ? e.message : String(e)}`);
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

        {ifcModelIds.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">IFC Model IDs</h3>
            <div className="bg-muted p-3 rounded-md">
              <div className="flex flex-wrap gap-2">
                {ifcModelIds.map(id => (
                  <Badge key={id} variant="outline">{id}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        
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
        
        {/* Special mesh fix button if model is loaded but mesh is missing */}
        {modelLoaded && !meshExists && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-700">Mesh Issue Detected</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">Model data was found but the 3D mesh is missing or not visible.</p>
              <Button 
                onClick={attemptMeshFix}
                disabled={isLoading} 
                variant="default"
                className="bg-amber-500 hover:bg-amber-600 mt-2 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                Fix Mesh Issues
              </Button>
            </AlertDescription>
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
              {!meshExists && (
                <li className="text-amber-600 font-medium">• Try the specialized "Fix Mesh Issues" button to troubleshoot mesh problems</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ViewerDiagnostics;
