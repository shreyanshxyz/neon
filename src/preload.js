const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('process', {
  env: process.env,
});

contextBridge.exposeInMainWorld('filesystem', {
  readDir: (path) => ipcRenderer.invoke('filesystem:readDir', path),
  getStats: (path) => ipcRenderer.invoke('filesystem:getStats', path),
  homePath: () => ipcRenderer.invoke('filesystem:homePath'),
  readFile: (path) => ipcRenderer.invoke('filesystem:readFile', path),
  writeFile: (path, content) => ipcRenderer.invoke('filesystem:writeFile', path, content),
  copy: (source, dest) => ipcRenderer.invoke('filesystem:copy', source, dest),
  move: (source, dest) => ipcRenderer.invoke('filesystem:move', source, dest),
  delete: (path) => ipcRenderer.invoke('filesystem:delete', path),
  createFolder: (path) => ipcRenderer.invoke('filesystem:createFolder', path),
});

contextBridge.exposeInMainWorld('search', {
  indexDirectory: (path) => ipcRenderer.invoke('search:indexDirectory', path),
  query: (query) => ipcRenderer.invoke('search:query', query),
  queryParsed: (parsedQuery) => ipcRenderer.invoke('search:queryParsed', parsedQuery),
  getStatus: () => ipcRenderer.invoke('search:getStatus'),
  clear: () => ipcRenderer.invoke('search:clear'),
  getSuggestions: (partial) => ipcRenderer.invoke('search:getSuggestions', partial),
});

contextBridge.exposeInMainWorld('smartFolders', {
  getAll: () => ipcRenderer.invoke('smartFolders:getAll'),
  create: (data) => ipcRenderer.invoke('smartFolders:create', data),
  update: (id, data) => ipcRenderer.invoke('smartFolders:update', id, data),
  delete: (id) => ipcRenderer.invoke('smartFolders:delete', id),
  execute: (id) => ipcRenderer.invoke('smartFolders:execute', id),
  getCount: () => ipcRenderer.invoke('smartFolders:getCount'),
});

contextBridge.exposeInMainWorld('ollama', {
  check: () => ipcRenderer.invoke('ollama:check'),
  chat: (payload) => ipcRenderer.invoke('ollama:chat', payload),
  generateSearch: (payload) => ipcRenderer.invoke('ollama:generateSearch', payload),
  streamChat: (payload, onChunk, onDone, onError) => {
    const requestId = payload.requestId;

    const handleChunk = (_event, data) => {
      if (data.requestId === requestId) {
        onChunk?.(data.chunk);
      }
    };

    const handleError = (_event, data) => {
      if (data.requestId === requestId) {
        cleanup();
        onError?.(data.error);
      }
    };

    const handleDone = (_event, data) => {
      if (data.requestId === requestId) {
        cleanup();
        onDone?.();
      }
    };

    const cleanup = () => {
      ipcRenderer.removeListener('ollama:streamChat:chunk', handleChunk);
      ipcRenderer.removeListener('ollama:streamChat:done', handleDone);
      ipcRenderer.removeListener('ollama:streamChat:error', handleError);
    };

    ipcRenderer.on('ollama:streamChat:chunk', handleChunk);
    ipcRenderer.on('ollama:streamChat:done', handleDone);
    ipcRenderer.on('ollama:streamChat:error', handleError);
    ipcRenderer.send('ollama:streamChat', payload);

    return cleanup;
  },
});
