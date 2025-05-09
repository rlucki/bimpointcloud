
import React from "react";
import { Canvas } from "@react-three/fiber";
import ViewerContainer, { HtmlOverlay } from "@/components/ViewerContainer";
import PointCloudViewer from "@/components/PointCloudViewer";
import { FileData } from "./ViewerFileManager";

interface ViewerLasContentProps {
  files: FileData[];
  visibleFiles: {[key: string]: boolean};
  showStats: boolean;
  onFrameAll: () => void;
}

const ViewerLasContent: React.FC<ViewerLasContentProps> = ({
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

export default ViewerLasContent;
