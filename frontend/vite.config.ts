import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./", // Use relative paths for Electron
  optimizeDeps: {
    include: ["react", "react-dom"], // Pre-bundle these dependencies for faster startup
    exclude: ["@vite/client", "@vite/env"],
  },
  build: {
    // Enable minification and optimization
    minify: "terser",
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],
          markdown: [
            "react-markdown",
            "rehype-highlight",
            "rehype-raw",
            "rehype-sanitize",
            "remark-gfm",
            "marked",
          ],
          syntax: ["react-syntax-highlighter", "highlight.js"],
          utils: [
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
            "dompurify",
          ],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (but smaller)
    sourcemap: false, // Disable in production for smaller size
    // Target modern browsers for smaller output
    target: "es2020",
    // Optimize CSS
    cssCodeSplit: true,
    // Additional optimizations
    reportCompressedSize: false, // Skip compressed size reporting for faster builds
    emptyOutDir: true,
  },
});
