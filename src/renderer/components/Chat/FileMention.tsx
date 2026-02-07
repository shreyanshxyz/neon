import { FileText } from 'lucide-react';
import { FileItem } from '../../hooks/useFileSystem';

interface FileMentionProps {
  files: FileItem[];
  onSelect: (file: FileItem) => void;
}

export default function FileMention({ files, onSelect }: FileMentionProps) {
  if (files.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-bg-secondary border border-border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
      {files.map((file) => (
        <button
          key={file.id}
          onClick={() => onSelect(file)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors"
        >
          <FileText className="w-4 h-4 text-text-muted" />
          <span className="truncate">{file.name}</span>
        </button>
      ))}
    </div>
  );
}
