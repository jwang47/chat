import { useState, useEffect, useRef, useMemo } from "react";
import { MarkedRenderer } from "./MarkedRenderer";

interface IncrementalRendererProps {
  content: string;
  messageId: string;
  isStreaming: boolean;
  globalExpandedState?: {
    messageId: string | null;
    blockIndex: number | null;
  };
  onGlobalCodeBlockToggle?: (
    messageId: string,
    blockIndex: number,
    payload: { code: string; language: string; filename?: string }
  ) => void;
  wordsPerSecond?: number;
}

export function IncrementalRenderer({
  content,
  messageId,
  isStreaming,
  globalExpandedState,
  onGlobalCodeBlockToggle,
  wordsPerSecond = 8,
}: IncrementalRendererProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [visibleWords, setVisibleWords] = useState(0);
  const lastContentRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const streamingSpeedRef = useRef<number>(wordsPerSecond);

  // Split content into words while preserving whitespace
  const words = useMemo(() => {
    return content.split(/(\s+)/);
  }, [content]);

  // Reset when we get a completely new message
  useEffect(() => {
    if (content.length < lastContentRef.current.length) {
      // Content got shorter, probably new message
      setVisibleWords(0);
      setDisplayedContent("");
      lastUpdateTimeRef.current = Date.now();
      streamingSpeedRef.current = wordsPerSecond;
    } else if (content.length > lastContentRef.current.length && isStreaming) {
      // New content arrived, calculate streaming speed
      const now = Date.now();
      const timeDiff = now - lastUpdateTimeRef.current;
      const newWords =
        content.split(/(\s+)/).length -
        lastContentRef.current.split(/(\s+)/).length;

      if (timeDiff > 0 && newWords > 0) {
        const actualWordsPerSecond = (newWords / timeDiff) * 1000;
        // Match actual streaming speed more closely
        streamingSpeedRef.current = Math.max(
          actualWordsPerSecond * 0.9,
          wordsPerSecond
        );
        console.debug(
          `Adjusted streaming speed: ${streamingSpeedRef.current} wps (from ${actualWordsPerSecond} actual)`
        );
      }
      lastUpdateTimeRef.current = now;
    }
    lastContentRef.current = content;
  }, [content, isStreaming, wordsPerSecond]);

  // Handle incremental word reveal
  useEffect(() => {
    if (!isStreaming) {
      // If not streaming, show all content immediately
      setDisplayedContent(content);
      setVisibleWords(words.length);
      return;
    }

    // Clear existing timeout to restart with new speed
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const revealNextWord = () => {
      setVisibleWords((prev) => {
        const next = prev + 1;

        if (next <= words.length) {
          setDisplayedContent(words.slice(0, next).join(""));

          // Schedule next word if there are more
          if (next < words.length) {
            timeoutRef.current = setTimeout(
              revealNextWord,
              1000 / streamingSpeedRef.current
            );
          }
        }

        return next;
      });
    };

    // Continue revealing if we have more content to show
    if (visibleWords < words.length) {
      // Use current speed immediately
      timeoutRef.current = setTimeout(
        revealNextWord,
        1000 / streamingSpeedRef.current
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, isStreaming, words, visibleWords, streamingSpeedRef.current]);

  // Use displayed content for rendering to avoid re-parsing on every chunk
  return (
    <div className="relative">
      <MarkedRenderer
        content={displayedContent}
        messageId={messageId}
        isStreaming={false} // Don't let MarkedRenderer handle streaming
        globalExpandedState={globalExpandedState}
        onGlobalCodeBlockToggle={onGlobalCodeBlockToggle}
      />
    </div>
  );
}
