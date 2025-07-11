import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { ChevronRight, Copy, Check } from "lucide-react";

interface CodeBlockProps {
  blockIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
  const [isStreaming, setIsStreaming] = useState(true);

  const lineCount = code.split("\n").length;
  const charCount = code.length;

  // Determine if code should be collapsible
  const shouldBeCollapsible =
    lineCount > COLLAPSE_THRESHOLD_LINES || isStreaming;

  // Effect to detect when streaming stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStreaming(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // For short code, show full code inline (no side panel needed)
  if (!shouldBeCollapsible) {
    return (
      <div
        className="mb-4 group relative border border-border/50 rounded-lg overflow-hidden"
        key={`cb-static-${blockIndex}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {filename || language}
            </span>
            <span className="text-xs text-muted-foreground">
              {lineCount} lines • {charCount} chars
            </span>
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
        <SyntaxHighlighter
          style={oneDark as any}
          language={language}
          PreTag="div"
          className="!m-0 !text-xs !font-mono !bg-surface"
          customStyle={{ margin: 0, padding: "12px" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  // For long code, always show as collapsed preview in conversation
  // Full code appears in side panel when expanded
  return (
    <div
      className="mb-4 group relative border border-border/50 rounded-lg overflow-hidden"
      key={`cb-collapsible-${blockIndex}`}
    >
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
            className="h-6 w-6 p-0"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </Button>
          <span className="text-xs font-mono text-muted-foreground">
            {filename || language}
          </span>
          {isStreaming && (
            <span className="text-xs text-muted-foreground/60 animate-pulse">
              streaming...
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {lineCount} lines • {charCount} chars
          </span>
          {isExpanded && (
            <span className="text-xs text-accent font-medium">
              → Expanded in side panel
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

      {/* Preview - Always shown in conversation */}
      <div
        className={`bg-surface/30 p-4 cursor-pointer transition-colors ${
          isExpanded ? "bg-surface/50" : "hover:bg-surface/40"
        }`}
        onClick={onToggleExpand}
      >
        <div className="text-xs text-muted-foreground mb-2">
          {isExpanded
            ? "Click to close side panel"
            : "Click to view in side panel"}
        </div>
        <div className="font-mono text-xs text-foreground/70 line-clamp-4 whitespace-pre-wrap">
          {code.split("\n").slice(0, 4).join("\n")}
          {lineCount > 4 && "\n..."}
        </div>
      </div>
    </div>
  );
}
