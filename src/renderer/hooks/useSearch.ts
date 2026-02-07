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
  dateRange?: { start: string; end: string };
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
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  const [lastQuery, setLastQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [aiParsedQuery, setAiParsedQuery] = useState<ParsedQuery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'standard' | 'ai'>('standard');

  useEffect(() => {
    if (searchMode === 'standard') {
      setAiParsedQuery(null);
      setIsAiSearching(false);
    }
  }, [searchMode]);

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
      }

      setError(response.error || 'Failed to index directory');
      setIsIndexing(false);
      return { success: false, error: response.error };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to index directory';
      setError(errorMsg);
      setIsIndexing(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setParsedQuery(null);
        setAiParsedQuery(null);
        return { success: true, results: [] };
      }

      setIsSearching(true);
      setError(null);
      setLastQuery(query);

      try {
        if (searchMode === 'ai' && !window.ollama) {
          setError('Ollama is not available. Using standard search instead.');
        }

        if (searchMode === 'ai' && window.ollama) {
          setIsAiSearching(true);

          const [standardResponse, aiParsed] = await Promise.all([
            window.search.query(query),
            window.ollama.generateSearch({ query }),
          ]);

          const standardResults =
            standardResponse.success && standardResponse.results ? standardResponse.results : [];

          setParsedQuery(standardResponse.parsedQuery || null);

          if (!aiParsed.success || !aiParsed.parsedQuery) {
            const errorMsg = aiParsed.error || 'AI search failed';
            setError(errorMsg);
            setResults(standardResults);
            setIsSearching(false);
            setIsAiSearching(false);
            return { success: false, error: errorMsg, results: standardResults };
          }

          const aiResponse = await window.search.queryParsed(aiParsed.parsedQuery);
          const aiResults = aiResponse.success && aiResponse.results ? aiResponse.results : [];
          const mergedResults = mergeResults(standardResults, aiResults);

          setResults(mergedResults);
          setAiParsedQuery(aiParsed.parsedQuery);
          setIsSearching(false);
          setIsAiSearching(false);
          return { success: true, results: mergedResults };
        }

        const response = await window.search.query(query);

        if (response.success && response.results) {
          setResults(response.results);
          setParsedQuery(response.parsedQuery || null);
          setIsSearching(false);
          return { success: true, results: response.results };
        }

        const errorMsg = response.error || 'Search failed';
        setError(errorMsg);
        setResults([]);
        setIsSearching(false);
        return { success: false, error: errorMsg };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Search failed';
        setError(errorMsg);
        setResults([]);
        setIsSearching(false);
        setIsAiSearching(false);
        return { success: false, error: errorMsg };
      }
    },
    [searchMode]
  );

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
    setAiParsedQuery(null);
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
    results,
    isSearching,
    isAiSearching,
    isIndexing,
    indexedCount,
    lastQuery,
    parsedQuery,
    aiParsedQuery,
    error,
    searchMode,
    indexDirectory,
    search,
    getSuggestions,
    clearSearch,
    clearIndex,
    refreshStatus,
    setSearchMode,
  };
}

export default useSearch;

function mergeResults(standardResults: SearchResult[], aiResults: SearchResult[]) {
  const resultMap = new Map<string, SearchResult>();

  for (const result of standardResults) {
    resultMap.set(result.file.path, result);
  }

  for (const result of aiResults) {
    const existing = resultMap.get(result.file.path);
    if (existing) {
      resultMap.set(result.file.path, {
        ...existing,
        score: Math.max(existing.score, result.score) + 5,
      });
    } else {
      resultMap.set(result.file.path, result);
    }
  }

  return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
}
