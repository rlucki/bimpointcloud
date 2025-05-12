
import React from "react";

interface LoadingOverlayProps {
  isDemoMode: boolean;
  filesCount: number;
  statusMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isDemoMode, 
  filesCount,
  statusMessage 
}) => {
  return (
    <div className="min-h-screen bg-[#222222] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
        <p className="text-white text-lg">Loading viewer...</p>
        <p className="text-gray-400 text-sm mt-2">
          {isDemoMode ? "Preparing demo environment" : `Loading ${filesCount} file(s)`}
        </p>
        {statusMessage && (
          <p className="text-gray-300 text-xs mt-1 px-4 py-2 bg-black/20 rounded-md max-w-md mx-auto">
            {statusMessage}
          </p>
        )}
        <div className="mt-6 text-xs text-gray-300 max-w-md mx-auto px-4 bg-black/30 py-4 rounded-md">
          <p className="font-semibold mb-2 text-sm">⚠️ IMPORTANTE: Archivo WASM necesario</p>
          <p>Para que el visor IFC funcione, debes tener los archivos WASM en la carpeta correcta:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-left">
            <li>Descarga los archivos web-ifc.wasm y web-ifc-mt.wasm</li>
            <li>Colócalos en la carpeta <span className="bg-black/30 px-1 rounded">public/wasm/</span> de tu proyecto</li>
            <li>Reinicia el servidor si es necesario</li>
          </ol>
          <p className="mt-3 text-yellow-300">Si el error persiste, revisa la consola del navegador para más detalles</p>
          <p className="mt-2">También puedes probar con modelos IFC de ejemplo más simples para pruebas iniciales</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
