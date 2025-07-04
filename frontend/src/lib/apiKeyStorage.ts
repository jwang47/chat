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
   * Get a specific API key from localStorage
   */
  static getApiKey(provider: ApiKeyProvider): string | null {
    try {
      const key = this.STORAGE_KEYS[provider];
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting ${provider} API key:`, error);
      return null;
    }
  }

  /**
   * Set a specific API key in localStorage
   */
  static setApiKey(provider: ApiKeyProvider, apiKey: string): boolean {
    try {
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
   * Get all API keys from localStorage
   */
  static getAllApiKeys(): ApiKeys {
    return {
      openrouter: this.getApiKey("openrouter") || undefined,
      gemini: this.getApiKey("gemini") || undefined,
    };
  }

  /**
   * Set multiple API keys at once
   */
  static setApiKeys(apiKeys: ApiKeys): boolean {
    try {
      let success = true;

      if (apiKeys.openrouter !== undefined) {
        success = this.setApiKey("openrouter", apiKeys.openrouter) && success;
      }

      if (apiKeys.gemini !== undefined) {
        success = this.setApiKey("gemini", apiKeys.gemini) && success;
      }

      return success;
    } catch (error) {
      console.error("Error setting API keys:", error);
      return false;
    }
  }

  /**
   * Remove a specific API key from localStorage
   */
  static removeApiKey(provider: ApiKeyProvider): boolean {
    try {
      const key = this.STORAGE_KEYS[provider];
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Remove all API keys from localStorage
   */
  static clearAllApiKeys(): boolean {
    try {
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
  static hasAnyApiKey(): boolean {
    const keys = this.getAllApiKeys();
    return !!(keys.openrouter || keys.gemini);
  }

  /**
   * Check if a specific API key is available
   */
  static hasApiKey(provider: ApiKeyProvider): boolean {
    return !!this.getApiKey(provider);
  }
}

export default ApiKeyStorage;
