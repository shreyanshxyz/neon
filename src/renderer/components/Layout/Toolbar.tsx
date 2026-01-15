import { ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Search, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ChangeEvent } from "react";

interface ToolbarProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  selectedCount: number;
}

export default function Toolbar({ currentPath, onPathChange, selectedCount }: ToolbarProps) {
  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    onPathChange("/" + parts.join("/") || "/");
  };

  const handlePathChange = (e: ChangeEvent<HTMLInputElement>) => {
    onPathChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onPathChange((e.target as HTMLInputElement).value);
    }
  };

  return (
    <header className="h-12 bg-bg-secondary border-b border-border flex items-center px-4 gap-2">
      <div className="flex items-center gap-1">
        <Button variant="icon" onClick={handleBack} disabled={currentPath === "/"}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="icon" disabled>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="icon" onClick={handleBack} disabled={currentPath === "/"}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          variant="icon"
          onClick={() => {
            const path = window.location.pathname.replace("/home/shreyanshxyz/Dev/neon", "");
            onPathChange(path || "/");
          }}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 mx-4">
        <Input value={currentPath} onChange={handlePathChange} onKeyDown={handleKeyDown} className="w-full" />
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
