
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

// Function to frame all objects in view
export const handleFrameAll = (viewerRef: React.MutableRefObject<IfcViewerAPI | null>, target?: THREE.Object3D) => {
  if (viewerRef.current) {
    try {
      if (target) {
        // If a specific target is provided, frame that object
        viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(target, true);
      } else {
        // Look for objects in the scene to frame
        const scene = viewerRef.current.context.getScene();
        
        if (scene && scene.children.length > 0) {
          // Create a bounding box that encompasses all objects
          const boundingBox = new THREE.Box3();
          
          // Add all visible meshes to the bounding box calculation
          scene.traverse((object) => {
            if (object.visible && (object instanceof THREE.Mesh || object instanceof THREE.Group)) {
              boundingBox.expandByObject(object);
            }
          });
          
          // Only continue if we found valid objects
          if (!boundingBox.isEmpty()) {
            // Create a sphere from the bounding box
            const boundingSphere = new THREE.Sphere();
            // Fix: Always pass a sphere object to getBoundingSphere
            boundingBox.getBoundingSphere(boundingSphere);
            
            // Create a dummy object at the center of the bounding sphere
            const dummyObject = new THREE.Object3D();
            dummyObject.position.copy(boundingSphere.center);
            
            // Use the dummy object as target for fitToSphere
            viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(dummyObject, true);
            console.log("Objects framed using bounding sphere");
          } else {
            // Plan B: frame the whole scene if bounding box is empty
            // Fix: Always pass the scene as an argument to fitToSphere
            viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
            console.log("Scene framed (alternative)");
          }
        } else if (scene) {
          // If the scene exists but has no children, frame the scene itself
          // Fix: Always pass the scene as an argument to fitToSphere
          viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
          console.log("Empty scene framed");
        }
      }
    } catch (e) {
      console.error("Error framing objects:", e);
    }
  }
};

// Utility function for debugging
export const debugViewer = (viewerRef: React.MutableRefObject<IfcViewerAPI | null>, toast: any) => {
  if (viewerRef.current) {
    console.log("Viewer state:", viewerRef.current);
    console.log("Scene:", viewerRef.current.context.getScene());
    
    // Fix: Create a Vector3 object to store the camera position
    const position = new THREE.Vector3();
    viewerRef.current.context.ifcCamera.cameraControls.getPosition(position);
    console.log("Camera position:", position);
    
    // Add a visible marker at origin for debugging
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    viewerRef.current.context.getScene().add(sphere);
    toast({
      title: "Debug info",
      description: "Check console for viewer state",
    });
  }
};

// Improved framing utility for IFC models
export const frameIFCModel = async (
  viewerRef: React.MutableRefObject<IfcViewerAPI | null>, 
  modelMesh?: THREE.Mesh
) => {
  if (!viewerRef.current || !modelMesh) return;
  
  try {
    // Calculate bounding box and center
    const box = new THREE.Box3().setFromObject(modelMesh);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    
    // Debug info to help diagnose issues
    console.table({
      min: box.min,               // minimum coordinate
      max: box.max,               // maximum coordinate
      size,                       // length × height × width
      center                      // geometric center
    });
    
    // Check for extremely large coordinates (likely UTM or EPSG format)
    if (box.min.length() > 100000 || box.max.length() > 100000) {
      console.warn("Model has extremely large coordinates - likely in UTM or EPSG format");
      
      // Recenter model by subtracting the center
      modelMesh.position.sub(center);
      console.log("Model recentered to origin");
      
      // Recalculate bounding box after centering
      box.setFromObject(modelMesh);
      box.getCenter(center);
    }
    
    // Check for millimeter scale
    if (size.length() > 10000) {
      console.warn("Model appears to be in millimeters - scaling down");
      // Auto-scaling to convert from mm to m
      modelMesh.scale.setScalar(0.001);
      console.log("Model rescaled from mm to m");
      
      // Recalculate box after scaling
      box.setFromObject(modelMesh);
      box.getSize(size);
      box.getCenter(center);
    }
    
    // Make sure model is in the scene
    const scene = viewerRef.current.context.getScene();
    if (!scene.getObjectById(modelMesh.id)) {
      scene.add(modelMesh);
    }
    
    // Set camera target to origin and fit camera to model
    viewerRef.current.context.ifcCamera.cameraControls.setTarget(0, 0, 0);
    viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(modelMesh, true);
    
    // Adjust camera near/far planes to ensure model is visible
    const camera = viewerRef.current.context.getCamera() as THREE.PerspectiveCamera;
    if (camera) {
      // Ensure reasonable near/far values with wide enough range
      camera.near = 0.1;
      camera.far = Math.max(10000, size.length() * 20); // Much larger far plane to handle large models
      camera.updateProjectionMatrix();
      console.log("Camera near/far adjusted:", {near: camera.near, far: camera.far});
    }
    
    console.log("IFC model framed with proper centering", {
      newPosition: modelMesh.position,
      boxSize: size.toArray(),
      camera: {
        near: camera?.near,
        far: camera?.far
      }
    });
  } catch (e) {
    console.error("Error framing IFC model:", e);
  }
};
