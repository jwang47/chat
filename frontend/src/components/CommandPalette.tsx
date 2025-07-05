import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Home, Settings, MessageSquare } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  onNewChat?: () => void;
}

export function CommandPalette({ onNewChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "o" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        handleNewChat();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
      </CommandList>
    </CommandDialog>
  );
}
