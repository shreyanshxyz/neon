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
