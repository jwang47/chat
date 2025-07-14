import {
  Settings,
  SquarePen,
  Palette,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useChat } from "@/contexts/ChatContext";
import { historyService } from "@/lib/historyService";

const SIDEBAR_STORAGE_KEY = "sidebar-state";
const SIDEBAR_WIDTH_STORAGE_KEY = "sidebar-width";

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

  const [sidebarState, setSidebarStateLocal] = useState(getStoredSidebarState);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const { isCollapsed, width } = sidebarState;
  const minWidth = 200;
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
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const menuItems = [
    {
      title: "New Chat",
      icon: SquarePen,
      onClick: handleNewChat,
      highlightIfActive: false,
      url: "/",
    },
    {
      title: "Components",
      icon: Palette,
      onClick: () => navigate("/components"),
      highlightIfActive: true,
      url: "/components",
    },
    {
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
            <div className="text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium">
              C
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
          {/* Menu Items */}
          <div className="relative flex w-full min-w-0 flex-col p-2">
            <div className="w-full text-sm">
              <ul className="flex w-full min-w-0 flex-col gap-1">
                {menuItems.map((item) => (
                  <li key={item.title} className="group/menu-item relative">
                    <button
                      onClick={item.onClick}
                      title={isCollapsed ? item.title : undefined}
                      className={`
                        peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50
                        ${
                          item.highlightIfActive &&
                          location.pathname === item.url
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : ""
                        }
                        ${isCollapsed ? "justify-center p-2" : "p-2"}
                      `}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Conversations */}
          {conversations.length > 0 && !isCollapsed && (
            <div className="relative flex w-full min-w-0 flex-col p-2">
              <div className="text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium">
                Recent Conversations
              </div>
              <div className="w-full text-sm">
                <ul className="flex w-full min-w-0 flex-col gap-1">
                  {conversations.map((conversation) => {
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
                      <li
                        key={conversation.id}
                        className="group/menu-item relative"
                      >
                        <div className="group flex items-center justify-between pr-2">
                          <button
                            onClick={() =>
                              handleLoadConversation(conversation.id)
                            }
                            title={displayTitle}
                            className={`
                              peer/menu-button flex flex-1 items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50
                              ${
                                currentConversationId === conversation.id
                                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                  : ""
                              }
                            `}
                          >
                            <MessageSquare className="w-4 h-4 shrink-0" />
                            <span className="truncate">{displayTitle}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 hover:text-red-600 rounded"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}
