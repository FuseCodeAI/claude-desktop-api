const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  readConfigs: () => ipcRenderer.invoke('read-configs'),
  toggleDevMode: (enable) => ipcRenderer.invoke('toggle-dev-mode', enable),
  syncEnvVars: () => ipcRenderer.invoke('sync-env-vars'),
  saveGateway: (cfg) => ipcRenderer.invoke('save-gateway', cfg),
  restartClaude: () => ipcRenderer.invoke('restart-claude'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
