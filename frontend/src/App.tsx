import { Button } from "@/components/ui/button";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { ChatInterface } from "./components/chat/ChatInterface";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="bg-background border-border hover:bg-surface transition-colors duration-150"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </Button>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full h-screen flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                LLM Chat Interface
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex-1">
            <ChatInterface />
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
