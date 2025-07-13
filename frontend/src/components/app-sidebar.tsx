import {
  Settings,
  PanelLeftOpen,
  PanelLeftClose,
  SquarePen,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "@/contexts/ChatContext";

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
  const { newChat } = useChat();
  const isCollapsed = state === "collapsed";

  const handleNewChat = () => {
    newChat();
    if (location.pathname !== "/") {
      navigate("/");
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
      </SidebarContent>
    </Sidebar>
  );
}
