
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
            // Fix: Pass a vector to store the result when calling getBoundingSphere
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

// New framing utility incorporating best practices
export const frameIFCModel = async (
  viewerRef: React.MutableRefObject<IfcViewerAPI | null>, 
  modelMesh?: THREE.Mesh
) => {
  if (!viewerRef.current) return;
  
  try {
    // If we have a specific mesh, frame it
    if (modelMesh) {
      // Force computation of the bounding sphere if it doesn't exist
      if (modelMesh.geometry && !modelMesh.geometry.boundingSphere) {
        modelMesh.geometry.computeBoundingSphere();
      }
      
      // Calculate bounding box
      const bbox = new THREE.Box3().setFromObject(modelMesh);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      
      // Create a sphere from the bounding box
      const sphere = new THREE.Sphere();
      bbox.getBoundingSphere(sphere);
      
      // Frame the model - important to do this AFTER all other camera operations
      viewerRef.current.context.ifcCamera.cameraControls.setTarget(center.x, center.y, center.z);
      viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(modelMesh, true);
      
      console.log("IFC model framed with proper sizing", {
        center: center.toArray(),
        radius: sphere.radius
      });
    } else {
      // If no specific mesh, frame the entire scene
      const scene = viewerRef.current.context.getScene();
      // Fix: Always pass the scene object as an argument to fitToSphere
      viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
    }
  } catch (e) {
    console.error("Error framing IFC model:", e);
  }
};
