import { ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Search, Grid3X3, List } from 'lucide-react';
import { ChangeEvent, useState } from 'react';

interface ToolbarProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  selectedCount: number;
  isSmartFolderView?: boolean;
  smartFolderName?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export default function Toolbar({
  currentPath,
  onPathChange,
  selectedCount,
  isSmartFolderView = false,
  smartFolderName,
  viewMode = 'list',
  onViewModeChange,
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

  const displayPath =
    isSmartFolderView && smartFolderName ? `smartfolder://${smartFolderName}` : currentPath;

  return (
    <header className="h-12 bg-terminal-surface border-b border-terminal-border flex items-center px-4 gap-3">
      <span className="font-terminal text-terminal-green text-lg select-none">λ</span>

      <div className="flex items-center gap-1">
        <button
          onClick={handleBack}
          disabled={currentPath === '/'}
          className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-elevated rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button disabled className="p-2 text-terminal-muted opacity-30 cursor-not-allowed">
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={handleBack}
          disabled={currentPath === '/'}
          className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-elevated rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 mx-2">
        {isSmartFolderView ? (
          <div className="w-full px-3 py-1.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green text-sm font-terminal">
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
                className="w-full px-3 py-1.5 bg-terminal-bg border border-terminal-green/50 rounded text-terminal-text text-sm font-terminal focus:outline-none focus:ring-1 focus:ring-terminal-green/50"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-3 py-1.5 bg-terminal-bg border border-terminal-border rounded text-terminal-text text-sm font-terminal text-left hover:border-terminal-green/30 transition-all duration-0"
              >
                <span className="text-terminal-muted">~</span>
                <span className="ml-1">
                  {displayPath.replace(process.env.HOME || '', '') || '/'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {onViewModeChange && (
        <div className="flex items-center gap-1 bg-terminal-bg rounded border border-terminal-border p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-terminal-elevated text-terminal-green' : 'text-terminal-muted hover:text-terminal-text'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-terminal-elevated text-terminal-green' : 'text-terminal-muted hover:text-terminal-text'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            const path = window.location.pathname.replace('/home/shreyanshxyz/Dev/neon', '');
            onPathChange(path || '/');
          }}
          className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-elevated rounded"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-elevated rounded">
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
