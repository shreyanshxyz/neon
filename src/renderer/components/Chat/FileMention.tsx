import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { FileItem } from '../../hooks/useFileSystem';

interface FileMentionProps {
  files: FileItem[];
  onSelect: (file: FileItem) => void;
}

export default function FileMention({ files, onSelect }: FileMentionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [files.length]);

  useEffect(() => {
    if (files.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      switch (e.key) {
        case 'ArrowDown':
          if (isInput) {
            e.stopPropagation();
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % files.length);
          }
          break;
        case 'ArrowUp':
          if (isInput) {
            e.stopPropagation();
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + files.length) % files.length);
          }
          break;
        case 'Enter':
          if (isInput) {
            e.stopPropagation();
            e.preventDefault();
            onSelect(files[selectedIndex]);
          }
          break;
        case 'Escape':
          e.stopPropagation();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, selectedIndex, onSelect]);

  if (files.length === 0) return null;

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
