import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';
import { FileItem } from '../../hooks/useFileSystem';
import { useOllama } from '../../hooks/useOllama';
import ChatMessage from './ChatMessage';
import FileMention from './FileMention';

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface LLMChatPanelProps {
  selectedFiles: FileItem[];
  currentPath: string;
}

interface FileContext {
  path: string;
  name: string;
  content?: string;
  size?: number;
  modified?: string;
}

export default function LLMChatPanel({ selectedFiles, currentPath }: LLMChatPanelProps) {
  const {
    isAvailable,
    models,
    selectedModel,
    setSelectedModel,
    isLoading,
    error,
    checkConnection,
    streamMessage,
  } = useOllama();

  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return selectedFiles;
    return selectedFiles.filter((file) =>
      file.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [selectedFiles, mentionQuery]);

  const clearChat = () => setMessages([]);

  const updateMentionState = (value: string) => {
    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) {
      setShowMentions(false);
      setMentionQuery('');
      return;
    }

    const afterAt = value.slice(lastAt + 1);
    if (afterAt.includes(' ')) {
      setShowMentions(false);
      setMentionQuery('');
      return;
    }

    setShowMentions(true);
    setMentionQuery(afterAt);
  };

  const handleMentionSelect = (file: FileItem) => {
    const lastAt = input.lastIndexOf('@');
    if (lastAt === -1) return;

    const nextValue = `${input.slice(0, lastAt)}@${file.name} `;
    setInput(nextValue);
    setShowMentions(false);
    setMentionQuery('');
  };

  const buildFileContext = async (file: FileItem): Promise<FileContext> => {
    try {
      const result = await window.filesystem.readFile(file.path);
      const content = result.isBinary || result.error ? undefined : result.content || undefined;

      return {
        path: file.path,
        name: file.name,
        content,
        size: file.size,
        modified: file.modified?.toISOString?.() || String(file.modified),
      };
    } catch (error) {
      return {
        path: file.path,
        name: file.name,
        size: file.size,
        modified: file.modified?.toISOString?.() || String(file.modified),
      };
    }
  };

  const resolveContexts = async (): Promise<FileContext | undefined> => {
    const mentions = extractMentions(input, selectedFiles);
    const filesToUse = mentions.length > 0 ? mentions : selectedFiles.slice(0, 5);

    if (filesToUse.length === 0) return undefined;

    const contexts = await Promise.all(filesToUse.map(buildFileContext));
    const content = contexts
      .map(
        (ctx) =>
          `File: ${ctx.name}\nPath: ${ctx.path}\nSize: ${ctx.size ?? 'unknown'}\nModified: ${
            ctx.modified ?? 'unknown'
          }\nContent:\n${ctx.content ?? '[no text content]'}\n`
      )
      .join('\n');

    return {
      path: currentPath,
      name: 'context',
      content,
    };
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatEntry = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const assistantMessage: ChatEntry = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setShowMentions(false);

    try {
      const context = await resolveContexts();

      const conversationHistory = messages
        .filter((msg) => msg.id !== assistantMessage.id && msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const { cleanup } = await streamMessage(
        trimmed,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + chunk, isStreaming: true }
                : msg
            )
          );
        },
        context,
        conversationHistory
      );

      streamCleanupRef.current = cleanup;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg))
      );

      streamCleanupRef.current = null;
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: msg.content || 'Sorry, the AI response failed.',
                isStreaming: false,
              }
            : msg
        )
      );
      streamCleanupRef.current = null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="text-sm text-text-primary">Ollama Chat</div>
        <div className="flex items-center gap-2">
          {models.length > 1 && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs bg-bg-primary border border-border rounded px-2 py-1 text-text-primary"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={clearChat}
            className="text-xs px-2 py-1 rounded bg-bg-hover text-text-muted hover:text-text-primary"
          >
            Clear
          </button>
        </div>
      </div>

      {!isAvailable && (
        <div className="px-3 py-2 text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          Ollama not available. Start it on `localhost:11434`.
          <button
            onClick={checkConnection}
            className="ml-auto text-xs flex items-center gap-1 text-amber-300 hover:text-amber-200"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
          {error}
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted text-sm mt-6 space-y-2">
            <p>Ask about files, summaries, or code insights.</p>
            <div className="text-xs">
              Try: "Summarize the selected files" or "What does @config.json do?"
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              isStreaming={message.isStreaming}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              updateMentionState(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              isAvailable ? 'Ask something... Use @ to mention selected files' : 'Ollama is offline'
            }
            className="w-full min-h-[64px] max-h-32 resize-none bg-bg-primary border border-border rounded p-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={!isAvailable}
          />
          {showMentions && <FileMention files={filteredMentions} onSelect={handleMentionSelect} />}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-text-muted">
            {selectedFiles.length > 0
              ? `Selected files: ${selectedFiles.length}`
              : 'No files selected'}
          </div>
          <button
            onClick={sendMessage}
            disabled={!isAvailable || isLoading || !input.trim()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-accent-primary text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3 h-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function extractMentions(input: string, files: FileItem[]): FileItem[] {
  const mentionMatches = Array.from(input.matchAll(/@([^\s]+)/g)).map((match) => match[1]);
  if (mentionMatches.length === 0) return [];

  const byName = new Map<string, FileItem>();
  const byPath = new Map<string, FileItem>();

  files.forEach((file) => {
    byName.set(file.name.toLowerCase(), file);
    const basename = file.path.split('/').pop()?.toLowerCase();
    if (basename && basename !== file.name.toLowerCase()) {
      byName.set(basename, file);
    }
    byPath.set(file.path.toLowerCase(), file);
  });

  return mentionMatches
    .map((mention) => {
      const lowerMention = mention.toLowerCase();
      return byName.get(lowerMention) || byPath.get(lowerMention);
    })
    .filter((file): file is FileItem => Boolean(file));
}
