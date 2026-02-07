interface FileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
}

interface FileStats {
  size: number;
  modified: Date;
  created: Date;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  permissions: string;
}

interface FileReadResult {
  content: string | null;
  isBinary: boolean;
  size: number;
  error: string | null;
}

interface OperationResult {
  success: boolean;
  trashed?: boolean;
  originalPath?: string;
}

interface FileSystemAPI {
  readDir(dirPath: string): Promise<FileSystemEntry[]>;
  getStats(filePath: string): Promise<FileStats>;
  homePath(): Promise<string>;
  readFile(filePath: string): Promise<FileReadResult>;
  writeFile(filePath: string, content: string): Promise<OperationResult>;
  copy(source: string, destination: string): Promise<OperationResult>;
  move(source: string, destination: string): Promise<OperationResult>;
  delete(filePath: string): Promise<OperationResult>;
  createFolder(folderPath: string): Promise<OperationResult>;
}

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

interface SearchQueryResponse {
  success: boolean;
  results?: SearchResult[];
  parsedQuery?: ParsedQuery;
  error?: string;
}

interface SearchIndexResponse {
  success: boolean;
  indexedCount?: number;
  error?: string;
}

interface SearchSuggestionsResponse {
  suggestions: string[];
}

interface SearchAPI {
  indexDirectory(path: string): Promise<SearchIndexResponse>;
  query(query: string): Promise<SearchQueryResponse>;
  getStatus(): Promise<SearchStatus>;
  clear(): Promise<{ success: boolean }>;
  getSuggestions(partial: string): Promise<SearchSuggestionsResponse>;
}

interface Window {
  filesystem: FileSystemAPI;
  search: SearchAPI;
}
