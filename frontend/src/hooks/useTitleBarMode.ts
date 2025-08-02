import { useState, useEffect } from "react";

export type TitleBarMode = "auto" | "enabled" | "disabled";

const TITLE_BAR_MODE_KEY = "title-bar-mode";
const TITLE_BAR_HEIGHT = 28; // Standard macOS title bar height

// Check if we're running in Tauri
const isTauri = () => {
  return typeof window !== "undefined" && window.__TAURI__ !== undefined;
};

// Get the stored title bar mode preference
const getStoredTitleBarMode = (): TitleBarMode => {
  try {
    const stored = localStorage.getItem(TITLE_BAR_MODE_KEY);
    if (stored && ["auto", "enabled", "disabled"].includes(stored)) {
      return stored as TitleBarMode;
    }
  } catch {
    // Ignore storage errors
  }
  return "auto";
};

// Set the title bar mode preference
const setStoredTitleBarMode = (mode: TitleBarMode) => {
  try {
    localStorage.setItem(TITLE_BAR_MODE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
};

export function useTitleBarMode() {
  const [mode, setMode] = useState<TitleBarMode>(getStoredTitleBarMode);

  // Determine if title bar spacing should be active
  const isActive = (() => {
    switch (mode) {
      case "enabled":
        return true;
      case "disabled":
        return false;
      case "auto":
      default:
        return isTauri();
    }
  })();

  const updateMode = (newMode: TitleBarMode) => {
    setMode(newMode);
    setStoredTitleBarMode(newMode);
  };

  // Apply CSS custom property for title bar height
  useEffect(() => {
    const height = isActive ? TITLE_BAR_HEIGHT : 0;
    document.documentElement.style.setProperty(
      "--title-bar-height",
      `${height}px`
    );
  }, [isActive]);

  return {
    mode,
    isActive,
    isTauri: isTauri(),
    titleBarHeight: TITLE_BAR_HEIGHT,
    updateMode,
  };
}