import { useState, useEffect } from "react";
import ApiKeyStorage from "@/lib/apiKeyStorage";
import { getName } from "@tauri-apps/api/app";

export function Settings() {
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running in Tauri using a more robust method
    const checkTauriAndLoadKeys = async () => {
      let tauriDetected = false;

      try {
        // Try to call a Tauri API function
        await getName();
        tauriDetected = true;
        console.log("Tauri detection: SUCCESS - Using Tauri API");
      } catch (error) {
        // If Tauri API fails, fall back to window.__TAURI__ check
        tauriDetected =
          typeof window !== "undefined" && window.__TAURI__ !== undefined;
        console.log(
          "Tauri detection: FALLBACK - Using window.__TAURI__:",
          tauriDetected
        );
      }

      setIsTauri(tauriDetected);

      if (!tauriDetected) return;

      try {
        const apiKeys = await ApiKeyStorage.getAllApiKeys();

        if (apiKeys.openrouter) {
          setOpenrouterKey(apiKeys.openrouter);
        }

        if (apiKeys.gemini) {
          setGeminiKey(apiKeys.gemini);
        }
      } catch (error) {
        console.error("Error loading API keys:", error);
      }
    };

    checkTauriAndLoadKeys();
  }, []);

  const handleSave = async () => {
    if (!isTauri) {
      setSaveMessage("API key storage is only available in the desktop app.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    setIsLoading(true);
    setSaveMessage("");

    try {
      const success = await ApiKeyStorage.setApiKeys({
        openrouter: openrouterKey || undefined,
        gemini: geminiKey || undefined,
      });

      if (success) {
        setSaveMessage("API keys saved successfully!");
      } else {
        setSaveMessage("Failed to save some API keys.");
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      setSaveMessage("Error saving API keys. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">API Keys</h2>

          {!isTauri && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Secure API key storage is only available in the desktop app.
                Your keys will not be saved in the web version.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="openrouter"
                className="block text-sm font-medium mb-2"
              >
                OpenRouter API Key
              </label>
              <input
                id="openrouter"
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your OpenRouter API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={!isTauri}
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  OpenRouter
                </a>
              </p>
            </div>

            <div>
              <label
                htmlFor="gemini"
                className="block text-sm font-medium mb-2"
              >
                Google Gemini API Key
              </label>
              <input
                id="gemini"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your Gemini API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={!isTauri}
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isLoading || !isTauri}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save API Keys"}
            </button>

            {saveMessage && (
              <span
                className={`text-sm ${
                  saveMessage.includes("Error") ||
                  saveMessage.includes("Failed")
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {saveMessage}
              </span>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>💡 Tip: Press Cmd/Ctrl + Enter to save quickly</p>
            {isTauri && (
              <p className="mt-1">
                🔒 Your API keys are stored securely in your system's credential
                store
              </p>
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Chat Application</p>
            <p>Version: 1.0.0</p>
            <p>Built with Tauri + React + TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  );
}
