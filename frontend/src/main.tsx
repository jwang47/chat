import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const enableStrictMode = true;

createRoot(document.getElementById("root")!).render(
  enableStrictMode ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
);
