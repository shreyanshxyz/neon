import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Search,
  Grid3X3,
  List,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import { ChangeEvent, useState } from 'react';

interface ToolbarProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  selectedCount: number;
  isSmartFolderView?: boolean;
  smartFolderName?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  rightPanelVisible: boolean;
  onToggleRightPanel: () => void;
  onOpenSearch?: () => void;
}

export default function Toolbar({
  currentPath,
  onPathChange,
  selectedCount,
  isSmartFolderView = false,
  smartFolderName,
  viewMode = 'list',
  onViewModeChange,
  sidebarVisible,
  onToggleSidebar,
  rightPanelVisible,
  onToggleRightPanel,
  onOpenSearch,
}: ToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    onPathChange('/' + parts.join('/') || '/');
  };

  const handlePathChange = (e: ChangeEvent<HTMLInputElement>) => {
    onPathChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onPathChange((e.target as HTMLInputElement).value);
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const displayPath = isSmartFolderView && smartFolderName ? smartFolderName : currentPath;

  return (
    <header className="toolbar">
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleBack}
          disabled={currentPath === '/'}
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button disabled className="btn-icon opacity-30 cursor-not-allowed">
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={handleBack}
          disabled={currentPath === '/'}
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 mx-2">
        {isSmartFolderView ? (
          <div className="w-full px-3 py-1.5 bg-accent-muted border border-accent/30 rounded text-accent text-sm font-medium">
            {displayPath}
          </div>
        ) : (
          <div className="relative flex items-center">
            {isEditing ? (
              <input
                value={displayPath}
                onChange={handlePathChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsEditing(false)}
                className="input w-full font-mono text-sm"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-3 py-1.5 bg-bg-primary border border-border rounded text-sm text-left hover:border-accent/50 transition-colors"
              >
                <span className="text-text-muted font-mono">
                  {displayPath.replace(process.env.HOME || '', '') || '/'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* View mode toggle */}
      {onViewModeChange && (
        <div className="flex items-center gap-0.5 bg-bg-primary rounded border border-border p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-bg-tertiary text-accent' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-bg-tertiary text-accent' : 'text-text-muted hover:text-text-primary'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleSidebar}
          className={`btn-icon ${sidebarVisible ? 'text-accent' : 'text-text-muted'}`}
          title="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleRightPanel}
          className={`btn-icon ${rightPanelVisible ? 'text-accent' : 'text-text-muted'}`}
          title="Toggle preview panel"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <button onClick={() => onPathChange(currentPath)} className="btn-icon" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={onOpenSearch} className="btn-icon" title="Search">
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
