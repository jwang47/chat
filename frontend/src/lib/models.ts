export interface ModelInfo {
  id: string;
  name: string;
  provider: "openrouter" | "gemini";
  displayName: string;
  description?: string;
  maxTokens?: number;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // OpenRouter models
  {
    id: "openrouter/cypher-alpha:free",
    name: "openrouter/cypher-alpha:free",
    provider: "openrouter",
    displayName: "Cypher Alpha (Free)",
    description: "",
    maxTokens: 1000000,
  },
  {
    id: "openrouter/moonshotai/kimi-dev-72b:free",
    name: "moonshotai/kimi-dev-72b:free",
    provider: "openrouter",
    displayName: "Kimi 7B (Free)",
    description: "",
    maxTokens: 131072,
  },
  {
    id: "openrouter/deepseek/deepseek-chat-v3-0324:free",
    name: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    displayName: "DeepSeek V3 0324 (Free)",
    description: "",
    maxTokens: 163840,
  },
  {
    id: "openrouter/deepseek/deepseek-r1-0528-qwen3-8b:free",
    name: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    provider: "openrouter",
    displayName: "Deepseek R1 0528 Qwen3 8B (free)",
    description: "",
    maxTokens: 131072,
  },

  // Gemini models
  {
    id: "google/gemini-2.5-flash",
    name: "gemini-2.5-flash",
    provider: "gemini",
    displayName: "Gemini 2.5 Flash",
    description: "",
    maxTokens: 1000000,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "gemini-2.5-pro",
    provider: "gemini",
    displayName: "Gemini 2.5 Pro",
    description: "",
    maxTokens: 1000000,
  },
];

export const getAllModels = (): ModelInfo[] => {
  return AVAILABLE_MODELS;
};

export const getModelsByProvider = (
  provider: "openrouter" | "gemini"
): ModelInfo[] => {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
};

export const getModelById = (id: string): ModelInfo | undefined => {
  return AVAILABLE_MODELS.find((model) => model.id === id);
};

export const getDefaultModel = (
  provider?: "openrouter" | "gemini"
): ModelInfo => {
  if (provider) {
    const models = getModelsByProvider(provider);
    return models[0]; // Return first model as default
  }
  return AVAILABLE_MODELS[0]; // Return first model overall as default
};
