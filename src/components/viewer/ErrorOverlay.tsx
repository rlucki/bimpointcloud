
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Code, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorOverlayProps {
  errorMessage: string | null;
  details?: string;
  onReturn: () => void;
  onRetry?: () => void;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ 
  errorMessage, 
  details, 
  onReturn,
  onRetry 
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  if (!errorMessage) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
      <div className="bg-card p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-xl font-medium mb-2">Error al cargar el modelo</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        
        <div className="bg-amber-950/30 border border-amber-600/30 p-4 rounded-md mb-4 text-left">
          <h4 className="font-semibold text-amber-200 mb-2 flex items-center">
            Problema al cargar el modelo IFC
          </h4>
          
          <p className="text-sm text-amber-100/80 mb-2">
            Ha ocurrido un error al cargar el modelo IFC. Esto puede deberse a:
          </p>
          
          <ul className="list-disc list-inside text-xs space-y-1 text-amber-100/70 pl-2">
            <li>El archivo IFC está dañado o no es compatible</li>
            <li>El modelo es demasiado grande para cargarse en el navegador</li>
            <li>Hay un problema de conexión al cargar el archivo</li>
          </ul>
          
          <p className="text-xs text-amber-100/60 mt-2">
            Intente cargar un modelo más pequeño o reinicie la aplicación. Si el problema persiste, contacte al soporte técnico.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full mb-3 flex justify-between items-center text-muted-foreground"
        >
          <div className="flex items-center">
            <Code className="h-4 w-4 mr-2" /> 
            {showTechnicalDetails ? "Ocultar detalles técnicos" : "Mostrar detalles técnicos"}
          </div>
          {showTechnicalDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {showTechnicalDetails && details && (
          <div className="bg-black/10 p-3 rounded-md mb-4 overflow-auto max-h-32 text-xs text-left text-muted-foreground">
            <code className="whitespace-pre-wrap font-mono">{details}</code>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          )}
          <Button onClick={onReturn}>Volver a la subida</Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;
