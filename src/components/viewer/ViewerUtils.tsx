
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

// Función para enmarcar todos los objetos en la vista
export const handleFrameAll = (viewerRef: React.MutableRefObject<IfcViewerAPI | null>, target?: THREE.Object3D) => {
  if (viewerRef.current) {
    try {
      if (target) {
        // Si se proporciona un objetivo específico, enmarcar ese objeto
        viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(target, true);
      } else {
        // Buscar objetos en la escena para enmarcar
        const scene = viewerRef.current.context.getScene();
        
        if (scene && scene.children.length > 0) {
          // Crear un cuadro delimitador que abarque todos los objetos
          const boundingBox = new THREE.Box3();
          
          // Añadir todas las mallas visibles al cálculo del cuadro delimitador
          scene.traverse((object) => {
            if (object.visible && (object instanceof THREE.Mesh || object instanceof THREE.Group)) {
              boundingBox.expandByObject(object);
            }
          });
          
          // Solo continuar si encontramos objetos válidos
          if (!boundingBox.isEmpty()) {
            // Crear una esfera a partir del cuadro delimitador
            const boundingSphere = new THREE.Sphere();
            boundingBox.getBoundingSphere(boundingSphere);
            
            // Crear un objeto ficticio en el centro de la esfera delimitadora
            const dummyObject = new THREE.Object3D();
            dummyObject.position.copy(boundingSphere.center);
            
            // Usar el objeto ficticio como objetivo para fitToSphere
            viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(dummyObject, true);
            console.log("Objetos enmarcados usando esfera delimitadora");
          } else {
            // Plan B: enmarcar toda la escena si el cuadro delimitador está vacío
            viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
            console.log("Escena enmarcada (alternativa)");
          }
        } else if (scene) {
          // Si la escena existe pero no tiene hijos, enmarcar la escena misma
          viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(scene, true);
          console.log("Escena vacía enmarcada");
        }
      }
    } catch (e) {
      console.error("Error al enmarcar objetos:", e);
    }
  }
};

// Función de utilidad para depuración
export const debugViewer = (viewerRef: React.MutableRefObject<IfcViewerAPI | null>, toast: any) => {
  if (viewerRef.current) {
    console.log("Estado del visor:", viewerRef.current);
    console.log("Escena:", viewerRef.current.context.getScene());
    console.log("Posición de cámara:", viewerRef.current.context.ifcCamera.cameraControls.getPosition());
    
    // Añadir un marcador visible en el origen para depuración
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    viewerRef.current.context.getScene().add(sphere);
    toast({
      title: "Información de depuración",
      description: "Consulta la consola para ver el estado del visor",
    });
  }
};
