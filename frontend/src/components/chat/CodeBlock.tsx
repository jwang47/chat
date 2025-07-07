import React, { useState } from "react";
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
const COLLAPSE_THRESHOLD = 700;

export function CodeBlock({ language, code, filename }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // Determine if code should be collapsible
  const shouldCollapse = code.length > COLLAPSE_THRESHOLD;
  const lineCount = code.split("\n").length;
  const charCount = code.length;

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
    if (shouldCollapse && !isExpanded) {
      setShowSidePanel(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCloseSidePanel = () => {
    setShowSidePanel(false);
  };

  // If code is short, always show expanded
  if (!shouldCollapse) {
    return (
      <div className="mb-4 group relative">
        <div className="flex items-center justify-between bg-surface/50 px-3 py-2 rounded-t-lg border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {language}
            </span>
            {filename && (
              <span className="text-xs text-muted-foreground">{filename}</span>
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
      </div>
    );
  }

  // Collapsible code block
  return (
    <>
      <div className="mb-4">
        {!isExpanded ? (
          // Collapsed view
          <Button variant="ghost" onClick={handleToggleExpanded}>
            <div className="flex items-center gap-3">
              <ChevronRight className="h-4 w-4" />
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
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {lineCount} lines • {charCount} chars
            </div>
          </Button>
        ) : (
          // Expanded view
          <div className="group relative">
            <div className="flex items-center justify-between bg-surface/50 px-3 py-2 rounded-t-lg border-b border-border/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
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
          </div>
        )}
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
              <div className="flex-1 overflow-auto">
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
