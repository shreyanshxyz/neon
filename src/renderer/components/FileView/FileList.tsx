import { useState, useCallback, useEffect } from 'react';
import { FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import FileItem from './FileItem';
import ContextMenu from '../ui/ContextMenu';
import { FileItem as FileItemType } from '../../hooks/useFileSystem';

interface FileListProps {
  files: FileItemType[];
  loading: boolean;
  error: string | null;
  selectedFiles: string[];
  currentPath: string;
  hasClipboard: boolean;
  viewMode?: 'grid' | 'list';
  onFileClick: (fileId: string, isCtrlClick: boolean) => void;
  onFileDoubleClick: (fileId: string) => void;
  onCopy: (file: FileItemType) => void;
  onCut: (file: FileItemType) => void;
  onPaste: () => void;
  onDelete: (file: FileItemType) => void;
  onRename: (file: FileItemType) => void;
  onCreateFolder: () => void;
  onPreview: (file: FileItemType) => void;
  onFileDrop?: (sourcePath: string, targetFolderPath: string) => void;
}

export default function FileList({
  files,
  loading,
  error,
  selectedFiles,
  currentPath,
  hasClipboard,
  viewMode = 'list',
  onFileClick,
  onFileDoubleClick,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRename,
  onCreateFolder,
  onPreview,
  onFileDrop,
}: FileListProps) {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    file: FileItemType | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    file: null,
  });

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileItemType | null = null) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      file,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, file: FileItemType) => {
    setDraggedFileId(file.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        path: file.path,
        id: file.id,
        name: file.name,
        type: file.type,
      })
    );
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, file: FileItemType) => {
      e.preventDefault();
      e.stopPropagation();
      if (file.type === 'folder' && file.id !== draggedFileId) {
        setDropTargetId(file.id);
      }
    },
    [draggedFileId]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetFile: FileItemType) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetId(null);
      setDraggedFileId(null);

      if (targetFile.type !== 'folder') return;

      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        try {
          const draggedFile = JSON.parse(jsonData);

          if (draggedFile.id === targetFile.id) return;

          if (targetFile.path.startsWith(draggedFile.path + '/')) return;

          const sourceName = draggedFile.path.split('/').pop();
          const destPath = targetFile.path + '/' + sourceName;

          if (onFileDrop) {
            onFileDrop(draggedFile.path, destPath);
          }
        } catch (err) {
          console.error('Error parsing drag data:', err);
        }
      }
    },
    [onFileDrop]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'c' && selectedFiles.length > 0) {
        e.preventDefault();
        const selectedFile = files.find((f) => f.id === selectedFiles[0]);
        if (selectedFile) onCopy(selectedFile);
      }

      if (isCtrl && e.key === 'x' && selectedFiles.length > 0) {
        e.preventDefault();
        const selectedFile = files.find((f) => f.id === selectedFiles[0]);
        if (selectedFile) onCut(selectedFile);
      }

      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        onPaste();
      }

      if (e.key === 'Delete' && selectedFiles.length > 0) {
        e.preventDefault();
        const selectedFile = files.find((f) => f.id === selectedFiles[0]);
        if (selectedFile) onDelete(selectedFile);
      }

      if (e.key === 'F2' && selectedFiles.length === 1) {
        e.preventDefault();
        const selectedFile = files.find((f) => f.id === selectedFiles[0]);
        if (selectedFile) onRename(selectedFile);
      }

      if (e.key === ' ' && selectedFiles.length === 1) {
        e.preventDefault();
        const selectedFile = files.find((f) => f.id === selectedFiles[0]);
        if (selectedFile && selectedFile.type === 'file') {
          onPreview(selectedFile);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, files, onCopy, onCut, onPaste, onDelete, onRename, onPreview]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-terminal-bg">
        {viewMode === 'list' && (
          <div className="flex items-center px-4 py-2 bg-terminal-surface border-b border-terminal-border text-xs font-terminal text-terminal-muted uppercase tracking-wider">
            <div className="flex-1">Name</div>
            <div className="w-24 text-right">Size</div>
            <div className="w-40 text-right">Modified</div>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-terminal-muted font-terminal">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-terminal-green" />
          <p>loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-terminal-bg">
        {viewMode === 'list' && (
          <div className="flex items-center px-4 py-2 bg-terminal-surface border-b border-terminal-border text-xs font-terminal text-terminal-muted uppercase tracking-wider">
            <div className="flex-1">Name</div>
            <div className="w-24 text-right">Size</div>
            <div className="w-40 text-right">Modified</div>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-terminal-muted font-terminal">
          <AlertCircle className="w-12 h-12 mb-2 text-terminal-red" />
          <p className="text-terminal-red">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-terminal-bg"
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {viewMode === 'list' && (
        <div className="flex items-center px-4 py-2 bg-terminal-surface border-b border-terminal-border text-xs font-terminal text-terminal-muted uppercase tracking-wider">
          <div className="flex-1">Name</div>
          <div className="w-24 text-right">Size</div>
          <div className="w-40 text-right">Modified</div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto scrollbar-thin ${viewMode === 'grid' ? 'p-4' : ''}`}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-terminal-muted font-terminal">
            <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
            <p>This folder is empty</p>
            <p className="text-xs mt-1 opacity-50">Right-click to create new folder</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                selected={selectedFiles.includes(file.id)}
                viewMode="grid"
                onClick={(isCtrlClick) => onFileClick(file.id, isCtrlClick)}
                onDoubleClick={() => onFileDoubleClick(file.id)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragOver={(e) => handleDragOver(e, file)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, file)}
                isDropTarget={dropTargetId === file.id}
              />
            ))}
          </div>
        ) : (
          files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              selected={selectedFiles.includes(file.id)}
              viewMode="list"
              onClick={(isCtrlClick) => onFileClick(file.id, isCtrlClick)}
              onDoubleClick={() => onFileDoubleClick(file.id)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              onDragStart={(e) => handleDragStart(e, file)}
              onDragOver={(e) => handleDragOver(e, file)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, file)}
              isDropTarget={dropTargetId === file.id}
            />
          ))
        )}
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        file={contextMenu.file}
        hasClipboard={hasClipboard}
        onClose={closeContextMenu}
        onOpen={() => {
          if (contextMenu.file) {
            onFileDoubleClick(contextMenu.file.id);
          }
        }}
        onPreview={() => {
          if (contextMenu.file && contextMenu.file.type === 'file') {
            onPreview(contextMenu.file);
          }
        }}
        onCopy={() => {
          if (contextMenu.file) onCopy(contextMenu.file);
        }}
        onCut={() => {
          if (contextMenu.file) onCut(contextMenu.file);
        }}
        onPaste={onPaste}
        onDelete={() => {
          if (contextMenu.file) onDelete(contextMenu.file);
        }}
        onRename={() => {
          if (contextMenu.file) onRename(contextMenu.file);
        }}
        onCreateFolder={onCreateFolder}
      />
    </div>
  );
}
