import React, { useState, useEffect, useCallback } from "react";

interface SearchResult {
  path: string;
  name: string;
  snippet?: string;
  mtime: number;
  size: number;
  score?: number;
}

interface GlobalSearchProps {
  onFileOpen: (filePath: string) => void;
}

function GlobalSearch({ onFileOpen }: GlobalSearchProps): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isIndexing, setIsIndexing] = useState<boolean>(false);
  const [indexLoaded, setIndexLoaded] = useState<boolean>(false);
  const [indexingProgress, setIndexingProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const initializeSearch = async () => {
      try {
        const loaded = await window.electronAPI.loadSearchIndex();
        setIndexLoaded(loaded);

        if (!loaded) {
          const homeDir = await window.electronAPI.getHomeDirectory();
          setIsIndexing(true);
          await window.electronAPI.buildSearchIndex([homeDir]);
        }
      } catch (error) {
        console.error("Failed to initialize search:", error);
      }
    };

    initializeSearch();

    const handleProgress = (
      _event: any,
      progress: { processed: number; total: number }
    ) => {
      setIndexingProgress(progress);
    };

    const handleComplete = () => {
      setIsIndexing(false);
      setIndexLoaded(true);
      setIndexingProgress(null);
    };

    const handleError = (error: string) => {
      console.error("Indexing error:", error);
      setIsIndexing(false);
      setIndexingProgress(null);
    };

    window.electronAPI.onIndexingComplete(handleComplete);
    window.electronAPI.onIndexingError(handleError);

    return () => {};
  }, []);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !indexLoaded) return;

      setIsLoading(true);
      try {
        const searchResults = await window.electronAPI.searchFiles(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [indexLoaded]
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleBuildIndex = async () => {
    try {
      const homeDir = await window.electronAPI.getHomeDirectory();
      setIsIndexing(true);
      await window.electronAPI.buildSearchIndex([homeDir]);
    } catch (error) {
      console.error("Failed to build index:", error);
      setIsIndexing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
        return "🟨";
      case "py":
        return "🐍";
      case "java":
        return "☕";
      case "cpp":
      case "c":
      case "h":
      case "hpp":
        return "⚙️";
      case "html":
        return "🌐";
      case "css":
        return "🎨";
      case "json":
        return "📄";
      case "md":
        return "📝";
      case "txt":
        return "📄";
      case "rs":
        return "🦀";
      case "go":
        return "🐹";
      default:
        return "📄";
    }
  };

  return (
    <div className="global-search">
      <div className="global-search-header">
        <h2 className="global-search-title">Global Search</h2>
        {isIndexing && (
          <div className="indexing-status">
            <span className="indexing-spinner">⏳</span>
            <div className="indexing-info">
              <span>Building search index...</span>
              {indexingProgress && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (indexingProgress.processed / indexingProgress.total) *
                        100
                      }%`,
                    }}
                  />
                  <span className="progress-text">
                    {indexingProgress.processed} / {indexingProgress.total}{" "}
                    files
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {!isIndexing && !indexLoaded && (
          <button className="build-index-button" onClick={handleBuildIndex}>
            Build Search Index
          </button>
        )}
      </div>

      <div className="global-search-input-container">
        <div className="search-bar">
          <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search across all indexed files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!indexLoaded || isIndexing}
            />
            {query && (
              <button
                className="clear-button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="global-search-results">
        {isLoading && (
          <div className="search-loading">
            <span className="loading-spinner">⏳</span>
            <span>Searching...</span>
          </div>
        )}

        {!isLoading && query && results.length === 0 && indexLoaded && (
          <div className="search-empty">
            <div className="empty-icon">🔍</div>
            <p>No results found for "{query}"</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="results-list">
            <div className="results-header">
              <span>
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <div className="results-grid">
              {results.map((result, index) => (
                <div
                  key={`${result.path}-${index}`}
                  className="result-item"
                  onClick={() => onFileOpen(result.path)}
                >
                  <div className="result-icon">{getFileIcon(result.name)}</div>
                  <div className="result-info">
                    <div className="result-name">{result.name}</div>
                    <div className="result-path">{result.path}</div>
                    {result.snippet && (
                      <div className="result-snippet">{result.snippet}</div>
                    )}
                    <div className="result-meta">
                      <span className="result-size">
                        {formatFileSize(result.size)}
                      </span>
                      <span className="result-date">
                        {formatDate(result.mtime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalSearch;
