import { useEffect, useRef } from 'react';
import { FileItem } from '../../hooks/useFileSystem';
import { FileText, Copy, Scissors, Clipboard, Trash2, Edit3, FolderPlus, Eye } from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  file: FileItem | null;
  hasClipboard: boolean;
  onClose: () => void;
  onOpen: () => void;
  onPreview: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onRename: () => void;
  onCreateFolder: () => void;
}

export default function ContextMenu({
  isOpen,
  position,
  file,
  hasClipboard,
  onClose,
  onOpen,
  onPreview,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRename,
  onCreateFolder,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const adjustedX = Math.min(position.x, window.innerWidth - 200);
  const adjustedY = Math.min(position.y, window.innerHeight - 300);

  const menuItems = [
    ...(file
      ? [
          {
            label: 'Open',
            icon: <Eye className="w-4 h-4" />,
            onClick: onOpen,
            shortcut: 'Enter',
          },
          {
            label: 'Preview',
            icon: <FileText className="w-4 h-4" />,
            onClick: onPreview,
            shortcut: 'Space',
          },
          { type: 'separator' as const },
          {
            label: 'Copy',
            icon: <Copy className="w-4 h-4" />,
            onClick: onCopy,
            shortcut: 'Ctrl+C',
          },
          {
            label: 'Cut',
            icon: <Scissors className="w-4 h-4" />,
            onClick: onCut,
            shortcut: 'Ctrl+X',
          },
          { type: 'separator' as const },
          {
            label: 'Rename',
            icon: <Edit3 className="w-4 h-4" />,
            onClick: onRename,
            shortcut: 'F2',
          },
          {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onDelete,
            shortcut: 'Delete',
            danger: true,
          },
        ]
      : []),
    ...(hasClipboard
      ? [
          { type: 'separator' as const },
          {
            label: 'Paste',
            icon: <Clipboard className="w-4 h-4" />,
            onClick: onPaste,
            shortcut: 'Ctrl+V',
          },
        ]
      : []),
    ...(!file
      ? [
          { type: 'separator' as const },
          {
            label: 'New Folder',
            icon: <FolderPlus className="w-4 h-4" />,
            onClick: onCreateFolder,
            shortcut: 'Ctrl+Shift+N',
          },
        ]
      : []),
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-bg-secondary border border-border rounded-lg shadow-xl py-1"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={`sep-${index}`} className="my-1 border-t border-border" />;
        }

        return (
          <button
            key={item.label}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-bg-hover transition-colors ${
              item.danger ? 'text-red-400 hover:text-red-300' : 'text-text-primary'
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-xs text-text-muted">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
