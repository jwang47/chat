import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { motion } from "framer-motion"; // Use framer-motion for better animations

interface CodeBlockProps {
  // ADDED: New props from our state manager
  blockIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  // Existing props
  language: string;
  code: string;
  filename?: string;
}

// Threshold for when to show collapsed view (lines of code)
const COLLAPSE_THRESHOLD_LINES = 8;

export function CodeBlock({
  blockIndex,
  isExpanded,
  onToggleExpand,
  language,
  code,
  filename,
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  // REMOVED: All internal state related to expansion is now gone.
  // const [isExpanded, setIsExpanded] = useState(false);
  // const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // You can still have local state for things like detecting if the code is streaming
  const [isStreaming, setIsStreaming] = useState(true);

  const lineCount = code.split("\n").length;
  const charCount = code.length;

  // Determine if code should be collapsible.
  // We collapse if it's long OR if it's currently streaming (to prevent layout shifts).
  const shouldBeCollapsible =
    lineCount > COLLAPSE_THRESHOLD_LINES || isStreaming;

  // Effect to detect when streaming stops.
  useEffect(() => {
    // A simple heuristic: if the code hasn't changed for a short period, assume streaming is done.
    const timer = setTimeout(() => {
      setIsStreaming(false);
    }, 1000); // 1 second of inactivity

    return () => clearTimeout(timer);
  }, [code]); // This effect re-runs every time the code content changes.

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Render non-collapsible for short, fully-loaded code.
  if (!shouldBeCollapsible && !isExpanded) {
    return (
      <div className="mb-4 group relative" key={`cb-static-${blockIndex}`}>
        <div className="flex items-center justify-between bg-surface/50 px-3 py-2 rounded-t-lg border-b border-border/50">
          <span className="text-xs font-mono text-muted-foreground">
            {language}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          >
            {isCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <SyntaxHighlighter
          style={oneDark as any}
          language={language}
          PreTag="div"
          className="!m-0 !text-xs !font-mono !bg-surface rounded-b-lg"
          customStyle={{ margin: 0, padding: "12px" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Render collapsible/expandable view
  return (
    <div className="pb-2" key={`cb-collapsible-${blockIndex}`}>
      {!isExpanded ? (
        // --- Collapsed View ---
        <div
          onClick={onToggleExpand}
          className="group relative cursor-pointer bg-surface/30 hover:bg-surface/50 border border-border/50 hover:border-border rounded-lg p-4 transition-colors duration-150 ease-in-out"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">Code</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {language}
                </span>
                {isStreaming && (
                  <span className="text-xs text-muted-foreground/60 animate-pulse">
                    streaming...
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {lineCount} lines • {charCount} chars
            </div>
          </div>
        </div>
      ) : (
        // --- Expanded View ---
        <motion.div
          key="expanded"
          initial={{ opacity: 0.5, height: "auto" }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="group relative overflow-hidden border border-border/50 rounded-lg"
        >
          <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                {language}
              </span>
              {isStreaming && (
                <span className="text-xs text-muted-foreground/60 animate-pulse">
                  streaming...
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              {isCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="relative">
            <SyntaxHighlighter
              style={oneDark as any}
              language={language}
              PreTag="div"
              className="!m-0 !text-xs !font-mono !bg-surface"
              customStyle={{
                margin: 0,
                padding: "12px",
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
              }}
            >
              {code}
            </SyntaxHighlighter>
            {isStreaming && (
              <div className="absolute bottom-3 right-3 w-2 h-4 bg-accent animate-pulse rounded-sm" />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
