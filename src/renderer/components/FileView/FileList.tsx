import { FolderOpen } from 'lucide-react';
import FileItem from './FileItem';
import { mockFiles } from '../../data/mockData';

interface FileListProps {
  currentPath: string;
  selectedFiles: string[];
  onSelectionChange: (selected: string[]) => void;
}

export default function FileList({ selectedFiles, onSelectionChange }: FileListProps) {
  const handleItemClick = (id: string) => {
    if (selectedFiles.includes(id)) {
      onSelectionChange(selectedFiles.filter((f) => f !== id));
    } else {
      onSelectionChange([...selectedFiles, id]);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-bg-tertiary/50 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
        <div className="flex-1">Name</div>
        <div className="w-24 text-right">Size</div>
        <div className="w-32 text-right">Modified</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
            <p>This folder is empty</p>
          </div>
        ) : (
          mockFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              selected={selectedFiles.includes(file.id)}
              onClick={() => handleItemClick(file.id)}
              onDoubleClick={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
