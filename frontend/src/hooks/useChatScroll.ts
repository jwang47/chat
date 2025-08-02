import { useRef, useCallback, useEffect } from "react";
import { useSmoothScroll } from "./useSmoothScroll"; // Assuming this path is correct

export function useChatScroll() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const hasInitialScrolled = useRef(false);
  const isStreamingRef = useRef(false);

  const { smoothScrollTo, smoothScrollToBottom, cancelScroll, onUserScroll } =
    useSmoothScroll();

  const getScrollElement = useCallback(() => {
    if (scrollElementRef.current) return scrollElementRef.current;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return null;

    const element = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;

    if (element) {
      scrollElementRef.current = element;
    }

    return element;
  }, []);

  const isAtBottom = useCallback(() => {
    const scrollableElement = getScrollElement();
    if (!scrollableElement) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollableElement;

    // Account for streaming buffer - consider "at bottom" if we're within buffer range
    const streamingBuffer = isStreamingRef.current ? 100 : 0;
    const threshold = 5 + streamingBuffer; // 5px base + streaming buffer

    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, [getScrollElement]);

  const scrollToBottom = useCallback(
    (immediate = false) => {
      const scrollableElement = getScrollElement();
      if (scrollableElement) {
        if (immediate) {
          scrollableElement.scrollTop = scrollableElement.scrollHeight;
        } else {
          // During streaming, use immediate scroll to buffer position to keep up with fast content
          // When not streaming, use smooth scroll to true bottom
          if (isStreamingRef.current) {
            // Calculate buffered position (100px above true bottom)
            const streamingBuffer = 100;
            const targetScroll = Math.max(
              0,
              scrollableElement.scrollHeight -
                scrollableElement.clientHeight -
                streamingBuffer,
            );
            // Use immediate scroll during streaming to keep up with content
            scrollableElement.scrollTop = targetScroll;
          } else {
            // Smooth scroll to true bottom when not streaming
            smoothScrollToBottom(scrollableElement);
          }
        }
      }
    },
    [smoothScrollTo, smoothScrollToBottom, getScrollElement],
  );

  const handleScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const currentScrollTop = target.scrollTop;
      const scrollDirection = currentScrollTop - lastScrollTopRef.current;

      // Only process significant scroll changes (> 1 pixel) to reduce noise
      if (Math.abs(scrollDirection) < 1) {
        return;
      }

      onUserScroll(currentScrollTop);

      // Break autoscroll immediately when user scrolls up any significant amount
      // But ignore upward movement if we're still within the "at bottom" range (including streaming buffer)
      if (scrollDirection < -2 && !isAtBottom()) {
        shouldAutoScrollRef.current = false;
        isUserScrollingRef.current = true;
        cancelScroll();
      }
      // Re-enable autoscroll when user reaches the bottom
      else if (isAtBottom()) {
        shouldAutoScrollRef.current = true;
        isUserScrollingRef.current = false;
      }

      lastScrollTopRef.current = currentScrollTop;
    },
    [isAtBottom, cancelScroll, onUserScroll],
  );

  const handleScrollStart = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  const setStreaming = useCallback(
    (streaming: boolean) => {
      const wasStreaming = isStreamingRef.current;
      isStreamingRef.current = streaming;

      // When streaming ends, scroll to true bottom with smooth animation
      if (wasStreaming && !streaming && shouldAutoScrollRef.current) {
        setTimeout(() => {
          const scrollableElement = getScrollElement();
          if (scrollableElement) {
            smoothScrollToBottom(scrollableElement);
          }
        }, 100); // Small delay to let final content render
      }
    },
    [getScrollElement, smoothScrollToBottom],
  );

  // Auto-scroll effect - removed, as scrolling should be triggered explicitly
  // This was causing continuous scrolling due to ref in dependencies

  // Attach scroll listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const scrollableElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;
    if (!scrollableElement) return;

    scrollableElement.addEventListener("scroll", handleScroll);

    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Initial scroll
  useEffect(() => {
    if (!hasInitialScrolled.current) {
      hasInitialScrolled.current = true;
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [scrollToBottom]);

  return {
    scrollAreaRef,
    scrollToBottom,
    handleScrollStart,
    setStreaming, // New method to control streaming state
    shouldAutoScrollRef, // Expose this if ChatInterface still needs to control it
    isAtBottom, // Expose this if ChatInterface still needs to check it
  };
}
