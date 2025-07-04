import { Button } from "@/components/ui/button";
import { ThemeProvider, useTheme } from "./components/theme-provider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "🌙" : "☀️"} Switch to{" "}
      {theme === "light" ? "Dark" : "Light"} Mode
    </Button>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Hello World!</h1>
        <p className="text-muted-foreground">This is a themed React app</p>
        <ThemeToggle />
        <Button>Click me</Button>
      </div>
    </ThemeProvider>
  );
}

export default App;
