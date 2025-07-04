import { ThemeProvider } from "./theme-provider";
import { SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full h-screen flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
