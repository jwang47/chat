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
    name: "cypher-alpha:free",
    provider: "openrouter",
    displayName: "Cypher Alpha (Free)",
    description: "Free tier model from OpenRouter",
  },
  {
    id: "openrouter/meta-llama/llama-3.1-8b-instruct:free",
    name: "meta-llama/llama-3.1-8b-instruct:free",
    provider: "openrouter",
    displayName: "Llama 3.1 8B (Free)",
    description: "Meta's Llama 3.1 8B model - free tier",
  },
  {
    id: "openrouter/microsoft/phi-3-mini-128k-instruct:free",
    name: "microsoft/phi-3-mini-128k-instruct:free",
    provider: "openrouter",
    displayName: "Phi-3 Mini (Free)",
    description: "Microsoft's Phi-3 Mini model - free tier",
  },
  {
    id: "openrouter/anthropic/claude-3.5-sonnet",
    name: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    displayName: "Claude 3.5 Sonnet",
    description: "Anthropic's Claude 3.5 Sonnet via OpenRouter",
  },
  {
    id: "openrouter/openai/gpt-4o-mini",
    name: "openai/gpt-4o-mini",
    provider: "openrouter",
    displayName: "GPT-4o Mini",
    description: "OpenAI's GPT-4o Mini via OpenRouter",
  },
  {
    id: "openrouter/openai/gpt-4o",
    name: "openai/gpt-4o",
    provider: "openrouter",
    displayName: "GPT-4o",
    description: "OpenAI's GPT-4o via OpenRouter",
  },
  {
    id: "openrouter/anthropic/claude-3-haiku",
    name: "anthropic/claude-3-haiku",
    provider: "openrouter",
    displayName: "Claude 3 Haiku",
    description: "Anthropic's Claude 3 Haiku via OpenRouter",
  },
  {
    id: "openrouter/meta-llama/llama-3.1-70b-instruct",
    name: "meta-llama/llama-3.1-70b-instruct",
    provider: "openrouter",
    displayName: "Llama 3.1 70B",
    description: "Meta's Llama 3.1 70B model",
  },
  {
    id: "openrouter/meta-llama/llama-3.1-405b-instruct",
    name: "meta-llama/llama-3.1-405b-instruct",
    provider: "openrouter",
    displayName: "Llama 3.1 405B",
    description: "Meta's Llama 3.1 405B model",
  },
  {
    id: "openrouter/google/gemma-2-9b-it",
    name: "google/gemma-2-9b-it",
    provider: "openrouter",
    displayName: "Gemma 2 9B",
    description: "Google's Gemma 2 9B model",
  },
  {
    id: "openrouter/mistralai/mistral-7b-instruct:free",
    name: "mistralai/mistral-7b-instruct:free",
    provider: "openrouter",
    displayName: "Mistral 7B (Free)",
    description: "Mistral's 7B model - free tier",
  },
  {
    id: "openrouter/mistralai/mixtral-8x7b-instruct",
    name: "mistralai/mixtral-8x7b-instruct",
    provider: "openrouter",
    displayName: "Mixtral 8x7B",
    description: "Mistral's Mixtral 8x7B model",
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
    id: "google/gemini-1.5-pro",
    name: "gemini-1.5-pro",
    provider: "gemini",
    displayName: "Gemini 1.5 Pro",
    description: "Google's Gemini 1.5 Pro model",
  },
  {
    id: "google/gemini-1.5-flash",
    name: "gemini-1.5-flash",
    provider: "gemini",
    displayName: "Gemini 1.5 Flash",
    description: "Google's Gemini 1.5 Flash model",
  },
  {
    id: "google/gemini-1.5-flash-8b",
    name: "gemini-1.5-flash-8b",
    provider: "gemini",
    displayName: "Gemini 1.5 Flash 8B",
    description: "Google's Gemini 1.5 Flash 8B model",
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
