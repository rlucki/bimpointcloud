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
  
  // Add new states for diagnostic panel
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [meshExists, setMeshExists] = useState(false);

  /* 1. se crea el viewer cuando EXISTE el div ---------- */
  useLayoutEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new IfcViewerAPI({
      container     : containerRef.current,
      backgroundColor: new THREE.Color(0x222222),
    });

    viewerRef.current = viewer;
    
    // Compute dynamic WASM path based on current environment
    const wasmPath = import.meta.env.BASE_URL.replace(/\/$/, '') + '/wasm/';
    console.log("Setting WASM path to:", wasmPath);
    
    // Set the WASM path and check if files are accessible
    (async () => {
      try {
        // Set WASM path first
        await viewer.IFC.setWasmPath(wasmPath);
        console.log("WASM path set successfully");
        
        // Check if WASM files are accessible
        try {
          const response = await fetch(`${wasmPath}web-ifc.wasm`, { method: 'HEAD' });
          setWasmLoaded(response.ok);
          console.log("WASM file check:", response.ok ? "Available" : "Missing");
        } catch (e) {
          console.error("Error checking WASM files:", e);
          setWasmLoaded(false);
        }

        // ejes + grid opcionales
        viewer.context.getScene().add(new THREE.GridHelper(50, 50));
        viewer.context.getScene().add(new THREE.AxesHelper(5));

        setReady(true);
      } catch (e) {
        console.error("Error setting WASM path:", e);
        setError("Error setting WASM path. Please check if WASM files are correctly placed in /public/wasm/ directory.");
      }
    })();
  }, [containerRef]);

  /* 2. cargar IFC cuando ya hay viewer y url ------------ */
  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready || !fileUrl) return;

    (async () => {
      try {
        setLoading(true);
        console.log("Loading IFC from URL:", fileUrl);
        
        const model = await viewer.IFC.loadIfcUrl(fileUrl);
        setModelLoaded(true);
        
        if (!model?.mesh) {
          setMeshExists(false);
          throw new Error("El IFC no contiene geometría.");
        }
        
        setMeshExists(true);

        // ---- normalizar coordenadas --------------------
        const box    = new THREE.Box3().setFromObject(model.mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());

        console.log("Model dimensions:", {
          size: size.toArray(),
          center: center.toArray(),
          min: box.min.toArray(),
          max: box.max.toArray()
        });

        // si está lejos (UTM) lo llevo al origen
        if (center.length() > 5_000) {
          console.log("Centering model (far from origin)");
          model.mesh.position.sub(center);
        }

        // si viene en milímetros lo escalo a metros
        if (size.length() > 10_000) {
          console.log("Scaling model from mm to m");
          model.mesh.scale.setScalar(0.001);
        }

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
        console.error("Error loading IFC:", e);
        setError(e.message ?? "Error cargando IFC");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, fileUrl, fileName, toast]);

  /* 3. API mínima que usas en tus componentes ----------- */
  return {
    viewer: viewerRef.current,
    mesh,
    ready,
    loading,
    error,
    // For diagnostic panel
    wasmLoaded,
    modelLoaded,
    meshExists,
    // For compatibility with current consumers of the hook
    isInitialized: ready,
    isLoading: loading,
    modelLoaded: modelLoaded,
    meshExists: meshExists,
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
