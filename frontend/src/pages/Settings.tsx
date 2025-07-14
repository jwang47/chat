import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import ApiKeyStorage from "@/lib/apiKeyStorage";

export function Settings() {
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // Load API keys from secure storage on component mount
    const loadApiKeys = async () => {
      try {
        const apiKeys = await ApiKeyStorage.getAllApiKeys();

        if (apiKeys.openrouter) {
          setOpenRouterApiKey(apiKeys.openrouter);
        }
        if (apiKeys.gemini) {
          setGeminiApiKey(apiKeys.gemini);
        }
      } catch (error) {
        console.error("Error loading API keys:", error);
        setSaveMessage("Error loading API keys.");
      }
    };

    loadApiKeys();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage("");

    try {
      const success = await ApiKeyStorage.setApiKeys({
        openrouter: openRouterApiKey,
        gemini: geminiApiKey,
      });

      if (success) {
        setSaveMessage("API keys saved successfully!");
      } else {
        setSaveMessage("Error saving API keys. Please try again.");
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      setSaveMessage("Error saving API keys. Please try again.");
    }

    setIsLoading(false);
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your API keys to enable chat functionality with different AI
          providers.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="openrouter-api-key"
              className="block text-sm font-medium text-foreground mb-2"
            >
              OpenRouter API Key
            </label>
            <Input
              id="openrouter-api-key"
              type="password"
              placeholder="Enter your OpenRouter API key"
              value={openRouterApiKey}
              onChange={(e) => setOpenRouterApiKey(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Access to multiple AI models through OpenRouter's unified API.
            </p>
          </div>

          <div>
            <label
              htmlFor="gemini-api-key"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Gemini API Key
            </label>
            <Input
              id="gemini-api-key"
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Direct access to Google's Gemini AI models.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-4">
              {typeof window !== 'undefined' && window.electronAPI?.isElectron 
                ? "Your API keys are stored securely using your operating system's credential store and are encrypted."
                : "Your API keys are stored locally in your browser and never sent to our servers."
              }
            </p>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>

              {saveMessage && (
                <span
                  className={`text-sm ${
                    saveMessage.includes("Error")
                      ? "text-destructive"
                      : "text-green-600"
                  }`}
                >
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">
            How to get your OpenRouter API Key:
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>
              1. Visit{" "}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                openrouter.ai
              </a>
            </li>
            <li>2. Sign up or log in to your account</li>
            <li>3. Go to the API Keys section in your dashboard</li>
            <li>4. Create a new API key and copy it here</li>
          </ol>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">
            How to get your Gemini API Key:
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>
              1. Visit{" "}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </li>
            <li>2. Sign in with your Google account</li>
            <li>3. Click "Get API key" in the left sidebar</li>
            <li>4. Create a new API key and copy it here</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
