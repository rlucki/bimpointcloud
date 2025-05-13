
import React from "react";
import { Info } from "lucide-react";

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
        <p className="text-white text-lg">Cargando visor 3D...</p>
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
            <p className="font-semibold">Información del visor</p>
          </div>
          
          <p className="text-sm text-center mb-2">
            El visor 3D está inicializando los componentes necesarios para visualizar modelos.
          </p>
          
          <p className="text-amber-400 text-xs text-center">
            Debido a limitaciones técnicas, los archivos IFC se mostrarán como modelos simplificados.
          </p>
          
          <p className="text-green-400 text-xs text-center mt-1">
            Usando visualización simplificada - Los modelos se representarán como objetos básicos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
