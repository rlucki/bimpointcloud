
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
      </div>
    </div>
  );
};

export default LoadingOverlay;
