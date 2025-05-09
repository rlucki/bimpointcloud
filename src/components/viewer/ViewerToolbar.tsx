
import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, MaximizeIcon, MinimizeIcon, Settings, Bug } from "lucide-react";

interface ViewerToolbarProps {
  title: string;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onDebug?: () => void;
  onDiagnostics?: () => void;
  isFullscreen: boolean;
  isDiagnosticsEnabled?: boolean;
}

const ViewerToolbar: React.FC<ViewerToolbarProps> = ({ 
  title,
  onClose,
  onToggleFullscreen,
  onDebug,
  onDiagnostics,
  isFullscreen,
  isDiagnosticsEnabled
}) => {
  return (
    <header className="bg-[#333333] border-b border-[#444444] h-12 flex items-center justify-between px-4">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="text-white hover:bg-[#444444]">
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="ml-4 text-white font-medium">
          {title}
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {onDiagnostics && (
          <Button 
            variant={isDiagnosticsEnabled ? "default" : "ghost"} 
            size="icon" 
            onClick={onDiagnostics} 
            className={isDiagnosticsEnabled 
              ? "bg-amber-500 text-white hover:bg-amber-600" 
              : "text-white hover:bg-[#444444]"}
            title="Diagnose viewer issues"
          >
            <Bug className="h-4 w-4" />
          </Button>
        )}
        {process.env.NODE_ENV === 'development' && onDebug && (
          <Button variant="ghost" size="icon" onClick={onDebug} className="text-white hover:bg-[#444444]">
            <Settings className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-[#444444]">
          <X className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleFullscreen} className="text-white hover:bg-[#444444]">
          {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};

export default ViewerToolbar;
