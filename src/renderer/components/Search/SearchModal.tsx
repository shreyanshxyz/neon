import { useState, useEffect, useCallback, useRef } from 'react';
import { FileItem } from '../../hooks/useFileSystem';
import { Search, X, Folder, File } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  files: FileItem[];
  currentPath: string;
  onClose: () => void;
  onFileSelect: (file: FileItem) => void;
  onNavigateToFolder: (folderPath: string) => void;
}

export default function SearchModal({
  isOpen,
  files,
  currentPath,
  onClose,
  onFileSelect,
  onNavigateToFolder,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = files.filter(
      (file) =>
        file.name.toLowerCase().includes(searchLower) ||
        file.extension.toLowerCase().includes(searchLower)
    );

    setResults(filtered);
    setSelectedIndex(0);
  }, [query, files]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedFile = results[selectedIndex];
        if (selectedFile) {
          if (selectedFile.type === 'folder') {
            onNavigateToFolder(selectedFile.path);
          } else {
            onFileSelect(selectedFile);
          }
          onClose();
        }
      }
    },
    [results, selectedIndex, onClose, onFileSelect, onNavigateToFolder]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20">
      <div className="bg-bg-secondary rounded-lg shadow-2xl w-[600px] max-w-[90vw] border border-border overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-bg-hover rounded transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-text-muted">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Type to search files in current directory</p>
              <p className="text-xs mt-2 opacity-60">Use ↑↓ to navigate, Enter to select</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="text-sm">No files found</p>
              <p className="text-xs mt-2 opacity-60">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-text-muted">
                {results.length} result{results.length !== 1 ? 's' : ''} in {currentPath}
              </div>
              {results.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-accent-primary/30' : 'hover:bg-bg-hover'
                  }`}
                  onClick={() => {
                    if (file.type === 'folder') {
                      onNavigateToFolder(file.path);
                    } else {
                      onFileSelect(file);
                    }
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {file.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-text-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">
                      {highlightMatch(file.name, query)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {file.type === 'folder' ? 'Folder' : file.extension || 'File'} •{' '}
                      {formatSize(file.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-bg-tertiary/50 border-t border-border text-xs text-text-muted flex items-center gap-4">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-accent-primary/50 text-text-primary">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
