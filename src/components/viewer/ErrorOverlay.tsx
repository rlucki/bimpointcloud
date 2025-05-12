
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileDown, RefreshCw, Code, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

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
  
  // Determine error type for targeted help
  const isWasmError = details?.includes('wasm') || errorMessage.toLowerCase().includes('wasm') || 
                      details?.includes('Aborted') || details?.includes('fetch');
  
  // Extract the specific WASM error if possible
  const wasmErrorMatch = details?.match(/WebAssembly\.[a-zA-Z]+\(\):([^)]+)\)/);
  const specificWasmError = wasmErrorMatch ? wasmErrorMatch[1].trim() : null;
  
  // Extract MIME type error if present
  const mimeTypeErrorMatch = details?.match(/Expected 'application\/wasm'/);
  const hasMimeTypeError = !!mimeTypeErrorMatch;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
      <div className="bg-card p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        
        {isWasmError && (
          <div className="bg-amber-950/30 border border-amber-600/30 p-4 rounded-md mb-4 text-left">
            <h4 className="font-semibold text-amber-200 mb-2 flex items-center">
              <FileDown className="h-4 w-4 mr-2" /> Archivos WebAssembly no detectados
            </h4>
            
            {hasMimeTypeError && (
              <p className="text-sm text-amber-100/80 mb-2">
                <strong>Error de tipo MIME detectado:</strong> El servidor está devolviendo 
                los archivos WASM con el tipo MIME incorrecto o está sirviendo un archivo HTML en lugar
                del binario WASM.
              </p>
            )}
            
            <p className="text-sm text-amber-100/80 mb-2">
              El visor IFC necesita archivos WASM para funcionar. Estos archivos no se encuentran o no son accesibles desde la ruta esperada.
            </p>
            
            <div className="border border-amber-600/20 bg-amber-950/20 p-3 rounded my-2">
              <h5 className="font-medium text-amber-200 text-sm mb-2">Solución:</h5>
              <ol className="list-decimal list-inside text-xs space-y-1 text-amber-100/70">
                <li>Descarga los archivos WASM desde el <a 
                  href="https://unpkg.com/browse/web-ifc@0.0.41/dist/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center"
                >
                  repositorio oficial <ExternalLink className="h-3 w-3 ml-1" />
                </a>:</li>
                <li className="pl-4">• web-ifc.wasm</li>
                <li className="pl-4">• web-ifc-mt.wasm</li>
                <li>Crea una carpeta <code className="bg-black/30 px-1 rounded">public/wasm/</code> en tu proyecto</li>
                <li>Coloca ambos archivos en esa carpeta</li>
                <li>Asegúrate que el servidor esté configurado para servir archivos .wasm con el tipo MIME correcto: <code className="bg-black/30 px-1 rounded">application/wasm</code></li>
                <li>Reinicia el servidor de desarrollo</li>
              </ol>
            </div>
            
            <p className="text-xs text-amber-100/60 mt-2">
              Si estás usando Vite, los archivos en la carpeta <code className="bg-black/30 px-1 rounded">public</code> son servidos directamente en la raíz.
            </p>
          </div>
        )}
        
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
