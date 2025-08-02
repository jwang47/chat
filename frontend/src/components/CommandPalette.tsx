import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Message } from "@/types/chat";
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
import { Settings, SquarePen, Palette, MessageSquare } from "lucide-react";

interface CommandPaletteProps {
  onNewChat?: () => void;
}

export function CommandPalette({ onNewChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedConversationMessages, setSelectedConversationMessages] =
    useState<Message[]>([]);
  const navigate = useNavigate();
  const { newChat, conversations, loadConversation } = useChat();

  const handleNewChat = useCallback(() => {
    if (onNewChat) {
      onNewChat();
    } else {
      newChat();
      navigate("/");
    }
    setOpen(false);
  }, [onNewChat, newChat, navigate]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    navigate("/");
    setOpen(false);
  };

  const handleConversationHover = async (conversationId: string) => {
    setSelectedConversationId(conversationId);

    // Load messages for preview
    try {
      const { historyService } = await import("@/lib/historyService");
      const historyMessages = await historyService.getMessagesForConversation(
        conversationId
      );
      const messages = historyMessages.slice(0, 5).map(historyService.convertToMessage);
      setSelectedConversationMessages(messages);
    } catch (error) {
      console.error("Failed to load messages for preview:", error);
      setSelectedConversationMessages([]);
    }
  };

  const selectedConversation = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId)
    : null;

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
      if (e.key === "o" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
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
  }, [navigate, onNewChat, handleNavigate, handleNewChat]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className="max-w-[960px] max-h-[75vh] h-[75vh]"
    >
      <div className="flex h-full">
        {/* Left side - Command items */}
        <div className="w-1/2 flex flex-col">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList className="max-h-none flex-1">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={handleNewChat}>
                <SquarePen className="mr-2 h-4 w-4" />
                <span>New Chat</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {conversations.some((c) => c.isPinned) && (
              <>
                <CommandGroup heading="Pinned">
                  {conversations
                    .filter((c) => c.isPinned)
                    .slice(0, 5)
                    .map((conversation) => (
                      <CommandItem
                        key={conversation.id}
                        value={`pinned-${conversation.id}`}
                        onSelect={() => handleLoadConversation(conversation.id)}
                        onMouseEnter={() =>
                          handleConversationHover(conversation.id)
                        }
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {conversation.title ||
                            new Date(conversation.createdAt).toLocaleString(
                              "en-US",
                              {
                                month: "numeric",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                        </span>
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            {conversations.some((c) => !c.isPinned) && (
              <>
                <CommandGroup heading="History">
                  {conversations
                    .filter((c) => !c.isPinned)
                    .slice(0, 5)
                    .map((conversation) => (
                      <CommandItem
                        key={conversation.id}
                        value={`history-${conversation.id}`}
                        onSelect={() => handleLoadConversation(conversation.id)}
                        onMouseEnter={() =>
                          handleConversationHover(conversation.id)
                        }
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {conversation.title ||
                            new Date(conversation.createdAt).toLocaleString(
                              "en-US",
                              {
                                month: "numeric",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                        </span>
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => handleNavigate("/")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Chat</span>
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
              {import.meta.env.DEV && (
                <CommandItem onSelect={() => handleNavigate("/components")}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Components</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </div>

        {/* Right side - Conversation preview */}
        <div className="w-1/2 border-l border-border bg-muted/30 p-4 flex flex-col">
          <div className="text-sm font-medium text-muted-foreground mb-3">
            Preview
          </div>
          {selectedConversation ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="border-b border-border pb-3">
                <div className="text-sm font-medium truncate">
                  {selectedConversation.title || "Untitled Chat"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(selectedConversation.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {selectedConversationMessages.length > 0 ? (
                  selectedConversationMessages.map((message, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-foreground/80 mb-1">
                        {message.role === "user" ? "You" : "Assistant"}
                      </div>
                      <div className="text-muted-foreground line-clamp-3">
                        {message.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground opacity-70">
                    Loading messages...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Hover over a conversation to preview
            </div>
          )}
        </div>
      </div>
    </CommandDialog>
  );
}
