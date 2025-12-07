import { contextBridge, ipcRenderer } from "electron";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

interface SearchResult {
  path: string;
  name: string;
  snippet?: string;
  mtime: number;
  size: number;
  score?: number;
}

interface ElectronAPI {
  getDrives: () => Promise<FileItem[]>;
  readDirectory: (dirPath: string) => Promise<FileItem[]>;
  getHomeDirectory: () => Promise<string>;
  openFile: (filePath: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
  platform: string;
  loadSearchIndex: () => Promise<boolean>;
  buildSearchIndex: (rootPaths: string[]) => Promise<void>;
  searchFiles: (query: string) => Promise<SearchResult[]>;
  getIndexingStatus: () => Promise<boolean>;
  onIndexingComplete: (callback: () => void) => void;
  onIndexingError: (callback: (error: string) => void) => void;
}

contextBridge.exposeInMainWorld("electronAPI", {
  getDrives: () => ipcRenderer.invoke("fs:getDrives"),
  readDirectory: (dirPath: string) =>
    ipcRenderer.invoke("fs:readDirectory", dirPath),
  getHomeDirectory: () => ipcRenderer.invoke("fs:getHomeDirectory"),
  openFile: (filePath: string) => ipcRenderer.invoke("fs:openFile", filePath),
  selectDirectory: () => ipcRenderer.invoke("dialog:selectDirectory"),
  platform: process.platform,
  loadSearchIndex: () => ipcRenderer.invoke("search:loadIndex"),
  buildSearchIndex: (rootPaths: string[]) =>
    ipcRenderer.invoke("search:buildIndex", rootPaths),
  searchFiles: (query: string) => ipcRenderer.invoke("search:files", query),
  getIndexingStatus: () => ipcRenderer.invoke("search:getIndexingStatus"),
  onIndexingComplete: (callback: () => void) => {
    ipcRenderer.on("indexing:complete", callback);
  },
  onIndexingError: (callback: (error: string) => void) => {
    ipcRenderer.on("indexing:error", (_, error) => callback(error));
  },
} as ElectronAPI);
