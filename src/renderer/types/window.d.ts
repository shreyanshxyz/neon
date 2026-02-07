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
  dateRange?: { start: string; end: string };
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
  queryParsed(parsedQuery: ParsedQuery): Promise<SearchQueryResponse>;
  getStatus(): Promise<SearchStatus>;
  clear(): Promise<{ success: boolean }>;
  getSuggestions(partial: string): Promise<SearchSuggestionsResponse>;
}

interface SmartFolder {
  id: string;
  name: string;
  query: string;
  parsedQuery: ParsedQuery;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface SmartFoldersGetAllResponse {
  success: boolean;
  folders?: SmartFolder[];
  error?: string;
}

interface SmartFolderCreateResponse {
  success: boolean;
  folder?: SmartFolder;
  error?: string;
}

interface SmartFolderUpdateResponse {
  success: boolean;
  folder?: SmartFolder;
  error?: string;
}

interface SmartFolderDeleteResponse {
  success: boolean;
  error?: string;
}

interface SmartFolderExecuteResponse {
  success: boolean;
  folder?: SmartFolder;
  results?: SearchResult[];
  error?: string;
}

interface SmartFolderCountResponse {
  success: boolean;
  count?: number;
  error?: string;
}

interface SmartFoldersAPI {
  getAll(): Promise<SmartFoldersGetAllResponse>;
  create(
    data: Omit<SmartFolder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SmartFolderCreateResponse>;
  update(id: string, data: Partial<SmartFolder>): Promise<SmartFolderUpdateResponse>;
  delete(id: string): Promise<SmartFolderDeleteResponse>;
  execute(id: string): Promise<SmartFolderExecuteResponse>;
  getCount(): Promise<SmartFolderCountResponse>;
}

interface OllamaCheckResponse {
  available: boolean;
  models: string[];
  defaultModel: string;
}

interface OllamaChatResponse {
  response: string;
  error?: string;
}

interface OllamaGenerateSearchResponse {
  success: boolean;
  parsedQuery?: ParsedQuery;
  error?: string;
}

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FileContext {
  path: string;
  name: string;
  content?: string;
  size?: number;
  modified?: string;
}

interface OllamaAPI {
  check(): Promise<OllamaCheckResponse>;
  chat(payload: { messages: OllamaChatMessage[]; model?: string }): Promise<OllamaChatResponse>;
  generateSearch(payload: {
    query: string;
    context?: FileContext;
  }): Promise<OllamaGenerateSearchResponse>;
  streamChat(
    payload: { requestId: string; messages: OllamaChatMessage[]; model?: string },
    onChunk?: (chunk: string) => void,
    onDone?: () => void,
    onError?: (error: string) => void
  ): () => void;
}

interface Window {
  filesystem: FileSystemAPI;
  search: SearchAPI;
  smartFolders: SmartFoldersAPI;
  ollama?: OllamaAPI;
}
