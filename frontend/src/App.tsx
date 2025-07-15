import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Use HashRouter for Tauri, BrowserRouter for web
const Router =
  typeof window !== "undefined" && window.__TAURI__ !== undefined
    ? HashRouter
    : BrowserRouter;
import { Layout } from "@/components/Layout";
import { ChatProvider } from "@/contexts/ChatContext";
import { Theme } from "@radix-ui/themes";

// Lazy load pages for better performance
const ChatInterface = lazy(() =>
  import("@/pages/ChatInterface").then((module) => ({
    default: module.ChatInterface,
  }))
);
const Settings = lazy(() =>
  import("./pages/Settings").then((module) => ({ default: module.Settings }))
);
const ComponentShowcase = lazy(() => import("./pages/ComponentShowcase"));

function App() {
  return (
    <Theme accentColor="gray" grayColor="gray" radius="medium" scaling="100%">
      <Router>
        <ChatProvider>
          <Suspense
            fallback={
              <div className="h-screen w-screen flex items-center justify-center text-foreground" style={{ backgroundColor: 'rgb(25, 24, 21)' }}>
                <div className="text-muted-foreground">Loading...</div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ChatInterface />} />
                <Route path="settings" element={<Settings />} />
                <Route path="showcase" element={<ComponentShowcase />} />
              </Route>
            </Routes>
          </Suspense>
        </ChatProvider>
      </Router>
    </Theme>
  );
}

export default App;
