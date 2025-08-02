import TauriApiKeyStorage from "./tauriApiKeyStorage";
import LocalStorageApiKeyStorage from "./localStorageApiKeyStorage";
import { isTauri } from "@tauri-apps/api/core";

export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

export type ApiKeyProvider = keyof ApiKeys;

export interface IApiKeyStorage {
  getApiKey(provider: ApiKeyProvider): Promise<string | null>;
  setApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean>;
  getAllApiKeys(): Promise<ApiKeys>;
  setApiKeys(apiKeys: ApiKeys): Promise<boolean>;
  removeApiKey(provider: ApiKeyProvider): Promise<boolean>;
  clearAllApiKeys(): Promise<boolean>;
  hasAnyApiKey(): Promise<boolean>;
  hasApiKey(provider: ApiKeyProvider): Promise<boolean>;
}

class ApiKeyStorage implements IApiKeyStorage {
  private static instance: ApiKeyStorage;
  private storage: IApiKeyStorage;

  constructor() {
    // Use Tauri for desktop app, localStorage for web/dev
    if (isTauri()) {
      this.storage = new TauriApiKeyStorage();
    } else {
      this.storage = new LocalStorageApiKeyStorage();
    }
  }

  private static getInstance(): ApiKeyStorage {
    if (!ApiKeyStorage.instance) {
      ApiKeyStorage.instance = new ApiKeyStorage();
    }
    return ApiKeyStorage.instance;
  }

  // Instance methods implementing the interface
  async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    return this.storage.getApiKey(provider);
  }

  async setApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean> {
    return this.storage.setApiKey(provider, apiKey);
  }

  async getAllApiKeys(): Promise<ApiKeys> {
    return this.storage.getAllApiKeys();
  }

  async setApiKeys(apiKeys: ApiKeys): Promise<boolean> {
    return this.storage.setApiKeys(apiKeys);
  }

  async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    return this.storage.removeApiKey(provider);
  }

  async clearAllApiKeys(): Promise<boolean> {
    return this.storage.clearAllApiKeys();
  }

  async hasAnyApiKey(): Promise<boolean> {
    return this.storage.hasAnyApiKey();
  }

  async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    return this.storage.hasApiKey(provider);
  }

  // Static methods for backward compatibility
  static async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    return ApiKeyStorage.getInstance().getApiKey(provider);
  }

  static async setApiKey(
    provider: ApiKeyProvider,
    apiKey: string
  ): Promise<boolean> {
    return ApiKeyStorage.getInstance().setApiKey(provider, apiKey);
  }

  static async getAllApiKeys(): Promise<ApiKeys> {
    return ApiKeyStorage.getInstance().getAllApiKeys();
  }

  static async setApiKeys(apiKeys: ApiKeys): Promise<boolean> {
    return ApiKeyStorage.getInstance().setApiKeys(apiKeys);
  }

  static async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    return ApiKeyStorage.getInstance().removeApiKey(provider);
  }

  static async clearAllApiKeys(): Promise<boolean> {
    return ApiKeyStorage.getInstance().clearAllApiKeys();
  }

  static async hasAnyApiKey(): Promise<boolean> {
    return ApiKeyStorage.getInstance().hasAnyApiKey();
  }

  static async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    return ApiKeyStorage.getInstance().hasApiKey(provider);
  }
}

export default ApiKeyStorage;
