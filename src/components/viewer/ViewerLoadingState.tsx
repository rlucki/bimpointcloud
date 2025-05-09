
import React from "react";

interface ViewerLoadingStateProps {
  isDemoMode: boolean;
  filesCount: number;
}

const ViewerLoadingState: React.FC<ViewerLoadingStateProps> = ({ isDemoMode, filesCount }) => {
  return (
    <div className="min-h-screen bg-[#222222] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
        <p className="text-white text-lg">Loading viewer...</p>
        <p className="text-gray-400 text-sm mt-2">
          {isDemoMode ? "Preparing demo environment" : `Loading ${filesCount} file(s)`}
        </p>
      </div>
    </div>
  );
};

export default ViewerLoadingState;
