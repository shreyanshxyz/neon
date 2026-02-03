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

interface Window {
  filesystem: FileSystemAPI;
}
