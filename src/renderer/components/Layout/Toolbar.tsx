import { ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ToolbarProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  selectedCount: number;
}

export default function Toolbar({ currentPath, onPathChange, selectedCount }: ToolbarProps) {
  const handleBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    onPathChange('/' + parts.join('/') || '/');
  };

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
        <Button variant="icon" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 mx-4">
        <Input
          value={currentPath}
          onChange={(e) => onPathChange(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="icon">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="icon">
          <MoreHorizontal className="w-4 h-4" />
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
