import { useState, useEffect, useRef } from "react";
import { renderComplexContent } from "@/lib/markdown.tsx";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  className?: string;
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
