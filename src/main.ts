import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import * as path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function getTrashPath(): Promise<string> {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/home/user';
  const trashPath = path.join(homeDir, '.neon-trash');
  if (!fs.existsSync(trashPath)) {
    await fs.promises.mkdir(trashPath, { recursive: true });
  }
  return trashPath;
}

ipcMain.handle('filesystem:readDir', async (_, dirPath: string) => {
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
    throw new Error(`Cannot read directory: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:getStats', async (_, filePath: string) => {
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
    throw new Error(`Cannot get stats: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:homePath', () => {
  return process.env.HOME || process.env.USERPROFILE || '/home/user';
});

ipcMain.handle('filesystem:readFile', async (_, filePath: string) => {
  try {
    const stats = await fs.promises.stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
      return {
        content: null,
        isBinary: true,
        size: stats.size,
        error: 'File too large to preview (>10MB)',
      };
    }

    const buffer = await fs.promises.readFile(filePath);
    const isBinary = buffer.slice(0, 8000).some((byte) => byte === 0);

    if (isBinary) {
      return {
        content: null,
        isBinary: true,
        size: stats.size,
        error: null,
      };
    }

    const content = buffer.toString('utf-8');
    return {
      content,
      isBinary: false,
      size: stats.size,
      error: null,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot read file: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:writeFile', async (_, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot write file: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:copy', async (_, source: string, destination: string) => {
  try {
    const stats = await fs.promises.stat(source);

    if (stats.isDirectory()) {
      await fs.promises.cp(source, destination, { recursive: true });
    } else {
      await fs.promises.copyFile(source, destination);
    }
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot copy: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:move', async (_, source: string, destination: string) => {
  try {
    await fs.promises.rename(source, destination);
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot move: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:delete', async (_, filePath: string) => {
  try {
    const trashPath = await getTrashPath();
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const trashFileName = `${timestamp}_${fileName}`;
    const trashDestination = path.join(trashPath, trashFileName);

    await fs.promises.rename(filePath, trashDestination);
    return { success: true, trashed: true, originalPath: filePath };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot delete: ${err.message || 'Unknown error'}`);
  }
});

ipcMain.handle('filesystem:createFolder', async (_, folderPath: string) => {
  try {
    await fs.promises.mkdir(folderPath, { recursive: true });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(`Cannot create folder: ${err.message || 'Unknown error'}`);
  }
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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('index.html');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
