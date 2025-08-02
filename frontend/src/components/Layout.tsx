import { ThemeProvider } from "./theme-provider";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { CommandPalette } from "./CommandPalette";
import { Outlet } from "react-router-dom";
import { useTitleBarMode } from "@/hooks/useTitleBarMode";

export function Layout() {
  const { isActive } = useTitleBarMode();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        {/* Title bar background - only visible when title bar is active */}
        {isActive && (
          <div 
            className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
            style={{ 
              height: "var(--title-bar-height)",
              transition: "opacity 0.2s ease-out"
            }}
          />
        )}
        
        <div className="animate-in fade-in duration-300">
          <AppSidebar />
        </div>
        <SidebarInset 
          className="min-h-screen max-h-screen overflow-y-auto animate-in fade-in duration-300"
          style={{ 
            paddingTop: "var(--title-bar-height)",
            minHeight: "calc(100vh - var(--title-bar-height))",
            maxHeight: "calc(100vh - var(--title-bar-height))",
            transition: "padding-top 0.2s ease-out, min-height 0.2s ease-out, max-height 0.2s ease-out"
          }}
        >
          <Outlet />
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </ThemeProvider>
  );
}
