import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { listen } from "@tauri-apps/api/event";
import { useChat } from "@/contexts/ChatContext";

interface CommandPaletteProps {
  onNewChat?: () => void;
}

export function CommandPalette({ onNewChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { newChat } = useChat();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      newChat();
      navigate("/");
    }
    setOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListeners = async () => {
      // Check if running in Tauri
      const isTauri =
        typeof window !== "undefined" && window.__TAURI__ !== undefined;

      if (isTauri) {
        // Listen for Tauri keyboard shortcuts
        try {
          unlisten = await listen<string>("keyboard-shortcut", (event) => {
            const shortcut = event.payload;
            if (shortcut === "toggle-window") {
              handleNewChat();
            } else if (shortcut === "open-settings") {
              handleNavigate("/settings");
            }
          });
        } catch (error) {
          console.error("Failed to set up Tauri shortcut listeners:", error);
        }
      }
    };

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // For new chat shortcut
      if (
        e.key === "o" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        console.log("cmd+shift+o detected, triggering new chat");
        e.preventDefault();
        handleNewChat();
      }
    };

    setupListeners();

    // Always register DOM listener as fallback
    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
      // Clean up Tauri listeners
      if (unlisten) {
        unlisten();
      }
    };
  }, [navigate, onNewChat]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleNewChat}>
            <span>New Chat</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate("/")}>
            <span>Chat</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/settings")}>
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/showcase")}>
            <span>Component Showcase</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
