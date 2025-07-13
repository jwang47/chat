import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/pages/ChatInterface";
import { Settings } from "./pages/Settings";
import ComponentShowcase from "./pages/ComponentShowcase";
import { ChatProvider } from "@/contexts/ChatContext";
import { Theme } from "@radix-ui/themes";

function App() {
  return (
    <Theme>
      <Router>
        <ChatProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<ChatInterface />} />
              <Route path="settings" element={<Settings />} />
              <Route path="components" element={<ComponentShowcase />} />
            </Route>
          </Routes>
        </ChatProvider>
      </Router>
    </Theme>
  );
}

export default App;
