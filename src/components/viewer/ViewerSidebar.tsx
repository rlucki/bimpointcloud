
import React from "react";
import { SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { File, Eye, EyeOff } from "lucide-react";

interface FileData {
  fileType: 'ifc' | 'las';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  visible?: boolean;
  id?: string;
}

interface ViewerSidebarProps {
  files: FileData[];
  selectedItem: string | null;
  visibleFiles: {[key: string]: boolean};
  onSelectItem: (fileName: string) => void;
  onToggleVisibility: (fileId: string) => void;
}

const ViewerSidebar: React.FC<ViewerSidebarProps> = ({
  files,
  selectedItem,
  visibleFiles,
  onSelectItem,
  onToggleVisibility
}) => {
  return (
    <SheetContent side="left" className="bg-[#333333] border-r border-[#444444] text-white w-64 p-0">
      <div className="p-4 border-b border-[#444444]">
        <h2 className="text-lg font-medium">Files</h2>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium mb-2">LOADED FILES</h3>
        <ul>
          {files.length > 0 ? (
            files.map((file) => (
              <li 
                key={file.id}
                className={`py-1 px-2 rounded cursor-pointer text-sm flex items-center justify-between ${selectedItem === file.fileName ? 'bg-[#444444]' : 'hover:bg-[#3a3a3a]'}`}
              >
                <div className="flex items-center" onClick={() => onSelectItem(file.fileName)}>
                  <File className="h-4 w-4 mr-2" /> 
                  {file.fileName} <span className="ml-2 text-xs opacity-50">{file.fileType.toUpperCase()}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => file.id && onToggleVisibility(file.id)}
                >
                  {file.id && visibleFiles[file.id] ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))
          ) : (
            <li className="py-1 px-2 text-sm text-gray-400">
              Demo mode - no files loaded
            </li>
          )}
        </ul>
      </div>
    </SheetContent>
  );
};

export default ViewerSidebar;
