import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { promises as fs } from "fs";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "dist/preload.js"),
    },
    titleBarStyle: "default",
    show: false,
  });

  const isDev = process.env.ELECTRON_IS_DEV === "true";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "renderer/dist/index.html"));
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
  return require("os").homedir();
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
