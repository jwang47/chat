import { ThemeProvider } from "./theme-provider";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { CommandPalette } from "./CommandPalette";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-screen">
          <Outlet />
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </ThemeProvider>
  );
}
