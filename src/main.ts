import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "url";
import * as path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

ipcMain.handle("filesystem:readDir", async (_, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory(),
      isSymbolicLink: entry.isSymbolicLink(),
    }));
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot read directory: ${err.message || "Unknown error"}`);
  }
});

ipcMain.handle("filesystem:getStats", async (_, filePath: string) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      permissions: (stats.mode & 0o777).toString(8),
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot get stats: ${err.message || "Unknown error"}`);
  }
});

ipcMain.handle("filesystem:homePath", () => {
  return process.env.HOME || process.env.USERPROFILE || "/home/user";
});

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile("index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
