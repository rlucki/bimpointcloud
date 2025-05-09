
import React from "react";
import { Button } from "@/components/ui/button";
import FileItem from "@/components/FileItem";

interface FileWithStatus extends File {
  id: string;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
}

interface FileListProps {
  files: FileWithStatus[];
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
}

const FileList: React.FC<FileListProps> = ({ 
  files, 
  onRemoveFile,
  onClearCompleted
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Files ({files.length})</h3>
        {files.some((file) => file.status === "success") && (
          <Button variant="link" size="sm" onClick={onClearCompleted}>
            Clear completed
          </Button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto pr-1">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            progress={file.progress}
            status={file.status}
            onRemove={() => onRemoveFile(file.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default FileList;
