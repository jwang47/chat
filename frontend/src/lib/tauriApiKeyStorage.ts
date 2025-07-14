import { invoke, isTauri } from "@tauri-apps/api/core";
import type { IApiKeyStorage, ApiKeys, ApiKeyProvider } from "./apiKeyStorage";

class TauriApiKeyStorage implements IApiKeyStorage {
  /**
   * Check if running in Tauri using the official API
   */
  private static isTauriApp(): boolean {
    return isTauri();
  }

  /**
   * Get a specific API key from secure storage (Tauri only)
   */
  async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      return await invoke<string | null>("get_api_key", { provider });
    } catch (error) {
      console.error(`Error getting ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * Set a specific API key in secure storage (Tauri only)
   */
  async setApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      console.log(`Attempting to save ${provider} API key...`);
      const result = await invoke<boolean>("set_api_key", {
        provider,
        value: apiKey,
      });
      console.log(`${provider} API key save result:`, result);
      return result;
    } catch (error) {
      console.error(`Error setting ${provider} API key:`, error);
      console.error(`Error details:`, {
        provider,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        isTauri: TauriApiKeyStorage.isTauriApp(),
      });
      throw error;
    }
  }

  /**
   * Get all API keys from secure storage (Tauri only)
   */
  async getAllApiKeys(): Promise<ApiKeys> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      return await invoke<ApiKeys>("get_all_api_keys");
    } catch (error) {
      console.error("Error getting all API keys:", error);
      throw error;
    }
  }

  /**
   * Set multiple API keys at once
   */
  async setApiKeys(apiKeys: ApiKeys): Promise<boolean> {
    try {
      let success = true;
      const results: { provider: string; success: boolean; error?: string }[] =
        [];

      if (apiKeys.openrouter !== undefined) {
        try {
          const result = await this.setApiKey("openrouter", apiKeys.openrouter);
          results.push({ provider: "openrouter", success: result });
          success = result && success;
        } catch (error) {
          console.error("Failed to save OpenRouter API key:", error);
          results.push({
            provider: "openrouter",
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
          success = false;
        }
      }

      if (apiKeys.gemini !== undefined) {
        try {
          const result = await this.setApiKey("gemini", apiKeys.gemini);
          results.push({ provider: "gemini", success: result });
          success = result && success;
        } catch (error) {
          console.error("Failed to save Gemini API key:", error);
          results.push({
            provider: "gemini",
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
          success = false;
        }
      }

      // Log detailed results for debugging
      console.log("API key save results:", results);

      if (!success) {
        const failedProviders = results.filter((r) => !r.success);
        console.error(
          "Failed to save API keys for providers:",
          failedProviders
        );
      }

      return success;
    } catch (error) {
      console.error("Error setting API keys:", error);
      return false;
    }
  }

  /**
   * Remove a specific API key from secure storage (Tauri only)
   */
  async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      return await invoke<boolean>("remove_api_key", { provider });
    } catch (error) {
      console.error(`Error removing ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * Remove all API keys from secure storage (Tauri only)
   */
  async clearAllApiKeys(): Promise<boolean> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      return await invoke<boolean>("clear_all_api_keys");
    } catch (error) {
      console.error("Error clearing API keys:", error);
      throw error;
    }
  }

  /**
   * Check if any API key is available (Tauri only)
   */
  async hasAnyApiKey(): Promise<boolean> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      return await invoke<boolean>("has_any_api_key");
    } catch (error) {
      console.error("Error checking for API keys:", error);
      throw error;
    }
  }

  /**
   * Check if a specific API key is available (Tauri only)
   */
  async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    try {
      if (!TauriApiKeyStorage.isTauriApp()) {
        throw new Error(
          "Secure credential storage is only available in the desktop app. Please use the Tauri version for secure API key storage."
        );
      }

      return await invoke<boolean>("has_api_key", { provider });
    } catch (error) {
      console.error(`Error checking for ${provider} API key:`, error);
      throw error;
    }
  }

  // Static methods for backward compatibility
  static async getApiKey(provider: ApiKeyProvider): Promise<string | null> {
    const instance = new TauriApiKeyStorage();
    return instance.getApiKey(provider);
  }

  static async setApiKey(
    provider: ApiKeyProvider,
    apiKey: string
  ): Promise<boolean> {
    const instance = new TauriApiKeyStorage();
    return instance.setApiKey(provider, apiKey);
  }

  static async getAllApiKeys(): Promise<ApiKeys> {
    const instance = new TauriApiKeyStorage();
    return instance.getAllApiKeys();
  }

  static async setApiKeys(apiKeys: ApiKeys): Promise<boolean> {
    const instance = new TauriApiKeyStorage();
    return instance.setApiKeys(apiKeys);
  }

  static async removeApiKey(provider: ApiKeyProvider): Promise<boolean> {
    const instance = new TauriApiKeyStorage();
    return instance.removeApiKey(provider);
  }

  static async clearAllApiKeys(): Promise<boolean> {
    const instance = new TauriApiKeyStorage();
    return instance.clearAllApiKeys();
  }

  static async hasAnyApiKey(): Promise<boolean> {
    const instance = new TauriApiKeyStorage();
    return instance.hasAnyApiKey();
  }

  static async hasApiKey(provider: ApiKeyProvider): Promise<boolean> {
    const instance = new TauriApiKeyStorage();
    return instance.hasApiKey(provider);
  }
}

export default TauriApiKeyStorage;
