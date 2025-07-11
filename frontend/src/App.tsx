import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { StreamingTest } from "@/components/test/StreamingTest";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatInterface />} />
          <Route path="test/streaming" element={<StreamingTest />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
