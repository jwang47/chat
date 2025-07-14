import { contextBridge, ipcRenderer } from 'electron';

export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

export type ApiKeyProvider = keyof ApiKeys;

// Expose secure credential API to renderer process
const credentialsAPI = {
  getApiKey: (provider: ApiKeyProvider): Promise<string | null> =>
    ipcRenderer.invoke('credentials:get', provider),
  
  setApiKey: (provider: ApiKeyProvider, value: string): Promise<boolean> =>
    ipcRenderer.invoke('credentials:set', provider, value),
  
  removeApiKey: (provider: ApiKeyProvider): Promise<boolean> =>
    ipcRenderer.invoke('credentials:remove', provider),
  
  getAllApiKeys: (): Promise<ApiKeys> =>
    ipcRenderer.invoke('credentials:getAll'),
  
  clearAllApiKeys: (): Promise<boolean> =>
    ipcRenderer.invoke('credentials:clear'),
  
  hasAnyApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke('credentials:hasAny'),
  
  hasApiKey: (provider: ApiKeyProvider): Promise<boolean> =>
    ipcRenderer.invoke('credentials:has', provider),
};

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  credentials: credentialsAPI,
  
  // Platform detection
  isElectron: true,
  platform: process.platform,
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      credentials: typeof credentialsAPI;
      isElectron: boolean;
      platform: string;
    };
  }
}