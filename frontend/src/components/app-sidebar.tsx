import {
  Settings,
  PanelLeftOpen,
  PanelLeftClose,
  SquarePen,
  Palette,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "@/contexts/ChatContext";
import { historyService } from "@/lib/historyService";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { newChat, conversations, loadConversation, refreshConversations, currentConversationId } = useChat();
  const isCollapsed = state === "collapsed";

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
      // If the deleted conversation was the current one, start a new chat
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            <SidebarGroupLabel className="m-0">Chat</SidebarGroupLabel>
          )}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    tooltip={item.title}
                    isActive={
                      item.highlightIfActive && location.pathname === item.url
                    }
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {conversations.length > 0 && !isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <div className="group flex items-center justify-between pr-2">
                      <SidebarMenuButton
                        onClick={() => handleLoadConversation(conversation.id)}
                        tooltip={conversation.title}
                        isActive={currentConversationId === conversation.id}
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="truncate">{conversation.title}</span>
                      </SidebarMenuButton>
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
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
