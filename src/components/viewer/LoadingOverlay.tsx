
import React from "react";
import { Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingOverlayProps {
  isDemoMode: boolean;
  filesCount: number;
  statusMessage?: string;
  wasmError?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isDemoMode, 
  filesCount,
  statusMessage,
  wasmError = false
}) => {
  // Función para abrir documentación
  const openWasmDocs = () => {
    window.open("https://github.com/IFCjs/web-ifc-viewer#using-web-ifc-viewer", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#222222] flex items-center justify-center">
      <div className="text-center max-w-lg px-4">
        {wasmError ? (
          // Mostrar error específico de WASM
          <>
            <div className="text-amber-500 mb-4">
              <AlertTriangle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-white text-xl mb-4">Error de carga de archivos WebAssembly</h2>
            <div className="bg-black/30 p-4 rounded-md mb-6">
              <p className="text-amber-200 text-left text-sm mb-4">
                El visor IFC requiere archivos WASM (WebAssembly) para funcionar correctamente. 
                Estos archivos deben estar disponibles en la carpeta <code className="bg-black/30 p-1 rounded">public/wasm/</code>.
              </p>
              <p className="text-white/80 text-xs text-left mb-4">
                Asegúrate de que los siguientes archivos existen en la carpeta <code className="bg-black/30 p-1 rounded">public/wasm/</code>:
              </p>
              <ul className="list-disc list-inside text-white/70 text-left text-xs mb-4">
                <li>web-ifc.wasm</li>
                <li>web-ifc-mt.wasm</li>
              </ul>
              <Button 
                variant="outline" 
                onClick={openWasmDocs}
                className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-100 border-amber-600/40 w-full"
              >
                Ver documentación de IFC.js
              </Button>
            </div>
          </>
        ) : (
          // Mostrar animación de carga normal
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
            <p className="text-white text-lg">Cargando visor IFC...</p>
            <p className="text-gray-400 text-sm mt-2">
              {isDemoMode ? "Preparando entorno de demostración" : `Cargando ${filesCount} archivo(s)`}
            </p>
            {statusMessage && (
              <p className="text-gray-300 text-xs mt-1 px-4 py-2 bg-black/20 rounded-md max-w-md mx-auto">
                {statusMessage}
              </p>
            )}
          </>
        )}

        <div className="mt-6 text-xs text-gray-300 max-w-md mx-auto px-4 bg-black/30 py-4 rounded-md">
          <div className="flex items-center justify-center gap-1 mb-2 text-sm">
            <Info className="h-4 w-4 text-blue-400" /> 
            <p className="font-semibold">Información del visor</p>
          </div>
          
          <p className="text-sm text-center mb-2">
            {wasmError 
              ? "El visor IFC no puede inicializarse debido a problemas con los archivos WebAssembly." 
              : "El visor IFC está inicializando los componentes necesarios para visualizar modelos 3D."}
          </p>
          
          <p className="text-yellow-300 text-xs text-center">
            {wasmError
              ? "Necesitas instalar los archivos WASM requeridos por el visor IFC."
              : "Si la carga tarda demasiado tiempo, puede deberse a la complejidad del modelo o a la conexión de internet."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
