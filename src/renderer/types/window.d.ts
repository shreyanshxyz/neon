interface FileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
}

interface FileSystemAPI {
  readDir(dirPath: string): Promise<FileSystemEntry[]>;
  getStats(dirPath: string): Promise<FileSystemEntry | null>;
  homePath(): Promise<string>;
}

interface Window {
  filesystem: FileSystemAPI;
}
