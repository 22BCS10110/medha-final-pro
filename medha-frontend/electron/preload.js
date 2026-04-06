// Preload script - runs in a privileged context before the renderer loads
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // NFC operations
  nfcScan: (options) => ipcRenderer.invoke('nfc-scan', options),
  
  // Print operations
  printDocument: (data) => ipcRenderer.invoke('print-document', data),
  
  // File operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Auto-updater
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
  
  // Check if running in Electron
  isElectron: true,
});

// Log when preload script is executed (for debugging)
console.log('Electron preload script loaded successfully');