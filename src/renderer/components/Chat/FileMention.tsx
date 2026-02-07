import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { FileItem } from '../../hooks/useFileSystem';

interface FileMentionProps {
  files: FileItem[];
  onSelect: (file: FileItem) => void;
}

export default function FileMention({ files, onSelect }: FileMentionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (files.length === 0) return null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (files.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % files.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + files.length) % files.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(files[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, selectedIndex, onSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [files.length]);

  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-bg-secondary border border-border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
      {files.map((file, index) => (
        <button
          key={file.id}
          onClick={() => onSelect(file)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary transition-colors ${
            index === selectedIndex ? 'bg-accent-primary/20' : 'hover:bg-bg-hover'
          }`}
        >
          <FileText className="w-4 h-4 text-text-muted" />
          <span className="truncate">{file.name}</span>
        </button>
      ))}
    </div>
  );
}
