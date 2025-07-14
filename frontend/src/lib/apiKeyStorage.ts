export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

export type ApiKeyProvider = keyof ApiKeys;

class ApiKeyStorage {
  private static readonly STORAGE_KEYS = {
    openrouter: "openrouter-api-key",
    gemini: "gemini-api-key",
  } as const;

  /**
   * Check if running in Electron
   */
  private static isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
  }

  /**
   * Get a specific API key from secure storage or localStorage fallback
   */
  static async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.getApiKey(provider);
      }
      
      // Fallback to localStorage for web version
      const key = this.STORAGE_KEYS[provider];
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting ${provider} API key:`, error);
      return null;
    }
  }

  /**
   * Set a specific API key in secure storage or localStorage fallback
   */
  static async setApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.setApiKey(provider, apiKey);
      }
      
      // Fallback to localStorage for web version
      const key = this.STORAGE_KEYS[provider];
      if (apiKey.trim()) {
        localStorage.setItem(key, apiKey.trim());
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error(`Error setting ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Get all API keys from secure storage or localStorage fallback
   */
  static async getAllApiKeys(): Promise<ApiKeys> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.getAllApiKeys();
      }
      
      // Fallback to localStorage for web version
      return {
        openrouter: (await this.getApiKey("openrouter")) || undefined,
        gemini: (await this.getApiKey("gemini")) || undefined,
      };
    } catch (error) {
      console.error("Error getting all API keys:", error);
      return {};
    }
  }

  /**
   * Set multiple API keys at once
   */
  static async setApiKeys(apiKeys: ApiKeys): Promise<boolean> {
    try {
      let success = true;

      if (apiKeys.openrouter !== undefined) {
        success = (await this.setApiKey("openrouter", apiKeys.openrouter)) && success;
      }

      if (apiKeys.gemini !== undefined) {
        success = (await this.setApiKey("gemini", apiKeys.gemini)) && success;
      }

      return success;
    } catch (error) {
      console.error("Error setting API keys:", error);
      return false;
    }
  }

  /**
   * Remove a specific API key from secure storage or localStorage fallback
   */
  static async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.removeApiKey(provider);
      }
      
      // Fallback to localStorage for web version
      const key = this.STORAGE_KEYS[provider];
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Remove all API keys from secure storage or localStorage fallback
   */
  static async clearAllApiKeys(): Promise<boolean> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.clearAllApiKeys();
      }
      
      // Fallback to localStorage for web version
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error("Error clearing API keys:", error);
      return false;
    }
  }

  /**
   * Check if any API key is available
   */
  static async hasAnyApiKey(): Promise<boolean> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.hasAnyApiKey();
      }
      
      // Fallback to localStorage for web version
      const keys = await this.getAllApiKeys();
      return !!(keys.openrouter || keys.gemini);
    } catch (error) {
      console.error("Error checking for API keys:", error);
      return false;
    }
  }

  /**
   * Check if a specific API key is available
   */
  static async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      if (this.isElectron() && window.electronAPI) {
        return await window.electronAPI.credentials.hasApiKey(provider);
      }
      
      // Fallback to localStorage for web version
      return !!(await this.getApiKey(provider));
    } catch (error) {
      console.error(`Error checking for ${provider} API key:`, error);
      return false;
    }
  }
}

export default ApiKeyStorage;
