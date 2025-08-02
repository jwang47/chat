import type { IApiKeyStorage, ApiKeys, ApiKeyProvider } from "./apiKeyStorage";

class LocalStorageApiKeyStorage implements IApiKeyStorage {
  private static readonly KEY_PREFIX = "api_key_";
  private static readonly ALL_KEYS_KEY = "all_api_keys";

  /**
   * Get a specific API key from localStorage
   */
  async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    try {
      const key = `${LocalStorageApiKeyStorage.KEY_PREFIX}${provider}`;
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.error(`Error getting ${provider} API key from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set a specific API key in localStorage
   */
  async setApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean> {
    try {
      const key = `${LocalStorageApiKeyStorage.KEY_PREFIX}${provider}`;
      localStorage.setItem(key, apiKey);
      
      // Update the all keys index
      await this.updateAllKeysIndex();
      
      return true;
    } catch (error) {
      console.error(`Error setting ${provider} API key in localStorage:`, error);
      return false;
    }
  }

  /**
   * Get all API keys from localStorage
   */
  async getAllApiKeys(): Promise<ApiKeys> {
    try {
      const apiKeys: ApiKeys = {};
      
      const openrouterKey = await this.getApiKey("openrouter");
      if (openrouterKey) {
        apiKeys.openrouter = openrouterKey;
      }
      
      const geminiKey = await this.getApiKey("gemini");
      if (geminiKey) {
        apiKeys.gemini = geminiKey;
      }
      
      return apiKeys;
    } catch (error) {
      console.error("Error getting all API keys from localStorage:", error);
      return {};
    }
  }

  /**
   * Set multiple API keys at once
   */
  async setApiKeys(apiKeys: ApiKeys): Promise<boolean> {
    try {
      let success = true;
      
      if (apiKeys.openrouter !== undefined) {
        const result = await this.setApiKey("openrouter", apiKeys.openrouter);
        success = result && success;
      }
      
      if (apiKeys.gemini !== undefined) {
        const result = await this.setApiKey("gemini", apiKeys.gemini);
        success = result && success;
      }
      
      return success;
    } catch (error) {
      console.error("Error setting API keys in localStorage:", error);
      return false;
    }
  }

  /**
   * Remove a specific API key from localStorage
   */
  async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      const key = `${LocalStorageApiKeyStorage.KEY_PREFIX}${provider}`;
      localStorage.removeItem(key);
      
      // Update the all keys index
      await this.updateAllKeysIndex();
      
      return true;
    } catch (error) {
      console.error(`Error removing ${provider} API key from localStorage:`, error);
      return false;
    }
  }

  /**
   * Remove all API keys from localStorage
   */
  async clearAllApiKeys(): Promise<boolean> {
    try {
      const providers: ApiKeyProvider[] = ["openrouter", "gemini"];
      
      for (const provider of providers) {
        const key = `${LocalStorageApiKeyStorage.KEY_PREFIX}${provider}`;
        localStorage.removeItem(key);
      }
      
      localStorage.removeItem(LocalStorageApiKeyStorage.ALL_KEYS_KEY);
      
      return true;
    } catch (error) {
      console.error("Error clearing API keys from localStorage:", error);
      return false;
    }
  }

  /**
   * Check if any API key is available
   */
  async hasAnyApiKey(): Promise<boolean> {
    try {
      const apiKeys = await this.getAllApiKeys();
      return Object.keys(apiKeys).length > 0;
    } catch (error) {
      console.error("Error checking for any API keys in localStorage:", error);
      return false;
    }
  }

  /**
   * Check if a specific API key is available
   */
  async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey(provider);
      return apiKey !== null && apiKey.length > 0;
    } catch (error) {
      console.error(`Error checking for ${provider} API key in localStorage:`, error);
      return false;
    }
  }

  /**
   * Private method to update the index of all stored keys
   */
  private async updateAllKeysIndex(): Promise<void> {
    try {
      const apiKeys = await this.getAllApiKeys();
      localStorage.setItem(LocalStorageApiKeyStorage.ALL_KEYS_KEY, JSON.stringify(apiKeys));
    } catch (error) {
      console.error("Error updating all keys index:", error);
    }
  }
}

export default LocalStorageApiKeyStorage;