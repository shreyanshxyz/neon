import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import { updateIndex, loadIndex, persistIndex, searchFiles } from "./indexer";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

export interface FileMeta {
  path: string;
  name: string;
  mtime: number;
  size: number;
}

export interface IndexedFile {
  meta: FileMeta;
  contentHash?: string;
  text?: string;
  tokens?: string[];
}

export interface InvertedIndex {
  [term: string]: Set<string>;
}

export interface SearchResult {
  path: string;
  name: string;
  snippet?: string;
  mtime: number;
  size: number;
  score?: number;
}

let mainWindow: BrowserWindow | null = null;
let searchIndex: InvertedIndex | null = null;
let isIndexing = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "default",
    show: false,
  });

  const isDev = process.env.ELECTRON_IS_DEV === "true";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("fs:getDrives", async (): Promise<FileItem[]> => {
  if (process.platform === "win32") {
    const drives: FileItem[] = [];
    for (let i = 65; i <= 90; i++) {
      const drive = String.fromCharCode(i) + ":";
      try {
        await fs.access(drive);
        drives.push({
          name: drive,
          path: drive + "\\",
          type: "drive",
        });
      } catch {}
    }
    return drives;
  } else {
    return [
      {
        name: "/",
        path: "/",
        type: "drive",
      },
    ];
  }
});

ipcMain.handle(
  "fs:readDirectory",
  async (event: any, dirPath: string): Promise<FileItem[]> => {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    const result = await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(dirPath, item.name);
        let stats;

        try {
          stats = await fs.stat(fullPath);
        } catch (error) {
          return null;
        }

        return {
          name: item.name,
          path: fullPath,
          type: item.isDirectory() ? "folder" : "file",
          size: stats.size,
          modified: stats.mtime.getTime(),
          isDirectory: item.isDirectory(),
        };
      })
    );

    const validItems = result.filter((item) => item !== null) as FileItem[];
    return validItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }
);

ipcMain.handle("fs:getHomeDirectory", (): string => {
  return os.homedir();
});

ipcMain.handle(
  "fs:openFile",
  async (event: any, filePath: string): Promise<void> => {
    const { shell } = require("electron");
    await shell.openPath(filePath);
  }
);

ipcMain.handle("dialog:selectDirectory", async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("search:loadIndex", async (): Promise<boolean> => {
  searchIndex ??= await loadIndex();
  return searchIndex !== null;
});

ipcMain.handle(
  "search:buildIndex",
  async (_event, rootPaths: string[]): Promise<void> => {
    if (isIndexing) return;

    isIndexing = true;
    try {
      searchIndex = (await loadIndex()) || {};

      searchIndex = await updateIndex(
        rootPaths,
        (processed, total) => {
          console.log(`Indexing progress: ${processed}/${total}`);
          mainWindow?.webContents.send("indexing:progress", {
            processed,
            total,
          });
        },
        (currentIndex) => {
          searchIndex = currentIndex;
        }
      );

      mainWindow?.webContents.send("indexing:complete");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Indexing failed:", errorMessage);
      mainWindow?.webContents.send("indexing:error", errorMessage);
    } finally {
      isIndexing = false;
    }
  }
);

ipcMain.handle(
  "search:files",
  async (_event, query: string): Promise<SearchResult[]> => {
    if (!searchIndex) {
      searchIndex = await loadIndex();
    }

    if (!searchIndex) {
      return [];
    }

    return await searchFiles(query, searchIndex);
  }
);

ipcMain.handle("search:getIndexingStatus", (): boolean => {
  return isIndexing;
});
