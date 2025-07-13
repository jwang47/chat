import ApiKeyStorage from "./apiKeyStorage";

export interface GeminiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GeminiStreamResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ModelConfig {
  model: string;
  minThinkingBudget: number;
}

const MODELS: Record<string, ModelConfig> = {
  "gemini-2.5-flash": {
    model: "gemini-2.5-flash",
    minThinkingBudget: 0,
  },
  "gemini-2.5-pro": {
    model: "gemini-2.5-pro",
    minThinkingBudget: 512,
  },
};

export class GeminiService {
  private static readonly BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta";
  private static readonly DEFAULT_MODEL = "gemini-2.5-flash";

  /**
   * Stream chat completion from Gemini
   */
  static async streamChatCompletion(
    messages: GeminiMessage[],
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    model: string = this.DEFAULT_MODEL
  ): Promise<void> {
    const apiKey = ApiKeyStorage.getApiKey("gemini");

    if (!apiKey) {
      onError(
        new Error(
          "Gemini API key not found. Please add your API key in settings."
        )
      );
      return;
    }

    try {
      // Convert messages to Gemini format
      const contents = this.convertMessagesToGeminiFormat(messages);

      const modelConfig = MODELS[model];
      if (!modelConfig) {
        throw new Error(`Model ${model} not found`);
      }

      const response = await fetch(
        `${this.BASE_URL}/models/${model}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: 8192,
              thinkingConfig: {
                thinkingBudget: modelConfig.minThinkingBudget,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

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

              try {
                const parsed: GeminiStreamResponse = JSON.parse(data);
                const chunkContent =
                  parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                onChunk(chunkContent);
                fullContent += chunkContent || "";
              } catch (e) {
                // Ignore invalid JSON chunks
                console.warn("Failed to parse streaming chunk:", e);
              }
            }
          }
        }

        onComplete();
        console.log("Streaming complete: ", fullContent);
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
   * Convert messages from our format to Gemini's format
   */
  private static convertMessagesToGeminiFormat(messages: GeminiMessage[]) {
    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    for (const message of messages) {
      // Skip system messages for now (Gemini handles them differently)
      if (message.role === "system") continue;

      contents.push({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      });
    }

    return contents;
  }

  /**
   * Check if Gemini API key is available
   */
  static hasApiKey(): boolean {
    return ApiKeyStorage.hasApiKey("gemini");
  }

  /**
   * Get available models (for future use)
   */
  static getDefaultModel(): string {
    return this.DEFAULT_MODEL;
  }
}
