
import React from "react";
import { Button } from "@/components/ui/button";
import { MaximizeIcon, MinimizeIcon, Settings } from "lucide-react";

interface ViewerControlsProps {
  onFrameAll: () => void;
  onToggleFullscreen: () => void;
  onToggleStats: () => void;
  isFullscreen: boolean;
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  onFrameAll,
  onToggleFullscreen,
  onToggleStats,
  isFullscreen
}) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 pointer-events-auto">
      {/* Eliminamos el botón de Frame All para evitar que el usuario lo use */}
      
      <Button 
        onClick={onToggleFullscreen}
        variant="secondary" 
        size="icon"
        title="Toggle fullscreen"
        className="bg-[#333333] text-white hover:bg-[#444444] border border-[#444444]"
      >
        {isFullscreen ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
      </Button>
      
      <Button 
        onClick={onToggleStats}
        variant="secondary" 
        size="icon"
        title="Toggle performance stats"
        className="bg-[#333333] text-white hover:bg-[#444444] border border-[#444444]"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ViewerControls;
