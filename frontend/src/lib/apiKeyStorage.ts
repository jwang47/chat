export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

export type ApiKeyProvider = keyof ApiKeys;

class ApiKeyStorage {

  /**
   * Check if running in Electron
   */
  private static isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
  }

  /**
   * Get a specific API key from secure storage (Electron only)
   */
  static async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.getApiKey(provider);
    } catch (error) {
      console.error(`Error getting ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * Set a specific API key in secure storage (Electron only)
   */
  static async setApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.setApiKey(provider, apiKey);
    } catch (error) {
      console.error(`Error setting ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * Get all API keys from secure storage (Electron only)
   */
  static async getAllApiKeys(): Promise<ApiKeys> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.getAllApiKeys();
    } catch (error) {
      console.error("Error getting all API keys:", error);
      throw error;
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
   * Remove a specific API key from secure storage (Electron only)
   */
  static async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.removeApiKey(provider);
    } catch (error) {
      console.error(`Error removing ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * Remove all API keys from secure storage (Electron only)
   */
  static async clearAllApiKeys(): Promise<boolean> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.clearAllApiKeys();
    } catch (error) {
      console.error("Error clearing API keys:", error);
      throw error;
    }
  }

  /**
   * Check if any API key is available (Electron only)
   */
  static async hasAnyApiKey(): Promise<boolean> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.hasAnyApiKey();
    } catch (error) {
      console.error("Error checking for API keys:", error);
      throw error;
    }
  }

  /**
   * Check if a specific API key is available (Electron only)
   */
  static async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      if (!this.isElectron() || !window.electronAPI) {
        throw new Error('Secure credential storage is only available in the desktop app. Please use the Electron version for secure API key storage.');
      }
      
      return await window.electronAPI.credentials.hasApiKey(provider);
    } catch (error) {
      console.error(`Error checking for ${provider} API key:`, error);
      throw error;
    }
  }
}

export default ApiKeyStorage;
