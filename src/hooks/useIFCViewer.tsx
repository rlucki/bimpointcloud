import { useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { useToast } from "@/components/ui/use-toast";

export const useIFCViewer = (
  containerRef: React.RefObject<HTMLDivElement>,
  fileUrl?: string,
  fileName?: string | null
) => {
  const viewerRef = useRef<IfcViewerAPI | null>(null);
  const { toast } = useToast();

  /* estados mínimos para tu UI  ------------------------ */
  const [ready, setReady]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [mesh, setMesh]         = useState<THREE.Mesh | null>(null);
  const [error, setError]       = useState<string | null>(null);

  /* 1. se crea el viewer cuando EXISTE el div ---------- */
  useLayoutEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new IfcViewerAPI({
      container     : containerRef.current,
      backgroundColor: new THREE.Color(0x222222),
    });

    viewerRef.current = viewer;
    // ruta a los ficheros WASM (los 4 archivos copiados en /public/wasm)
    viewer.IFC.setWasmPath("/wasm/");

    // ejes + grid opcionales
    viewer.context.getScene().add(new THREE.GridHelper(50, 50));
    viewer.context.getScene().add(new THREE.AxesHelper(5));

    setReady(true);
  }, [containerRef]);

  /* 2. cargar IFC cuando ya hay viewer y url ------------ */
  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready || !fileUrl) return;

    (async () => {
      try {
        setLoading(true);
        const model = await viewer.IFC.loadIfcUrl(fileUrl);
        if (!model?.mesh) throw new Error("El IFC no contiene geometría.");

        // ---- normalizar coordenadas --------------------
        const box    = new THREE.Box3().setFromObject(model.mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());

        // si está lejos (UTM) lo llevo al origen
        if (center.length() > 5_000) model.mesh.position.sub(center);

        // si viene en milímetros lo escalo a metros
        if (size.length() > 10_000)  model.mesh.scale.setScalar(0.001);

        // ---- encuadre ----------------------------------
        const camera = viewer.context.getCamera() as THREE.PerspectiveCamera;
        camera.near = 0.1;
        camera.far  = size.length() * 10;
        camera.updateProjectionMatrix();

        viewer.context.ifcCamera.cameraControls.setTarget(0,0,0);
        viewer.context.ifcCamera.cameraControls.fitToSphere(model.mesh, true);

        setMesh(model.mesh);
        toast({ title: "IFC cargado", description: fileName ?? "modelo" });
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Error cargando IFC");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, fileUrl, fileName, toast]);

  /* 3. API mínima que usas en tus componentes ----------- */
  return {
    viewer : viewerRef.current,
    mesh,
    ready,
    loading,
    error,
    // For compatibility with current consumers of the hook
    isInitialized: ready,
    isLoading: loading,
    modelLoaded: !!mesh,
    meshExists: !!mesh,
    // Keep any methods that might be used elsewhere
    frameAll: () => {
      if (mesh && viewerRef.current) {
        viewerRef.current.context.ifcCamera.cameraControls.fitToSphere(mesh, true);
      }
    },
    debug: () => {
      if (viewerRef.current) {
        console.log("Viewer state:", viewerRef.current);
        console.log("Scene:", viewerRef.current.context.getScene());
        if (mesh) console.log("Model mesh:", mesh);
      }
    }
  };
};
