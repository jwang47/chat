"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose secure credential API to renderer process
const credentialsAPI = {
    getApiKey: (provider) => electron_1.ipcRenderer.invoke('credentials:get', provider),
    setApiKey: (provider, value) => electron_1.ipcRenderer.invoke('credentials:set', provider, value),
    removeApiKey: (provider) => electron_1.ipcRenderer.invoke('credentials:remove', provider),
    getAllApiKeys: () => electron_1.ipcRenderer.invoke('credentials:getAll'),
    clearAllApiKeys: () => electron_1.ipcRenderer.invoke('credentials:clear'),
    hasAnyApiKey: () => electron_1.ipcRenderer.invoke('credentials:hasAny'),
    hasApiKey: (provider) => electron_1.ipcRenderer.invoke('credentials:has', provider),
};
// Expose APIs to renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    credentials: credentialsAPI,
    // Platform detection
    isElectron: true,
    platform: process.platform,
});
