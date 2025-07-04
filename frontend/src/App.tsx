import { ThemeProvider } from "./components/theme-provider";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { ChatInterface } from "./components/chat/ChatInterface";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full h-screen flex flex-col">
          <div className="flex-1">
            <ChatInterface />
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
