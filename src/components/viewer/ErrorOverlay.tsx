
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileDown, RefreshCw } from "lucide-react";

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
  if (!errorMessage) return null;
  
  const isWasmError = details?.includes('wasm') || errorMessage.toLowerCase().includes('wasm') || 
                      details?.includes('Aborted') || details?.includes('fetch');
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
      <div className="bg-card p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-xl font-medium mb-2">Error Loading Model</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        
        {isWasmError && (
          <div className="bg-amber-950/30 border border-amber-600/30 p-4 rounded-md mb-4 text-left">
            <h4 className="font-semibold text-amber-200 mb-2 flex items-center">
              <FileDown className="h-4 w-4 mr-2" /> WebAssembly Files Missing
            </h4>
            <p className="text-sm text-amber-100/80 mb-2">
              It appears the WASM files required for IFC parsing are missing or inaccessible.
            </p>
            <ol className="list-decimal list-inside text-xs space-y-1 text-amber-100/70">
              <li>Download web-ifc.wasm and web-ifc-mt.wasm files</li>
              <li>Place them in the <span className="bg-black/30 px-1 rounded">public/wasm/</span> folder</li>
              <li>Restart your application</li>
            </ol>
          </div>
        )}
        
        {details && (
          <div className="bg-black/10 p-3 rounded-md mb-4 overflow-auto max-h-32 text-xs text-left text-muted-foreground">
            <code>{details}</code>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
          <Button onClick={onReturn}>Return to Upload</Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;
