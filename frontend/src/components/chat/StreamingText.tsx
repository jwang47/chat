import { useState, useEffect, useRef } from "react";
import React from "react";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { addCustomStyling, renderComplexContent } from "@/lib/markdown.tsx";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

interface CollapsibleCodeBlockProps {
  children: string;
  language: string;
}

function CollapsibleCodeBlock({
  children,
  language,
}: CollapsibleCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);

  const lineCount = children.split("\n").length;

  useEffect(() => {
    const viewportHeight = window.innerHeight;
    const maxHeight = viewportHeight * 0.25;
    const estimatedHeight = lineCount * 20; // Rough estimate
    setShouldShowToggle(estimatedHeight > maxHeight);
  }, [lineCount]); // Only depend on lineCount, not children

  const maxHeight = shouldShowToggle && !isExpanded ? "25vh" : "none";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative mb-4">
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight }}
      >
        <SyntaxHighlighter
          style={oneDark as any}
          language={language}
          PreTag="div"
          className="!m-0 !p-3 !text-xs !font-mono"
          customStyle={{
            backgroundColor: "rgba(45, 44, 40, 0.6)",
            margin: 0,
            padding: "12px",
            borderRadius:
              shouldShowToggle && isExpanded ? "0.5rem 0.5rem 0 0" : "0.5rem",
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
      {shouldShowToggle && !isExpanded && (
        <button
          onClick={handleToggle}
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1 bg-background/90"
        >
          Show more ({lineCount} lines)
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
      {shouldShowToggle && isExpanded && (
        <div className="border-t border-[rgba(45,44,40,0.8)] bg-[rgba(45,44,40,0.4)] rounded-b-lg">
          <button
            onClick={handleToggle}
            className="w-full px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1 hover:bg-[rgba(45,44,40,0.6)] rounded-b-lg"
          >
            Show less
            <svg
              className="w-3 h-3 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export function StreamingText({
  content,
  isStreaming,
  className,
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [adaptiveDelay, setAdaptiveDelay] = useState(20);
  const lastContentUpdateRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debug print when finished streaming
  useEffect(() => {
    if (!isStreaming) {
      console.log("Streaming finished!", content);
    }
  }, [isStreaming]);

  // Reset displayed content when content changes significantly (new message)
  useEffect(() => {
    if (content.length < displayedContent.length) {
      setDisplayedContent(content);
    }
  }, [content.length, displayedContent.length]);

  // Track content arrival speed and adjust typewriter speed accordingly
  useEffect(() => {
    if (content.length > displayedContent.length) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastContentUpdateRef.current;

      // Calculate adaptive delay based on content arrival speed
      // If content is arriving fast (< 100ms), speed up typewriter
      // If content is arriving slow (> 500ms), slow down typewriter
      let newDelay = adaptiveDelay;

      if (timeSinceLastUpdate < 100) {
        // Content arriving fast - speed up typewriter (reduce delay)
        newDelay = Math.max(5, adaptiveDelay * 0.8);
      } else if (timeSinceLastUpdate > 500) {
        // Content arriving slow - slow down typewriter (increase delay)
        newDelay = Math.min(50, adaptiveDelay * 1.2);
      }

      if (newDelay !== adaptiveDelay) {
        setAdaptiveDelay(newDelay);
      }
      lastContentUpdateRef.current = now;
    }
  }, [content.length, displayedContent.length, adaptiveDelay]);

  // Typewriter effect
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isStreaming) {
      // When streaming is complete, show all content immediately
      if (displayedContent !== content) {
        setDisplayedContent(content);
      }
      return;
    }

    if (content.length <= displayedContent.length) {
      // Content hasn't grown, no need to update
      return;
    }

    // Calculate how many characters to reveal based on content gap
    const contentGap = content.length - displayedContent.length;
    const charsToReveal = Math.min(
      contentGap,
      Math.max(1, Math.floor(contentGap / 10))
    );

    // Typewriter effect - gradually reveal content with adaptive speed
    timerRef.current = setTimeout(() => {
      setDisplayedContent((prev) =>
        content.substring(0, prev.length + charsToReveal)
      );
    }, adaptiveDelay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [content, isStreaming, displayedContent, adaptiveDelay]);

  // Render the content
  const renderContent = () => {
    if (!displayedContent.trim()) {
      // Show animated dots while waiting for initial response
      if (isStreaming) {
        return (
          <div className="flex items-center space-x-1 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
            </div>
          </div>
        );
      }
      return null;
    }

    // Use the shared complex content renderer
    return renderComplexContent(displayedContent);
  };

  return (
    <div className={`${className} [&>*:last-child]:mb-0`}>
      {renderContent()}
    </div>
  );
}
