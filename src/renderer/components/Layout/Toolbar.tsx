import { ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ChangeEvent } from 'react';

interface ToolbarProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  selectedCount: number;
  isSmartFolderView?: boolean;
  smartFolderName?: string;
}

export default function Toolbar({
  currentPath,
  onPathChange,
  selectedCount,
  isSmartFolderView = false,
  smartFolderName,
}: ToolbarProps) {
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
    }
  };

  const displayPath =
    isSmartFolderView && smartFolderName ? `Smart Folder: ${smartFolderName}` : currentPath;

  return (
    <header className="h-12 bg-bg-secondary border-b border-border flex items-center px-4 gap-2">
      <div className="flex items-center gap-1">
        <Button variant="icon" onClick={handleBack} disabled={currentPath === '/'}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="icon" disabled>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="icon" onClick={handleBack} disabled={currentPath === '/'}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          variant="icon"
          onClick={() => {
            const path = window.location.pathname.replace('/home/shreyanshxyz/Dev/neon', '');
            onPathChange(path || '/');
          }}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 mx-4">
        {isSmartFolderView ? (
          <div className="w-full px-3 py-2 bg-accent-primary/10 border border-accent-primary/30 rounded text-text-primary text-sm font-medium">
            {displayPath}
          </div>
        ) : (
          <Input
            value={displayPath}
            onChange={handlePathChange}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="icon">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="ml-4 px-2 py-1 bg-accent-primary/20 rounded text-xs text-accent-primary">
          {selectedCount} selected
        </div>
      )}
    </header>
  );
}
