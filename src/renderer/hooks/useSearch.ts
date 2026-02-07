import { useState, useCallback, useEffect } from 'react';

interface SearchFileIndex {
  path: string;
  name: string;
  extension: string;
  content: string;
  preview: string;
  modified: Date;
  size: number;
}

interface SearchResult {
  file: SearchFileIndex;
  score: number;
  matches: {
    name?: boolean;
    content?: string[];
    path?: boolean;
  };
}

interface ParsedQuery {
  keywords: string[];
  fileTypes?: string[];
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min?: number; max?: number };
  namePattern?: string;
  contentQuery?: string;
}

interface SearchStatus {
  isIndexing: boolean;
  indexedCount: number;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  const [lastQuery, setLastQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get initial status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await window.search.getStatus();
        setIsIndexing(status.isIndexing);
        setIndexedCount(status.indexedCount);
      } catch (err) {
        console.error('Failed to get search status:', err);
      }
    };
    checkStatus();
  }, []);

  const indexDirectory = useCallback(async (path: string) => {
    setIsIndexing(true);
    setError(null);

    try {
      const response = await window.search.indexDirectory(path);

      if (response.success) {
        setIndexedCount(response.indexedCount || 0);
        setIsIndexing(false);
        return { success: true, indexedCount: response.indexedCount };
      } else {
        setError(response.error || 'Failed to index directory');
        setIsIndexing(false);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to index directory';
      setError(errorMsg);
      setIsIndexing(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setParsedQuery(null);
      return { success: true, results: [] };
    }

    setIsSearching(true);
    setError(null);
    setLastQuery(query);

    try {
      const response = await window.search.query(query);

      if (response.success && response.results) {
        setResults(response.results);
        setParsedQuery(response.parsedQuery || null);
        setIsSearching(false);
        return { success: true, results: response.results };
      } else {
        const errorMsg = response.error || 'Search failed';
        setError(errorMsg);
        setResults([]);
        setIsSearching(false);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed';
      setError(errorMsg);
      setResults([]);
      setIsSearching(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const getSuggestions = useCallback(async (partial: string) => {
    try {
      const response = await window.search.getSuggestions(partial);
      return response.suggestions;
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setLastQuery('');
    setParsedQuery(null);
    setError(null);
  }, []);

  const clearIndex = useCallback(async () => {
    try {
      await window.search.clear();
      setIndexedCount(0);
      setResults([]);
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear index';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await window.search.getStatus();
      setIsIndexing(status.isIndexing);
      setIndexedCount(status.indexedCount);
    } catch (err) {
      console.error('Failed to refresh search status:', err);
    }
  }, []);

  return {
    // State
    results,
    isSearching,
    isIndexing,
    indexedCount,
    lastQuery,
    parsedQuery,
    error,

    // Actions
    indexDirectory,
    search,
    getSuggestions,
    clearSearch,
    clearIndex,
    refreshStatus,
  };
}

export default useSearch;
