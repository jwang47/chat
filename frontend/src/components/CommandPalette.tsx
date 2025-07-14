import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Home, Settings } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { useChat } from "@/contexts/ChatContext";

interface CommandPaletteProps {
  onNewChat?: () => void;
}

export function CommandPalette({ onNewChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { conversations, loadConversation } = useChat();

  const handleNewChat = useCallback(() => {
    if (onNewChat) {
      onNewChat();
    } else {
      navigate("/");
    }
    setOpen(false);
  }, [onNewChat, navigate]);

  const handleNavigateToSettings = useCallback(() => {
    navigate("/settings");
    setOpen(false);
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate("/");
    setOpen(false);
  }, [navigate]);

  const handleLoadConversation = useCallback(
    async (conversationId: string) => {
      await loadConversation(conversationId);
      navigate("/");
      setOpen(false);
    },
    [loadConversation, navigate]
  );

  useEffect(() => {
    // Electron keyboard shortcut handler
    const handleElectronShortcut = (shortcut: string) => {
      if (shortcut === 'command-palette') {
        setOpen((open) => !open);
      } else if (shortcut === 'new-chat') {
        handleNewChat();
      }
    };

    // Regular DOM keyboard event handler (fallback for web or if Electron shortcuts fail)
    const down = (e: KeyboardEvent) => {
      // Only handle if not in Electron or as fallback
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // For new chat, only handle if not in Electron (since Electron has global shortcut)
      if (e.key === "o" && (e.metaKey || e.ctrlKey) && e.shiftKey && !window.electronAPI?.isElectron) {
        e.preventDefault();
        handleNewChat();
      }
    };

    // Register Electron shortcuts if available
    if (window.electronAPI?.onKeyboardShortcut) {
      window.electronAPI.onKeyboardShortcut(handleElectronShortcut);
    }
    
    // Always register DOM listener as fallback
    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
      // Clean up Electron listeners
      if (window.electronAPI?.removeKeyboardShortcutListeners) {
        window.electronAPI.removeKeyboardShortcutListeners();
      }
    };
  }, [handleNewChat]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search for commands and actions"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>⌘⇧O</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={handleNavigateToHome}>
            <Home className="mr-2 h-4 w-4" />
            <span>Go to Chat</span>
          </CommandItem>
          <CommandItem onSelect={handleNavigateToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>
        {/* Pinned Conversations */}
        {conversations.some(c => c.isPinned) && (
          <CommandGroup heading="Pinned">
            {conversations.filter(c => c.isPinned).slice(0, 5).map((conversation) => {
              const displayTitle =
                conversation.title ||
                new Date(conversation.createdAt).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

              return (
                <CommandItem
                  key={conversation.id}
                  onSelect={() => handleLoadConversation(conversation.id)}
                  value={`${conversation.title || ""} ${displayTitle} ${conversation.id}`}
                >
                  <span className="truncate">{displayTitle}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {/* History (Regular Conversations) */}
        {conversations.some(c => !c.isPinned) && (
          <CommandGroup heading="History">
            {conversations.filter(c => !c.isPinned).slice(0, 10).map((conversation) => {
              const displayTitle =
                conversation.title ||
                new Date(conversation.createdAt).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

              return (
                <CommandItem
                  key={conversation.id}
                  onSelect={() => handleLoadConversation(conversation.id)}
                  value={`${conversation.title || ""} ${displayTitle} ${conversation.id}`}
                >
                  <span className="truncate">{displayTitle}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
