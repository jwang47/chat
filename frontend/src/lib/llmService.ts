import { OpenRouterService, type OpenRouterMessage } from "./openrouter";
import { GeminiService, type GeminiMessage } from "./gemini";
import { getModelById } from "./models";

const DEFAULT_SYSTEM_INSTRUCTION =
  "Use Markdown markdown format to format your response, but reserve ``` for code blocks only.";
export interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export class LlmService {
  /**
   * Stream chat completion using the specified model
   */
  static async streamChatCompletion(
    model: string,
    messages: LlmMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    const { onChunk, onComplete, onError } = callbacks;

    // Get model info to determine provider
    const modelInfo = getModelById(model);
    if (!modelInfo) {
      onError(new Error(`Unknown model: ${model}`));
      return;
    }

    const provider = modelInfo.provider;

    // Check if API key is available for the provider
    const hasApiKey = this.hasApiKey(provider);
    if (!hasApiKey) {
      onError(
        new Error(
          `${
            provider === "openrouter" ? "OpenRouter" : "Gemini"
          } API key not found. Please add your API key in settings.`
        )
      );
      return;
    }

    // Extract model name from full model ID
    const modelName = modelInfo.name;

    // Call appropriate service based on provider
    if (provider === "openrouter") {
      const openRouterMessages: OpenRouterMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      await OpenRouterService.streamChatCompletion(
        openRouterMessages,
        onChunk,
        onComplete,
        onError,
        modelName
      );
    } else if (provider === "gemini") {
      const geminiMessages: GeminiMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      await GeminiService.streamChatCompletion(
        geminiMessages,
        onChunk,
        onComplete,
        onError,
        modelName,
        DEFAULT_SYSTEM_INSTRUCTION
      );
    } else {
      onError(new Error(`Unsupported provider: ${provider}`));
    }
  }

  /**
   * Check if API key is available for the given provider
   */
  private static async hasApiKey(provider: "openrouter" | "gemini"): Promise<boolean> {
    return provider === "openrouter"
      ? await OpenRouterService.hasApiKey()
      : await GeminiService.hasApiKey();
  }

  /**
   * Get available providers
   */
  static getAvailableProviders(): Array<"openrouter" | "gemini"> {
    return ["openrouter", "gemini"];
  }

  /**
   * Check if any API key is available
   */
  static async hasAnyApiKey(): Promise<boolean> {
    const [openrouterHasKey, geminiHasKey] = await Promise.all([
      OpenRouterService.hasApiKey(),
      GeminiService.hasApiKey()
    ]);
    return openrouterHasKey || geminiHasKey;
  }
}
