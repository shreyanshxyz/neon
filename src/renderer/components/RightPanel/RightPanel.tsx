import { FileItem } from '../../hooks/useFileSystem';
import FilePreview from '../FileView/FilePreview';
import LLMChatPanel from '../Chat/LLMChatPanel';
import PluginManager from '../Plugins/PluginManager';

interface RightPanelProps {
  tab: 'preview' | 'chat' | 'plugins';
  onTabChange: (tab: 'preview' | 'chat' | 'plugins') => void;
  file: FileItem | null;
  selectedFiles: FileItem[];
  currentPath: string;
  readFileContent: (path: string) => Promise<{
    content: string | null;
    isBinary: boolean;
    size: number;
    error: string | null;
  }>;
}

export default function RightPanel({
  tab,
  onTabChange,
  file,
  selectedFiles,
  currentPath,
  readFileContent,
}: RightPanelProps) {
  return (
    <div className="w-96 bg-bg-secondary border-l border-border flex flex-col shrink-0">
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <button
          onClick={() => onTabChange('preview')}
          className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
            tab === 'preview'
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => onTabChange('chat')}
          className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
            tab === 'chat'
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => onTabChange('plugins')}
          className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
            tab === 'plugins'
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          Plugins
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'preview' ? (
          file ? (
            <FilePreview
              file={file}
              isOpen={true}
              onClose={undefined}
              readFileContent={readFileContent}
              showClose={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Select a file to preview
            </div>
          )
        ) : tab === 'chat' ? (
          <LLMChatPanel selectedFiles={selectedFiles} currentPath={currentPath} />
        ) : (
          <PluginManager />
        )}
      </div>
    </div>
  );
}
