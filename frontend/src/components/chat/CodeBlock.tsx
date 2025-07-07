import React, { useState, useEffect, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
}

// Threshold for when to show collapsed view (characters)
const COLLAPSE_THRESHOLD = 50; // Much lower threshold to collapse early

// Generate a stable key for the code block based on content
function generateCodeKey(
  code: string,
  language: string,
  filename?: string
): string {
  // Use a combination of language, filename, and a hash of the first part of the code
  // This ensures the component maintains identity even during streaming
  const codeStart = code.substring(0, Math.min(50, code.length));
  const keyBase = `${language}-${filename || "no-file"}-${codeStart}`;
  return btoa(keyBase)
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 16);
}

export function CodeBlock({ language, code, filename }: CodeBlockProps) {
  // Generate a stable key for this code block
  const codeKey = useMemo(
    () => generateCodeKey(code, language, filename),
    [language, filename, code.substring(0, 50)]
  );

  // Start collapsed by default for any code that could potentially be long
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true); // Assume streaming initially
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Determine if code should be collapsible (much more aggressive)
  const shouldCollapse = code.length > COLLAPSE_THRESHOLD || isStreaming;
  const lineCount = code.split("\n").length;
  const charCount = code.length;

  // Track if content appears to be streaming (growing over time)
  useEffect(() => {
    // Check if code ends with common "incomplete" patterns or is very short
    const endsWithIncomplete =
      code.length < 20 ||
      (/[^\n\s]$/.test(code) &&
        !code.endsWith("}") &&
        !code.endsWith(";") &&
        !code.endsWith(">") &&
        !code.endsWith(")") &&
        !code.endsWith("]") &&
        !code.endsWith('"') &&
        !code.endsWith("'") &&
        !code.endsWith("`"));

    if (endsWithIncomplete) {
      setIsStreaming(true);
      // Set a timer to check if streaming has stopped
      const timer = setTimeout(() => {
        setIsStreaming(false);
      }, 2000); // If no changes for 2 seconds, assume streaming stopped

      return () => clearTimeout(timer);
    } else {
      // Give it a moment to ensure streaming is really done
      const timer = setTimeout(() => {
        setIsStreaming(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [code]);

  // Reset interaction state when starting a new code block
  useEffect(() => {
    if (code.length < 10) {
      setHasUserInteracted(false);
      setIsExpanded(false);
      setShowSidePanel(false);
    }
  }, [code.length]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleToggleExpanded = () => {
    setHasUserInteracted(true);

    if (shouldCollapse && !isExpanded) {
      setShowSidePanel(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCloseSidePanel = () => {
    setShowSidePanel(false);
    setHasUserInteracted(true);
  };

  const handleExpandInline = () => {
    setIsExpanded(true);
    setHasUserInteracted(true);
  };

  const handleCollapseInline = () => {
    setIsExpanded(false);
    setHasUserInteracted(true);
  };

  // Always show collapsed view first if it should collapse, even for short code during streaming
  if (shouldCollapse) {
    return (
      <div key={codeKey}>
        <div className="pb-2">
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              // Collapsed view - clickable code block preview
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="group relative overflow-hidden"
              >
                {/* Clickable collapsed preview */}
                <div
                  onClick={handleToggleExpanded}
                  className="cursor-pointer bg-surface/30 hover:bg-surface/50 border border-border/50 hover:border-border rounded-lg p-4 transition-colors duration-150 ease-in-out"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">Code</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {language}
                        </span>
                        {filename && (
                          <span className="text-xs text-muted-foreground">
                            {filename}
                          </span>
                        )}
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
                  <div className="text-xs text-muted-foreground mt-2 opacity-60 group-hover:opacity-80 transition-opacity">
                    Click to expand code block{" "}
                    {isStreaming ? "(streaming)" : ""}
                  </div>
                </div>

                {/* Inline expand option */}
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExpandInline}
                    className="h-7 px-3 text-xs"
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Expand inline
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleExpanded}
                    className="h-7 px-3 text-xs"
                  >
                    Open in side panel
                  </Button>
                </div>
              </motion.div>
            ) : (
              // Expanded view - shows live streaming content
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="group relative overflow-hidden"
              >
                <div className="flex items-center justify-between bg-surface/50 px-3 py-2 rounded-t-lg border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCollapseInline}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-mono text-muted-foreground">
                      {language}
                    </span>
                    {filename && (
                      <span className="text-xs text-muted-foreground">
                        {filename}
                      </span>
                    )}
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
                    className="!m-0 !text-xs !font-mono !bg-surface rounded-b-lg"
                    customStyle={{
                      margin: 0,
                      padding: "12px",
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: "0.5rem",
                      borderBottomRightRadius: "0.5rem",
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                  {/* Streaming cursor indicator */}
                  {isStreaming && (
                    <div className="absolute bottom-3 right-3 w-2 h-4 bg-accent animate-pulse rounded-sm" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {showSidePanel && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-50"
                onClick={handleCloseSidePanel}
              />

              {/* Side Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-1/2 min-w-[400px] max-w-[800px] bg-background border-l border-border z-50 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">Code</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {language}
                    </span>
                    {filename && (
                      <span className="text-xs text-muted-foreground">
                        {filename}
                      </span>
                    )}
                    {isStreaming && (
                      <span className="text-xs text-muted-foreground/60 animate-pulse">
                        streaming...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 w-8 p-0"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseSidePanel}
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>

                {/* Code Content */}
                <div className="flex-1 overflow-auto relative">
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={language}
                    PreTag="div"
                    className="!m-0 !text-sm !font-mono !bg-background h-full"
                    customStyle={{
                      margin: 0,
                      padding: "16px",
                      height: "100%",
                      background: "transparent",
                    }}
                    showLineNumbers={true}
                  >
                    {code}
                  </SyntaxHighlighter>
                  {/* Streaming cursor indicator */}
                  {isStreaming && (
                    <div className="absolute bottom-4 right-4 w-2 h-4 bg-accent animate-pulse rounded-sm" />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // For very short, non-collapsible code, show directly
  return (
    <div className="mb-4 group relative" key={codeKey}>
      <div className="flex items-center justify-between bg-surface/50 px-3 py-2 rounded-t-lg border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {language}
          </span>
          {filename && (
            <span className="text-xs text-muted-foreground">{filename}</span>
          )}
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
          className="!m-0 !text-xs !font-mono !bg-surface rounded-b-lg"
          customStyle={{
            margin: 0,
            padding: "12px",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
          }}
        >
          {code}
        </SyntaxHighlighter>
        {/* Streaming cursor indicator */}
        {isStreaming && (
          <div className="absolute bottom-3 right-3 w-2 h-4 bg-accent animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
