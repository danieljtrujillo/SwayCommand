// Preload — the entire IPC surface the renderer sees, behind contextBridge.

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('akswayj', {
  info: () => ipcRenderer.invoke('app:info'),

  doctor: {
    run: () => ipcRenderer.invoke('doctor:run'),
    fix: (fixId) => ipcRenderer.invoke('doctor:fix', fixId),
    onFixProgress: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('fix:progress', handler);
      return () => ipcRenderer.removeListener('fix:progress', handler);
    },
  },

  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
  },

  project: {
    openDialog: () => ipcRenderer.invoke('project:openDialog'),
    saveDialog: (name) => ipcRenderer.invoke('project:saveDialog', name),
    read: (filePath) => ipcRenderer.invoke('project:read', filePath),
    write: (filePath, doc) => ipcRenderer.invoke('project:write', filePath, doc),
    recent: () => ipcRenderer.invoke('project:recent'),
    templates: () => ipcRenderer.invoke('project:templates'),
    readTemplate: (id) => ipcRenderer.invoke('project:readTemplate', id),
  },

  docs: {
    list: () => ipcRenderer.invoke('docs:list'),
    read: (id) => ipcRenderer.invoke('docs:read', id),
  },

  files: {
    pickAudio: () => ipcRenderer.invoke('files:pickAudio'),
    readAudio: (filePath) => ipcRenderer.invoke('files:readAudio', filePath),
    statAudio: (filePath) => ipcRenderer.invoke('files:statAudio', filePath),
  },

  platform: {
    systemAudio: () => ipcRenderer.invoke('platform:systemAudio'),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch) => ipcRenderer.invoke('settings:set', patch),
  },

  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
