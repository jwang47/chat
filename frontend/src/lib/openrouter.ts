import ApiKeyStorage from "./apiKeyStorage";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterStreamResponse {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

export class OpenRouterService {
  private static readonly BASE_URL = "https://openrouter.ai/api/v1";
  private static readonly DEFAULT_MODEL = "openrouter/cypher-alpha:free";

  /**
   * Stream chat completion from OpenRouter
   */
  static async streamChatCompletion(
    messages: OpenRouterMessage[],
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    model: string = this.DEFAULT_MODEL
  ): Promise<void> {
    const apiKey = ApiKeyStorage.getApiKey("openrouter");

    if (!apiKey) {
      onError(
        new Error(
          "OpenRouter API key not found. Please add your API key in settings."
        )
      );
      return;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Chat Interface",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines from buffer
          while (true) {
            const lineEnd = buffer.indexOf("\n");
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);

            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                onComplete();
                return;
              }

              try {
                const parsed: OpenRouterStreamResponse = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
                // Ignore invalid JSON chunks
                console.warn("Failed to parse streaming chunk:", e);
              }
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch (error) {
      onError(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
    }
  }

  /**
   * Check if OpenRouter API key is available
   */
  static hasApiKey(): boolean {
    return ApiKeyStorage.hasApiKey("openrouter");
  }

  /**
   * Get available models (for future use)
   */
  static getDefaultModel(): string {
    return this.DEFAULT_MODEL;
  }
}
