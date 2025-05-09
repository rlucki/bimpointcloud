
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
            boundingBox.getBoundingSphere(boundingSphere);
            
            // Create a dummy object at the center of the bounding sphere
            const dummyObject = new THREE.Object3D();
            dummyObject.position.copy(boundingSphere.center);
            
            // Use the dummy object as target for fitToSphere
            viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(dummyObject, true);
            console.log("Objects framed using bounding sphere");
          } else {
            // Plan B: frame the whole scene if bounding box is empty
            viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
            console.log("Scene framed (alternative)");
          }
        } else if (scene) {
          // If the scene exists but has no children, frame the scene itself
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
    console.log("Camera position:", viewerRef.current.context.ifcCamera.cameraControls.getPosition());
    
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
      // Make sure the parser is done processing
      await viewerRef.current.IFC.loader.ifcManager.whenAllDone();
      
      // Calculate bounding box
      const bbox = new THREE.Box3().setFromObject(modelMesh);
      const center = bbox.getCenter(new THREE.Vector3());
      const sphere = bbox.getBoundingSphere(new THREE.Sphere());
      
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
      viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
    }
  } catch (e) {
    console.error("Error framing IFC model:", e);
  }
};
