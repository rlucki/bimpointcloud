
import React from "react";
import { FileDown, Info, ExternalLink } from "lucide-react";

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
      <div className="text-center max-w-lg px-4">
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
        <div className="mt-6 text-xs text-gray-300 max-w-md mx-auto px-4 bg-black/30 py-4 rounded-md">
          <div className="flex items-center justify-center gap-1 mb-2 text-sm">
            <Info className="h-4 w-4 text-blue-400" /> 
            <p className="font-semibold">Requisitos importantes</p>
          </div>
          
          <div className="mb-4 text-left">
            <div className="flex items-start gap-2">
              <FileDown className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1 text-sm">Archivos WASM necesarios</p>
                <p className="text-sm">Para visualizar modelos IFC, necesitas estos archivos en tu proyecto:</p>
              </div>
            </div>
            <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
              <li>Descarga estos archivos: 
                <a 
                  href="https://unpkg.com/browse/web-ifc@0.0.41/dist/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center ml-1"
                >
                  enlace al repositorio <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </li>
              <li className="ml-4 text-xs">• <code>web-ifc.wasm</code></li>
              <li className="ml-4 text-xs">• <code>web-ifc-mt.wasm</code></li>
              <li>Colócalos en la carpeta <code className="bg-black/30 px-1 rounded">public/wasm/</code> de tu proyecto</li>
              <li>Reinicia el servidor si es necesario</li>
            </ol>
          </div>
          
          <div className="flex items-center justify-center mb-2">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          
          <p className="text-yellow-300 text-xs text-left">
            <span className="font-medium">Solución de problemas:</span> Si ves un error relacionado con archivos WASM, es probable que estos archivos no estén correctamente configurados. Verifica que la ruta sea correcta y que el servidor esté configurado para servir archivos .wasm con el tipo MIME <code>application/wasm</code>.
          </p>
          
          <p className="mt-2 text-xs text-left">
            Si estás utilizando el modo de desarrollo, también puedes probar con modelos IFC de ejemplo más simples para verificar que todo funciona correctamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
