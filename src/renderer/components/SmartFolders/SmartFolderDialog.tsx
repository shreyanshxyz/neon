import { useState, useEffect } from 'react';
import { X, Search, AlertCircle } from 'lucide-react';
import { SmartFolder, ParsedQuery } from '../../hooks/useSmartFolders';

interface SmartFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, query: string, parsedQuery: ParsedQuery) => void;
  folder?: SmartFolder | null;
  title: string;
  existingFolders?: SmartFolder[];
}

export default function SmartFolderDialog({
  isOpen,
  onClose,
  onSave,
  folder,
  title,
  existingFolders = [],
}: SmartFolderDialogProps) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setQuery(folder.query);
      setParsedQuery(folder.parsedQuery);
    } else {
      setName('');
      setQuery('');
      setParsedQuery(null);
    }
    setError(null);
  }, [folder, isOpen]);

  useEffect(() => {
    if (query.trim()) {
      setIsValidating(true);
      const timeoutId = setTimeout(async () => {
        try {
          const response = await window.search.query(query);
          if (response.success && response.parsedQuery) {
            setParsedQuery(response.parsedQuery);
            setError(null);
          }
        } catch (err) {
          console.error('Failed to parse query:', err);
        } finally {
          setIsValidating(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setParsedQuery(null);
      setIsValidating(false);
    }
  }, [query]);

  const validate = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }

    if (name.trim().length < 1) {
      setError('Name must be at least 1 character');
      return false;
    }

    if (!query.trim()) {
      setError('Query is required');
      return false;
    }

    if (!parsedQuery || parsedQuery.keywords.length === 0) {
      setError('Query must contain at least one keyword');
      return false;
    }

    const normalizedName = name.trim().toLowerCase();
    const duplicate = existingFolders.find(
      (f) => f.name.toLowerCase() === normalizedName && f.id !== folder?.id
    );
    if (duplicate) {
      setError(`A smart folder named "${name}" already exists`);
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (validate() && parsedQuery) {
      onSave(name.trim(), query.trim(), parsedQuery);
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setQuery('');
    setParsedQuery(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg p-6 w-[500px] max-w-[90vw] border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-bg-hover rounded transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Recent JavaScript Files"
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Query</label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., javascript files from last week"
                className="w-full px-3 py-2 pl-10 bg-bg-primary border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Try: file types, dates, sizes, names, or content
            </p>
          </div>

          {parsedQuery && (
            <div className="p-3 bg-bg-tertiary/50 rounded">
              <div className="text-xs text-text-muted mb-2">Parsed Query:</div>
              <div className="flex flex-wrap gap-1">
                {parsedQuery.keywords.length > 0 && (
                  <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded text-xs">
                    keywords: {parsedQuery.keywords.join(', ')}
                  </span>
                )}
                {parsedQuery.fileTypes && parsedQuery.fileTypes.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                    types: {parsedQuery.fileTypes.join(', ')}
                  </span>
                )}
                {parsedQuery.dateRange && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                    date filter
                  </span>
                )}
                {parsedQuery.sizeRange && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                    size filter
                  </span>
                )}
                {parsedQuery.namePattern && (
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                    name: {parsedQuery.namePattern}
                  </span>
                )}
                {parsedQuery.contentQuery && (
                  <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded text-xs">
                    content: "{parsedQuery.contentQuery}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isValidating || !parsedQuery}
            className="px-4 py-2 text-sm bg-accent-primary text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? 'Validating...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
