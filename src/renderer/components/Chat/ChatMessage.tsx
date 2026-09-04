import { Copy } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-accent-primary text-white'
            : 'bg-bg-tertiary text-text-primary border border-border'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {content || (isStreaming ? '…' : '')}
          </div>
          {!isUser && content && (
            <button
              onClick={handleCopy}
              className="text-text-muted hover:text-text-primary transition-colors"
              title="Copy"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
        {timestamp && (
          <div className="mt-1 text-[10px] text-text-muted/70 text-right">
            {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
