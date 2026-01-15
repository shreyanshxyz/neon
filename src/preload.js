const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('process', {
  env: process.env
});

contextBridge.exposeInMainWorld('filesystem', {
  readDir: (path) => ipcRenderer.invoke('filesystem:readDir', path),
  getStats: (path) => ipcRenderer.invoke('filesystem:getStats', path),
  homePath: () => ipcRenderer.invoke('filesystem:homePath'),
});
