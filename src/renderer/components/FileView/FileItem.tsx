import {
  Folder,
  FileArchive,
  FileText,
  Image,
  Music,
  Video,
  File,
  FileCode,
  FileJson,
  FileType,
  Globe,
} from 'lucide-react';
import { FileItem as FileItemType } from '../../hooks/useFileSystem';
import { clsx } from 'clsx';
import { useState } from 'react';

interface FileItemProps {
  file: FileItemType;
  selected?: boolean;
  viewMode?: 'grid' | 'list';
  onClick: (isCtrlClick: boolean) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
}

const getIcon = (file: FileItemType, size: 'sm' | 'lg' = 'sm') => {
  const sizeClass = size === 'lg' ? 'w-12 h-12' : 'w-5 h-5';

  if (file.type === 'folder') return <Folder className={`${sizeClass} text-terminal-blue`} />;

  switch (file.icon) {
    case 'archive':
      return <FileArchive className={`${sizeClass} text-terminal-amber`} />;
    case 'text':
      return <FileText className={`${sizeClass} text-terminal-text`} />;
    case 'image':
      return <Image className={`${sizeClass} text-terminal-purple`} />;
    case 'audio':
      return <Music className={`${sizeClass} text-terminal-cyan`} />;
    case 'video':
      return <Video className={`${sizeClass} text-terminal-red`} />;
    case 'code':
      return <FileCode className={`${sizeClass} text-terminal-green`} />;
    case 'web':
      return <Globe className={`${sizeClass} text-terminal-blue`} />;
    case 'data':
      return <FileJson className={`${sizeClass} text-terminal-amber`} />;
    case 'document':
      return <FileType className={`${sizeClass} text-terminal-blue`} />;
    case 'pdf':
      return <FileText className={`${sizeClass} text-terminal-red`} />;
    default:
      return <File className={`${sizeClass} text-terminal-muted`} />;
  }
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function FileItem({
  file,
  selected,
  viewMode = 'list',
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDropTarget,
}: FileItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    const isCtrlClick = e.ctrlKey || e.metaKey;
    onClick(isCtrlClick);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.setData('application/json', JSON.stringify(file));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (file.type === 'folder') {
      setIsDragOver(true);
      if (onDragOver) {
        onDragOver(e);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDragLeave) {
      onDragLeave(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDrop && file.type === 'folder') {
      onDrop(e);
    }
  };

  if (viewMode === 'grid') {
    return (
      <div
        draggable={true}
        className={clsx(
          'terminal-grid-item',
          selected && 'selected',
          isDragging && 'opacity-50',
          (isDragOver || isDropTarget) && 'ring-2 ring-terminal-green'
        )}
        onClick={handleClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {getIcon(file, 'lg')}
        <span className="mt-2 text-xs text-center text-terminal-text truncate w-full font-terminal">
          {file.name}
        </span>
        <span className="text-[10px] text-terminal-muted mt-0.5">{formatSize(file.size)}</span>
      </div>
    );
  }

  return (
    <div
      draggable={true}
      className={clsx(
        'terminal-list-item border-b border-terminal-border/30',
        selected && 'selected',
        isDragging && 'opacity-50',
        (isDragOver || isDropTarget) && 'bg-terminal-elevated/70'
      )}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getIcon(file, 'sm')}
        <span className="text-sm truncate text-terminal-text">{file.name}</span>
      </div>
      <div className="w-24 text-right text-sm text-terminal-muted font-terminal">
        {formatSize(file.size)}
      </div>
      <div className="w-40 text-right text-sm text-terminal-muted font-terminal">
        {formatDate(file.modified)}
      </div>
    </div>
  );
}
