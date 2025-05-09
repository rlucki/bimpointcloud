
import React from "react";
import { Canvas } from "@react-three/fiber";
import PointCloudViewer from "@/components/PointCloudViewer";
import ViewerContainer, { HtmlOverlay } from "@/components/ViewerContainer";

interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  visible?: boolean;
  id?: string;
}

interface LASViewerContainerProps {
  files: FileData[];
  visibleFiles: {[key: string]: boolean};
  showStats: boolean;
  onFrameAll: () => void;
}

const LASViewerContainer: React.FC<LASViewerContainerProps> = ({ 
  files, 
  visibleFiles, 
  showStats, 
  onFrameAll 
}) => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <ViewerContainer showStats={showStats}>
          {files.length > 0 ? (
            files
              .filter(f => f.fileType === 'las' && f.id && visibleFiles[f.id])
              .map((file) => (
                <PointCloudViewer
                  key={file.id}
                  url={file.fileUrl}
                  color="#4f46e5"
                  opacity={0.8}
                />
              ))
          ) : (
            // Demo point cloud for empty state
            <PointCloudViewer />
          )}
        </ViewerContainer>
      </Canvas>
      
      {/* Place HTML overlay outside of Canvas */}
      <HtmlOverlay onFrameAll={onFrameAll} />
    </div>
  );
};

export default LASViewerContainer;
