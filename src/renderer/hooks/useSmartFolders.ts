import { useState, useCallback, useEffect } from 'react';

export interface ParsedQuery {
  keywords: string[];
  fileTypes?: string[];
  dateRange?: { start: string; end: string };
  sizeRange?: { min?: number; max?: number };
  namePattern?: string;
  contentQuery?: string;
}

export interface SmartFolder {
  id: string;
  name: string;
  query: string;
  parsedQuery: ParsedQuery;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  file: {
    path: string;
    name: string;
    extension: string;
    content: string;
    preview: string;
    modified: Date;
    size: number;
  };
  score: number;
  matches: {
    name?: boolean;
    content?: string[];
    path?: boolean;
  };
}

export function useSmartFolders() {
  const [folders, setFolders] = useState<SmartFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await window.smartFolders.getAll();

      if (response.success && response.folders) {
        setFolders(response.folders);
        setCount(response.folders.length);
      } else {
        setError(response.error || 'Failed to load smart folders');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load smart folders';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(
    async (
      name: string,
      query: string,
      parsedQuery: ParsedQuery,
      icon?: string,
      color?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await window.smartFolders.create({
          name,
          query,
          parsedQuery,
          icon,
          color,
        });

        if (response.success && response.folder) {
          setFolders((prev) => [...prev, response.folder!]);
          setCount((prev) => prev + 1);
          return { success: true, folder: response.folder };
        } else {
          setError(response.error || 'Failed to create smart folder');
          return { success: false, error: response.error };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create smart folder';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateFolder = useCallback(async (id: string, updates: Partial<SmartFolder>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await window.smartFolders.update(id, updates);

      if (response.success && response.folder) {
        setFolders((prev) => prev.map((f) => (f.id === id ? response.folder! : f)));
        return { success: true, folder: response.folder };
      } else {
        setError(response.error || 'Failed to update smart folder');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update smart folder';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await window.smartFolders.delete(id);

      if (response.success) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setCount((prev) => Math.max(0, prev - 1));
        return { success: true };
      } else {
        setError(response.error || 'Failed to delete smart folder');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete smart folder';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const executeFolder = useCallback(
    async (id: string): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await window.smartFolders.execute(id);

        if (response.success && response.results) {
          return { success: true, results: response.results };
        } else {
          const errorMsg = response.error || 'Failed to execute smart folder';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute smart folder';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshCount = useCallback(async () => {
    try {
      const response = await window.smartFolders.getCount();
      if (response.success && response.count !== undefined) {
        setCount(response.count);
      }
    } catch (err) {
      console.error('Failed to refresh count:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    folders,
    loading,
    error,
    count,
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    executeFolder,
    refreshCount,
    clearError,
  };
}

export default useSmartFolders;
