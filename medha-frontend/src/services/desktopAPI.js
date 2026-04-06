// Desktop API - wraps Electron IPC calls for native features
// This service provides native functionality when running in Electron

const isElectron = window.electronAPI?.isElectron || false;

// Desktop API methods
const desktopAPI = {
  // Check if running in Electron
  isElectron,

  // Get app version
  getAppVersion: async () => {
    if (isElectron) {
      return await window.electronAPI.getAppVersion();
    }
    return '1.0.0-web';
  },

  // Get platform (win32, darwin, linux)
  getPlatform: async () => {
    if (isElectron) {
      return await window.electronAPI.getPlatform();
    }
    return 'web';
  },

  // NFC Card Scanning - uses native USB NFC reader
  nfcScan: async (options = {}) => {
    if (isElectron) {
      return await window.electronAPI.nfcScan(options);
    }
    // Fallback to web-based NFC bridge
    return { success: false, error: 'NFC not available in web mode' };
  },

  // Print document
  printDocument: async (data) => {
    if (isElectron) {
      return await window.electronAPI.printDocument(data);
    }
    // Fallback to browser print
    window.print();
    return { success: true };
  },

  // Save file to disk
  saveFile: async (data) => {
    if (isElectron) {
      return await window.electronAPI.saveFile(data);
    }
    // Fallback to browser download
    const blob = new Blob([data.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  },

  // Auto-update listeners
  onUpdateAvailable: (callback) => {
    if (isElectron) {
      window.electronAPI.onUpdateAvailable(callback);
    }
  },

  onUpdateDownloaded: (callback) => {
    if (isElectron) {
      window.electronAPI.onUpdateDownloaded(callback);
    }
  },

  restartAndInstall: async () => {
    if (isElectron) {
      await window.electronAPI.restartAndInstall();
    }
  },
};

export default desktopAPI;