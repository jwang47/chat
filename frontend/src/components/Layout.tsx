import { ThemeProvider } from "./theme-provider";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { CommandPalette } from "./CommandPalette";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <div className="animate-in fade-in duration-300">
          <AppSidebar />
        </div>
        <SidebarInset className="min-h-screen animate-in fade-in duration-300">
          <Outlet />
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </ThemeProvider>
  );
}
