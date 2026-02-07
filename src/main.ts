import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import * as path from 'path';
import fs from 'fs';
import { FileIndexer } from './main/services/FileIndexer.js';
import { QueryParser } from './main/services/QueryParser.js';
import { SmartFolderService } from './main/services/SmartFolderService.js';
import { OllamaService } from './main/services/OllamaService.js';
import type { ParsedQuery } from './main/services/FileIndexer.js';
import type { ChatMessage, FileContext } from './main/services/OllamaService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fileIndexer = new FileIndexer();
const queryParser = new QueryParser();
const smartFolderService = new SmartFolderService();
const ollamaService = new OllamaService();

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

ipcMain.handle('search:indexDirectory', async (_, dirPath: string) => {
  try {
    await fileIndexer.indexDirectory(dirPath);
    return {
      success: true,
      indexedCount: fileIndexer.getIndexedCount(),
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      error: err.message || 'Failed to index directory',
    };
  }
});

ipcMain.handle('search:query', async (_, query: string) => {
  try {
    const parsedQuery = queryParser.parse(query);
    const results = fileIndexer.search(parsedQuery);
    return {
      success: true,
      results,
      parsedQuery,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      error: err.message || 'Search failed',
    };
  }
});

ipcMain.handle('search:queryParsed', async (_, parsedQuery: ParsedQuery) => {
  try {
    const results = fileIndexer.search(parsedQuery);
    return {
      success: true,
      results,
      parsedQuery,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      error: err.message || 'Search failed',
    };
  }
});

ipcMain.handle('search:getStatus', () => {
  return {
    isIndexing: fileIndexer.isIndexing(),
    indexedCount: fileIndexer.getIndexedCount(),
  };
});

ipcMain.handle('search:clear', () => {
  fileIndexer.clearIndex();
  return { success: true };
});

ipcMain.handle('search:getSuggestions', (_, partial: string) => {
  const suggestions = queryParser.getSuggestions(partial);
  return { suggestions };
});

ipcMain.handle('smartFolders:getAll', async () => {
  try {
    const folders = await smartFolderService.getAll();
    return { success: true, folders };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to get smart folders' };
  }
});

ipcMain.handle('smartFolders:create', async (_, data) => {
  try {
    const folder = await smartFolderService.create(data);
    return { success: true, folder };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to create smart folder' };
  }
});

ipcMain.handle('smartFolders:update', async (_, id, data) => {
  try {
    const folder = await smartFolderService.update(id, data);
    return { success: true, folder };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to update smart folder' };
  }
});

ipcMain.handle('smartFolders:delete', async (_, id) => {
  try {
    await smartFolderService.delete(id);
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to delete smart folder' };
  }
});

ipcMain.handle('smartFolders:execute', async (_, id) => {
  try {
    const folder = await smartFolderService.execute(id);

    if (fileIndexer.getIndexedCount() === 0) {
      return {
        success: false,
        error:
          'No files indexed yet. Please navigate to a directory first to build the search index.',
      };
    }

    const parsedQuery = queryParser.parse(folder.query);
    const results = fileIndexer.search(parsedQuery);
    return { success: true, folder, results };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to execute smart folder' };
  }
});

ipcMain.handle('smartFolders:getCount', async () => {
  try {
    const count = await smartFolderService.getCount();
    return { success: true, count };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to get count' };
  }
});

ipcMain.handle('ollama:check', async () => {
  const status = await ollamaService.checkConnection();
  return {
    available: status.available,
    models: status.models,
    defaultModel: ollamaService.getFallbackModel(status.models),
  };
});

ipcMain.handle('ollama:chat', async (_, payload: { messages: ChatMessage[]; model?: string }) => {
  try {
    const response = await ollamaService.chat(payload.messages, payload.model);
    return { response };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { response: '', error: err.message || 'Chat failed' };
  }
});

ipcMain.on(
  'ollama:streamChat',
  async (
    event,
    payload: { requestId: string; messages: ChatMessage[]; model?: string }
  ) => {
    const { requestId, messages, model } = payload;
  try {
    for await (const chunk of ollamaService.streamChat(messages, model)) {
      event.sender.send('ollama:streamChat:chunk', { requestId, chunk });
    }
    event.sender.send('ollama:streamChat:done', { requestId });
  } catch (error: unknown) {
    const err = error as { message?: string };
    event.sender.send('ollama:streamChat:error', {
      requestId,
      error: err.message || 'Streaming failed',
    });
  }
  }
);

ipcMain.handle(
  'ollama:generateSearch',
  async (_, payload: { query: string; context?: FileContext }) => {
  try {
    const parsedQuery = await ollamaService.generateSearchQuery(
      payload.query,
      payload.context
    );
    return { success: true, parsedQuery };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'AI search failed' };
  }
  }
);

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
