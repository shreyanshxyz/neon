import { FolderOpen, AlertCircle, Loader2 } from "lucide-react";
import FileItem from "./FileItem";
import { FileItem as FileItemType } from "../../hooks/useFileSystem";

interface FileListProps {
  files: FileItemType[];
  loading: boolean;
  error: string | null;
  selectedFiles: string[];
  onFileClick: (fileId: string) => void;
}

export default function FileList({
  files,
  loading,
  error,
  selectedFiles,
  onFileClick,
}: FileListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-bg-tertiary/50 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
          <div className="flex-1">Name</div>
          <div className="w-24 text-right">Size</div>
          <div className="w-32 text-right">Modified</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-bg-tertiary/50 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
          <div className="flex-1">Name</div>
          <div className="w-24 text-right">Size</div>
          <div className="w-32 text-right">Modified</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-bg-tertiary/50 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
        <div className="flex-1">Name</div>
        <div className="w-24 text-right">Size</div>
        <div className="w-32 text-right">Modified</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
            <p>This folder is empty</p>
          </div>
        ) : (
          files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              selected={selectedFiles.includes(file.id)}
              onClick={() => onFileClick(file.id)}
              onDoubleClick={() => {
                if (file.type === "folder") {
                  onFileClick(file.id);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
