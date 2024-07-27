// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  query: async (sql, params) => {
    try {
      const result = await ipcRenderer.invoke('query-database', sql, params);
      return result;
    } catch (error) {
      console.error('Error querying database:', error);
      throw error;
    }
  }
});
