import { useEffect, useState } from 'react';
import { FileItem } from '../../hooks/useFileSystem';
import { FileText, X, File, Image, Binary, AlertCircle, Loader2 } from 'lucide-react';

interface FilePreviewProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  readFileContent: (path: string) => Promise<{
    content: string | null;
    isBinary: boolean;
    size: number;
    error: string | null;
  }>;
}

export default function FilePreview({ file, isOpen, onClose, readFileContent }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isBinary, setIsBinary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type === 'file' && isOpen) {
      loadFileContent();
    }
  }, [file, isOpen]);

  const loadFileContent = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setContent(null);
    setIsBinary(false);

    try {
      const result = await readFileContent(file.path);

      if (result.error) {
        setError(result.error);
      } else if (result.isBinary) {
        setIsBinary(true);
      } else {
        setContent(result.content);
      }
    } catch (err) {
      setError('Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !file) return null;

  return (
    <div className="w-80 bg-bg-secondary border-l border-border flex flex-col shrink-0">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          {file.type === 'folder' ? (
            <FileText className="w-5 h-5 text-blue-400" />
          ) : isBinary ? (
            <Binary className="w-5 h-5 text-amber-400" />
          ) : (
            <File className="w-5 h-5 text-text-secondary" />
          )}
          <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">
            {file.name}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded transition-colors">
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Type</span>
            <span className="text-text-primary">
              {file.type === 'folder' ? 'Folder' : file.extension.toUpperCase() || 'File'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Size</span>
            <span className="text-text-primary">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Modified</span>
            <span className="text-text-primary">{file.modified.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Path</span>
            <span className="text-text-primary truncate max-w-[150px]" title={file.path}>
              {file.path}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
            <p className="text-sm text-center">{error}</p>
          </div>
        ) : file.type === 'folder' ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <FileText className="w-12 h-12 mb-2 text-blue-400" />
            <p className="text-sm">Folder selected</p>
            <p className="text-xs mt-1">Double-click to open</p>
          </div>
        ) : isBinary ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Binary className="w-12 h-12 mb-2 text-amber-400" />
            <p className="text-sm">Binary file</p>
            <p className="text-xs mt-1">Cannot preview binary files</p>
          </div>
        ) : content ? (
          <div className="bg-bg-primary rounded p-3">
            <pre className="text-xs text-text-secondary whitespace-pre-wrap break-all font-mono">
              {content.length > 5000 ? content.substring(0, 5000) + '\n\n... (truncated)' : content}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <File className="w-12 h-12 mb-2" />
            <p className="text-sm">No preview available</p>
          </div>
        )}
      </div>
    </div>
  );
}
