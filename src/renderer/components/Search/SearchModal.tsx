import { useState, useEffect, useCallback, useRef } from 'react';
import { FileItem } from '../../hooks/useFileSystem';
import { useSearch } from '../../hooks/useSearch';
import { Search, X, Folder, File, Loader2, Sparkles, Filter } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  files: FileItem[];
  currentPath: string;
  onClose: () => void;
  onFileSelect: (file: FileItem) => void;
  onNavigateToFolder: (folderPath: string) => void;
}

export default function SearchModal({
  isOpen,
  files,
  currentPath,
  onClose,
  onFileSelect,
  onNavigateToFolder,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    results,
    isSearching,
    isAiSearching,
    isIndexing,
    indexedCount,
    parsedQuery,
    aiParsedQuery,
    error,
    search,
    indexDirectory,
    getSuggestions,
    clearSearch,
    searchMode,
    setSearchMode,
  } = useSearch();

  useEffect(() => {
    if (isOpen && currentPath) {
      indexDirectory(currentPath);
    }
  }, [isOpen, currentPath, indexDirectory]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        clearSearch();
      }
      setSelectedIndex(0);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search, clearSearch]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      clearSearch();
      setSearchMode('standard');
    }
  }, [isOpen, clearSearch, setSearchMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (results.length === 0 && !isSearching) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedResult = results[selectedIndex];
        if (selectedResult) {
          const fileItem: FileItem = {
            id: selectedResult.file.path,
            name: selectedResult.file.name,
            type: selectedResult.file.extension === '' ? 'folder' : 'file',
            path: selectedResult.file.path,
            size: selectedResult.file.size,
            modified: selectedResult.file.modified,
            icon: getFileIcon(selectedResult.file.name, selectedResult.file.extension === ''),
            extension: selectedResult.file.extension,
            hidden: selectedResult.file.name.startsWith('.'),
          };

          if (fileItem.type === 'folder') {
            onNavigateToFolder(fileItem.path);
          } else {
            onFileSelect(fileItem);
          }
          onClose();
        }
      }
    },
    [results, selectedIndex, onClose, onFileSelect, onNavigateToFolder, isSearching]
  );

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20">
      <div className="bg-bg-secondary rounded-lg shadow-2xl w-[700px] max-w-[90vw] border border-border overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search files... (e.g., 'javascript files from last week')"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-lg"
          />
          {(isSearching || isAiSearching) && (
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          )}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                clearSearch();
              }}
              className="p-1 hover:bg-bg-hover rounded transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            ESC
          </button>
          <button
            onClick={() => setSearchMode(searchMode === 'standard' ? 'ai' : 'standard')}
            className="px-2 py-1 text-xs border border-border rounded text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center gap-1"
            title="Toggle search mode"
          >
            <Filter className="w-3 h-3" />
            {searchMode === 'standard' ? 'Standard' : 'AI'}
          </button>
        </div>

        {isIndexing && (
          <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-xs text-blue-400">
              Indexing directory... {indexedCount} files indexed
            </span>
          </div>
        )}

        {searchMode === 'standard' && parsedQuery && query.trim() && (
          <div className="px-4 py-2 bg-bg-tertiary/50 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-text-muted">Parsed:</span>
              {parsedQuery.keywords.length > 0 && (
                <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                  keywords: {parsedQuery.keywords.join(', ')}
                </span>
              )}
              {parsedQuery.fileTypes && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  types: {parsedQuery.fileTypes.join(', ')}
                </span>
              )}
              {parsedQuery.dateRange && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                  date range
                </span>
              )}
              {parsedQuery.sizeRange && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                  size filter
                </span>
              )}
              {parsedQuery.namePattern && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                  name: {parsedQuery.namePattern}
                </span>
              )}
              {parsedQuery.contentQuery && (
                <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded">
                  content: "{parsedQuery.contentQuery}"
                </span>
              )}
            </div>
          </div>
        )}

        {searchMode === 'ai' && query.trim() && (
          <div className="px-4 py-2 bg-bg-tertiary/50 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-text-muted">AI interpreted:</span>
              {isAiSearching && (
                <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                  thinking...
                </span>
              )}
              {aiParsedQuery?.keywords?.length ? (
                <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                  keywords: {aiParsedQuery.keywords.join(', ')}
                </span>
              ) : null}
              {aiParsedQuery?.fileTypes && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  types: {aiParsedQuery.fileTypes.join(', ')}
                </span>
              )}
              {aiParsedQuery?.dateRange && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                  date range
                </span>
              )}
              {aiParsedQuery?.sizeRange && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                  size filter
                </span>
              )}
              {aiParsedQuery?.namePattern && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                  name: {aiParsedQuery.namePattern}
                </span>
              )}
              {aiParsedQuery?.contentQuery && (
                <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded">
                  content: "{aiParsedQuery.contentQuery}"
                </span>
              )}
            </div>
          </div>
        )}
        {showSuggestions && !query.trim() && (
          <div className="px-4 py-3 bg-bg-tertiary/30 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted">Try these examples:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'javascript files from last week',
                'images larger than 1MB',
                'files named main',
                'documents from 2024',
                'files containing "TODO"',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleSuggestionClick(example)}
                  className="px-3 py-1.5 text-xs bg-bg-primary hover:bg-bg-hover text-text-secondary rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-text-muted">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-1">Type to search files</p>
              <p className="text-xs opacity-60">Search by name, content, type, date, or size</p>
            </div>
          ) : isSearching ? (
            <div className="p-8 text-center text-text-muted">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="text-sm">No files found</p>
              <p className="text-xs mt-2 opacity-60">
                Try a different search term or check your spelling
              </p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-text-muted flex items-center justify-between">
                <span>
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
                <span className="text-text-muted/60">{indexedCount} files indexed</span>
              </div>
              {results.map((result, index) => (
                <div
                  key={result.file.path}
                  className={`flex items-start gap-3 px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-accent-primary/30' : 'hover:bg-bg-hover'
                  }`}
                  onClick={() => {
                    const fileItem: FileItem = {
                      id: result.file.path,
                      name: result.file.name,
                      type: result.file.extension === '' ? 'folder' : 'file',
                      path: result.file.path,
                      size: result.file.size,
                      modified: result.file.modified,
                      icon: getFileIcon(result.file.name, result.file.extension === ''),
                      extension: result.file.extension,
                      hidden: result.file.name.startsWith('.'),
                    };

                    if (fileItem.type === 'folder') {
                      onNavigateToFolder(fileItem.path);
                    } else {
                      onFileSelect(fileItem);
                    }
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {result.file.extension === '' ? (
                    <Folder className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  ) : (
                    <File className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary truncate">
                        {highlightMatch(result.file.name, query)}
                      </span>
                      {result.score > 50 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                          {Math.round(result.score)}% match
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted">
                      {result.file.extension === '' ? 'Folder' : result.file.extension || 'File'} •{' '}
                      {formatSize(result.file.size)} • {result.file.modified.toLocaleDateString()}
                    </div>
                    {result.matches.content && result.matches.content.length > 0 && (
                      <div className="mt-1 text-xs text-text-muted bg-bg-primary/50 rounded px-2 py-1">
                        <div className="font-medium mb-0.5">Content matches:</div>
                        {result.matches.content.slice(0, 2).map((match, i) => (
                          <div key={i} className="truncate text-text-secondary">
                            {highlightMatch(match.slice(0, 100), query)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-bg-tertiary/50 border-t border-border text-xs text-text-muted flex items-center gap-4">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}

function getFileIcon(name: string, isDirectory: boolean): string {
  if (isDirectory) return 'folder';

  const parts = name.split('.');
  const ext = parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
  const iconMap: Record<string, string> = {
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    mp3: 'audio',
    wav: 'audio',
    mp4: 'video',
    pdf: 'pdf',
    doc: 'document',
    docx: 'document',
    txt: 'text',
    zip: 'archive',
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    py: 'code',
    java: 'code',
    html: 'web',
    css: 'web',
    json: 'data',
  };

  return iconMap[ext] || 'file';
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-accent-primary/50 text-text-primary">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
