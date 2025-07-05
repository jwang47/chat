export interface ModelInfo {
  id: string;
  name: string;
  provider: "openrouter" | "gemini";
  displayName: string;
  description?: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // OpenRouter models
  {
    id: "openrouter/cypher-alpha:free",
    name: "openrouter/cypher-alpha:free",
    provider: "openrouter",
    displayName: "Cypher Alpha (Free)",
    description: "Free tier model from OpenRouter",
  },
  {
    id: "openrouter/moonshotai/kimi-dev-72b:free",
    name: "moonshotai/kimi-dev-72b:free",
    provider: "openrouter",
    displayName: "Kimi 7B (Free)",
    description: "Kimi's 7B model - free tier",
  },
  {
    id: "openrouter/deepseek/deepseek-chat-v3-0324:free",
    name: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    displayName: "DeepSeek V3 0324 (Free)",
    description: "DeepSeek's V3 model via OpenRouter - free tier",
  },
  {
    id: "openrouter/deepseek/deepseek-r1-0528:free",
    name: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
    displayName: "DeepSeek R1 (Free)",
    description: "DeepSeek's R1 reasoning model via OpenRouter - free tier",
  },

  // Gemini models
  {
    id: "google/gemini-2.5-flash",
    name: "gemini-2.5-flash",
    provider: "gemini",
    displayName: "Gemini 2.5 Flash",
    description: "Google's latest Gemini 2.5 Flash model",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "gemini-2.5-pro",
    provider: "gemini",
    displayName: "Gemini 2.5 Pro",
    description: "Google's Gemini 2.5 Pro model",
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
