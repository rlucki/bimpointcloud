
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import UploadZone from "@/components/UploadZone";
import FileList from "@/components/FileList";
import FileActions from "@/components/FileActions";
import { FileUploadProvider, useFileUpload } from "@/context/FileUploadContext";

const FileUploaderContent: React.FC = () => {
  const { 
    files, 
    isUploading,
    handleFilesSelected,
    handleRemoveFile,
    simulateUpload,
    clearCompleted,
    viewIn3D,
    hasSuccessfulFiles
  } = useFileUpload();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          File Upload
          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
            IFC & LAS
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UploadZone onFileSelect={handleFilesSelected} accept={[".ifc", ".las"]} />
        <FileList 
          files={files} 
          onRemoveFile={handleRemoveFile} 
          onClearCompleted={clearCompleted} 
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          Supported formats: .ifc, .las
        </div>
        <FileActions 
          isUploading={isUploading}
          filesExist={files.length > 0}
          hasSuccessfulFiles={hasSuccessfulFiles}
          onUpload={simulateUpload}
          onViewIn3D={viewIn3D}
        />
      </CardFooter>
    </Card>
  );
};

const FileUploader: React.FC = () => {
  return (
    <FileUploadProvider>
      <FileUploaderContent />
    </FileUploadProvider>
  );
};

export default FileUploader;
