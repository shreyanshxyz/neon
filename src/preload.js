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
