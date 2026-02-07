import { Search, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { SmartFolder } from '../../hooks/useSmartFolders';
import { useState, useRef, useEffect } from 'react';

interface SmartFoldersPanelProps {
  folders: SmartFolder[];
  currentPath: string;
  onSelect: (folder: SmartFolder) => void;
  onCreate: () => void;
  onEdit: (folder: SmartFolder) => void;
  onDelete: (folder: SmartFolder) => void;
  onRefresh?: (folder: SmartFolder) => void;
  maxFolders?: number;
}

const MAX_FOLDERS_DEFAULT = 50;

export default function SmartFoldersPanel({
  folders,
  currentPath,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
  maxFolders = MAX_FOLDERS_DEFAULT,
}: SmartFoldersPanelProps) {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    folder: SmartFolder | null;
  }>({ visible: false, x: 0, y: 0, folder: null });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, folder: null });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const handleContextMenu = (e: React.MouseEvent, folder: SmartFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      folder,
    });
  };

  const isActive = (folder: SmartFolder) => {
    return currentPath === `smartfolder://${folder.id}`;
  };

  return (
    <div className="px-3 flex flex-col gap-1 mb-4">
      <div className="flex items-center justify-between mb-1 px-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Smart Folders
        </h3>
        <button
          onClick={onCreate}
          disabled={folders.length >= maxFolders}
          className="h-6 w-6 p-1 hover:bg-bg-hover rounded transition-colors disabled:opacity-50"
          title={
            folders.length >= maxFolders
              ? `Maximum ${maxFolders} folders reached`
              : 'Create new smart folder'
          }
        >
          <Plus className="w-3 h-3 text-text-muted" />
        </button>
      </div>

      {folders.length > 0 ? (
        folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onSelect(folder)}
            onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, folder)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left justify-start ${
              isActive(folder)
                ? 'bg-accent-primary/20 text-text-primary hover:bg-accent-primary/20'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <span className="text-text-muted">
              <Search className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-text-muted">
          No smart folders yet. Click + to create one.
        </div>
      )}

      {folders.length > 0 && (
        <div className="px-3 py-1 text-[10px] text-text-muted">
          {folders.length} / {maxFolders} folders
        </div>
      )}

      {contextMenu.visible && contextMenu.folder && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] bg-bg-secondary border border-border rounded-lg shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              onEdit(contextMenu.folder!);
              setContextMenu({ visible: false, x: 0, y: 0, folder: null });
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-bg-hover transition-colors text-text-primary"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          {onRefresh && (
            <button
              onClick={() => {
                onRefresh(contextMenu.folder!);
                setContextMenu({ visible: false, x: 0, y: 0, folder: null });
              }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-bg-hover transition-colors text-text-primary"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => {
              onDelete(contextMenu.folder!);
              setContextMenu({ visible: false, x: 0, y: 0, folder: null });
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-bg-hover transition-colors text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
