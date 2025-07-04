import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("openrouter-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    setSaveMessage("");

    try {
      if (apiKey.trim()) {
        localStorage.setItem("openrouter-api-key", apiKey.trim());
        setSaveMessage("API key saved successfully!");
      } else {
        localStorage.removeItem("openrouter-api-key");
        setSaveMessage("API key removed.");
      }
    } catch (error) {
      setSaveMessage("Error saving API key. Please try again.");
    } finally {
      setIsLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(""), 3000);
    }
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
          Configure your OpenRouter API key to enable chat functionality.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="api-key"
              className="block text-sm font-medium text-foreground mb-2"
            >
              OpenRouter API Key
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your OpenRouter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Your API key is stored locally in your browser and never sent to
              our servers.
            </p>
          </div>

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
      </Card>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
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
      </div>
    </div>
  );
}
