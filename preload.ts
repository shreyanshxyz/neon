import { contextBridge, ipcRenderer } from "electron";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

interface ElectronAPI {
  getDrives: () => Promise<FileItem[]>;
  readDirectory: (dirPath: string) => Promise<FileItem[]>;
  getHomeDirectory: () => Promise<string>;
  openFile: (filePath: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
  platform: string;
}

contextBridge.exposeInMainWorld("electronAPI", {
  getDrives: () => ipcRenderer.invoke("fs:getDrives"),
  readDirectory: (dirPath: string) =>
    ipcRenderer.invoke("fs:readDirectory", dirPath),
  getHomeDirectory: () => ipcRenderer.invoke("fs:getHomeDirectory"),
  openFile: (filePath: string) => ipcRenderer.invoke("fs:openFile", filePath),
  selectDirectory: () => ipcRenderer.invoke("dialog:selectDirectory"),
  platform: process.platform,
} as ElectronAPI);
