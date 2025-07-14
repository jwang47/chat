export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

export type ApiKeyProvider = keyof ApiKeys;

interface CredentialsAPI {
  getApiKey: (provider: ApiKeyProvider) => Promise<string | null>;
  setApiKey: (provider: ApiKeyProvider, value: string) => Promise<boolean>;
  removeApiKey: (provider: ApiKeyProvider) => Promise<boolean>;
  getAllApiKeys: () => Promise<ApiKeys>;
  clearAllApiKeys: () => Promise<boolean>;
  hasAnyApiKey: () => Promise<boolean>;
  hasApiKey: (provider: ApiKeyProvider) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: {
      credentials: CredentialsAPI;
      isElectron: boolean;
      platform: string;
    };
  }
}

export {};