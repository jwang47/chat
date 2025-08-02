import {
  Settings,
  SquarePen,
  Palette,
  Trash2,
  MoreVertical,
  Edit3,
  Pin,
  Zap,
  Monitor,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useChat } from "@/contexts/ChatContext";
import { historyService } from "@/lib/historyService";
import { useTitleBarMode, type TitleBarMode } from "@/hooks/useTitleBarMode";

const SIDEBAR_STORAGE_KEY = "sidebar-state";
const SIDEBAR_WIDTH_STORAGE_KEY = "sidebar-width";

interface MenuItem {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  highlightIfActive: boolean;
  url: string;
  subtitle?: string;
}

interface SidebarState {
  isCollapsed: boolean;
  width: number;
}

const getStoredSidebarState = (): SidebarState => {
  try {
    const storedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const storedWidth = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    return {
      isCollapsed: storedCollapsed ? JSON.parse(storedCollapsed) : false,
      width: storedWidth ? JSON.parse(storedWidth) : 160,
    };
  } catch {
    return { isCollapsed: false, width: 160 };
  }
};

const setSidebarState = (state: Partial<SidebarState>) => {
  try {
    if (state.isCollapsed !== undefined) {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify(state.isCollapsed)
      );
    }
    if (state.width !== undefined) {
      localStorage.setItem(
        SIDEBAR_WIDTH_STORAGE_KEY,
        JSON.stringify(state.width)
      );
    }
  } catch {
    // Ignore storage errors
  }
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    newChat,
    conversations,
    loadConversation,
    refreshConversations,
    currentConversationId,
  } = useChat();

  const { mode: titleBarMode, isActive: titleBarActive, isTauri, updateMode: updateTitleBarMode } = useTitleBarMode();

  const [sidebarState, setSidebarStateLocal] = useState(getStoredSidebarState);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const { isCollapsed, width } = sidebarState;
  const minWidth = 150;
  const maxWidth = 400;

  const updateSidebarState = useCallback((updates: Partial<SidebarState>) => {
    setSidebarStateLocal((prev) => {
      const newState = { ...prev, ...updates };
      setSidebarState(updates);
      return newState;
    });
  }, []);

  const handleToggleCollapse = useCallback(() => {
    updateSidebarState({ isCollapsed: !isCollapsed });
  }, [isCollapsed, updateSidebarState]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return;

      e.preventDefault();
      setIsDragging(true);
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isCollapsed, width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startXRef.current;
        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, startWidthRef.current + deltaX)
        );
        updateSidebarState({ width: newWidth });
      });
    },
    [updateSidebarState]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: true,
      });
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleNewChat = () => {
    newChat();
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await historyService.deleteConversation(conversationId);
      await refreshConversations();
      if (currentConversationId === conversationId) {
        newChat();
      }
      setActiveDropdown(null);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleRenameConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setRenamingId(conversationId);
      setRenameValue(conversation.title || "");
      setActiveDropdown(null);
    }
  };

  const handlePinConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        await historyService.updateConversationPin(
          conversationId,
          !conversation.isPinned
        );
        await refreshConversations();
      }
      setActiveDropdown(null);
    } catch (error) {
      console.error("Failed to update pin status:", error);
    }
  };

  const handleSaveRename = async (conversationId: string) => {
    try {
      if (renameValue.trim()) {
        await historyService.updateConversationTitle(
          conversationId,
          renameValue.trim()
        );
        await refreshConversations();
      }
      setRenamingId(null);
      setRenameValue("");
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRenameKeyDown = (
    e: React.KeyboardEvent,
    conversationId: string
  ) => {
    if (e.key === "Enter") {
      handleSaveRename(conversationId);
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  };

  const toggleDropdown = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(
      activeDropdown === conversationId ? null : conversationId
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  // Handle title bar mode toggle
  const handleTitleBarModeToggle = () => {
    const modes: TitleBarMode[] = ["auto", "enabled", "disabled"];
    const currentIndex = modes.indexOf(titleBarMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    updateTitleBarMode(modes[nextIndex]);
  };

  // Get title bar mode display info
  const getTitleBarModeInfo = () => {
    switch (titleBarMode) {
      case "auto":
        return {
          title: `Title Bar: Auto ${titleBarActive ? "(On)" : "(Off)"}`,
          subtitle: isTauri ? "On in Tauri" : "Off in Web",
        };
      case "enabled":
        return {
          title: "Title Bar: Always On",
          subtitle: "Forced enabled",
        };
      case "disabled":
        return {
          title: "Title Bar: Always Off",
          subtitle: "Forced disabled",
        };
    }
  };

  const menuItems: MenuItem[] = [
    {
      key: "new-chat",
      title: "New Chat",
      icon: SquarePen,
      onClick: handleNewChat,
      highlightIfActive: false,
      url: "/",
    },
    ...(import.meta.env.DEV
      ? [
          {
            key: "components",
            title: "Components",
            icon: Palette,
            onClick: () => navigate("/components"),
            highlightIfActive: true,
            url: "/components",
          },
          {
            key: "stream-test",
            title: "Stream Test",
            icon: Zap,
            onClick: () => navigate("/stream-test"),
            highlightIfActive: true,
            url: "/stream-test",
          },
          {
            key: "title-bar-toggle",
            title: getTitleBarModeInfo().title,
            icon: Monitor,
            onClick: handleTitleBarModeToggle,
            highlightIfActive: false,
            url: "",
            subtitle: getTitleBarModeInfo().subtitle,
          },
        ]
      : []),
    {
      key: "settings",
      title: "Settings",
      icon: Settings,
      onClick: () => navigate("/settings"),
      highlightIfActive: true,
      url: "/settings",
    },
  ];

  return (
    <div className="relative flex">
      <motion.div
        ref={sidebarRef}
        className="relative flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen overflow-hidden"
        initial={false}
        animate={{
          width: isCollapsed ? 48 : width,
          opacity: 1,
        }}
        transition={{
          width: isDragging
            ? { duration: 0 }
            : { duration: 0.2, ease: "easeOut" },
          opacity: { duration: 0.2 },
        }}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center">
            <div className="text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
          {/* Menu Items */}
          <div className="relative flex w-full min-w-0 flex-col p-2">
            <div className="w-full text-sm">
              <ul className="flex w-full min-w-0 flex-col gap-1">
                {menuItems.map((item) => (
                  <li key={item.key} className="group/menu-item relative">
                    <button
                      onClick={item.onClick}
                      title={isCollapsed ? item.title : undefined}
                      className={`
                        peer/menu-button relative flex w-full ${item.subtitle && !isCollapsed ? "h-12" : "h-8"} items-center overflow-hidden rounded-md text-left text-sm outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50
                        ${
                          item.highlightIfActive &&
                          location.pathname === item.url
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                        }
                      `}
                    >
                      <item.icon
                        className={`absolute left-2 ${item.subtitle && !isCollapsed ? "top-3" : "top-2"} w-4 h-4 ${
                          item.highlightIfActive &&
                          location.pathname === item.url
                            ? ""
                            : "opacity-70 group-hover:opacity-100"
                        }`}
                      />
                      {!isCollapsed && (
                        <div className="pl-8 flex-1 min-w-0">
                          <div className="truncate">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-xs text-sidebar-foreground/50 truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pinned Conversations */}
          {conversations.some((c) => c.isPinned) && !isCollapsed && (
            <div className="relative flex w-full min-w-0 flex-col p-2">
              <div className="text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium">
                Pinned
              </div>
              <div className="w-full text-sm">
                <ul className="flex w-full min-w-0 flex-col gap-1">
                  {conversations
                    .filter((c) => c.isPinned)
                    .map((conversation) => {
                      const displayTitle =
                        conversation.title ||
                        new Date(conversation.createdAt).toLocaleString(
                          "en-US",
                          {
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        );

                      return (
                        <li
                          key={conversation.id}
                          className="group/menu-item relative"
                        >
                          <div
                            className={`
                          relative rounded-md transition-colors group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground
                          ${
                            currentConversationId === conversation.id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 group-hover/menu-item:text-sidebar-accent-foreground"
                          }
                        `}
                          >
                            {renamingId === conversation.id ? (
                              <div className="relative flex w-full h-8 items-center">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) =>
                                    setRenameValue(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleRenameKeyDown(e, conversation.id)
                                  }
                                  onBlur={() =>
                                    handleSaveRename(conversation.id)
                                  }
                                  className="pl-2 pr-8 w-full h-full bg-transparent text-sm outline-none border border-border rounded"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleLoadConversation(conversation.id)
                                }
                                title={displayTitle}
                                className={`
                                relative flex w-full h-8 items-center overflow-hidden text-left text-sm outline-hidden transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50
                                ${
                                  currentConversationId === conversation.id
                                    ? "font-medium"
                                    : ""
                                }
                              `}
                              >
                                <span className="pl-2 pr-8 truncate">
                                  {displayTitle}
                                </span>
                              </button>
                            )}

                            {/* Dropdown Menu Button */}
                            {renamingId !== conversation.id && (
                              <button
                                onClick={(e) =>
                                  toggleDropdown(conversation.id, e)
                                }
                                className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover/menu-item:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                title="More options"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            )}

                            {/* Dropdown Menu */}
                            {activeDropdown === conversation.id && (
                              <div className="absolute top-8 right-0 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-32">
                                <button
                                  onClick={() =>
                                    handleRenameConversation(conversation.id)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Rename
                                </button>
                                <button
                                  onClick={() =>
                                    handlePinConversation(conversation.id)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                                >
                                  <Pin className="w-3 h-3" />
                                  Unpin
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteConversation(conversation.id)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          )}

          {/* History (Regular Conversations) */}
          {conversations.some((c) => !c.isPinned) && !isCollapsed && (
            <div className="relative flex w-full min-w-0 flex-col p-2">
              <div className="text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium">
                History
              </div>
              <div className="w-full text-sm">
                <ul className="flex w-full min-w-0 flex-col gap-1">
                  {conversations
                    .filter((c) => !c.isPinned)
                    .map((conversation) => {
                      const displayTitle =
                        conversation.title ||
                        new Date(conversation.createdAt).toLocaleString(
                          "en-US",
                          {
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        );

                      return (
                        <li
                          key={conversation.id}
                          className="group/menu-item relative"
                        >
                          <div
                            className={`
                          relative rounded-md transition-colors group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground
                          ${
                            currentConversationId === conversation.id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 group-hover/menu-item:text-sidebar-accent-foreground"
                          }
                        `}
                          >
                            {renamingId === conversation.id ? (
                              <div className="relative flex w-full h-8 items-center">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) =>
                                    setRenameValue(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleRenameKeyDown(e, conversation.id)
                                  }
                                  onBlur={() =>
                                    handleSaveRename(conversation.id)
                                  }
                                  className="pl-2 pr-8 w-full h-full bg-transparent text-sm outline-none border border-border rounded"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleLoadConversation(conversation.id)
                                }
                                title={displayTitle}
                                className={`
                                relative flex w-full h-8 items-center overflow-hidden text-left text-sm outline-hidden transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50
                                ${
                                  currentConversationId === conversation.id
                                    ? "font-medium"
                                    : ""
                                }
                              `}
                              >
                                <span className="pl-2 pr-8 truncate">
                                  {displayTitle}
                                </span>
                              </button>
                            )}

                            {/* Dropdown Menu Button */}
                            {renamingId !== conversation.id && (
                              <button
                                onClick={(e) =>
                                  toggleDropdown(conversation.id, e)
                                }
                                className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover/menu-item:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                title="More options"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            )}

                            {/* Dropdown Menu */}
                            {activeDropdown === conversation.id && (
                              <div className="absolute top-8 right-0 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-32">
                                <button
                                  onClick={() =>
                                    handleRenameConversation(conversation.id)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Rename
                                </button>
                                <button
                                  onClick={() =>
                                    handlePinConversation(conversation.id)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
                                >
                                  <Pin className="w-3 h-3" />
                                  Pin
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteConversation(conversation.id)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          )}

          {/* Blank space that can be clicked to collapse/expand */}
          <div
            className={`flex-1 ${
              isCollapsed ? "cursor-e-resize" : "cursor-w-resize"
            }`}
            onClick={handleToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
        </div>
      </motion.div>

      {/* Resize Handle - invisible but functional */}
      {!isCollapsed && (
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize"
          onMouseDown={handleMouseDown}
        />
      )}
      {/* Extended resize area for easier grabbing */}
      {!isCollapsed && (
        <div
          className="absolute top-0 -right-2 w-4 h-full cursor-col-resize"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}
